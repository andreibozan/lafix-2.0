'use client';
import {useEffect,useId,useRef,useState} from 'react';
import RequestForm from './request-form';
const services=['Renovări','Construcții','Acoperișuri','Panouri solare','Încălzire','Ferestre și uși','Curățenie','Mutări','Reparații auto'];
export function ProjectTrigger({caption=false}:{caption?:boolean}){
 return <button type="button" className={caption?'art-caption project-caption':'cta project-trigger'} aria-haspopup="dialog" onClick={()=>window.dispatchEvent(new Event('lafix:project'))}>{caption?<><span className="caption-icon" aria-hidden="true">⌂</span><span><strong>Casa ta. Proiectul tău.</strong><span>Hai să-i dăm un început. ↗</span></span></>:<>Începe proiectul tău <span aria-hidden="true">↗</span></>}</button>;
}
export default function ProjectPopup(){
 const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null),[open,setOpen]=useState(false),[stage,setStage]=useState<'idea'|'details'>('idea'),[category,setCategory]=useState('Renovări');
 const title=useId();
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const show=()=>{
   clearTimeout(timer);
   if(!dialog.current||dialog.current.open)return;
   setStage('idea');dialog.current.showModal();setOpen(true);
  };
  // performance.now() starts at document navigation, so hydration does not add delay.
  timer=setTimeout(show,Math.max(0,Math.ceil(15_000-performance.now())));
  window.addEventListener('lafix:project',show);
  return()=>{clearTimeout(timer);window.removeEventListener('lafix:project',show)};
 },[]);
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[open]);
 useEffect(()=>{if(open){if(dialog.current)dialog.current.scrollTop=0;heading.current?.focus({preventScroll:true})}},[open,stage]);
 function close(){dialog.current?.close();setOpen(false)}
 return <dialog ref={dialog} className="project-dialog" aria-labelledby={title} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)close()}}>
 <div className="project-window"><button type="button" className="project-close" aria-label="Închide fereastra Proiectul tău" onClick={close}>×</button>
 <aside className="project-story"><a className="wordmark" href="/" onClick={e=>{e.preventDefault();close()}}>La<span>Fix</span><i aria-hidden="true">✳</i></a><div><p className="eyebrow">DE LA IDEE, LA FAPTĂ.</p><h2>Un gând bun.<br/>Un om priceput.<br/><em>Proiectul tău.</em></h2><p>Lucrurile frumoase încep cu un prim pas. Hai să-l facem împreună.</p></div><img src="/illustrations/lafix-neighborhood.png" width="420" height="420" alt="O proprietară și o echipă de profesioniști pregătesc renovarea unei case."/><span className="project-story-note">Oameni potriviți. Lucruri bine făcute.</span></aside>
 <div className="project-content"><div className="project-progress" aria-label={stage==='idea'?'Pasul 1 din 2: Alege serviciul':'Pasul 2 din 2: Descrie lucrarea'}><span className="active">01 <b>Ideea ta</b></span><i/><span className={stage==='details'?'active':''}>02 <b>Detaliile</b></span></div>
 <p className="eyebrow">{stage==='idea'?'FACEM LOC PLANURILOR TALE':'PUȚIN CONTEXT FACE DIFERENȚA'}</p><h2 id={title} ref={heading} tabIndex={-1}>{stage==='idea'?<>Ce ai vrea<br/>să prindă viață?</>:<>Povestește-ne<br/>despre proiect.</>}</h2>
 <div hidden={stage!=='idea'}><p className="project-description">O cameră de renovat? O casă de pus la punct? Alege serviciul și pornim de aici.</p><fieldset className="project-services"><legend className="sr-only">Alege serviciul pentru proiectul tău</legend>{services.map((s,i)=><label className={category===s?'selected':''} key={s}><input type="radio" name="project-service" value={s} checked={category===s} onChange={()=>setCategory(s)}/><span className="project-service-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span>{s}</span><span className="project-service-check" aria-hidden="true">{category===s?'✓':'↗'}</span></label>)}</fieldset><button type="button" className="project-continue" onClick={()=>setStage('details')}>Continuă cu proiectul meu <span aria-hidden="true">→</span></button><p className="project-no-obligation">Maximum 3 prestatori. Tu alegi. Fără obligații.</p></div>
 <div hidden={stage!=='details'}><p className="project-auth-note">Ai nevoie de un cont pentru a trimite cererea. <a href="/account">Intră în cont</a> sau <a href="/account?mode=register">creează un cont gratuit</a>.</p><div className="request-form-wrap project-form"><RequestForm initialCategory={category} listenForServices={false}/></div><button className="project-back" type="button" onClick={()=>setStage('idea')}>← Înapoi la servicii</button></div>
 </div></div></dialog>;
}
