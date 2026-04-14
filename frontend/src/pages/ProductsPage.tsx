import { useCallback, useEffect, useMemo, useState } from 'react'
import { stockApi } from '../api/stockApi'
import type { Category, Product, Supplier } from '../types'
import { Modal } from '../components/Modal'

const emptyProduct = {
  name: '',
  sku: '',
  description: '',
  quantity: 0,
  reorder_level: 0,
  unit_price: '0',
  category_id: '' as string | number,
  supplier_id: '' as string | number,
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lowOnly, setLowOnly] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQ(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const categoryMap = useMemo(() => {
    const m = new Map<number, string>()
    categories.forEach((c) => m.set(c.id, c.name))
    return m
  }, [categories])

  const supplierMap = useMemo(() => {
    const m = new Map<number, string>()
    suppliers.forEach((s) => m.set(s.id, s.name))
    return m
  }, [suppliers])

  const load = useCallback(async () => {
    setError(null)
    try {
      const [prods, cats, sups] = await Promise.all([
        stockApi.products.list({
          low_stock_only: lowOnly,
          category_id: categoryFilter ? Number(categoryFilter) : undefined,
          q: searchQ || undefined,
        }),
        stockApi.categories.list(),
        stockApi.suppliers.list(),
      ])
      setProducts(prods)
      setCategories(cats)
      setSuppliers(sups)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [lowOnly, categoryFilter, searchQ])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyProduct })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description ?? '',
      quantity: p.quantity,
      reorder_level: p.reorder_level,
      unit_price: String(p.unit_price),
      category_id: p.category_id ?? '',
      supplier_id: p.supplier_id ?? '',
    })
    setModalOpen(true)
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || null,
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
      unit_price: form.unit_price,
      category_id: form.category_id === '' ? null : Number(form.category_id),
      supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
    }
    try {
      if (editing) {
        await stockApi.products.update(editing.id, payload)
      } else {
        await stockApi.products.create(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function removeProduct(p: Product) {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return
    setError(null)
    try {
      await stockApi.products.delete(p.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function exportCsv() {
    setExporting(true)
    setError(null)
    try {
      await stockApi.products.exportCsv()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export impossible')
    } finally {
      setExporting(false)
    }
  }

  function formatPrice(v: string) {
    const n = Number(v)
    return Number.isFinite(n)
      ? n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
      : v
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Produits</h1>
          <p className="page-lead">Inventaire, seuils d’alerte, fournisseurs et export.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" disabled={exporting} onClick={exportCsv}>
            {exporting ? 'Export…' : 'Export CSV'}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Nouveau produit
          </button>
        </div>
      </header>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="toolbar toolbar-wrap">
        <label className="field-grow">
          <span className="sr-only">Recherche</span>
          <input
            type="search"
            placeholder="Rechercher par nom ou SKU…"
            value={searchInput}
            onChange={(e) => {
              setLoading(true)
              setSearchInput(e.target.value)
            }}
            aria-label="Recherche produits"
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => {
              setLoading(true)
              setLowOnly(e.target.checked)
            }}
          />
          Stock bas uniquement
        </label>
        <label className="field-inline">
          <span>Catégorie</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setLoading(true)
              setCategoryFilter(e.target.value)
            }}
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Seuil</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th>Fournisseur</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    Aucun produit. Créez-en un ou modifiez les filtres.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const low = p.quantity <= p.reorder_level
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.name}
                        {low ? (
                          <span className="badge badge-warn" title="Stock au ou sous le seuil">
                            alerte
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <code className="sku">{p.sku}</code>
                      </td>
                      <td>{p.quantity}</td>
                      <td>{p.reorder_level}</td>
                      <td>{formatPrice(p.unit_price)}</td>
                      <td>{p.category_id != null ? categoryMap.get(p.category_id) ?? '—' : '—'}</td>
                      <td>{p.supplier_id != null ? supplierMap.get(p.supplier_id) ?? '—' : '—'}</td>
                      <td className="actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                          Modifier
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => removeProduct(p)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="product-form" className="btn btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <form id="product-form" className="form-grid" onSubmit={submitProduct}>
          <label>
            Nom
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label>
            SKU
            <input
              required
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label>
            Quantité
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
            />
          </label>
          <label>
            Seuil d’alerte
            <input
              type="number"
              min={0}
              value={form.reorder_level}
              onChange={(e) => setForm((f) => ({ ...f, reorder_level: Number(e.target.value) }))}
            />
          </label>
          <label>
            Prix unitaire (€)
            <input
              type="text"
              inputMode="decimal"
              value={form.unit_price}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
            />
          </label>
          <label>
            Catégorie
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value === '' ? '' : Number(e.target.value) }))
              }
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fournisseur
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier_id: e.target.value === '' ? '' : Number(e.target.value) }))
              }
            >
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  )
}
