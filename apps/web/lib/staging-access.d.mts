export function stagingAccess(header: string | null, env?: NodeJS.ProcessEnv): Promise<'disabled' | 'unconfigured' | 'allowed' | 'denied'>;
