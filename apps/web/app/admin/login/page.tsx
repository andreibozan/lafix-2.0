import {redirect} from 'next/navigation';
import {authenticate} from '../../../lib/auth';
import AuthPanel from '../../components/auth-panel';
export const dynamic='force-dynamic';
export default async function AdminLogin(){const session=await authenticate(undefined,{securitySetup:true});if(session?.role==='ADMIN')redirect(session.mfaVerified?'/admin':'/account/security');return <AuthPanel adminOnly/>}
