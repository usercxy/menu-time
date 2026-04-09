import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      retry: false,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false
    },
    mutations: {
      networkMode: 'always',
      retry: false
    }
  }
})
