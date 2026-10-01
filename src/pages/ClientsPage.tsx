import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { ClientBalance } from '@/types/database'

interface Props {
  onSelectClient: (code: string) => void
}

export function ClientsPage({ onSelectClient }: Props) {
  const [search, setSearch] = useState('')

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

  const filtered = balances.filter((b) => {
    const q = search.toLowerCase()
    return (
      b.client_code?.toLowerCase().includes(q) ||
      b.client_name?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl tracking-wide">Clients</h2>
          <p className="text-sm opacity-70">{filtered.length} accounts</p>
        </div>
        <input
          type="search"
          placeholder="Search code, name, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 neo-border bg-white w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-maroon text-cream text-left">
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">City</th>
                <th className="px-4 py-3 font-semibold text-right">Due</th>
                <th className="px-4 py-3 font-semibold text-right">Received</th>
                <th className="px-4 py-3 font-semibold text-right">Balance</th>
                <th className="px-4 py-3 font-semibold text-center">Entries</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center opacity-60">
                    Loading clients…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center opacity-60">
                    No clients found
                  </td>
                </tr>
              ) : (
                filtered.map((b, i) => (
                  <tr
                    key={b.client_code}
                    onClick={() => onSelectClient(b.client_code!)}
                    className={`cursor-pointer border-t-2 border-maroon/20 hover:bg-cream-dark transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-cream/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold">{b.client_code}</td>
                    <td className="px-4 py-3">{b.client_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell opacity-70">{b.city || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(b.total_due))}</td>
                    <td className="px-4 py-3 text-right font-mono text-gold">
                      {formatCurrency(Number(b.total_received))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(Number(b.current_balance))}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{b.entry_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}