import {ReactNode,useEffect,useState} from 'react';
import {Activity,BarChart3,Box,ChevronRight,Factory,LayoutDashboard,LogOut,Menu,Package,ScanLine,Settings,ShoppingBag,ShieldCheck,Users,X} from 'lucide-react';
import QrManager from './QrManager';import Production from './Production';import Analytics from './Analytics';import AdminModules from './AdminModules';import SummaryDashboard from './SummaryDashboard';import './adminlayout.css';import './adminsidebar.css';
type Props={api:string;session:any;onLogout:()=>void};
const groups=[
 {label:'INICIO',links:[['Resumen','/admin',LayoutDashboard]]},
 {label:'OPERACIÓN',links:[['Pedidos','/admin/orders',ShoppingBag],['Productos','/admin/products',Package],['Clientes','/admin/customers',Users]]},
 {label:'HERRAMIENTAS',links:[['Códigos QR','/admin/qr',ScanLine],['Producción','/admin/production',Factory],['Analítica','/admin/analytics',BarChart3],['Páginas digitales','/admin/digital-pages',Box]]},
 {label:'SISTEMA',links:[['Configuración','/admin/settings',Settings]]}
] as const;
const links=groups.flatMap(group=>group.links);

export default function AdminLayout({api,session,onLogout}:Props){
 const [open,setOpen]=useState(false);
 const path=location.pathname;
 const active=links.find(link=>link[1]===path)||links[0];
 useEffect(()=>{
  if(!open)return;
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  window.addEventListener('keydown',closeOnEscape);
  return()=>window.removeEventListener('keydown',closeOnEscape);
 },[open]);
 let content:ReactNode=<SummaryDashboard api={api} session={session}/>;
 if(path==='/admin/qr')content=<QrManager api={api} csrf={session.csrf} onClose={()=>{location.href='/admin'}}/>;
 else if(path==='/admin/production')content=<Production api={api} csrf={session.csrf}/>;
 else if(path==='/admin/analytics')content=<Analytics api={api}/>;
 else if(path.startsWith('/admin/')){
  const module=path.split('/').pop();
  if(['products','customers','orders','suppliers','digital-pages','settings'].includes(module||''))content=<AdminModules api={api} csrf={session.csrf} session={session} module={module as any}/>;
 }
 return <div className="admin-layout">
  {open&&<button type="button" className="admin-sidebar-scrim" onClick={()=>setOpen(false)} aria-label="Cerrar menú lateral"/>}
  <aside className={open?'admin-sidebar open':'admin-sidebar'} id="admin-navigation">
   <a className="admin-brand" href="/admin"><img className="admin-brand-lockup" src="/brand-lockup.png" alt="ENLÁZATE"/><span>OPERACIONES</span></a>
   <div className="admin-workspace-label"><span><Activity size={13}/></span>CENTRO DE OPERACIONES</div>
   <nav aria-label="Navegación principal">{groups.map(group=><div className="admin-nav-group" key={group.label}>
    <p>{group.label}</p>
    {group.links.map(([label,href,Icon])=><a className={active[1]===href?'active':''} aria-current={active[1]===href?'page':undefined} href={href} key={href} onClick={()=>setOpen(false)}><span className="admin-nav-icon"><Icon size={17}/></span><span className="admin-nav-text">{label}</span>{active[1]===href&&<ChevronRight className="admin-nav-current" size={14}/>}</a>)}
   </div>)}</nav>
   <div className="admin-sidebar-footer">
    <div className="admin-sidebar-user"><span className="admin-avatar">{session.admin?.name?.[0]||'A'}</span><div><strong>{session.admin?.name||'Administrador'}</strong><small><ShieldCheck size={11}/> Sesión activa</small></div></div>
    <button className="admin-logout" onClick={onLogout}><LogOut size={16}/><span>Cerrar sesión</span></button>
   </div>
  </aside>
  <div className="admin-workspace">
   <header className="admin-topbar"><button className="admin-menu" onClick={()=>setOpen(!open)} aria-label={open?'Cerrar menú':'Abrir menú'} aria-expanded={open} aria-controls="admin-navigation">{open?<X size={20}/>:<Menu size={20}/>}</button><div className="admin-crumb"><span>ENLÁZATE</span><b>/</b>{active[0]}</div><div className="admin-user"><div className="admin-avatar">{session.admin?.name?.[0]||'A'}</div><span>{session.admin?.name||'Administrador'}</span></div></header>
   <main className="admin-content">{content}</main>
  </div>
 </div>;
}
