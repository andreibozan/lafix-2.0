import {redirect} from 'next/navigation';
import {authenticate} from '../../lib/auth';
import AdminConsole from './admin-console';
export const dynamic='force-dynamic';
export default async function Admin(){const session=await authenticate(undefined,{securitySetup:true});if(!session)redirect('/admin/login');if(session.role!=='ADMIN')redirect('/dashboard');if(!session.mfaVerified)redirect('/account/security');return <AdminConsole/>}
