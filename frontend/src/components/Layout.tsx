import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { stockApi } from '../api/stockApi'

export function Layout() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    stockApi
      .health()
      .then(() => {
        if (!cancelled) setApiOk(true)
      })
      .catch(() => {
        if (!cancelled) setApiOk(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>Stock</strong>
            <span className="brand-sub">Gestion locale</span>
          </div>
        </div>
        <nav className="nav" aria-label="Navigation principale">
          <NavLink end to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tableau de bord
          </NavLink>
          <NavLink to="/produits" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Produits
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Catégories
          </NavLink>
          <NavLink
            to="/fournisseurs"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Fournisseurs
          </NavLink>
          <NavLink
            to="/mouvements"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Mouvements
          </NavLink>
          <NavLink
            to="/rapports/ventes"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Rapports ventes
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span
            className={`status-dot ${apiOk === true ? 'ok' : apiOk === false ? 'err' : ''}`}
            title={apiOk === false ? 'API injoignable — lancez le backend (port 8000)' : 'API'}
          />
          <a className="docs-link" href="/docs" target="_blank" rel="noreferrer">
            Documentation API
          </a>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
