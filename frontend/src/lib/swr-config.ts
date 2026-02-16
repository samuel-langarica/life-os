import { SWRConfiguration } from 'swr';
import { api } from './api-client';

export const swrConfig: SWRConfiguration = {
  fetcher: (url: string) => api.get(url),
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
};
