import {FormEvent,useEffect,useState} from 'react';
import {ArrowUpRight,Building2,CircleDollarSign,Clock3,Eye,Globe2,Mail,MapPin,PackageCheck,PackageOpen,Plus,RefreshCw,Save,Search,Settings2,ShieldCheck,ShoppingBag,Tag,Timer,UserRound,UsersRound,Phone,X} from 'lucide-react';
import DigitalPages from './DigitalPages';
import './adminmodules.css';
import './settings.css';

type ModuleName='products'|'customers'|'orders'|'suppliers'|'digital-pages'|'settings';
type Props={api:string;csrf?:string;module:ModuleName;session?:{admin?:{name?:string;email?:string}}};
const meta:Record<Exclude<ModuleName,'settings'>,{title:string;eyebrow:string;endpoint:string;columns:string[]}>= {
 products:{title:'Productos',eyebrow:'CATÁLOGO',endpoint:'/api/admin/products',columns:['name','category','price_dop','is_active']},
 customers:{title:'Clientes',eyebrow:'RELACIÓN COMERCIAL',endpoint:'/api/admin/customers',columns:['business_name','contact_name','phone','city']},
 orders:{title:'Pedidos',eyebrow:'OPERACIÓN COMERCIAL',endpoint:'/api/admin/orders',columns:['order_number','customer_name','total_dop','status']},
 suppliers:{title:'Proveedores',eyebrow:'PRODUCCIÓN EXTERNA',endpoint:'/api/admin/suppliers',columns:['name','contact_name','phone','usual_lead_time_days']},
 'digital-pages':{title:'Páginas digitales',eyebrow:'EXPERIENCIAS QR',endpoint:'/api/admin/digital-pages',columns:['title','page_type','slug','is_public']}
};
async function call(api:string,path:string,options:RequestInit={},csrf?:string){const r=await fetch(`${api}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'No se pudo completar la operación');return d;}
export default function AdminModules({api,csrf,module,session}:Props){if(module==='settings')return <SettingsPage api={api} session={session}/>;if(module==='orders')return <OrdersPage api={api} csrf={csrf}/>;if(module==='products')return <ProductsPage api={api} csrf={csrf}/>;if(module==='customers')return <CustomersPage api={api} csrf={csrf}/>;if(module==='digital-pages')return <DigitalPages api={api} csrf={csrf}/>;const c=meta[module];const [items,setItems]=useState<any[]>([]);const [open,setOpen]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const load=()=>{setLoading(true);call(api,c.endpoint).then(d=>setItems(d.items||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));};useEffect(load,[module]);return <section className="admin-module"><div className="module-head"><div><p className="eyebrow">{c.eyebrow}</p><h1>{c.title}</h1><p className="muted">Gestiona información real de tu operación.</p></div>{module!=='orders'&&<button className="button" onClick={()=>setOpen(true)}><Plus size={16}/> Crear registro</button>}</div>{error&&<div className="alert">{error}</div>}<div className="module-toolbar"><span>{items.length} registros</span><button className="icon-button" onClick={load}><RefreshCw size={16}/></button></div><div className="module-table"><table><thead><tr>{c.columns.map(col=><th key={col}>{col.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{loading?<tr><td className="table-empty" colSpan={c.columns.length}>Cargando…</td></tr>:items.length===0?<tr><td className="table-empty" colSpan={c.columns.length}>No hay registros todavía.</td></tr>:items.map((row,i)=><tr key={row.id||i}>{c.columns.map(col=><td key={col}>{col==='price_dop'||col==='total_dop'?`RD$ ${Number(row[col]||0).toLocaleString('es-DO',{minimumFractionDigits:2})}`:String(row[col]??'—')}</td>)}</tr>)}</tbody></table></div>{open&&<CreateForm api={api} csrf={csrf} module={module} onClose={()=>setOpen(false)} onDone={()=>{setOpen(false);load()}}/>}</section>;}

type Customer={
 id:number;business_name:string;contact_name:string;phone:string;email?:string|null;rnc?:string|null;
 address?:string|null;city?:string|null;province?:string|null;notes?:string|null;
};
type CustomerFilter='all'|'email'|'no-email';
const customerFilters:{id:CustomerFilter;label:string}[]=[{id:'all',label:'Todos'},{id:'email',label:'Con correo'},{id:'no-email',label:'Sin correo'}];
function CustomersPage({api,csrf}:{api:string;csrf?:string}){
 const [items,setItems]=useState<Customer[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<CustomerFilter>('all');
 const [open,setOpen]=useState(false);
 const [selected,setSelected]=useState<Customer|null>(null);
 const load=()=>{setLoading(true);setError('');call(api,'/api/admin/customers').then(d=>setItems(d.items||[])).catch(e=>setError(e instanceof Error?e.message:'No se pudo cargar la cartera de clientes')).finally(()=>setLoading(false));};
 useEffect(()=>{load();},[api]);
 const normalizedQuery=normalize(query.trim());
 const filtered=items.filter(customer=>{
  const hasEmail=Boolean(customer.email?.trim());
  const matchesFilter=filter==='all'||(filter==='email'?hasEmail:!hasEmail);
  const matchesQuery=!normalizedQuery||normalize([customer.business_name,customer.contact_name,customer.phone,customer.email||'',customer.rnc||'',customer.address||'',customer.city||'',customer.province||''].join(' ')).includes(normalizedQuery);
  return matchesFilter&&matchesQuery;
 });
 const emailCount=items.filter(customer=>Boolean(customer.email?.trim())).length;
 const cityCount=new Set(items.map(customer=>customer.city?.trim()).filter((city):city is string=>Boolean(city))).size;
 const provinceCount=new Set(items.map(customer=>customer.province?.trim()).filter((province):province is string=>Boolean(province))).size;
 return <section className="customers-page">
  <div className="customers-heading">
   <div><p className="eyebrow">RELACIÓN COMERCIAL</p><h1>Clientes</h1><p className="muted">Mantén a mano los datos de contacto y ubicación de tus clientes.</p></div>
   <div className="customers-heading-actions"><button className="icon-button customers-refresh" onClick={load} disabled={loading} aria-label="Actualizar clientes" title="Actualizar clientes"><RefreshCw size={17}/></button><button className="button" onClick={()=>setOpen(true)}><Plus size={16}/> Añadir cliente</button></div>
  </div>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="customers-overview">
   <div className="customers-metric"><span className="customers-metric-icon blue"><UsersRound size={18}/></span><div><small>Clientes registrados</small><strong>{loading?'—':items.length}</strong></div></div>
   <div className="customers-metric"><span className="customers-metric-icon green"><Mail size={18}/></span><div><small>Con correo electrónico</small><strong>{loading?'—':emailCount}</strong></div></div>
   <div className="customers-metric"><span className="customers-metric-icon violet"><Building2 size={18}/></span><div><small>Ciudades</small><strong>{loading?'—':cityCount}</strong></div></div>
   <div className="customers-metric"><span className="customers-metric-icon amber"><MapPin size={18}/></span><div><small>Provincias</small><strong>{loading?'—':provinceCount}</strong></div></div>
  </div>
  <div className="customers-list-panel">
   <div className="customers-list-heading"><div><h2>Cartera de clientes</h2><p>{loading?'Cargando clientes…':`${filtered.length} ${filtered.length===1?'cliente':'clientes'}`}</p></div>
    <label className="customers-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar negocio, contacto, teléfono o RNC" aria-label="Buscar clientes"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
   </div>
   <div className="customers-filters" role="group" aria-label="Filtrar clientes">
    {customerFilters.map(item=><button type="button" key={item.id} className={filter===item.id?'active':''} aria-pressed={filter===item.id} onClick={()=>setFilter(item.id)}>{item.label}<span>{item.id==='all'?items.length:item.id==='email'?emailCount:items.length-emailCount}</span></button>)}
   </div>
   {loading?<div className="customers-loading">Cargando clientes…</div>:filtered.length===0?<div className="customers-empty"><UsersRound size={26}/><strong>{items.length?'No encontramos clientes':'Aún no tienes clientes registrados'}</strong><span>{items.length?'Prueba con otra búsqueda o filtro.':'Registra un cliente para tener sus datos de contacto organizados.'}</span>{!items.length&&<button className="button" onClick={()=>setOpen(true)}><Plus size={16}/> Añadir cliente</button>}</div>:
    <div className="customers-grid">{filtered.map(customer=><article className="customer-card" key={customer.id}>
     <div className="customer-card-top"><span className="customer-avatar"><Building2 size={18}/></span><span className="customer-record">CLIENTE</span></div>
     <div className="customer-card-copy"><h3>{customer.business_name}</h3><span><UserRound size={14}/>{customer.contact_name}</span></div>
     <div className="customer-card-contact"><a href={`tel:${customer.phone}`}><Phone size={14}/>{customer.phone}</a>{customer.email?<a href={`mailto:${customer.email}`}><Mail size={14}/>{customer.email}</a>:<span className="customer-no-email"><Mail size={14}/>Sin correo registrado</span>}</div>
     <div className="customer-card-footer"><span><MapPin size={14}/>{[customer.city,customer.province].filter(Boolean).join(', ')||'Ubicación no registrada'}</span><button type="button" onClick={()=>setSelected(customer)} aria-label={`Ver ficha de ${customer.business_name}`}><Eye size={15}/> Ver ficha</button></div>
    </article>)}</div>
   }
  </div>
  {open&&<CustomerForm api={api} csrf={csrf} onClose={()=>setOpen(false)} onDone={()=>{setOpen(false);load();}}/>}
  {selected&&<CustomerDetail customer={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}
function CustomerForm({api,csrf,onClose,onDone}:{api:string;csrf?:string;onClose:()=>void;onDone:()=>void}){
 const [data,setData]=useState({business_name:'',contact_name:'',phone:'',email:'',rnc:'',address:'',city:'',province:'',notes:''});
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const set=(key:keyof typeof data,value:string)=>setData(old=>({...old,[key]:value}));
 const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{await call(api,'/api/admin/customers',{method:'POST',body:JSON.stringify(data)},csrf);onDone();}catch(e){setError(e instanceof Error?e.message:'No se pudo crear el cliente');}finally{setSaving(false);}};
 return <div className="modal-backdrop"><form className="modal customer-form" onSubmit={submit}>
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar formulario"><X size={18}/></button>
  <p className="eyebrow">NUEVA RELACIÓN COMERCIAL</p><h2>Añadir cliente</h2><p className="customer-form-intro">Guarda el negocio y la persona de contacto para encontrarlos fácilmente.</p>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="customer-form-grid"><label>Nombre del negocio<input required maxLength={190} autoFocus value={data.business_name} onChange={event=>set('business_name',event.target.value)} placeholder="Ej. Café Central"/></label><label>Persona de contacto<input required maxLength={120} value={data.contact_name} onChange={event=>set('contact_name',event.target.value)} placeholder="Nombre y apellido"/></label></div>
  <div className="customer-form-grid"><label>Teléfono<input required maxLength={40} type="tel" value={data.phone} onChange={event=>set('phone',event.target.value)} placeholder="809-555-0100"/></label><label>Correo electrónico<input type="email" maxLength={190} value={data.email} onChange={event=>set('email',event.target.value)} placeholder="contacto@negocio.com"/></label></div>
  <label>RNC<input maxLength={30} value={data.rnc} onChange={event=>set('rnc',event.target.value)} placeholder="Opcional"/></label>
  <label>Dirección<input maxLength={255} value={data.address} onChange={event=>set('address',event.target.value)} placeholder="Calle, número o sector"/></label>
  <div className="customer-form-grid"><label>Ciudad<input maxLength={100} value={data.city} onChange={event=>set('city',event.target.value)}/></label><label>Provincia<input maxLength={100} value={data.province} onChange={event=>set('province',event.target.value)}/></label></div>
  <label>Notas<textarea rows={2} value={data.notes} onChange={event=>set('notes',event.target.value)} placeholder="Información útil sobre esta relación."/></label>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="button" disabled={saving}>{saving?'Guardando…':'Guardar cliente'} <Save size={15}/></button></div>
 </form></div>;
}
function CustomerDetail({customer,onClose}:{customer:Customer;onClose:()=>void}){
 return <div className="modal-backdrop customers-backdrop"><section className="customer-detail" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar ficha"><X size={18}/></button>
  <span className="customer-detail-icon"><Building2 size={20}/></span><p className="eyebrow">FICHA DEL CLIENTE</p><h2 id="customer-detail-title">{customer.business_name}</h2><p className="customer-detail-contact"><UserRound size={15}/>{customer.contact_name}</p>
  <div className="customer-detail-block"><h3>Contacto</h3><a href={`tel:${customer.phone}`}><Phone size={15}/>{customer.phone}</a>{customer.email&&<a href={`mailto:${customer.email}`}><Mail size={15}/>{customer.email}</a>}</div>
  <div className="customer-detail-block"><h3>Ubicación</h3><p>{customer.address||'Dirección no registrada'}</p><p>{[customer.city,customer.province].filter(Boolean).join(', ')||'Ciudad y provincia no registradas'}</p></div>
  <div className="customer-detail-block"><h3>Información adicional</h3><p><strong>RNC:</strong> {customer.rnc||'No registrado'}</p><p><strong>Notas:</strong> {customer.notes||'Sin notas'}</p></div>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cerrar ficha</button></div>
 </section></div>;
}

type Product={id:number;name:string;description?:string|null;category?:string|null;price_dop:number;production_cost_dop?:number|null;lead_time_days?:number|null;is_active:boolean|number|string};
type ProductFilter='all'|'active'|'inactive';
const productFilters:{id:ProductFilter;label:string}[]=[{id:'all',label:'Todos'},{id:'active',label:'Activos'},{id:'inactive',label:'Inactivos'}];
function activeProduct(product:Product){return product.is_active===true||Number(product.is_active)===1;}
function ProductsPage({api,csrf}:{api:string;csrf?:string}){
 const [items,setItems]=useState<Product[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<ProductFilter>('all');
 const [open,setOpen]=useState(false);
 const load=()=>{setLoading(true);setError('');call(api,'/api/admin/products').then(d=>setItems(d.items||[])).catch(e=>setError(e instanceof Error?e.message:'No se pudo cargar el catálogo')).finally(()=>setLoading(false));};
 useEffect(()=>{load();},[api]);
 const normalizedQuery=normalize(query.trim());
 const filtered=items.filter(product=>{
  const isActive=activeProduct(product);
  const matchesFilter=filter==='all'||(filter==='active'?isActive:!isActive);
  const matchesQuery=!normalizedQuery||normalize([product.name,product.description||'',product.category||''].join(' ')).includes(normalizedQuery);
  return matchesFilter&&matchesQuery;
 });
 const activeCount=items.filter(activeProduct).length;
 const categories=new Set(items.map(product=>product.category).filter((category):category is string=>Boolean(category)));
 const averagePrice=activeCount?items.filter(activeProduct).reduce((sum,product)=>sum+Number(product.price_dop||0),0)/activeCount:0;
 return <section className="products-page">
  <div className="products-heading">
   <div><p className="eyebrow">CATÁLOGO COMERCIAL</p><h1>Productos</h1><p className="muted">Administra tus soluciones y lo que aparece en el catálogo público.</p></div>
   <div className="products-heading-actions"><a className="button secondary products-public-link" href="/catalogo" target="_blank" rel="noreferrer">Ver catálogo</a><button className="button" onClick={()=>setOpen(true)}><Plus size={16}/> Añadir producto</button></div>
  </div>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="products-overview">
   <div className="products-metric"><span className="products-metric-icon blue"><PackageOpen size={18}/></span><div><small>Productos registrados</small><strong>{loading?'—':items.length}</strong></div></div>
   <div className="products-metric"><span className="products-metric-icon green"><Tag size={18}/></span><div><small>Disponibles en catálogo</small><strong>{loading?'—':activeCount}</strong></div></div>
   <div className="products-metric"><span className="products-metric-icon violet"><PackageCheck size={18}/></span><div><small>Categorías usadas</small><strong>{loading?'—':categories.size}</strong></div></div>
   <div className="products-metric"><span className="products-metric-icon amber"><CircleDollarSign size={18}/></span><div><small>Precio promedio activo</small><strong>{loading?'—':money(averagePrice)}</strong></div></div>
  </div>
  <div className="products-list-panel">
   <div className="products-list-heading"><div><h2>Tu catálogo</h2><p>{loading?'Cargando productos…':`${filtered.length} ${filtered.length===1?'producto':'productos'}`}</p></div>
    <label className="products-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre o categoría" aria-label="Buscar productos"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
   </div>
   <div className="products-filters" role="group" aria-label="Filtrar productos">
    {productFilters.map(item=><button type="button" key={item.id} className={filter===item.id?'active':''} aria-pressed={filter===item.id} onClick={()=>setFilter(item.id)}>{item.label}<span>{item.id==='all'?items.length:item.id==='active'?activeCount:items.length-activeCount}</span></button>)}
   </div>
   {loading?<div className="products-loading">Cargando catálogo…</div>:filtered.length===0?<div className="products-empty"><PackageOpen size={26}/><strong>{items.length?'No encontramos productos':'Tu catálogo todavía está vacío'}</strong><span>{items.length?'Prueba con otra búsqueda o filtro.':'Añade tu primera solución para publicarla en tu tienda.'}</span>{!items.length&&<button className="button" onClick={()=>setOpen(true)}><Plus size={16}/> Añadir producto</button>}</div>:
    <div className="products-grid">{filtered.map(product=>{
     const isActive=activeProduct(product);
     const cost=Number(product.production_cost_dop||0);
     const price=Number(product.price_dop||0);
     const margin=price>0&&cost>0?Math.round((price-cost)/price*100):null;
     return <article className={`product-admin-card ${isActive?'':'inactive'}`} key={product.id}>
      <div className="product-card-top"><span className="product-card-icon"><PackageOpen size={20}/></span><span className={`product-visibility ${isActive?'active':'inactive'}`}><i/>{isActive?'En catálogo':'No publicado'}</span></div>
      <div className="product-card-copy"><span className="product-category">{product.category||'Sin categoría'}</span><h3>{product.name}</h3><p>{product.description||'Sin descripción registrada.'}</p></div>
      <div className="product-card-price"><span>Precio de venta</span><strong>{money(price)}</strong></div>
      <div className="product-card-footer"><span>{Number(product.lead_time_days)>0?<><Timer size={14}/> {product.lead_time_days} {Number(product.lead_time_days)===1?'día':'días'}</>:<><Timer size={14}/> Tiempo no definido</>}</span>{margin!==null&&<span>Margen bruto <strong>{margin}%</strong></span>}</div>
     </article>;
    })}</div>
   }
  </div>
  {open&&<ProductForm api={api} csrf={csrf} onClose={()=>setOpen(false)} onDone={()=>{setOpen(false);load();}}/>}
 </section>;
}
function ProductForm({api,csrf,onClose,onDone}:{api:string;csrf?:string;onClose:()=>void;onDone:()=>void}){
 const [data,setData]=useState({name:'',description:'',price_dop:'',production_cost_dop:'',lead_time_days:''});
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const set=(key:keyof typeof data,value:string)=>setData(old=>({...old,[key]:value}));
 const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{await call(api,'/api/admin/products',{method:'POST',body:JSON.stringify({name:data.name,description:data.description,price_dop:Number(data.price_dop),production_cost_dop:data.production_cost_dop===''?null:Number(data.production_cost_dop),lead_time_days:data.lead_time_days===''?null:Number(data.lead_time_days)})},csrf);onDone();}catch(e){setError(e instanceof Error?e.message:'No se pudo crear el producto');}finally{setSaving(false);}};
 return <div className="modal-backdrop"><form className="modal product-form" onSubmit={submit}>
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar formulario"><X size={18}/></button>
  <p className="eyebrow">NUEVA SOLUCIÓN</p><h2>Añadir producto</h2><p className="product-form-intro">Define lo esencial. Al guardarlo, quedará disponible en tu catálogo público.</p>
  {error&&<div className="alert" role="alert">{error}</div>}
  <label>Nombre del producto<input required maxLength={190} autoFocus value={data.name} onChange={event=>set('name',event.target.value)} placeholder="Ej. Menú digital"/></label>
  <label>Descripción<textarea value={data.description} onChange={event=>set('description',event.target.value)} rows={3} placeholder="Explica brevemente qué incluye esta solución."/></label>
  <div className="product-form-grid"><label>Precio de venta (DOP)<input required type="number" min="0" step="0.01" value={data.price_dop} onChange={event=>set('price_dop',event.target.value)} placeholder="0.00"/></label><label>Costo interno (DOP)<input type="number" min="0" step="0.01" value={data.production_cost_dop} onChange={event=>set('production_cost_dop',event.target.value)} placeholder="Opcional"/></label></div>
  <label>Tiempo de producción<input type="number" min="1" step="1" value={data.lead_time_days} onChange={event=>set('lead_time_days',event.target.value)} placeholder="Días (opcional)"/></label>
  <p className="product-form-note"><Tag size={14}/> El producto se creará activo y aparecerá en el catálogo público.</p>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="button" disabled={saving}>{saving?'Guardando…':'Guardar producto'} <Save size={15}/></button></div>
 </form></div>;
}

type Order={
 id:number;order_number:string;customer_name:string;business_name?:string|null;phone:string;
 email?:string|null;delivery_address?:string|null;notes?:string|null;item_count:number;
 subtotal_dop:number;shipping_dop:number;discount_dop:number;total_dop:number;
 payment_method:string;payment_status:string;status:string;created_at:string;
};
type OrderGroup='all'|'pending'|'in-progress'|'delivered'|'cancelled';
const orderStatuses=[
 ['new','Nuevo'],['pending_confirmation','Pendiente de confirmación'],['confirmed','Confirmado'],
 ['pending_payment','Pendiente de pago'],['paid','Pagado'],['preparing','En preparación'],
 ['sent_to_supplier','Enviado al proveedor'],['in_production','En producción'],['received','Recibido'],
 ['ready','Listo'],['delivered','Entregado'],['cancelled','Cancelado']
] as const;
const orderStatusLabels:Record<string,string>=Object.fromEntries(orderStatuses);
const paymentMethodLabels:Record<string,string>={pending:'Por confirmar',manual_transfer:'Transferencia manual',cash:'Efectivo',provider:'Proveedor'};
const paymentStatusLabels:Record<string,string>={pending:'Pendiente',partial:'Parcial',paid:'Pagado',failed:'Fallido'};
const groups:{id:OrderGroup;label:string}[]=[
 {id:'all',label:'Todos'},{id:'pending',label:'Pendientes'},{id:'in-progress',label:'En proceso'},
 {id:'delivered',label:'Entregados'},{id:'cancelled',label:'Cancelados'}
];
function orderGroup(status:string):Exclude<OrderGroup,'all'>{
 if(status==='delivered')return 'delivered';
 if(status==='cancelled')return 'cancelled';
 if(['confirmed','paid','preparing','sent_to_supplier','in_production','received','ready'].includes(status))return 'in-progress';
 return 'pending';
}
function money(value:number|string|undefined){return `RD$ ${Number(value||0).toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
function orderDate(value:string){const date=new Date(value.replace(' ','T'));return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('es-DO',{day:'numeric',month:'short',year:'numeric'}).format(date);}
function normalize(value:string){return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function OrdersPage({api,csrf}:{api:string;csrf?:string}){
 const [items,setItems]=useState<Order[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [group,setGroup]=useState<OrderGroup>('all');
 const [selected,setSelected]=useState<Order|null>(null);
 const [nextStatus,setNextStatus]=useState('');
 const [notice,setNotice]=useState('');
 const load=()=>{setLoading(true);setError('');call(api,'/api/admin/orders').then(d=>setItems(d.items||[])).catch(e=>setError(e instanceof Error?e.message:'No se pudieron cargar los pedidos')).finally(()=>setLoading(false));};
 useEffect(()=>{load();},[api]);
 const normalizedQuery=normalize(query.trim());
 const filtered=items.filter(order=>{
  const matchesGroup=group==='all'||orderGroup(order.status)===group;
  const matchesQuery=!normalizedQuery||normalize([order.order_number,order.customer_name,order.business_name||'',order.phone].join(' ')).includes(normalizedQuery);
  return matchesGroup&&matchesQuery;
 });
 const countFor=(id:OrderGroup)=>id==='all'?items.length:items.filter(order=>orderGroup(order.status)===id).length;
 const openOrder=(order:Order)=>{setSelected(order);setNextStatus(order.status);setNotice('');};
 const saveStatus=async()=>{
  if(!selected||nextStatus===selected.status)return;
  setSaving(true);setError('');setNotice('');
  try{
   await call(api,`/api/admin/orders/${selected.id}`,{method:'PATCH',body:JSON.stringify({status:nextStatus})},csrf);
   const updated={...selected,status:nextStatus};
   setItems(current=>current.map(order=>order.id===selected.id?updated:order));
   setSelected(updated);setNotice('Estado del pedido actualizado.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar el pedido');}
  finally{setSaving(false);}
 };
 const revenue=items.filter(order=>order.status!=='cancelled').reduce((total,order)=>total+Number(order.total_dop||0),0);
 return <section className="orders-page">
  <div className="orders-heading">
   <div><p className="eyebrow">OPERACIÓN COMERCIAL</p><h1>Pedidos</h1><p className="muted">Consulta solicitudes, revisa sus datos y mantén cada pedido al día.</p></div>
   <button className="icon-button orders-refresh" onClick={load} disabled={loading} aria-label="Actualizar pedidos" title="Actualizar pedidos"><RefreshCw size={17}/></button>
  </div>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="orders-overview">
   <div className="orders-metric"><span className="orders-metric-icon blue"><ShoppingBag size={18}/></span><div><small>Pedidos recibidos</small><strong>{loading?'—':items.length}</strong></div></div>
   <div className="orders-metric"><span className="orders-metric-icon amber"><Clock3 size={18}/></span><div><small>Pendientes</small><strong>{loading?'—':countFor('pending')}</strong></div></div>
   <div className="orders-metric"><span className="orders-metric-icon violet"><PackageCheck size={18}/></span><div><small>En proceso</small><strong>{loading?'—':countFor('in-progress')}</strong></div></div>
   <div className="orders-metric"><span className="orders-metric-icon green"><CircleDollarSign size={18}/></span><div><small>Ventas no canceladas</small><strong>{loading?'—':money(revenue)}</strong></div></div>
  </div>
  <div className="orders-list-panel">
   <div className="orders-list-heading"><div><h2>Todos los pedidos</h2><p>{loading?'Cargando pedidos…':`${filtered.length} ${filtered.length===1?'resultado':'resultados'}`}</p></div>
    <label className="orders-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar pedido, cliente o teléfono" aria-label="Buscar pedidos"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
   </div>
   <div className="orders-filters" role="group" aria-label="Filtrar pedidos por estado">
    {groups.map(item=><button type="button" key={item.id} className={group===item.id?'active':''} aria-pressed={group===item.id} onClick={()=>setGroup(item.id)}>{item.label}<span>{countFor(item.id)}</span></button>)}
   </div>
   <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Pago</th><th>Total</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
    <tbody>{loading?<tr><td colSpan={7} className="table-empty">Cargando pedidos…</td></tr>:filtered.length===0?<tr><td colSpan={7} className="orders-empty"><ShoppingBag size={24}/><strong>{items.length?'No encontramos pedidos':'Todavía no hay pedidos'}</strong><span>{items.length?'Prueba con otra búsqueda o filtro.':'Los pedidos nuevos aparecerán aquí.'}</span></td></tr>:filtered.map(order=><tr key={order.id}>
     <td><strong className="orders-number">{order.order_number}</strong><small>{Number(order.item_count||0)} {Number(order.item_count||0)===1?'producto':'productos'}</small></td>
     <td><strong>{order.customer_name||'Cliente sin nombre'}</strong><small>{order.business_name||order.phone||'Sin negocio asociado'}</small></td>
     <td>{orderDate(order.created_at)}</td>
     <td><span className={`orders-payment ${order.payment_status==='paid'?'paid':''}`}>{paymentStatusLabels[order.payment_status]||'Pendiente'}</span><small>{paymentMethodLabels[order.payment_method]||order.payment_method||'Por confirmar'}</small></td>
     <td className="orders-total">{money(order.total_dop)}</td>
     <td><span className={`orders-status ${orderGroup(order.status)}`}>{orderStatusLabels[order.status]||order.status}</span></td>
     <td><button type="button" className="orders-view" onClick={()=>openOrder(order)} aria-label={`Ver pedido ${order.order_number}`}><Eye size={16}/><span>Ver</span></button></td>
    </tr>)}</tbody>
   </table></div>
  </div>
  {selected&&<div className="modal-backdrop orders-backdrop"><section className="orders-detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
   <button type="button" className="modal-close" onClick={()=>setSelected(null)} aria-label="Cerrar detalle"><X size={18}/></button>
   <p className="eyebrow">DETALLE DEL PEDIDO</p><h2 id="order-detail-title">{selected.order_number}</h2><p className="orders-detail-date">Recibido el {orderDate(selected.created_at)}</p>
   <div className="orders-detail-block"><h3>Cliente</h3><strong>{selected.customer_name}</strong>{selected.business_name&&<span>{selected.business_name}</span>}<a href={`tel:${selected.phone}`}>{selected.phone}</a>{selected.email&&<a href={`mailto:${selected.email}`}>{selected.email}</a>}</div>
   <div className="orders-detail-block"><h3>Entrega</h3><p>{selected.delivery_address||'No se indicó dirección de entrega.'}</p>{selected.notes&&<p className="orders-note">{selected.notes}</p>}</div>
   <div className="orders-detail-block"><h3>Resumen</h3><div className="orders-total-line"><span>{Number(selected.item_count||0)} {Number(selected.item_count||0)===1?'producto':'productos'}</span><strong>{money(selected.subtotal_dop)}</strong></div>{Number(selected.shipping_dop)>0&&<div className="orders-total-line"><span>Envío</span><strong>{money(selected.shipping_dop)}</strong></div>}{Number(selected.discount_dop)>0&&<div className="orders-total-line"><span>Descuento</span><strong>− {money(selected.discount_dop)}</strong></div>}<div className="orders-total-line grand"><span>Total</span><strong>{money(selected.total_dop)}</strong></div><p className="orders-payment-detail">Pago: {paymentMethodLabels[selected.payment_method]||selected.payment_method||'Por confirmar'} · {paymentStatusLabels[selected.payment_status]||'Pendiente'}</p></div>
   <div className="orders-status-editor"><label htmlFor="order-status">Estado del pedido</label><select id="order-status" value={nextStatus} onChange={event=>setNextStatus(event.target.value)} disabled={saving}>{orderStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
   {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
   <div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setSelected(null)}>Cerrar</button><button type="button" className="button" onClick={saveStatus} disabled={saving||nextStatus===selected.status}>{saving?'Guardando…':'Guardar estado'} <Save size={15}/></button></div>
  </section></div>}
 </section>;
}
function CreateForm({api,csrf,module,onClose,onDone}:{api:string;csrf?:string;module:Exclude<ModuleName,'orders'|'settings'>;onClose:()=>void;onDone:()=>void}){const [data,setData]=useState<Record<string,string>>({});const [error,setError]=useState('');const set=(key:string,value:string)=>setData(old=>({...old,[key]:value}));const submit=async(e:FormEvent)=>{e.preventDefault();try{let body:any;if(module==='products')body={name:data.name,description:data.description,price_dop:Number(data.price_dop||0),production_cost_dop:Number(data.production_cost_dop||0),lead_time_days:Number(data.lead_time_days||0)};else if(module==='customers')body={business_name:data.business_name,contact_name:data.contact_name,phone:data.phone,email:data.email,address:data.address,city:data.city,province:data.province};else if(module==='suppliers')body={name:data.name,contact_name:data.contact_name,phone:data.phone,email:data.email,services:data.services,materials:data.materials,usual_lead_time_days:Number(data.usual_lead_time_days||0)};else body={title:data.title,page_type:data.page_type||'menu',subtitle:data.subtitle,content:{}};await call(api,meta[module].endpoint,{method:'POST',body:JSON.stringify(body)},csrf);onDone();}catch(e){setError(e instanceof Error?e.message:'Error');}}
const fields=module==='products'?[['name','Nombre'],['description','Descripción'],['price_dop','Precio DOP'],['production_cost_dop','Costo interno'],['lead_time_days','Días de producción']]:module==='customers'?[['business_name','Negocio'],['contact_name','Contacto'],['phone','Teléfono'],['email','Correo'],['address','Dirección'],['city','Ciudad'],['province','Provincia']]:module==='suppliers'?[['name','Proveedor'],['contact_name','Contacto'],['phone','Teléfono'],['email','Correo'],['services','Servicios'],['materials','Materiales'],['usual_lead_time_days','Días habituales']]:[['title','Título'],['subtitle','Subtítulo']];return <div className="modal-backdrop"><form className="modal admin-form" onSubmit={submit}><button type="button" className="modal-close" onClick={onClose}><X size={18}/></button><p className="eyebrow">NUEVO REGISTRO</p><h2>Crear registro</h2>{error&&<div className="alert">{error}</div>}{module==='digital-pages'&&<label>Tipo<select value={data.page_type||'menu'} onChange={e=>set('page_type',e.target.value)}><option value="menu">Menú</option><option value="wifi">Wi‑Fi</option><option value="contact">Contacto</option><option value="reviews">Reseñas</option><option value="maps">Maps</option><option value="whatsapp">WhatsApp</option></select></label>}{fields.map(([key,label])=><label key={key}>{label}<input required={['name','business_name','contact_name','phone','title'].includes(key)} type={key.includes('email')?'email':key.includes('price')||key.includes('cost')||key.includes('days')?'number':'text'} value={data[key]||''} onChange={e=>set(key,e.target.value)}/></label>)}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button">Guardar <Save size={15}/></button></div></form></div>;}
type Setting={setting_key:string;setting_value:string;updated_at?:string};
type SettingsGroup='brand'|'regional'|'links';
const settingLabels:Record<string,{label:string;group:'brand'|'regional'|'links';description:string}>={
 brand_name:{label:'Nombre comercial',group:'brand',description:'Nombre que identifica la plataforma.'},
 tagline:{label:'Frase de marca',group:'brand',description:'Texto breve asociado a la marca.'},
 currency:{label:'Moneda',group:'regional',description:'Moneda predeterminada para los precios.'},
 timezone:{label:'Zona horaria',group:'regional',description:'Zona utilizada para fechas y operaciones.'},
 qr_base_url:{label:'Dirección base de códigos QR',group:'links',description:'Prefijo de los enlaces QR públicos.'}
};
function SettingsPage({api,session}:{api:string;session?:Props['session']}){
 const [items,setItems]=useState<Setting[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const load=()=>{setLoading(true);setError('');call(api,'/api/admin/settings').then(data=>setItems(data.items||[])).catch(reason=>setError(reason instanceof Error?reason.message:'No se pudo cargar la configuración')).finally(()=>setLoading(false));};
 useEffect(()=>{load();},[api]);
 const grouped=(group:SettingsGroup)=>items.filter(item=>settingLabels[item.setting_key]?.group===group);
 const display=(value:string)=>value||'No configurado';
 const name=session?.admin?.name?.trim()||'Administrador';
 return <section className="settings-page">
  <div className="settings-heading"><div><p className="eyebrow">SISTEMA</p><h1>Configuración</h1><p className="muted">Consulta la identidad de tu cuenta y los parámetros de la plataforma.</p></div><button type="button" className="icon-button settings-refresh" onClick={load} disabled={loading} aria-label="Actualizar configuración" title="Actualizar configuración"><RefreshCw size={17}/></button></div>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="settings-callout"><span><ShieldCheck size={18}/></span><p><strong>Configuración protegida.</strong> Esta pantalla muestra los valores no secretos guardados en el sistema. Los cambios se gestionan desde el entorno de despliegue; aquí no se exponen credenciales ni secretos.</p></div>
  <div className="settings-layout">
   <section className="settings-account">
    <div className="settings-section-heading"><span className="settings-section-icon blue"><UserRound size={18}/></span><div><h2>Cuenta administrativa</h2><p>Sesión actual</p></div></div>
    <div className="settings-profile"><span className="settings-avatar">{name.charAt(0).toLocaleUpperCase()}</span><div><strong>{name}</strong><span>{session?.admin?.email||'Correo no disponible'}</span></div></div>
    <div className="settings-session-status"><i/><span>Sesión autenticada</span><small>Acceso administrativo activo</small></div>
    <div className="settings-security-note"><ShieldCheck size={16}/><p>El acceso está protegido por sesión administrativa y token CSRF para las operaciones que modifican datos.</p></div>
   </section>
   <section className="settings-overview">
    <div className="settings-section-heading"><span className="settings-section-icon violet"><Settings2 size={18}/></span><div><h2>Parámetros de la plataforma</h2><p>{loading?'Cargando valores guardados…':`${items.length} parámetros disponibles`}</p></div></div>
    {loading?<div className="settings-state">Cargando configuración…</div>:items.length===0?<div className="settings-state">No hay parámetros de configuración disponibles.</div>:<>
     <div className="settings-values-grid">
      {(['brand','regional','links'] as const).map(group=>{
       const values=grouped(group);
       if(!values.length)return null;
       const heading=group==='brand'?'Identidad de marca':group==='regional'?'Preferencias regionales':'Enlaces públicos';
       return <div className="settings-group" key={group}><h3>{heading}</h3>{values.map(item=>{
        const definition=settingLabels[item.setting_key];
        return <div className="settings-value" key={item.setting_key}><span>{definition.label}<small>{definition.description}</small></span><strong title={item.setting_value}>{display(item.setting_value)}</strong></div>;
       })}</div>;
      })}
     </div>
     {!items.some(item=>settingLabels[item.setting_key])&&<div className="settings-state">Los parámetros guardados no contienen valores reconocidos para mostrar.</div>}
    </>}
    <div className="settings-readonly"><Globe2 size={15}/><span>Solo lectura desde el panel</span><small>La tabla de configuración no cuenta con una API de edición.</small></div>
   </section>
  </div>
  <section className="settings-shortcuts"><div className="settings-section-heading"><span className="settings-section-icon amber"><ArrowUpRight size={18}/></span><div><h2>Accesos de operación</h2><p>Atajos a los módulos relacionados.</p></div></div><div className="settings-shortcut-grid"><a href="/admin/qr"><span><Globe2 size={17}/></span><div><strong>Códigos QR</strong><small>Gestiona destinos y enlaces permanentes.</small></div><ArrowUpRight size={15}/></a><a href="/admin/digital-pages"><span><Settings2 size={17}/></span><div><strong>Páginas digitales</strong><small>Administra las experiencias públicas.</small></div><ArrowUpRight size={15}/></a></div></section>
 </section>;
}
