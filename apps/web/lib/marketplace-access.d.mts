export function freeMarketplace(env?: NodeJS.ProcessEnv): boolean;
export function canAccessMatch(match: {refundedAt?: Date|string|null;unlockedAt?:Date|string|null}|null, request: {qualification:string}|null, env?: NodeJS.ProcessEnv): boolean;
