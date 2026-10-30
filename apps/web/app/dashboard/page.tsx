'use client';
import {useEffect,useState} from 'react';
import ProjectCard from './project-card';
import ProviderWorkspace from './provider-workspace';
type Data=any;
export default function Dashboard(){
 const [user,setUser]=useState<Data>(null),[items,setItems]=useState<Data[]>([]),[msg,setMsg]=useState(''),[busy,setBusy]=useState(true);
 async function load(){try{const r=await fetch('/api/auth/me');if(!r.ok){window.location.href='/account';return}const u=(await r.json()).user;setUser(u);if(u.role==='ADMIN'){window.location.href='/admin';return}if(u.role==='CLIENT'){const v=await fetch('/api/client/requests'),j=await v.json();if(!v.ok)throw Error(j.error);setItems(j.requests)}}catch(e){setMsg(e instanceof Error?e.message:'Date indisponibile')}finally{setBusy(false)}}useEffect(()=>{void load()},[]);
 async function accept(id:string){const r=await fetch('/api/offers/'+id+'/accept',{method:'POST'});setMsg(r.ok?'Oferta a fost acceptată':'Oferta nu poate fi acceptată');void load()}
 if(busy)return <main className="auth">Se încarcă…</main>;
 return <main className="dashboard"><header className="nav"><a href="/"><strong>La<span>Fix</span></strong></a><button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/'}}>Ieșire</button></header><section><p className="eyebrow">CONTUL MEU</p><h1>Salut, {user?.name}</h1>{msg&&<p role="status">{msg}</p>}{user?.role==='PROVIDER'?<ProviderWorkspace/>:<><p>Solicitările și ofertele tale · gratuit pentru clienți</p><a className="workspace-link" href="/#cerere">Solicitare nouă ↗</a>{!items.length&&<p>Nu există solicitări de afișat.</p>}{items.map((item:Data)=><ProjectCard key={item.id} item={item} accept={accept} reload={()=>void load()}/>)}</>}</section></main>
}
