'use client'

import { createContext, useContext } from 'react'
import { authClient, clearAccessToken } from './auth-client'

type SessionData = NonNullable<ReturnType<typeof authClient.useSession>['data']>
type User = SessionData['user']
type Session = SessionData['session']

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ twoFactor: boolean }>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string, redirectTo: string) => Promise<void>
  updatePassword: (password: string, token: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession()
  const user = data?.user ?? null
  const session = data?.session ?? null

  /** Resolves to { twoFactor: true } when the account needs its authenticator code to finish signing in. */
  const signIn = async (email: string, password: string) => {
    clearAccessToken()
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message || 'Failed to sign in')
    return { twoFactor: Boolean((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) }
  }

  const signUp = async (email: string, password: string) => {
    clearAccessToken()
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email,
    })
    if (error) throw new Error(error.message || 'Failed to create account')
  }

  const signOut = async () => {
    clearAccessToken()
    const { error } = await authClient.signOut()
    if (error) throw new Error(error.message || 'Failed to sign out')
  }

  // Sends a password-reset email. The link returns the user to `redirectTo`
  // with a `token` query param, which updatePassword exchanges.
  const resetPassword = async (email: string, redirectTo: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo,
    })
    if (error) throw new Error(error.message || 'Failed to send reset email')
  }

  const updatePassword = async (password: string, token: string) => {
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    if (error) throw new Error(error.message || 'Failed to update password')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading: isPending,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
