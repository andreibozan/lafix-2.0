import {requestAccountAction} from '../../../../../lib/account-action-routes';
export const POST=(req:Request)=>requestAccountAction(req,'VERIFY_EMAIL');
