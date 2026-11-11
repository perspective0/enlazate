import {FormEvent,useEffect,useMemo,useState} from 'react';
import {ArrowRight,Box,CalendarClock,Check,ClipboardList,Factory,FilePlus,Layers3,PackageCheck,Plus,RefreshCw,Save,Search,Settings2,Timer,Truck,X} from 'lucide-react';
import './production.css';

type Props={api:string;csrf?:string};
type Supplier={id:number;name:string};
type Template={id:number;name:string;width_mm:number;height_mm:number;bleed_mm:number;safe_margin_mm:number;qr_width_mm?:number|null};
type ProductionOrder={id:number;production_number:string;order_number?:string|null;supplier_id?:number|null;supplier_name?:string|null;status:string;expected_at?:string|null;created_at:string;internal_cost_dop?:number|null;instructions?:string|null};
type ProductionStatus='draft'|'sent'|'in_production'|'received'|'closed'|'cancelled';
type ProductionFilter='all'|'pending'|'in_production'|'received'|'closed'|'cancelled';
const statuses:{value:ProductionStatus;label:string}[]=[
 {value:'draft',label:'Borrador'},{value:'sent',label:'Enviado al proveedor'},
 {value:'in_production',label:'En producción'},{value:'received',label:'Recibido'},
 {value:'closed',label:'Cerrado'},{value:'cancelled',label:'Cancelado'}
];
const filters:{value:ProductionFilter;label:string}[]=[
 {value:'all',label:'Todas'},{value:'pending',label:'Pendientes'},
 {value:'in_production',label:'En producción'},{value:'received',label:'Recibidas'},
 {value:'closed',label:'Cerradas'},{value:'cancelled',label:'Canceladas'}
];
const statusNames:Record<string,string>=Object.fromEntries(statuses.map(status=>[status.value,status.label]));
async function call<T=any>(api:string,path:string,options:RequestInit={},csrf?:string):Promise<T>{
 const response=await fetch(`${api}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...(options.headers||{})},...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||'No se pudo completar la operación');
 return data as T;
}
function money(value:number|string|null|undefined){return `RD$ ${Number(value||0).toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
function productionDate(value:string|undefined|null){
 if(!value)return 'Sin fecha estimada';
 const date=new Date(value.includes('T')?value:`${value.slice(0,10)}T12:00:00`);
 return Number.isNaN(date.getTime())?'Sin fecha estimada':new Intl.DateTimeFormat('es-DO',{day:'numeric',month:'short',year:'numeric'}).format(date);
}
function normalize(value:string){return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function groupFor(status:string):ProductionFilter{
 if(status==='in_production'||status==='sent')return 'in_production';
 if(status==='received')return 'received';
 if(status==='closed')return 'closed';
 if(status==='cancelled')return 'cancelled';
 return 'pending';
}
export default function Production({api,csrf}:Props){
 const [orders,setOrders]=useState<ProductionOrder[]>([]);
 const [suppliers,setSuppliers]=useState<Supplier[]>([]);
 const [templates,setTemplates]=useState<Template[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<ProductionFilter>('all');
 const [create,setCreate]=useState(false);
 const [design,setDesign]=useState(false);
 const [selected,setSelected]=useState<ProductionOrder|null>(null);
 const [statusSaving,setStatusSaving]=useState(false);
 const load=()=>{
  setLoading(true);setError('');setNotice('');
  Promise.all([
   call<{items:ProductionOrder[]}>(api,'/api/admin/production'),
   call<{items:Supplier[]}>(api,'/api/admin/suppliers'),
   call<{items:Template[]}>(api,'/api/admin/templates')
  ]).then(([production,supplierData,templateData])=>{
   setOrders(production.items||[]);setSuppliers(supplierData.items||[]);setTemplates(templateData.items||[]);
  }).catch(e=>setError(e instanceof Error?e.message:'No se pudieron cargar los datos de producción'))
   .finally(()=>setLoading(false));
 };
 useEffect(()=>{load();},[api]);
 const normalizedQuery=normalize(query.trim());
 const visible=useMemo(()=>orders.filter(order=>{
  const matchesFilter=filter==='all'||groupFor(order.status)===filter;
  const matchesQuery=!normalizedQuery||normalize([order.production_number,order.order_number||'',order.supplier_name||'',order.status].join(' ')).includes(normalizedQuery);
  return matchesFilter&&matchesQuery;
 }),[orders,filter,normalizedQuery]);
 const countFor=(value:ProductionFilter)=>value==='all'?orders.length:orders.filter(order=>groupFor(order.status)===value).length;
 const inProduction=orders.filter(order=>order.status==='in_production'||order.status==='sent').length;
 const pending=orders.filter(order=>order.status==='draft').length;
 const updateStatus=async(order:ProductionOrder,status:ProductionStatus)=>{
  if(order.status===status)return;
  setStatusSaving(true);setError('');setNotice('');
  try{
   await call(api,`/api/admin/production/${order.id}`,{method:'PATCH',body:JSON.stringify({status})},csrf);
   const updated={...order,status};
   setOrders(current=>current.map(item=>item.id===order.id?updated:item));
   setSelected(updated);setNotice(`Orden ${order.production_number}: ${statusNames[status].toLowerCase()}.`);
  }catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar el estado de producción');}
  finally{setStatusSaving(false);}
 };
 return <section className="production-page">
  <div className="production-heading">
   <div><p className="eyebrow">OPERACIONES EXTERNAS</p><h1>Producción</h1><p className="muted">Coordina órdenes, proveedores y especificaciones para fabricar cada pieza.</p></div>
   <div className="production-heading-actions"><button type="button" className="button secondary" onClick={()=>setDesign(true)}><Layers3 size={16}/> Diseños</button><button type="button" className="button" onClick={()=>setCreate(true)}><Plus size={16}/> Nueva orden</button></div>
  </div>
  {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
  <div className="production-banner"><span><Factory size={19}/></span><p><strong>De las especificaciones a la fabricación.</strong> Cada orden registra materiales, medidas, proveedor y avance para que el trabajo esté claro antes de producir.</p></div>
  <div className="production-metrics">
   <div className="production-metric"><span className="production-metric-icon blue"><ClipboardList size={18}/></span><div><small>Órdenes registradas</small><strong>{loading?'—':orders.length}</strong></div></div>
   <div className="production-metric"><span className="production-metric-icon amber"><Timer size={18}/></span><div><small>Pendientes de iniciar</small><strong>{loading?'—':pending}</strong></div></div>
   <div className="production-metric"><span className="production-metric-icon violet"><Factory size={18}/></span><div><small>En proceso</small><strong>{loading?'—':inProduction}</strong></div></div>
   <div className="production-metric"><span className="production-metric-icon green"><PackageCheck size={18}/></span><div><small>Plantillas y proveedores</small><strong>{loading?'—':`${templates.length} / ${suppliers.length}`}</strong></div></div>
  </div>
  <div className="production-work-panel">
   <div className="production-list-heading"><div><h2>Órdenes de producción</h2><p>{loading?'Cargando órdenes…':`${visible.length} ${visible.length===1?'resultado':'resultados'}`}</p></div>
    <label className="production-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar orden, pedido o proveedor" aria-label="Buscar órdenes de producción"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
    <button type="button" className="icon-button production-refresh" onClick={load} disabled={loading} aria-label="Actualizar producción" title="Actualizar"><RefreshCw size={17}/></button>
   </div>
   <div className="production-filters" role="group" aria-label="Filtrar órdenes por estado">{filters.map(item=><button type="button" key={item.value} className={filter===item.value?'active':''} aria-pressed={filter===item.value} onClick={()=>setFilter(item.value)}>{item.label}<span>{countFor(item.value)}</span></button>)}</div>
   <div className="production-table-wrap"><table className="production-orders-table"><thead><tr><th>Orden</th><th>Pedido relacionado</th><th>Proveedor</th><th>Fecha estimada</th><th>Estado</th><th><span className="sr-only">Detalle</span></th></tr></thead>
    <tbody>{loading?<tr><td colSpan={6} className="table-empty">Cargando órdenes de producción…</td></tr>:visible.length===0?<tr><td colSpan={6} className="production-empty"><Factory size={25}/><strong>{orders.length?'No encontramos órdenes':'Todavía no hay órdenes de producción'}</strong><span>{orders.length?'Prueba con otra búsqueda o filtro.':'Crea una orden para organizar las especificaciones de fabricación.'}</span>{!orders.length&&<button type="button" className="button" onClick={()=>setCreate(true)}><Plus size={16}/> Nueva orden</button>}</td></tr>:visible.map(order=><tr key={order.id}>
     <td><button type="button" className="production-order-number" onClick={()=>setSelected(order)}>{order.production_number}</button><small>Creada {productionDate(order.created_at)}</small></td>
     <td>{order.order_number||<span className="production-muted">Sin pedido asociado</span>}</td>
     <td>{order.supplier_name||<span className="production-unassigned">Por asignar</span>}</td>
     <td><span className="production-date"><CalendarClock size={14}/>{productionDate(order.expected_at)}</span></td>
     <td><span className={`production-status ${order.status}`}>{statusNames[order.status]||order.status}</span></td>
     <td><button type="button" className="production-view" onClick={()=>setSelected(order)}>Ver orden <ArrowRight size={14}/></button></td>
    </tr>)}</tbody>
   </table></div>
   <div className="production-panel-footer"><span><Layers3 size={14}/>{templates.length} plantillas disponibles</span><span><Truck size={14}/>{suppliers.length} proveedores registrados</span></div>
  </div>
  {create&&<ProductionForm api={api} csrf={csrf} suppliers={suppliers} onClose={()=>setCreate(false)} onDone={()=>{setCreate(false);load();setNotice('Orden de producción creada.');}}/>}
  {design&&<DesignForm api={api} csrf={csrf} templates={templates} onClose={()=>setDesign(false)} onDone={()=>{setDesign(false);load();setNotice('Versión de diseño guardada.');}}/>}
  {selected&&<ProductionDetail order={selected} statusSaving={statusSaving} onClose={()=>setSelected(null)} onStatus={status=>updateStatus(selected,status)}/>}
 </section>;
}

function ProductionForm({api,csrf,suppliers,onClose,onDone}:{api:string;csrf?:string;suppliers:Supplier[];onClose:()=>void;onDone:()=>void}){
 const [form,setForm]=useState({supplier_id:'',instructions:'',expected_at:'',internal_cost_dop:'',product_name:'',quantity:'1',width_mm:'100',height_mm:'150',qr_width_mm:'35',material:'Acrílico',finish:''});
 const [error,setError]=useState('');const [saving,setSaving]=useState(false);
 const change=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));
 const submit=async(event:FormEvent)=>{
  event.preventDefault();setSaving(true);setError('');
  try{
   await call(api,'/api/admin/production',{method:'POST',body:JSON.stringify({
    supplier_id:form.supplier_id?Number(form.supplier_id):null,
    instructions:form.instructions,expected_at:form.expected_at||null,
    internal_cost_dop:form.internal_cost_dop===''?null:Number(form.internal_cost_dop),
    items:[{product_name:form.product_name.trim(),quantity:Number(form.quantity),width_mm:Number(form.width_mm),height_mm:Number(form.height_mm),qr_width_mm:Number(form.qr_width_mm),material:form.material,finish:form.finish}]
   })},csrf);
   onDone();
  }catch(e){setError(e instanceof Error?e.message:'No se pudo crear la orden de producción');}
  finally{setSaving(false);}
 };
 return <Modal title="Nueva orden de producción" eyebrow="ESPECIFICACIONES DE FABRICACIÓN" onClose={onClose} className="production-create-modal">
  <form onSubmit={submit}>{error&&<div className="alert" role="alert">{error}</div>}
   <div className="form-grid"><label>Proveedor<select value={form.supplier_id} onChange={event=>change('supplier_id',event.target.value)}><option value="">Por asignar</option>{suppliers.map(supplier=><option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label>Fecha estimada<input type="date" value={form.expected_at} onChange={event=>change('expected_at',event.target.value)}/></label></div>
   <label>Producto / pieza<input required maxLength={190} value={form.product_name} onChange={event=>change('product_name',event.target.value)} placeholder="Ej. Display acrílico pequeño"/></label>
   <div className="form-grid"><label>Cantidad<input required type="number" min="1" max="99999" step="1" value={form.quantity} onChange={event=>change('quantity',event.target.value)}/></label><label>Costo interno (DOP)<input type="number" min="0" step="0.01" value={form.internal_cost_dop} onChange={event=>change('internal_cost_dop',event.target.value)} placeholder="Opcional"/></label></div>
   <p className="production-form-section">DIMENSIONES DE LA PIEZA · MILÍMETROS</p>
   <div className="form-grid three"><label>Ancho<input required type="number" min="1" step="0.01" value={form.width_mm} onChange={event=>change('width_mm',event.target.value)}/></label><label>Alto<input required type="number" min="1" step="0.01" value={form.height_mm} onChange={event=>change('height_mm',event.target.value)}/></label><label>Ancho QR<input required type="number" min="1" step="0.01" value={form.qr_width_mm} onChange={event=>change('qr_width_mm',event.target.value)}/></label></div>
   <div className="form-grid"><label>Material<input maxLength={120} value={form.material} onChange={event=>change('material',event.target.value)} placeholder="Ej. Acrílico"/></label><label>Acabado<input maxLength={120} value={form.finish} onChange={event=>change('finish',event.target.value)} placeholder="Opcional"/></label></div>
   <label>Instrucciones<textarea maxLength={5000} value={form.instructions} onChange={event=>change('instructions',event.target.value)} rows={3} placeholder="Detalles para el proveedor."/></label>
   <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="button" disabled={saving}>{saving?'Guardando…':'Crear orden'} <ArrowRight size={15}/></button></div>
  </form>
 </Modal>;
}

type DesignElement={type:'text'|'qr'|'logo';text:string;x:number;y:number;width:number;height:number};
function DesignForm({api,csrf,templates,onClose,onDone}:{api:string;csrf?:string;templates:Template[];onClose:()=>void;onDone:()=>void}){
 const [templateId,setTemplateId]=useState(templates[0]?.id?String(templates[0].id):'');
 const template=templates.find(item=>String(item.id)===templateId)||templates[0];
 const [name,setName]=useState('Diseño nuevo');const [error,setError]=useState('');const [saving,setSaving]=useState(false);
 const [elements,setElements]=useState<DesignElement[]>([]);
 const add=(type:DesignElement['type'])=>setElements(current=>[...current,{type,text:type==='text'?'Texto nuevo':type==='qr'?'QR dinámico':'Logo',x:10+(current.length%5)*8,y:15+(current.length%5)*12,width:type==='qr'?35:50,height:type==='qr'?35:12}]);
 const submit=async()=>{
  if(!name.trim()){setError('Escribe un nombre para la versión de diseño.');return;}
  setSaving(true);setError('');
  try{
   await call(api,'/api/admin/design-versions',{method:'POST',body:JSON.stringify({template_id:template?.id||null,name:name.trim(),width_mm:template?.width_mm||100,height_mm:template?.height_mm||150,definition:{elements}})},csrf);
   onDone();
  }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la versión de diseño');}
  finally{setSaving(false);}
 };
 return <Modal title="Nueva versión de diseño" eyebrow="DISEÑO PARA PRODUCCIÓN" onClose={onClose} className="production-design-modal">
  <p className="production-modal-intro">Prepara una composición a escala en milímetros basada en una plantilla de fabricación.</p>
  {error&&<div className="alert" role="alert">{error}</div>}
  {templates.length?<label>Plantilla<select value={template?.id||''} onChange={event=>setTemplateId(event.target.value)}>{templates.map(item=><option key={item.id} value={item.id}>{item.name} — {item.width_mm} × {item.height_mm} mm</option>)}</select></label>:<div className="notice">No hay plantillas activas. Se usará un lienzo de 100 × 150 mm.</div>}
  <label>Nombre de versión<input value={name} onChange={event=>setName(event.target.value)} maxLength={190}/></label>
  <div className="designer-toolbar"><span>Añadir al diseño</span><button type="button" onClick={()=>add('text')}>+ Texto</button><button type="button" onClick={()=>add('qr')}>+ QR</button><button type="button" onClick={()=>add('logo')}>+ Logo</button></div>
  <div className="designer-canvas" style={{aspectRatio:`${template?.width_mm||100}/${template?.height_mm||150}`}}>{elements.map((element,index)=><div key={`${element.type}-${index}`} className={`design-element ${element.type}`} style={{left:`${element.x}%`,top:`${element.y}%`,width:`${element.width}%`,height:`${element.height}%`}}>{element.type==='qr'?<div className="mini-qr">QR</div>:element.text}</div>)}{!elements.length&&<span>Área de trabajo · {template?.width_mm||100} × {template?.height_mm||150} mm</span>}</div>
  {template&&<div className="template-specs"><span>Margen de sangrado <strong>{template.bleed_mm} mm</strong></span><span>Margen seguro <strong>{template.safe_margin_mm} mm</strong></span>{template.qr_width_mm&&<span>Ancho QR <strong>{template.qr_width_mm} mm</strong></span>}</div>}
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="button" className="button" onClick={submit} disabled={saving}>{saving?'Guardando…':'Guardar versión'} <Save size={15}/></button></div>
 </Modal>;
}

function ProductionDetail({order,statusSaving,onClose,onStatus}:{order:ProductionOrder;statusSaving:boolean;onClose:()=>void;onStatus:(status:ProductionStatus)=>void}){
 const [status,setStatus]=useState<ProductionStatus>(statuses.some(item=>item.value===order.status)?order.status as ProductionStatus:'draft');
 useEffect(()=>setStatus(statuses.some(item=>item.value===order.status)?order.status as ProductionStatus:'draft'),[order.id,order.status]);
 return <div className="modal-backdrop production-detail-backdrop"><section className="production-detail" role="dialog" aria-modal="true" aria-labelledby="production-detail-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar orden"><X size={18}/></button>
  <p className="eyebrow">ORDEN DE PRODUCCIÓN</p><h2 id="production-detail-title">{order.production_number}</h2><p className="production-detail-created">Creada {productionDate(order.created_at)}</p>
  <div className="production-detail-grid"><div><span>Pedido relacionado</span><strong>{order.order_number||'Sin pedido asociado'}</strong></div><div><span>Proveedor</span><strong>{order.supplier_name||'Por asignar'}</strong></div><div><span>Entrega estimada</span><strong>{productionDate(order.expected_at)}</strong></div><div><span>Costo interno</span><strong>{order.internal_cost_dop===null||order.internal_cost_dop===undefined?'No especificado':money(order.internal_cost_dop)}</strong></div></div>
  {order.instructions&&<div className="production-instructions"><h3>Instrucciones</h3><p>{order.instructions}</p></div>}
  <label className="production-status-field">Estado de fabricación<select value={status} onChange={event=>setStatus(event.target.value as ProductionStatus)} disabled={statusSaving}>{statuses.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cerrar</button><button type="button" className="button" onClick={()=>onStatus(status)} disabled={statusSaving||status===order.status}>{statusSaving?'Guardando…':'Actualizar estado'} <Check size={15}/></button></div>
 </section></div>;
}

function Modal({title,eyebrow,onClose,children,className=''}:{title:string;eyebrow:string;onClose:()=>void;children:any;className?:string}){
 return <div className="modal-backdrop production-backdrop"><section className={`modal production-modal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18}/></button><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}
 </section></div>;
}
