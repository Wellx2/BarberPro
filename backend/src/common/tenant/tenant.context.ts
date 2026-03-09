import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
    shopId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();
