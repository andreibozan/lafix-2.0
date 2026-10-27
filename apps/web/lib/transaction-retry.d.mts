export function retryableTransactionError(error: unknown): boolean;
export function withTransactionRetry<T>(operation: () => Promise<T>, pause?: (ms: number) => Promise<void>): Promise<T>;
