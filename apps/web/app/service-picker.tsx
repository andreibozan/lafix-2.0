'use client';
const services=[
 {name:'Renovări',detail:'Un nou început pentru casa ta',path:'M3 21h18M5 21V9l7-6 7 6v12M9 21v-8h6v8'},
 {name:'Construcții',detail:'De la fundație la ultimele detalii',path:'M3 21h18M6 21V7h12v14M9 3h6v4M9 11h1m4 0h1m-6 4h1m4 0h1'},
 {name:'Acoperișuri',detail:'Protecție pentru orice anotimp',path:'m2 12 10-9 10 9M5 10v11h14V10M9 21v-7h6v7'},
 {name:'Panouri solare',detail:'Mai multă energie, de la soare',path:'M5 10h14l2 9H3l2-9ZM8 10l-1 9m9-9 1 9M4 15h16M9 22h6M12 2v3M4 5l2 2m14-2-2 2'},
 {name:'Încălzire',detail:'Confort în fiecare cameră',path:'M5 9v12m5-12v12m4-12v12m5-12v12M3 12h18M3 18h18M8 3c-2 2 2 2 0 4m8-4c-2 2 2 2 0 4'},
 {name:'Ferestre și uși',detail:'Lumină și liniște, în casa ta',path:'M4 3h16v18H4zM12 3v18M4 12h16m-7 3h2'},
 {name:'Curățenie',detail:'Spațiu curat, timp pentru tine',path:'m14 3-4 12M5 15h10l2 6H3l2-6ZM18 3v6m-3-3h6M6 3v4M4 5h4'},
 {name:'Mutări',detail:'Un pas mai aproape de acasă',path:'M2 7h12v12H2zM14 11h4l4 4v4h-8M5 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4m13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4'},
 {name:'Reparații auto',detail:'Înapoi la drum, cu încredere',path:'m4 10 2-6h12l2 6M3 10h18v9H3zM6 19v2m12-2v2M6 14h2m8 0h2'}
];
export default function ServicePicker(){return <div className="service-grid">{services.map((s,i)=><a href="#cerere" key={s.name} className="service-card" onClick={()=>window.dispatchEvent(new CustomEvent('lafix:service',{detail:s.name}))}><span className={'service-icon tone-'+i%3}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={s.path}/></svg></span><span><strong>{s.name}</strong><small>{s.detail}</small></span><span className="card-arrow" aria-hidden="true">↗</span></a>)}</div>}
