import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { ClientBalance } from '@/types/database'

interface Props {
  onSelectClient: (code: string) => void
}

export function DashboardPage({ onSelectClient }: Props) {
  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['client_balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_balances')
        .select('*')
        .order('client_code')
      if (error) throw error
      return data as ClientBalance[]
    },
  })

  const totalClients = balances.length
  const totalDue = balances.reduce((s, b) => s + (Number(b.total_due) || 0), 0)
  const totalReceived = balances.reduce((s, b) => s + (Number(b.total_received) || 0), 0)
  const outstanding = totalDue - totalReceived
  const totalEntries = balances.reduce((s, b) => s + (Number(b.entry_count) || 0), 0)

  const topOutstanding = [...balances]
    .filter((b) => (Number(b.current_balance) || 0) > 0)
    .sort((a, b) => (Number(b.current_balance) || 0) - (Number(a.current_balance) || 0))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-4xl tracking-wide">Dashboard</h2>
        <p className="text-sm opacity-70 mt-1">Live overview of client ledgers</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Clients" value={String(totalClients)} />
        <KpiCard label="Total Due" value={formatCurrency(totalDue)} />
        <KpiCard label="Received" value={formatCurrency(totalReceived)} accent="gold" />
        <KpiCard label="Outstanding" value={formatCurrency(outstanding)} accent="maroon" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="neo-card p-5">
          <h3 className="font-display text-2xl mb-4">Top Outstanding</h3>
          {isLoading ? (
            <p className="text-sm opacity-60">Loading…</p>
          ) : topOutstanding.length === 0 ? (
            <p className="text-sm opacity-60">No outstanding balances</p>
          ) : (
            <ul className="space-y-2">
              {topOutstanding.map((b) => (
                <li key={b.client_code}>
                  <button
                    onClick={() => onSelectClient(b.client_code!)}
                    className="w-full flex justify-between items-center px-3 py-2 neo-border bg-cream hover:bg-white text-left"
                  >
                    <span className="font-mono text-sm">{b.client_code}</span>
                    <span className="font-semibold">{formatCurrency(Number(b.current_balance))}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="neo-card p-5">
          <h3 className="font-display text-2xl mb-4">Quick Stats</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="opacity-70">Total ledger entries</dt>
              <dd className="font-mono font-semibold">{totalEntries}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="opacity-70">Clients with balance</dt>
              <dd className="font-mono font-semibold">
                {balances.filter((b) => (Number(b.current_balance) || 0) !== 0).length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="opacity-70">Avg. balance</dt>
              <dd className="font-mono font-semibold">
                {formatCurrency(totalClients ? outstanding / totalClients : 0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'gold' | 'maroon'
}) {
  return (
    <div className="neo-card p-4">
      <p className="text-xs uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p
        className={`font-display text-2xl md:text-3xl ${accent === 'gold' ? 'text-gold' : accent === 'maroon' ? 'text-maroon' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}