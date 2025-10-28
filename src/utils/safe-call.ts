export function safeCallSync<TResult, TError extends Error = Error>(
  fn: () => TResult,
): [null, TResult] | [TError, null] {
  try {
    return [null, fn()];
  } catch (e) {
    const err =
      e instanceof Error ? (e as TError) : (new Error(String(e)) as TError);
    return [err, null];
  }
}

export async function safeCall<TResult, TError extends Error = Error>(
  fn: () => Promise<TResult>,
): Promise<[null, TResult] | [TError, null]> {
  try {
    const res = await fn();
    return [null, res];
  } catch (e) {
    const err =
      e instanceof Error ? (e as TError) : (new Error(String(e)) as TError);
    return [err, null];
  }
}
