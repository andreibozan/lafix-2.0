export function retryableTransactionError(error) {
  return error?.code === 'P2034' ||
    (error?.code === 'P2010' && ['40001', '40P01'].includes(error?.meta?.code));
}
// Retry whole transactions only. Callbacks must have no external side effects.
export async function withTransactionRetry(operation, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      if (!retryableTransactionError(error) || attempt >= 8) throw error;
      await pause(Math.min(200, 10 * 2 ** attempt) + Math.floor(Math.random() * 20));
    }
  }
}
