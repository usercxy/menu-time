import { create } from 'zustand'
import type { SessionDTO, TokenBundleDTO } from '@/services/types/auth'

type SessionStatus = 'idle' | 'authenticated' | 'anonymous'

interface SessionState {
  status: SessionStatus
  session: SessionDTO | null
  tokenBundle: TokenBundleDTO | null
  setSession: (session: SessionDTO) => void
  setTokenBundle: (tokenBundle: TokenBundleDTO | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'idle',
  session: null,
  tokenBundle: null,
  setSession: (session) =>
    set((state) => ({
      session,
      status: 'authenticated',
      tokenBundle: state.tokenBundle
    })),
  setTokenBundle: (tokenBundle) => set({ tokenBundle }),
  clearSession: () => set({ status: 'anonymous', session: null, tokenBundle: null })
}))
