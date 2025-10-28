import { AsyncLocalStorage } from 'async_hooks';
type RequestContext = {
  requestId: string;
  ipAddress: string;
};
export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
