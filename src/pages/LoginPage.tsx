import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
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