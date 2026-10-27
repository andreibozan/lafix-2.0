export function loginDestination(role:string,next?:string|null):string;
export function authConfigured(env?:Record<string,string|undefined>):boolean;
export function secureSessionCookie(env?:Record<string,string|undefined>):boolean;
export function sessionDurationSeconds(role:string):number;
