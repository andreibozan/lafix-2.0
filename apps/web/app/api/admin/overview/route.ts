import {NextResponse} from 'next/server';
import {authenticate} from '../../../../lib/auth';
import {adminRows,adminSummary} from '../../../../lib/admin-data';
import {parseAdminQuery} from '../../../../lib/admin-query.mjs';
export async function GET(req:Request){
 const s=await authenticate(req);if(!s)return NextResponse.json({error:'Autentificare necesară'},{status:401});if(s.role!=='ADMIN')return NextResponse.json({error:'Acces rezervat administratorului'},{status:403});
 let query;try{query=parseAdminQuery(new URL(req.url).searchParams)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Filtre invalide'},{status:400})}
 try{const [result,summary]=await Promise.all([adminRows(query),adminSummary(query.createdAt)]);return NextResponse.json({...result,summary,view:query.view,page:query.page,pageSize:query.pageSize,totalPages:Math.max(1,Math.ceil(result.total/query.pageSize)),generatedAt:new Date(),demo:false},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Datele administrative sunt temporar indisponibile. Verifică baza de date și migrarea.'},{status:503})}
}
