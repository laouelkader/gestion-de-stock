import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { stockApi } from '../api/stockApi'
import type { DashboardStats } from '../types'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    stockApi.stats
      .dashboard()
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = stats
    ? Number(stats.total_stock_value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
    : '—'

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-lead">Vue d’ensemble de l’inventaire et de l’activité récente.</p>
        </div>
      </header>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {!stats && !error ? <p className="muted">Chargement…</p> : null}

      {stats ? (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-label">Produits référencés</span>
              <strong className="stat-value">{stats.total_products}</strong>
              <Link to="/produits" className="stat-link">
                Voir les produits →
              </Link>
            </article>
            <article className="stat-card stat-card-warn">
              <span className="stat-label">Alertes stock bas</span>
              <strong className="stat-value">{stats.low_stock_count}</strong>
              <Link to="/produits" className="stat-link">
                Filtrer →
              </Link>
            </article>
            <article className="stat-card">
              <span className="stat-label">Valeur stock (qty × prix)</span>
              <strong className="stat-value stat-value-money">{value}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-label">Mouvements (7 jours)</span>
              <strong className="stat-value">{stats.movements_last_7_days}</strong>
              <Link to="/mouvements" className="stat-link">
                Historique →
              </Link>
            </article>
            <article className="stat-card">
              <span className="stat-label">Analyse des ventes</span>
              <strong className="stat-value">PDF · courbes</strong>
              <Link to="/rapports/ventes" className="stat-link">
                Ouvrir les rapports →
              </Link>
            </article>
            <article className="stat-card">
              <span className="stat-label">Catégories</span>
              <strong className="stat-value">{stats.total_categories}</strong>
              <Link to="/categories" className="stat-link">
                Gérer →
              </Link>
            </article>
            <article className="stat-card">
              <span className="stat-label">Fournisseurs</span>
              <strong className="stat-value">{stats.total_suppliers}</strong>
              <Link to="/fournisseurs" className="stat-link">
                Gérer →
              </Link>
            </article>
          </div>

          {stats.low_stock_count > 0 ? (
            <div className="banner banner-warn">
              <strong>{stats.low_stock_count}</strong> produit(s) au ou sous le seuil de réapprovisionnement.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
