import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Client, LedgerEntry } from '@/types/database'

interface Props {
  clientCode: string
  onBack: () => void
}

export function ClientLedgerPage({ clientCode, onBack }: Props) {
  const { data: client } = useQuery({
    queryKey: ['client', clientCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_code', clientCode)
        .single()
      if (error) throw error
      return data as Client
    },
  })

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ledger', clientCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('client_code', clientCode)
        .order('entry_date', { ascending: true })
      if (error) throw error
      return data as LedgerEntry[]
    },
  })

  const totalDue = entries.reduce((s, e) => s + (Number(e.amount_due) || 0), 0)
  const totalReceived = entries.reduce((s, e) => s + (Number(e.amount_received) || 0), 0)
  const balance = totalDue - totalReceived

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-sm mb-2 neo-btn px-3 py-1 bg-white"
          >
            ← Back to Clients
          </button>
          <h2 className="font-display text-4xl tracking-wide">{clientCode}</h2>
          <p className="text-lg">{client?.client_name || 'Loading…'}</p>
          {client?.city && <p className="text-sm opacity-70">{client.city}</p>}
        </div>

        <div className="neo-card p-4 text-right min-w-[160px]">
          <p className="text-xs uppercase opacity-60">Current Balance</p>
          <p className="font-display text-3xl">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-60">Total Due</p>
          <p className="font-mono font-semibold">{formatCurrency(totalDue)}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-60">Received</p>
          <p className="font-mono font-semibold text-gold">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-60">Entries</p>
          <p className="font-mono font-semibold">{entries.length}</p>
        </div>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-maroon text-cream text-left">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Folder</th>
                <th className="px-3 py-2 font-semibold">Stage</th>
                <th className="px-3 py-2 font-semibold">TM No</th>
                <th className="px-3 py-2 font-semibold">Details</th>
                <th className="px-3 py-2 font-semibold text-right">Due</th>
                <th className="px-3 py-2 font-semibold text-right">Received</th>
                <th className="px-3 py-2 font-semibold text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center opacity-60">Loading ledger…</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center opacity-60">No entries</td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-t border-maroon/15 ${
                      e.entry_type === 'payment' ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-cream/40'
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{formatDate(e.entry_date)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.folder_no || '—'}</td>
                    <td className="px-3 py-2">{e.stage || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.tm_no || '—'}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={e.details || ''}>
                      {e.details || '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {e.amount_due != null ? formatCurrency(Number(e.amount_due)) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gold">
                      {e.amount_received != null ? formatCurrency(Number(e.amount_received)) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {e.running_balance != null ? formatCurrency(Number(e.running_balance)) : '—'}
                    </td>
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