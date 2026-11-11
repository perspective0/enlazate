import {FormEvent,useEffect,useState} from 'react';
import {AlertTriangle,ArrowRight,Check,Clipboard,Download,ExternalLink,History,Link2,Pause,Play,Plus,RefreshCw,ScanLine,ShieldCheck,Trash2,X} from 'lucide-react';
import './qrmanager.css';

type QR={id:number;public_id:string;label:string;type:string;status:string;destination_url:string;scan_count:number;business_name?:string|null;qr_url:string};
type QRHistory={destination_url:string;created_at:string};
type QRDetailData={item:QR&{history:QRHistory[];stats:{total:number;unique_estimate:number}}};
type QRGroup='all'|'active'|'paused'|'archived'|'expired';
type Props={api:string;csrf?:string;onClose:()=>void};
async function call<T=any>(api:string,path:string,options:RequestInit={},csrf?:string):Promise<T>{
 const response=await fetch(`${api}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...(options.headers||{})},...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||'No se pudo completar la operación');
 return data as T;
}
const statusNames:Record<string,string>={active:'Activo',paused:'Pausado',archived:'Archivado',expired:'Vencido'};
const typeNames:Record<string,string>={url:'URL personalizada',menu:'Menú digital',reviews:'Reseñas',whatsapp:'WhatsApp',wifi:'Wi-Fi',maps:'Google Maps',contact:'Contacto',nfc:'NFC'};
const qrGroups:{id:QRGroup;label:string}[]=[{id:'all',label:'Todos'},{id:'active',label:'Activos'},{id:'paused',label:'Pausados'},{id:'archived',label:'Archivados'},{id:'expired',label:'Vencidos'}];
function qrStatus(qr:QR){return statusNames[qr.status]||'Desconocido';}
function normalize(value:string){return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
async function copyText(value:string){if(!navigator.clipboard)throw new Error('El navegador no permite copiar automáticamente. Selecciona y copia el enlace.');await navigator.clipboard.writeText(value);}

export default function QrManager({api,csrf,onClose}:Props){
 const [items,setItems]=useState<QR[]>([]);
 const [query,setQuery]=useState('');
 const [group,setGroup]=useState<QRGroup>('all');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [form,setForm]=useState(false);
 const [selected,setSelected]=useState<QR|null>(null);
 const [copied,setCopied]=useState('');
 const load=()=>{
  setLoading(true);setError('');setNotice('');
  call<{items:Omit<QR,'qr_url'>[];qr_base_url:string}>(api,'/api/admin/qr')
   .then(data=>{
    if(!data.qr_base_url)throw new Error('No se pudo determinar el enlace permanente. Revisa la configuración de los códigos QR.');
    const base=data.qr_base_url.replace(/\/+$/,'');
    setItems(data.items.map(item=>({...item,qr_url:item.qr_url||`${base}/${item.public_id}`})));
   })
   .catch(e=>setError(e instanceof Error?e.message:'No se pudieron cargar los códigos QR'))
   .finally(()=>setLoading(false));
 };
 useEffect(()=>{load();},[api]);
 const filtered=items.filter(qr=>{
  const matchesGroup=group==='all'||qr.status===group;
  const matchesQuery=!normalize(query.trim())||normalize([qr.public_id,qr.label,qr.business_name||'',qr.destination_url].join(' ')).includes(normalize(query.trim()));
  return matchesGroup&&matchesQuery;
 });
 const countFor=(id:QRGroup)=>id==='all'?items.length:items.filter(qr=>qr.status===id).length;
 const totalScans=items.reduce((sum,qr)=>sum+Number(qr.scan_count||0),0);
 const updateStatus=async(qr:QR,action:'pause'|'activate')=>{
  setError('');setNotice('');
  try{
   const data=await call<{status:string}>(api,`/api/admin/qr/${qr.id}/${action}`,{method:'POST'},csrf);
   setItems(current=>current.map(item=>item.id===qr.id?{...item,status:data.status}:item));
   setSelected(current=>current?.id===qr.id?{...current,status:data.status}:current);
   setNotice(`Código ${action==='pause'?'pausado':'activado'}. Su enlace permanente no cambió.`);
  }catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar el código QR');}
 };
 const handleCopy=async(value:string,key:string)=>{
  try{await copyText(value);setCopied(key);setError('');window.setTimeout(()=>setCopied(current=>current===key?'':current),1800);}
  catch(e){setError(e instanceof Error?e.message:'No se pudo copiar el enlace');}
 };
 return <section className="qr-management">
  <div className="qr-management-heading">
   <div><p className="eyebrow">INFRAESTRUCTURA DIGITAL</p><h1>Códigos QR</h1><p className="muted">Administra tus enlaces permanentes y actualiza sus destinos cuando quieras.</p></div>
   <div className="qr-heading-actions"><button className="button secondary qr-back" onClick={onClose}>Volver al resumen</button><button className="button" onClick={()=>setForm(true)}><Plus size={16}/> Crear QR dinámico</button></div>
  </div>
  <div className="qr-dynamic-callout"><span><ShieldCheck size={19}/></span><p><strong>Tu QR no cambia cuando actualizas el destino.</strong> Cada código contiene una URL fija de ENLÁZATE; puedes cambiar el enlace de llegada sin imprimir otro QR.</p></div>
  {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
  <div className="qr-overview">
   <div className="qr-metric"><span className="qr-metric-icon blue"><ScanLine size={18}/></span><div><small>Códigos registrados</small><strong>{loading?'—':items.length}</strong></div></div>
   <div className="qr-metric"><span className="qr-metric-icon green"><ShieldCheck size={18}/></span><div><small>Activos</small><strong>{loading?'—':countFor('active')}</strong></div></div>
   <div className="qr-metric"><span className="qr-metric-icon amber"><Pause size={18}/></span><div><small>Pausados</small><strong>{loading?'—':countFor('paused')}</strong></div></div>
   <div className="qr-metric"><span className="qr-metric-icon violet"><ScanLine size={18}/></span><div><small>Escaneos acumulados</small><strong>{loading?'—':totalScans.toLocaleString('es-DO')}</strong></div></div>
  </div>
  <div className="qr-list-panel">
   <div className="qr-list-heading"><div><h2>Tus códigos</h2><p>{loading?'Cargando códigos…':`${filtered.length} ${filtered.length===1?'resultado':'resultados'}`}</p></div>
    <label className="qr-search"><ScanLine size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre, ID o destino" aria-label="Buscar códigos QR"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
    <button className="icon-button qr-refresh" onClick={load} disabled={loading} aria-label="Actualizar códigos QR" title="Actualizar"><RefreshCw size={17}/></button>
   </div>
   <div className="qr-filters" role="group" aria-label="Filtrar códigos QR por estado">{qrGroups.map(item=><button type="button" key={item.id} className={group===item.id?'active':''} aria-pressed={group===item.id} onClick={()=>setGroup(item.id)}>{item.label}<span>{countFor(item.id)}</span></button>)}</div>
   <div className="qr-table-wrap"><table className="qr-management-table"><thead><tr><th>QR permanente</th><th>Nombre</th><th>Destino actual</th><th>Tipo</th><th>Escaneos</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
    <tbody>{loading?<tr><td colSpan={7} className="table-empty">Cargando códigos QR…</td></tr>:filtered.length===0?<tr><td colSpan={7} className="qr-empty"><ScanLine size={24}/><strong>{items.length?'No encontramos códigos':'Aún no tienes códigos QR'}</strong><span>{items.length?'Prueba con otra búsqueda o filtro.':'Crea un QR dinámico para empezar.'}</span>{!items.length&&<button className="button" onClick={()=>setForm(true)}><Plus size={16}/> Crear QR dinámico</button>}</td></tr>:filtered.map(qr=><tr key={qr.id}>
     <td><strong className="qr-id">{qr.public_id}</strong><small className="qr-permanent-url">{qr.qr_url.replace(/^https?:\/\//,'')}</small></td>
     <td><strong>{qr.label}</strong><small>{qr.business_name||'Sin cliente asociado'}</small></td>
     <td className="qr-current-destination" title={qr.destination_url}>{qr.destination_url||'Sin destino'}</td>
     <td>{typeNames[qr.type]||qr.type}</td><td>{Number(qr.scan_count||0).toLocaleString('es-DO')}</td>
     <td><span className={`qr-status ${qr.status}`}>{qrStatus(qr)}</span></td>
     <td><div className="qr-row-actions"><button type="button" onClick={()=>setSelected(qr)} aria-label={`Gestionar QR ${qr.label}`} title="Ver destino e historial"><ExternalLink size={16}/></button>{qr.status==='active'?<button type="button" onClick={()=>updateStatus(qr,'pause')} aria-label={`Pausar ${qr.label}`} title="Pausar"><Pause size={16}/></button>:qr.status==='paused'?<button type="button" onClick={()=>updateStatus(qr,'activate')} aria-label={`Activar ${qr.label}`} title="Activar"><Play size={16}/></button>:null}</div></td>
    </tr>)}</tbody>
   </table></div>
  </div>
  {form&&<CreateQr api={api} csrf={csrf} knownIds={items.map(item=>String(item.id))} onDone={qr=>{setForm(false);load();setSelected(qr);}} onCancel={()=>setForm(false)}/>}
  {selected&&<QrDetail api={api} csrf={csrf} qr={selected} copied={copied} onCopy={handleCopy} onDestinationUpdated={destination=>{setItems(current=>current.map(item=>item.id===selected.id?{...item,destination_url:destination}:item));setSelected(current=>current?{...current,destination_url:destination}:current);}} onDeleted={deleted=>{setItems(current=>current.filter(item=>item.id!==deleted.id));setSelected(null);setNotice(`Se eliminó “${deleted.label}”.`);}} onClose={()=>setSelected(null)}/>}
 </section>;
}

function CreateQr({api,csrf,knownIds,onDone,onCancel}:{api:string;csrf?:string;knownIds:string[];onDone:(qr:QR)=>void;onCancel:()=>void}){
 const [label,setLabel]=useState('');const [url,setUrl]=useState('');const [type,setType]=useState('url');const [error,setError]=useState('');const [saving,setSaving]=useState(false);
 const submit=async(event:FormEvent)=>{
  event.preventDefault();setSaving(true);setError('');
  try{
   const data=await call<{item?:QR}>(api,'/api/admin/qr',{method:'POST',body:JSON.stringify({label,destination_url:url,type})},csrf);
   let item=data.item;
   if(!item?.qr_url){
    const list=await call<{items:Omit<QR,'qr_url'>[];qr_base_url:string}>(api,'/api/admin/qr');
    const known=new Set(knownIds);
    const saved=list.items.find(qr=>item&&(qr.id===item.id||qr.public_id===item.public_id))
     ||list.items.find(qr=>!known.has(String(qr.id))&&qr.label===label.trim()&&qr.destination_url===url.trim()&&qr.type===type);
    const base=list.qr_base_url?.replace(/\/+$/,'');
    if(!saved||!base)throw new Error('El código se creó, pero no se pudo recuperar su enlace permanente. Actualiza la lista para comprobarlo.');
    item={...saved,qr_url:saved.qr_url||`${base}/${saved.public_id}`};
   }
   onDone(item);
  }catch(e){setError(e instanceof Error?e.message:'No se pudo crear el código QR');}
  finally{setSaving(false);}
 };
 return <div className="modal-backdrop"><form className="modal qr-create-modal" onSubmit={submit}>
  <button type="button" className="modal-close" onClick={onCancel} aria-label="Cerrar formulario"><X size={18}/></button>
  <p className="eyebrow">NUEVO CÓDIGO PERMANENTE</p><h2>Crear QR dinámico</h2><p className="qr-create-intro">El QR impreso apuntará a una URL fija de ENLÁZATE. El destino se podrá cambiar después sin reemplazar el código.</p>
  {error&&<div className="alert" role="alert">{error}</div>}
  <label>Nombre del código<input required maxLength={190} autoFocus value={label} onChange={event=>setLabel(event.target.value)} placeholder="Menú — Restaurante Central"/></label>
  <label>Tipo de experiencia<select value={type} onChange={event=>setType(event.target.value)}><option value="url">URL personalizada</option><option value="menu">Menú digital</option><option value="reviews">Reseñas</option><option value="whatsapp">WhatsApp</option><option value="wifi">Wi-Fi</option><option value="maps">Google Maps</option><option value="contact">Contacto digital</option><option value="nfc">NFC</option></select></label>
  <label>Destino inicial<input required type="url" value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://tusitio.com/menu"/><small>Debe ser una dirección HTTP o HTTPS. Podrás cambiarla sin volver a generar el QR.</small></label>
  <div className="qr-dynamic-note"><Link2 size={16}/><span>El destino puede cambiar; el identificador y el QR descargable permanecen iguales.</span></div>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel} disabled={saving}>Cancelar</button><button className="button" disabled={saving}>{saving?'Creando…':'Crear código QR'} <ArrowRight size={16}/></button></div>
 </form></div>;
}

function QrDetail({api,csrf,qr,copied,onCopy,onDestinationUpdated,onDeleted,onClose}:{api:string;csrf?:string;qr:QR;copied:string;onCopy:(value:string,key:string)=>void;onDestinationUpdated:(destination:string)=>void;onDeleted:(qr:QR)=>void;onClose:()=>void}){
 const [url,setUrl]=useState(qr.destination_url||'');const [history,setHistory]=useState<QRHistory[]>([]);const [stats,setStats]=useState<{total:number;unique_estimate:number}|null>(null);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [deleting,setDeleting]=useState(false);const [confirmDelete,setConfirmDelete]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
 useEffect(()=>{
  let cancelled=false;setLoading(true);setError('');
  call<QRDetailData>(api,`/api/admin/qr/${qr.id}`).then(data=>{if(cancelled)return;setUrl(data.item.destination_url||'');setHistory(data.item.history||[]);setStats(data.item.stats||null);})
   .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'No se pudo cargar el detalle del QR');})
   .finally(()=>{if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;};
 },[api,qr.id]);
 const save=async()=>{
  if(!url.trim()||url===qr.destination_url)return;
  setSaving(true);setError('');setMessage('');
  try{
   await call(api,`/api/admin/qr/${qr.id}`,{method:'PATCH',body:JSON.stringify({destination_url:url})},csrf);
   onDestinationUpdated(url);setMessage('Destino actualizado. El mismo QR y su URL permanente siguen vigentes.');
   try{const data=await call<QRDetailData>(api,`/api/admin/qr/${qr.id}`);setHistory(data.item.history||[]);setStats(data.item.stats||null);}
   catch(e){setError(`El destino sí se actualizó sin cambiar el QR, pero no se pudo refrescar el historial: ${e instanceof Error?e.message:'error desconocido'}`);}
  }catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar el destino');}
  finally{setSaving(false);}
 };
 const remove=async()=>{
  setDeleting(true);setError('');
  try{
   await call(api,`/api/admin/qr/${qr.id}`,{method:'DELETE'},csrf);
   onDeleted(qr);
  }catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar el código QR');}
  finally{setDeleting(false);}
 };
 return <div className="modal-backdrop qr-detail-backdrop"><section className="qr-detail-modal" role="dialog" aria-modal="true" aria-labelledby="qr-detail-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar detalle" disabled={deleting}><X size={18}/></button>
  <p className="eyebrow">QR DINÁMICO · {qr.public_id}</p><h2 id="qr-detail-title">{qr.label}</h2><p className="qr-detail-business">{qr.business_name||'Sin cliente asociado'} · {typeNames[qr.type]||qr.type} · <span className={`qr-status ${qr.status}`}>{qrStatus(qr)}</span></p>
  <div className="qr-fixed-link"><div><span>ENLACE FIJO QUE CONTIENE EL QR</span><code>{qr.qr_url}</code></div><button type="button" onClick={()=>onCopy(qr.qr_url,`detail-${qr.id}`)} aria-label="Copiar enlace permanente">{copied===`detail-${qr.id}`?<Check size={16}/>:<Clipboard size={16}/>}</button></div>
  <p className="qr-fixed-explanation">Este enlace permanente redirige al destino vigente. Puedes imprimir el QR una vez y actualizar el destino cuantas veces necesites.</p>
  <div className="qr-detail-stats"><div><strong>{stats?.total??qr.scan_count}</strong><small>Escaneos totales</small></div><div><strong>{stats?.unique_estimate??'—'}</strong><small>Escaneos únicos estimados</small></div></div>
  <label className="qr-destination-label">Destino actual<input type="url" required value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://tusitio.com/menu"/><small>Al guardar, cambia el destino detrás del mismo QR. No se genera un código nuevo.</small></label>
  {error&&<div className="alert" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}
  <div className="qr-detail-actions"><button type="button" className="button" onClick={save} disabled={saving||deleting||loading||url===qr.destination_url}>{saving?'Guardando…':'Guardar destino'} <RefreshCw size={15}/></button><button type="button" className="button qr-delete-button" onClick={()=>{setConfirmDelete(true);setError('');}} disabled={saving||deleting}><Trash2 size={15}/> Eliminar QR</button></div>
  {confirmDelete&&<div className="qr-delete-confirm" role="alertdialog" aria-labelledby="qr-delete-title" aria-describedby="qr-delete-description"><span><AlertTriangle size={18}/></span><div><strong id="qr-delete-title">¿Eliminar este código QR?</strong><p id="qr-delete-description">Esta acción es permanente. El enlace dejará de funcionar y se borrarán su historial de destinos y sus estadísticas de escaneos. Las páginas digitales o etiquetas NFC vinculadas permanecerán guardadas, pero quedarán desvinculadas.</p><div><button type="button" className="button secondary" onClick={()=>setConfirmDelete(false)} disabled={deleting}>Cancelar</button><button type="button" className="button qr-delete-confirm-button" onClick={remove} disabled={deleting}>{deleting?'Eliminando…':'Eliminar definitivamente'} <Trash2 size={14}/></button></div></div></div>}
  <div className="qr-downloads"><span>Descargar el mismo QR</span><a href={`${api}/api/admin/qr/${qr.id}/svg`}><Download size={15}/> SVG</a><a href={`${api}/api/admin/qr/${qr.id}/png`}><Download size={15}/> PNG</a></div>
  <div className="qr-history-heading"><h3><History size={16}/> Historial de destinos</h3>{loading&&<small>Cargando…</small>}</div>
  <div className="qr-history">{history.length?history.map((entry,index)=><div key={`${entry.created_at}-${index}`}><span>{entry.destination_url}</span><small>{entry.created_at}</small></div>):!loading?<p>Aún no hay cambios de destino registrados.</p>:null}</div>
 </section></div>;
}
