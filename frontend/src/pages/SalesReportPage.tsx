import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { stockApi } from '../api/stockApi'
import type { SalesReport } from '../types'

function isoRangeDefaults() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function SalesReportPage() {
  const defaults = useMemo(() => isoRangeDefaults(), [])
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const r = await stockApi.reports.sales({ from_date: from, to_date: to })
      setReport(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load()
  }, [load])

  const chartData = useMemo(() => {
    if (!report) return []
    return report.series.map((p) => ({
      day: p.day,
      label: new Date(p.day + 'T12:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      units: p.units,
      value: Number(p.value),
    }))
  }, [report])

  async function downloadPdf() {
    setPdfLoading(true)
    setError(null)
    try {
      await stockApi.reports.salesPdf({ from_date: from, to_date: to })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const totalMoney = report
    ? Number(report.totals.value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
    : '—'

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Rapports de ventes</h1>
          <p className="page-lead">
            Graphiques et export PDF à partir des <strong>sorties de stock</strong> (mouvements « vente / consommation »).
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={pdfLoading || loading} onClick={downloadPdf}>
          {pdfLoading ? 'PDF…' : 'Télécharger le PDF'}
        </button>
      </header>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="toolbar toolbar-wrap sales-toolbar">
        <label className="field-inline">
          <span>Du</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field-inline">
          <span>au</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
          Actualiser
        </button>
      </div>

      {report ? (
        <p className="muted report-note">{report.note}</p>
      ) : null}

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : report ? (
        <>
          <div className="stats-grid sales-kpis">
            <article className="stat-card">
              <span className="stat-label">Unités vendues</span>
              <strong className="stat-value">{report.totals.units}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-label">Montant estimé</span>
              <strong className="stat-value stat-value-money">{totalMoney}</strong>
            </article>
          </div>

          <section className="chart-panel">
            <h2 className="chart-title">Courbes : unités et montant par jour</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis
                    yAxisId="u"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    label={{ value: 'Unités', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    yAxisId="euro"
                    orientation="right"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    label={{ value: '€', angle: 90, position: 'insideRight', fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                    labelFormatter={(_, payload) => {
                      const d = payload?.[0]?.payload?.day
                      return d
                        ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''
                    }}
                    formatter={(value, name) => {
                      if (name === 'value' && typeof value === 'number') {
                        return [`${value.toFixed(2)} €`, 'Montant']
                      }
                      if (typeof value === 'number') {
                        return [value, 'Unités']
                      }
                      return [String(value ?? ''), String(name ?? '')]
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="euro" dataKey="value" name="Montant (€)" fill="#5eead4" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="u"
                    type="monotone"
                    dataKey="units"
                    name="Unités"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-panel chart-panel-second">
            <h2 className="chart-title">Volume des unités (histogramme)</h2>
            <div className="chart-box chart-box-short">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="units" name="Unités vendues" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
