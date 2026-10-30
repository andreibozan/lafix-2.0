export function projectProgress(request){
 if(request.status==='CANCELLED')return {label:'Proiect anulat',step:-1};
 if(request.status==='CLOSED')return {label:'Lucrare finalizată',step:5};
 if(request.status==='ACCEPTED')return {label:'Prestator ales',step:4};
 if(request.status==='QUOTED')return {label:'Oferte primite',step:3};
 if(request.status==='MATCHED')return {label:'Trimisă prestatorilor',step:2};
 return {label:request.qualification==='QUALIFIED'?'Pregătită pentru alocare':'În verificare',step:1};
}
export const projectSteps=['Solicitare primită','În verificare','Trimisă prestatorilor','Oferte primite','Prestator ales','Lucrare finalizată'];
