import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error.message)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    const result = await signInWithGoogle()
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    }
    // On success Supabase redirects away; keep loading true
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
      <div className="w-full max-w-md neo-card p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-wider text-maroon">BRANDEX</h1>
          <p className="mt-1 text-sm font-medium tracking-wide opacity-80">LAW ASSOCIATES · LEDGER</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 neo-btn text-sm',
              mode === 'login' ? 'bg-maroon text-cream' : 'bg-cream'
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={cn(
              'flex-1 py-2 neo-btn text-sm',
              mode === 'signup' ? 'bg-maroon text-cream' : 'bg-cream'
            )}
          >
            Sign Up
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 neo-btn bg-white text-maroon text-sm font-semibold flex items-center justify-center gap-2 mb-4 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.5 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-maroon/20" />
          <span className="text-xs uppercase tracking-wider opacity-50">or email</span>
          <div className="flex-1 h-px bg-maroon/20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 neo-border bg-white focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 neo-border bg-white focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="you@firm.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 neo-border bg-white focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-100 neo-border text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 neo-btn bg-maroon text-cream text-sm uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs opacity-60">
          Brandex Law Associates · Secure Ledger System
        </p>
      </div>
    </div>
  )
}
