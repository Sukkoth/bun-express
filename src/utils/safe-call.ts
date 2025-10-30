/**
 * This module provides utility functions for Go-style error handling in
 * TypeScript. It allows functions to return a tuple where the first element is
 * an error (if any) and the second is the result, promoting explicit error
 * checking.
 */

/**
 * - Executes an asynchronous function and captures any thrown errors in a
 *   Go-style tuple.
 *
 * @example
 *   ```typescript
 *   function divide(a: number, b: number): number {
 *   if (b === 0) {
 *   throw new Error("Cannot divide by zero");
 *   }
 *   return a / b;
 *   }
 *
 *   const [err1, result1] = safeCallSync(() => divide(10, 2));
 *   if (err1) {
 *   console.error("Error:", err1.message); // This will not be called
 *   } else {
 *   console.log("Result:", result1); // Output: Result: 5
 *   }
 *
 *   const [err2, result2] = safeCallSync(() => divide(10, 0));
 *   if (err2) {
 *   console.error("Error:", err2.message); // Output: Error: Cannot divide by zero
 *   } else {
 *   console.log("Result:", result2); // This will not be called
 *   }
 */

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

/**
 * Executes an asynchronous function and captures any thrown errors in a
 * Go-style tuple.
 *
 * This function wraps an asynchronous operation (a Promise-returning function),
 * preventing exceptions from propagating up the call stack. Instead, it returns
 * a Promise that resolves to a tuple `[error, result]`. If the Promise resolves
 * successfully, `error` will be `null` and `result` will contain the resolved
 * value. If the Promise rejects, `error` will contain the rejected `Error`
 * object (or a new `Error` object if a non-Error value was rejected), and
 * `result` will be `null`.
 *
 * @example
 *   ```typescript
 *   async function fetchData(shouldFail: boolean): Promise<string> {
 *     return new Promise((resolve, reject) => {
 *       setTimeout(() => {
 *         if (shouldFail) {
 *           reject(new Error("Failed to fetch data"));
 *         } else {
 *           resolve("Data fetched successfully");
 *         }
 *       }, 100);
 *     });
 *   }
 *
 *   async function runExamples() {
 *     const [err1, data1] = await safeCall(() => fetchData(false));
 *     if (err1) {
 *       console.error("Error:", err1.message); // This will not be called
 *     } else {
 *       console.log("Data:", data1); // Output: Data: Data fetched successfully
 *     }
 *
 *     const [err2, data2] = await safeCall(() => fetchData(true));
 *     if (err2) {
 *       console.error("Error:", err2.message); // Output: Error: Failed to fetch data
 *     } else {
 *       console.log("Data:", data2); // This will not be called
 *     }
 *   }
 *
 *   runExamples();
 *   ```;
 */
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
