import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientLedgerPage } from '@/pages/ClientLedgerPage'
import { useState } from 'react'

type Page = 'dashboard' | 'clients' | 'ledger'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="neo-card px-8 py-6 text-center">
          <p className="font-display text-3xl tracking-wide">BRANDEX</p>
          <p className="mt-2 text-sm opacity-70">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <DashboardLayout
      currentPage={page}
      onNavigate={(p) => {
        setPage(p)
        if (p !== 'ledger') setSelectedClient(null)
      }}
    >
      {page === 'dashboard' && <DashboardPage onSelectClient={(code) => {
        setSelectedClient(code)
        setPage('ledger')
      }} />}
      {page === 'clients' && <ClientsPage onSelectClient={(code) => {
        setSelectedClient(code)
        setPage('ledger')
      }} />}
      {page === 'ledger' && selectedClient && (
        <ClientLedgerPage
          clientCode={selectedClient}
          onBack={() => setPage('clients')}
        />
      )}
      {page === 'ledger' && !selectedClient && (
        <ClientsPage onSelectClient={(code) => {
          setSelectedClient(code)
          setPage('ledger')
        }} />
      )}
    </DashboardLayout>
  )
}