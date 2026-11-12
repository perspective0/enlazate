import {FormEvent,useCallback,useEffect,useMemo,useState} from 'react';
import {BookOpen,Check,Copy,Edit3,ExternalLink,Globe2,Link2,MapPin,MessageCircle,Plus,RefreshCw,Search,ShieldCheck,Star,Trash2,Wifi,X,Phone,Save,Eye,EyeOff,ArrowUp,ArrowDown} from 'lucide-react';
import './digitalpages.css';
import './digitalpagesmanagement.css';
import './digitalpageform.css';

type PageType='menu'|'wifi'|'contact'|'reviews'|'maps'|'whatsapp';
type PageFilter='all'|'menu'|'wifi'|'contact'|'links'|'private';
type PageContent=Record<string,string>;
type MenuItem={id:number;category_id:number;name:string;description:string|null;price_dop:number|string|null;image_url:string|null;sort_order:number;is_available:number|string};
type MenuCategory={id:number;page_id:number;name:string;sort_order:number;is_active:number|string};
type DigitalPageRecord={id:number;slug:string;page_type:PageType;title:string;subtitle:string|null;logo_url?:string|null;cover_url?:string|null;content:PageContent|string|null;is_public:number|string;created_at:string;category_count?:number|string;categories?:MenuCategory[];items?:MenuItem[]};
type PageKind={id:PageType;label:string;description:string;Icon:typeof Wifi};
const pageTypes:PageKind[]=[
 {id:'menu',label:'Menú digital',description:'Crea secciones y publica los productos de tu menú.',Icon:BookOpen},
 {id:'wifi',label:'Acceso Wi-Fi',description:'Muestra la red y su contraseña.',Icon:Wifi},
 {id:'contact',label:'Contacto',description:'Facilita llamadas y correos.',Icon:Phone},
 {id:'reviews',label:'Reseñas',description:'Invita a tus clientes a opinar.',Icon:Star},
 {id:'maps',label:'Ubicación',description:'Enlaza tu negocio en Maps.',Icon:MapPin},
 {id:'whatsapp',label:'WhatsApp',description:'Abre una conversación directa.',Icon:MessageCircle}
];
const filters:{id:PageFilter;label:string}[]=[{id:'all',label:'Todas'},{id:'menu',label:'Menús'},{id:'wifi',label:'Wi-Fi'},{id:'contact',label:'Contacto'},{id:'links',label:'Enlaces externos'},{id:'private',label:'No públicas'}];
const typeLabel:Record<PageType,string>={menu:'Menú digital',wifi:'Acceso Wi-Fi',contact:'Contacto',reviews:'Reseñas',maps:'Ubicación',whatsapp:'WhatsApp'};

async function request<T=any>(api:string,path:string,options:RequestInit={},csrf?:string):Promise<T>{
 const response=await fetch(`${api}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...(options.headers||{})},...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||'No se pudo completar la solicitud');
 return data as T;
}
function isPublic(page:DigitalPageRecord){return page.is_public===1||page.is_public==='1';}
function isEnabled(value:number|string){return value===1||value==='1';}
function normalize(value:string){return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function pageContent(page:DigitalPageRecord):PageContent{
 if(typeof page.content==='string'){try{return JSON.parse(page.content)||{};}catch{return {};}}
 return page.content||{};
}
function pageKind(type:PageType){return pageTypes.find(item=>item.id===type)||pageTypes[0];}
function pageDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?'Fecha no disponible':date.toLocaleDateString('es-DO',{day:'numeric',month:'short',year:'numeric'});}
async function copyText(value:string){
 try{
  await navigator.clipboard.writeText(value);
  return;
 }catch{
  const textarea=document.createElement('textarea');
  textarea.value=value;
  textarea.setAttribute('readonly','');
  textarea.style.position='fixed';
  textarea.style.opacity='0';
  document.body.appendChild(textarea);
  try{
   textarea.focus();
   textarea.select();
   textarea.setSelectionRange(0,textarea.value.length);
   if(!document.execCommand('copy')){
    if(window.prompt('No se pudo copiar automáticamente. Copia este enlace:',value)===null)throw new Error('No se copió el enlace.');
   }
  }finally{
   textarea.remove();
  }
 }
}

export default function DigitalPages({api,csrf}:{api:string;csrf?:string}){
 const [items,setItems]=useState<DigitalPageRecord[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<PageFilter>('all');
 const [createOpen,setCreateOpen]=useState(false);
 const [manageId,setManageId]=useState<number|null>(null);
 const load=useCallback(()=>{setLoading(true);setError('');request<{items:DigitalPageRecord[]}>(api,'/api/admin/digital-pages').then(data=>setItems(data.items||[])).catch(reason=>setError(reason instanceof Error?reason.message:'No se pudieron cargar las páginas digitales')).finally(()=>setLoading(false));},[api]);
 useEffect(()=>{load();},[load]);
 const counts=useMemo(()=>({
  all:items.length,menu:items.filter(page=>page.page_type==='menu').length,wifi:items.filter(page=>page.page_type==='wifi').length,
  contact:items.filter(page=>page.page_type==='contact').length,links:items.filter(page=>['reviews','maps','whatsapp'].includes(page.page_type)).length,
  private:items.filter(page=>!isPublic(page)).length
 }),[items]);
 const visible=useMemo(()=>{
  const q=normalize(query.trim());
  return items.filter(page=>{
   const matchesFilter=filter==='all'||(filter==='links'?['reviews','maps','whatsapp'].includes(page.page_type):filter==='private'?!isPublic(page):page.page_type===filter);
   return matchesFilter&&(!q||normalize(`${page.title} ${page.subtitle||''} ${page.slug} ${typeLabel[page.page_type]}`).includes(q));
  });
 },[filter,items,query]);
 const pageUrl=(page:DigitalPageRecord)=>`${window.location.origin}/p/${page.slug}`;
 const copyUrl=async(page:DigitalPageRecord)=>{
  try{await copyText(pageUrl(page));setError('');setNotice(`Enlace de “${page.title}” copiado.`);window.setTimeout(()=>setNotice(''),3000);}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo copiar el enlace. Comprueba los permisos del navegador.');}
 };
 return <section className="digital-pages">
  <div className="digital-pages-heading">
   <div><p className="eyebrow">EXPERIENCIAS QR</p><h1>Páginas digitales</h1><p className="muted">Diseña y administra lo que tus clientes ven al abrir cada enlace.</p></div>
   <div className="digital-pages-actions"><button type="button" className="icon-button digital-pages-refresh" onClick={load} disabled={loading} aria-label="Actualizar páginas" title="Actualizar páginas"><RefreshCw size={17}/></button><button type="button" className="button" onClick={()=>{setCreateOpen(true);setError('');setNotice('');}}><Plus size={16}/> Crear página</button></div>
  </div>
  {error&&<div className="alert" role="alert">{error}</div>}
  {notice&&<div className="digital-pages-notice" role="status"><Check size={16}/>{notice}</div>}
  <div className="digital-pages-callout"><span><ShieldCheck size={18}/></span><p><strong>Crea y mantén cada experiencia al día.</strong> Administra páginas públicas, edita su contenido y usa sus enlaces como destino de códigos QR dinámicos.</p></div>
  <div className="digital-pages-overview">
   <div className="digital-pages-metric"><span className="digital-pages-metric-icon blue"><Globe2 size={18}/></span><div><small>Páginas creadas</small><strong>{loading?'—':counts.all}</strong></div></div>
   <div className="digital-pages-metric"><span className="digital-pages-metric-icon green"><Check size={18}/></span><div><small>Públicas</small><strong>{loading?'—':items.filter(isPublic).length}</strong></div></div>
   <div className="digital-pages-metric"><span className="digital-pages-metric-icon violet"><BookOpen size={18}/></span><div><small>Menús digitales</small><strong>{loading?'—':counts.menu}</strong></div></div>
   <div className="digital-pages-metric"><span className="digital-pages-metric-icon amber"><Link2 size={18}/></span><div><small>Contacto y enlaces</small><strong>{loading?'—':counts.contact+counts.links}</strong></div></div>
  </div>
  <div className="digital-pages-list">
   <div className="digital-pages-list-heading"><div><h2>Tu biblioteca de páginas</h2><p>{loading?'Cargando páginas…':`${visible.length} ${visible.length===1?'página':'páginas'}`}</p></div>
    <label className="digital-pages-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por título o enlace" aria-label="Buscar páginas digitales"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</label>
   </div>
   <div className="digital-pages-filters" role="group" aria-label="Filtrar páginas">
    {filters.map(item=><button type="button" key={item.id} className={filter===item.id?'active':''} aria-pressed={filter===item.id} onClick={()=>setFilter(item.id)}>{item.label}<span>{counts[item.id]}</span></button>)}
   </div>
   {loading?<div className="digital-pages-loading">Cargando páginas digitales…</div>:visible.length===0?
    <div className="digital-pages-empty"><Globe2 size={27}/><strong>{items.length?'No encontramos páginas':'Aún no tienes páginas digitales'}</strong><span>{items.length?'Prueba con otra búsqueda o filtro.':'Crea una página y prepara el contenido que verán tus clientes.'}</span>{items.length===0&&<button type="button" className="button" onClick={()=>setCreateOpen(true)}><Plus size={15}/> Crear primera página</button>}</div>:
    <div className="digital-pages-grid">{visible.map(page=>{
     const kind=pageKind(page.page_type);const Icon=kind.Icon;const content=pageContent(page);
     return <article className="digital-page-card" key={page.id}>
      <div className={`digital-page-card-icon ${page.page_type}`}><Icon size={20}/></div>
      <div className="digital-page-card-top"><span className={`digital-page-status ${isPublic(page)?'public':'private'}`}><i/>{isPublic(page)?'Pública':'No pública'}</span><span className="digital-page-kind">{typeLabel[page.page_type]}</span></div>
      <h3>{page.title}</h3>{page.subtitle&&<p className="digital-page-subtitle">{page.subtitle}</p>}
      {page.page_type==='menu'&&<p className="digital-page-preview"><BookOpen size={14}/>{Number(page.category_count||0)} secciones en el menú</p>}
      {page.page_type==='wifi'&&<p className="digital-page-preview"><Wifi size={14}/>{content.network||'Red Wi-Fi sin configurar'}</p>}
      {page.page_type==='contact'&&<p className="digital-page-preview"><Phone size={14}/>{content.phone||content.email||'Datos de contacto sin configurar'}</p>}
      {['reviews','maps','whatsapp'].includes(page.page_type)&&<p className="digital-page-preview"><ExternalLink size={14}/>{content.url?'Enlace configurado':'Enlace sin configurar'}</p>}
      <div className="digital-page-card-link"><span>ENLACE DE LA PÁGINA</span><code title={pageUrl(page)}>{pageUrl(page)}</code></div>
      <div className="digital-page-card-footer"><span>{pageDate(page.created_at)}</span>
       <div><button type="button" className="digital-page-action manage" onClick={()=>{setManageId(page.id);setError('');}} aria-label={`Gestionar ${page.title}`} title="Gestionar contenido"><Edit3 size={15}/><span>Gestionar</span></button>{isPublic(page)&&<a className="digital-page-action" href={pageUrl(page)} aria-label={`Abrir ${page.title}`} title="Vista pública"><ExternalLink size={15}/></a>}<button type="button" className="digital-page-action" onClick={()=>copyUrl(page)} aria-label={`Copiar enlace de ${page.title}`} title="Copiar enlace"><Copy size={15}/></button></div>
      </div>
     </article>;
    })}</div>}
  </div>
  {createOpen&&<CreateDigitalPage api={api} csrf={csrf} onClose={()=>setCreateOpen(false)} onDone={page=>{setCreateOpen(false);void load();setManageId(page.id);}}/>}
  {manageId!==null&&<ManagePage api={api} csrf={csrf} pageId={manageId} onClose={()=>setManageId(null)} onUpdated={updated=>{setItems(current=>current.map(page=>page.id===updated.id?{...page,...updated}:page));}} onDeleted={deleted=>{setItems(current=>current.filter(page=>page.id!==deleted.id));setManageId(null);setNotice(`Se eliminó “${deleted.title}”.`);}}/>}
 </section>;
}

function CreateDigitalPage({api,csrf,onClose,onDone}:{api:string;csrf?:string;onClose:()=>void;onDone:(page:DigitalPageRecord)=>void}){
 const [type,setType]=useState<PageType>('menu');const [title,setTitle]=useState('');const [subtitle,setSubtitle]=useState('');
 const [fields,setFields]=useState({network:'',password:'',phone:'',email:'',url:''});const [logoUrl,setLogoUrl]=useState('');const [coverUrl,setCoverUrl]=useState('');const [published,setPublished]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 const setField=(key:keyof typeof fields,value:string)=>setFields(current=>({...current,[key]:value}));
 const submit=async(event:FormEvent)=>{
  event.preventDefault();setSaving(true);setError('');const content:PageContent={};
  if(type==='wifi'){content.network=fields.network.trim();content.password=fields.password;}
  if(type==='contact'){content.phone=fields.phone.trim();content.email=fields.email.trim();}
  if(['reviews','maps','whatsapp'].includes(type))content.url=fields.url.trim();
  try{
   const result=await request<{id:number;slug:string}>(api,'/api/admin/digital-pages',{method:'POST',body:JSON.stringify({title:title.trim(),subtitle:subtitle.trim(),page_type:type,content,logo_url:logoUrl.trim(),cover_url:coverUrl.trim(),is_public:published?1:0})},csrf);
   onDone({id:result.id,slug:result.slug,page_type:type,title:title.trim(),subtitle:subtitle.trim()||null,logo_url:logoUrl.trim()||null,cover_url:coverUrl.trim()||null,content,is_public:published?1:0,created_at:new Date().toISOString()});
  }catch(reason){setError(reason instanceof Error?reason.message:'No se pudo crear la página digital');}
  finally{setSaving(false);}
 };
 const selected=pageKind(type);const Icon=selected.Icon;
 return <div className="modal-backdrop digital-pages-backdrop"><form className="modal digital-page-form" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="digital-page-form-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar formulario" disabled={saving}><X size={18}/></button>
  <p className="eyebrow">NUEVA EXPERIENCIA</p><h2 id="digital-page-form-title">Crear página digital</h2><p className="digital-page-form-intro">Elige un formato y agrega los datos iniciales. Después podrás gestionar todo su contenido.</p>
  {error&&<div className="alert" role="alert">{error}</div>}
  <fieldset className="digital-page-type-picker"><legend>Tipo de página</legend><div>{pageTypes.map(item=><button type="button" key={item.id} className={type===item.id?'selected':''} aria-pressed={type===item.id} onClick={()=>setType(item.id)}><item.Icon size={17}/><span>{item.label}</span></button>)}</div></fieldset>
  <div className="digital-page-form-section"><strong><Icon size={16}/>{selected.label}</strong><span>{selected.description}</span></div>
  <label>Título<input required maxLength={190} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Ej. Café La Esquina"/></label>
  <label>Descripción breve <span className="optional">(opcional)</span><input maxLength={255} value={subtitle} onChange={event=>setSubtitle(event.target.value)} placeholder="Una frase que describa esta página"/></label>
  <div className="digital-page-form-grid"><label>URL del logo <span className="optional">(opcional)</span><input type="url" value={logoUrl} onChange={event=>setLogoUrl(event.target.value)} placeholder="https://…"/></label><label>URL de portada <span className="optional">(opcional)</span><input type="url" value={coverUrl} onChange={event=>setCoverUrl(event.target.value)} placeholder="https://…"/></label></div>
  <label className="digital-page-publish-option"><input type="checkbox" checked={published} onChange={event=>setPublished(event.target.checked)}/><span>Publicar al crear</span></label>
  {type==='wifi'&&<div className="digital-page-form-grid"><label>Nombre de la red<input required value={fields.network} onChange={event=>setField('network',event.target.value)} placeholder="Wi-Fi del negocio"/></label><label>Contraseña<input value={fields.password} onChange={event=>setField('password',event.target.value)} placeholder="Contraseña de la red"/></label></div>}
  {type==='contact'&&<div className="digital-page-form-grid"><label>Teléfono<input type="tel" required={!fields.email.trim()} value={fields.phone} onChange={event=>setField('phone',event.target.value)} placeholder="+1 809 555 0100"/></label><label>Correo electrónico<input type="email" required={!fields.phone.trim()} value={fields.email} onChange={event=>setField('email',event.target.value)} placeholder="hola@minegocio.com"/></label></div>}
  {['reviews','maps','whatsapp'].includes(type)&&<label>{type==='reviews'?'Enlace para reseñas':type==='maps'?'Enlace de Google Maps':'Enlace de WhatsApp'}<input type="url" required value={fields.url} onChange={event=>setField('url',event.target.value)} placeholder={type==='whatsapp'?'https://wa.me/18095550100':'https://…'}/></label>}
  {type==='menu'&&<div className="digital-page-hint"><BookOpen size={16}/><span>Después de crear la página podrás agregar secciones y productos con descripción, imagen y precio.</span></div>}
  <div className="digital-page-form-hint"><Link2 size={15}/><span>Se generará un enlace público único que podrás abrir, copiar o usar como destino de un QR.</span></div>
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="button" disabled={saving}>{saving?'Creando…':'Crear página'} <Plus size={15}/></button></div>
 </form></div>;
}

function ManagePage({api,csrf,pageId,onClose,onUpdated,onDeleted}:{api:string;csrf?:string;pageId:number;onClose:()=>void;onUpdated:(page:DigitalPageRecord)=>void;onDeleted:(page:DigitalPageRecord)=>void}){
 const [page,setPage]=useState<DigitalPageRecord|null>(null);const [title,setTitle]=useState('');const [subtitle,setSubtitle]=useState('');const [logoUrl,setLogoUrl]=useState('');const [coverUrl,setCoverUrl]=useState('');
 const [content,setContent]=useState<PageContent>({});const [published,setPublished]=useState(true);const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const [categoryName,setCategoryName]=useState('');const [addingCategory,setAddingCategory]=useState(false);const [itemCategory,setItemCategory]=useState<number|null>(null);const [editingItem,setEditingItem]=useState<MenuItem|null>(null);const [deletePageConfirm,setDeletePageConfirm]=useState(false);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const response=await request<{item:DigitalPageRecord}>(api,`/api/admin/digital-pages/${pageId}`);const item=response.item;item.items=item.items||[];item.categories=item.categories||[];item.category_count=item.categories.length;setPage(item);setTitle(item.title);setSubtitle(item.subtitle||'');setLogoUrl(item.logo_url||'');setCoverUrl(item.cover_url||'');setContent(pageContent(item));setPublished(isPublic(item));onUpdated(item);}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo cargar la página digital');}
  finally{setLoading(false);}
 },[api,pageId]);
 useEffect(()=>{void load();},[load]);
 const pagePath=`/api/admin/digital-pages/${pageId}`;
 const savePage=async(event:FormEvent)=>{
  event.preventDefault();if(!page)return;setSaving(true);setError('');setNotice('');
  try{
   await request(api,pagePath,{method:'PATCH',body:JSON.stringify({title:title.trim(),subtitle:subtitle.trim(),logo_url:logoUrl.trim(),cover_url:coverUrl.trim(),content,is_public:published?1:0})},csrf);
   const updated={...page,title:title.trim(),subtitle:subtitle.trim()||null,logo_url:logoUrl.trim()||null,cover_url:coverUrl.trim()||null,content,is_public:published?1:0};setPage(updated);onUpdated(updated);setNotice('Cambios de la página guardados.');
  }catch(reason){setError(reason instanceof Error?reason.message:'No se pudieron guardar los cambios');}
  finally{setSaving(false);}
 };
 const addCategory=async(event:FormEvent)=>{
  event.preventDefault();const name=categoryName.trim();if(!name)return;setAddingCategory(true);setError('');
  try{await request(api,`${pagePath}/categories`,{method:'POST',body:JSON.stringify({name})},csrf);setCategoryName('');await load();setNotice('Sección añadida al menú.');}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo añadir la sección');}
  finally{setAddingCategory(false);}
 };
 const updateCategory=async(category:MenuCategory,changes:Partial<MenuCategory>)=>{
  setError('');
  try{await request(api,`${pagePath}/categories/${category.id}`,{method:'PATCH',body:JSON.stringify(changes)},csrf);await load();}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo actualizar la sección');}
 };
 const moveCategory=async(index:number,direction:-1|1)=>{
  const reordered=[...categories];const target=index+direction;if(target<0||target>=reordered.length)return;
  [reordered[index],reordered[target]]=[reordered[target],reordered[index]];
  setError('');
  try{
   await request(api,`${pagePath}/categories/order`,{method:'PUT',body:JSON.stringify({ids:reordered.map(category=>category.id)})},csrf);
   await load();
  }catch(reason){setError(reason instanceof Error?reason.message:'No se pudo reordenar la sección');}
 };
 const deleteCategory=async(category:MenuCategory)=>{
  if(!window.confirm(`¿Eliminar la sección “${category.name}” y todos los productos que contiene?`))return;
  setError('');
  try{await request(api,`${pagePath}/categories/${category.id}`,{method:'DELETE'},csrf);await load();setNotice('Sección y productos eliminados.');}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo eliminar la sección');}
 };
 const saveItem=async(categoryId:number,itemData:Partial<MenuItem>,itemId?:number)=>{
  const path=itemId?`${pagePath}/categories/${categoryId}/items/${itemId}`:`${pagePath}/categories/${categoryId}/items`;
  await request(api,path,{method:itemId?'PATCH':'POST',body:JSON.stringify(itemData)},csrf);
  setItemCategory(null);setEditingItem(null);await load();setNotice(itemId?'Producto actualizado.':'Producto añadido al menú.');
 };
 const moveItem=async(categoryId:number,index:number,direction:-1|1)=>{
  const reordered=menuItems.filter(item=>item.category_id===categoryId);const target=index+direction;if(target<0||target>=reordered.length)return;
  [reordered[index],reordered[target]]=[reordered[target],reordered[index]];
  setError('');
  try{
   await request(api,`${pagePath}/categories/${categoryId}/items/order`,{method:'PUT',body:JSON.stringify({ids:reordered.map(item=>item.id)})},csrf);
   await load();
  }catch(reason){setError(reason instanceof Error?reason.message:'No se pudo reordenar el producto');}
 };
 const deleteItem=async(item:MenuItem)=>{
  if(!page)return;
  if(!window.confirm(`¿Eliminar “${item.name}” del menú?`))return;
  setError('');
  try{await request(api,`${pagePath}/categories/${item.category_id}/items/${item.id}`,{method:'DELETE'},csrf);await load();setNotice('Producto eliminado del menú.');}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo eliminar el producto');}
 };
 const deletePage=async()=>{
  if(!page)return;setSaving(true);setError('');
  try{await request(api,pagePath,{method:'DELETE'},csrf);onDeleted(page);}
  catch(reason){setError(reason instanceof Error?reason.message:'No se pudo eliminar la página');}
  finally{setSaving(false);}
 };
 const categories=page?.categories||[];const menuItems=page?.items||[];const isMenu=page?.page_type==='menu';
 return <div className="modal-backdrop digital-pages-backdrop digital-manage-backdrop"><section className="digital-manage-modal" role="dialog" aria-modal="true" aria-labelledby="digital-manage-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar gestión"><X size={18}/></button>
  {loading?<div className="digital-manage-state">Cargando contenido de la página…</div>:!page?<div className="digital-manage-state"><strong>No se pudo abrir esta página</strong>{error&&<p>{error}</p>}<button type="button" className="button secondary" onClick={onClose}>Cerrar</button></div>:<>
   <div className="digital-manage-header"><p className="eyebrow">GESTIÓN DE CONTENIDO</p><h2 id="digital-manage-title">{page.title}</h2><div className="digital-manage-header-links"><span className={`digital-page-status ${published?'public':'private'}`}><i/>{published?'Pública':'Borrador'}</span><a href={`${window.location.origin}/p/${page.slug}`}><ExternalLink size={13}/> Ver página</a></div></div>
   {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="digital-pages-notice" role="status"><Check size={15}/>{notice}</div>}
   <form className="digital-manage-page-form" onSubmit={savePage}>
    <h3>Datos de la página</h3><div className="digital-manage-two-col"><label>Título<input required maxLength={190} value={title} onChange={event=>setTitle(event.target.value)}/></label><label>Descripción breve<input maxLength={255} value={subtitle} onChange={event=>setSubtitle(event.target.value)} placeholder="Opcional"/></label><label>URL del logo<input type="url" value={logoUrl} onChange={event=>setLogoUrl(event.target.value)} placeholder="https://…"/></label><label>URL de portada<input type="url" value={coverUrl} onChange={event=>setCoverUrl(event.target.value)} placeholder="https://…"/></label></div>
    <ContentFields type={page.page_type} content={content} onChange={(key,value)=>setContent(current=>({...current,[key]:value}))}/>
    <div className="digital-publish-control"><div><strong>Publicar página</strong><small>{published?'El enlace es visible para todos.':'Solo administradores pueden verla en el panel.'}</small></div><button type="button" role="switch" aria-checked={published} className={`digital-switch ${published?'on':''}`} onClick={()=>setPublished(value=>!value)} aria-label={published?'Despublicar página':'Publicar página'}><span/></button></div>
    <div className="digital-manage-save"><button type="submit" className="button" disabled={saving}>{saving?'Guardando…':'Guardar cambios'} <Save size={15}/></button></div>
   </form>
   {isMenu&&<section className="digital-menu-builder">
    <div className="digital-builder-heading"><div><p className="eyebrow">EDITOR DE MENÚ</p><h3>Secciones y productos</h3><p>Ordena el contenido que aparecerá en el menú público.</p></div><span className="digital-builder-count">{categories.length} {categories.length===1?'sección':'secciones'} · {menuItems.length} {menuItems.length===1?'producto':'productos'}</span></div>
    <form className="digital-add-category" onSubmit={addCategory}><label className="sr-only" htmlFor="new-menu-category">Nombre de la sección</label><input id="new-menu-category" maxLength={120} required value={categoryName} onChange={event=>setCategoryName(event.target.value)} placeholder="Ej. Entradas, Platos principales…"/><button className="button" type="submit" disabled={addingCategory||!categoryName.trim()}><Plus size={15}/>{addingCategory?'Añadiendo…':'Añadir sección'}</button></form>
    {categories.length===0?<div className="digital-builder-empty"><BookOpen size={21}/><strong>Empieza por crear una sección</strong><span>Luego podrás añadir productos con descripción, precio e imagen.</span></div>:
     <div className="digital-category-list">{categories.map((category,index)=>{
      const entries=menuItems.filter(item=>item.category_id===category.id);
      return <article className={`digital-category ${isEnabled(category.is_active)?'':'inactive'}`} key={category.id}>
       <div className="digital-category-heading"><div className="digital-category-order"><button type="button" aria-label={`Subir ${category.name}`} disabled={index===0} onClick={()=>void moveCategory(index,-1)}><ArrowUp size={13}/></button><button type="button" aria-label={`Bajar ${category.name}`} disabled={index===categories.length-1} onClick={()=>void moveCategory(index,1)}><ArrowDown size={13}/></button></div>
        <label className="digital-category-name"><span className="sr-only">Nombre de sección</span><input key={`${category.id}-${category.name}`} defaultValue={category.name} maxLength={120} onBlur={event=>{const name=event.target.value.trim();if(name&&name!==category.name)void updateCategory(category,{name});}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/><small>{entries.length} {entries.length===1?'producto':'productos'}</small></label>
        <button type="button" className={`digital-inline-toggle ${isEnabled(category.is_active)?'enabled':''}`} onClick={()=>void updateCategory(category,{is_active:isEnabled(category.is_active)?0:1})}>{isEnabled(category.is_active)?'Visible':'Oculta'}</button>
        <button type="button" className="digital-icon-danger" onClick={()=>void deleteCategory(category)} aria-label={`Eliminar sección ${category.name}`} title="Eliminar sección y sus productos"><Trash2 size={15}/></button>
       </div>
       {entries.length>0&&<div className="digital-menu-items">{entries.map((item,itemIndex)=><article className={`digital-menu-item ${isEnabled(item.is_available)?'':'unavailable'}`} key={item.id}>
        {item.image_url?<img src={item.image_url} alt="" loading="lazy"/>:<span className="digital-menu-item-placeholder"><BookOpen size={15}/></span>}
        <div className="digital-menu-item-info"><strong>{item.name}</strong><small>{item.description||'Sin descripción'}{item.price_dop!==null&&item.price_dop!==''?` · RD$ ${Number(item.price_dop).toLocaleString('es-DO',{minimumFractionDigits:2})}`:''}</small></div>
        <div className="digital-menu-item-actions"><button type="button" aria-label={`Subir ${item.name}`} disabled={itemIndex===0} onClick={()=>void moveItem(category.id,itemIndex,-1)}><ArrowUp size={13}/></button><button type="button" aria-label={`Bajar ${item.name}`} disabled={itemIndex===entries.length-1} onClick={()=>void moveItem(category.id,itemIndex,1)}><ArrowDown size={13}/></button><button type="button" className={`digital-item-visibility ${isEnabled(item.is_available)?'enabled':''}`} onClick={()=>void request(api,`${pagePath}/categories/${category.id}/items/${item.id}`,{method:'PATCH',body:JSON.stringify({is_available:isEnabled(item.is_available)?0:1})},csrf).then(load).catch(reason=>setError(reason instanceof Error?reason.message:'No se pudo cambiar la disponibilidad'))} aria-label={isEnabled(item.is_available)?`Ocultar ${item.name}`:`Mostrar ${item.name}`} title={isEnabled(item.is_available)?'Visible en el menú':'Oculto del menú'}>{isEnabled(item.is_available)?<Eye size={14}/>:<EyeOff size={14}/>}</button><button type="button" onClick={()=>setEditingItem(item)} aria-label={`Editar ${item.name}`}><Edit3 size={14}/></button><button type="button" className="danger" onClick={()=>void deleteItem(item)} aria-label={`Eliminar ${item.name}`}><Trash2 size={14}/></button></div>
       </article>)}</div>}
       <button type="button" className="digital-add-item" onClick={()=>{setItemCategory(category.id);setEditingItem(null);}}><Plus size={14}/> Añadir producto a {category.name}</button>
      </article>;
     })}</div>}
   </section>}
   <div className="digital-manage-footer"><button type="button" className="digital-delete-page-link" onClick={()=>setDeletePageConfirm(true)}><Trash2 size={14}/> Eliminar página</button><button type="button" className="button secondary" onClick={onClose}>Cerrar gestión</button></div>
   {deletePageConfirm&&<div className="digital-confirm-layer"><div className="digital-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-page-title"><span><Trash2 size={18}/></span><h3 id="delete-page-title">¿Eliminar “{page.title}”?</h3><p>Se eliminarán la página y todo su contenido. El enlace dejará de estar disponible. Esta acción no se puede deshacer.</p>{error&&<div className="alert" role="alert">{error}</div>}<div><button type="button" className="button secondary" onClick={()=>setDeletePageConfirm(false)} disabled={saving}>Cancelar</button><button type="button" className="button danger" onClick={()=>void deletePage()} disabled={saving}>{saving?'Eliminando…':'Eliminar página'} <Trash2 size={14}/></button></div></div></div>}
   {itemCategory!==null&&<MenuItemForm category={categories.find(category=>category.id===itemCategory)!} onClose={()=>setItemCategory(null)} onSave={data=>saveItem(itemCategory,data)}/>}
   {editingItem&&<MenuItemForm category={categories.find(category=>category.id===editingItem.category_id)!} item={editingItem} onClose={()=>setEditingItem(null)} onSave={data=>saveItem(editingItem.category_id,data,editingItem.id)}/>}
  </>}
 </section></div>;
}

function ContentFields({type,content,onChange}:{type:PageType;content:PageContent;onChange:(key:string,value:string)=>void}){
 if(type==='menu')return <p className="digital-content-note"><BookOpen size={15}/>El contenido del menú se administra abajo en Secciones y productos.</p>;
 if(type==='wifi')return <div className="digital-content-fields"><label>Nombre de la red Wi-Fi<input value={content.network||''} onChange={event=>onChange('network',event.target.value)} placeholder="Wi-Fi del negocio"/></label><label>Contraseña<input value={content.password||''} onChange={event=>onChange('password',event.target.value)} placeholder="Contraseña de acceso"/></label></div>;
 if(type==='contact')return <div className="digital-content-fields"><label>Teléfono<input type="tel" value={content.phone||''} onChange={event=>onChange('phone',event.target.value)} placeholder="+1 809 555 0100"/></label><label>Correo electrónico<input type="email" value={content.email||''} onChange={event=>onChange('email',event.target.value)} placeholder="hola@minegocio.com"/></label></div>;
 const title=type==='reviews'?'Enlace para reseñas':type==='maps'?'Enlace de Google Maps':'Enlace de WhatsApp';
 return <div className="digital-content-fields"><label>{title}<input type="url" value={content.url||''} onChange={event=>onChange('url',event.target.value)} placeholder={type==='whatsapp'?'https://wa.me/18095550100':'https://…'}/></label></div>;
}

function MenuItemForm({category,item,onClose,onSave}:{category:MenuCategory;item?:MenuItem;onClose:()=>void;onSave:(data:Partial<MenuItem>)=>Promise<void>}){
 const [name,setName]=useState(item?.name||'');const [description,setDescription]=useState(item?.description||'');const [price,setPrice]=useState(item?.price_dop===null||item?.price_dop===undefined?'':String(item.price_dop));const [image,setImage]=useState(item?.image_url||'');const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{await onSave({name:name.trim(),description:description.trim(),price_dop:price===''?null:Number(price),image_url:image.trim()||null});}catch(reason){setError(reason instanceof Error?reason.message:'No se pudo guardar el producto');}finally{setSaving(false);}};
 return <div className="modal-backdrop digital-item-backdrop"><form className="modal digital-item-form" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="digital-item-form-title">
  <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar producto" disabled={saving}><X size={18}/></button><p className="eyebrow">{category.name.toLocaleUpperCase()}</p><h2 id="digital-item-form-title">{item?'Editar producto':'Añadir producto'}</h2>{error&&<div className="alert" role="alert">{error}</div>}
  <label>Nombre del producto<input required maxLength={190} autoFocus value={name} onChange={event=>setName(event.target.value)} placeholder="Ej. Mangú con los tres golpes"/></label>
  <label>Descripción<textarea rows={3} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Ingredientes, tamaño o detalles importantes"/></label>
  <div className="digital-item-form-grid"><label>Precio (DOP)<input type="number" min="0" step="0.01" value={price} onChange={event=>setPrice(event.target.value)} placeholder="0.00"/></label><label>URL de imagen<input type="url" value={image} onChange={event=>setImage(event.target.value)} placeholder="https://…"/></label></div>
  {image&&<div className="digital-item-image-preview"><img src={image} alt="Vista previa del producto" onError={event=>{event.currentTarget.style.display='none';}}/></div>}
  <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="button" disabled={saving}>{saving?'Guardando…':item?'Guardar cambios':'Añadir producto'} <Save size={15}/></button></div>
 </form></div>;
}
