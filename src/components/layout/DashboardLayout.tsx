import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Page = 'dashboard' | 'clients' | 'ledger'

interface Props {
  children: ReactNode
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clients', label: 'Clients' },
  { id: 'ledger', label: 'Ledger' },
]

export function DashboardLayout({ children, currentPage, onNavigate }: Props) {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="neo-border border-t-0 border-x-0 bg-maroon text-cream px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl tracking-wider">BRANDEX LEDGER</h1>
          <span className="hidden sm:inline text-xs opacity-70 border-l border-cream/40 pl-3">
            Law Associates
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:inline">
            {profile?.full_name || profile?.email || 'User'}
            {profile?.role && (
              <span className="ml-2 text-xs opacity-70 uppercase">{profile.role}</span>
            )}
          </span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-xs neo-btn bg-cream text-maroon"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-cream-dark neo-border border-t-0 border-x-0 px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'px-4 py-2 text-sm font-semibold neo-btn whitespace-nowrap',
              currentPage === item.id
                ? 'bg-maroon text-cream'
                : 'bg-white text-maroon hover:bg-cream'
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="text-center text-xs opacity-50 py-4 border-t-2 border-maroon/20">
        Brandex Law Associates · Ledger System v2 (TypeScript)
      </footer>
    </div>
  )
}