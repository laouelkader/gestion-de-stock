import { useCallback, useEffect, useMemo, useState } from 'react'
import { stockApi } from '../api/stockApi'
import type { MovementType, Product, StockMovement } from '../types'

function movementLabel(t: MovementType) {
  switch (t) {
    case 'in':
      return 'Entrée'
    case 'out':
      return 'Sortie'
    case 'adjust':
      return 'Ajustement'
    default:
      return t
  }
}

export function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterProduct, setFilterProduct] = useState<string>('')

  const [productId, setProductId] = useState<string>('')
  const [movementType, setMovementType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState<number>(1)
  const [note, setNote] = useState('')

  const productMap = useMemo(() => {
    const m = new Map<number, Product>()
    products.forEach((p) => m.set(p.id, p))
    return m
  }, [products])

  const load = useCallback(async () => {
    setError(null)
    try {
      const [movs, prods] = await Promise.all([
        stockApi.movements.list({
          product_id: filterProduct ? Number(filterProduct) : undefined,
          limit: 200,
        }),
        stockApi.products.list(),
      ])
      setMovements(movs)
      setProducts(prods)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [filterProduct])

  useEffect(() => {
    load()
  }, [load])

  async function submitMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) {
      setError('Choisissez un produit.')
      return
    }
    setError(null)
    try {
      await stockApi.movements.create({
        product_id: Number(productId),
        movement_type: movementType,
        quantity,
        note: note.trim() || null,
      })
      setNote('')
      setQuantity(1)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Mouvements de stock</h1>
          <p className="page-lead">Entrées, sorties et ajustements — l’historique se met à jour automatiquement.</p>
        </div>
      </header>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="card">
        <h2 className="card-title">Enregistrer un mouvement</h2>
        <form className="movement-form" onSubmit={submitMovement}>
          <label>
            Produit
            <select required value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — stock {p.quantity}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
            >
              <option value="in">Entrée (réception)</option>
              <option value="out">Sortie (vente / consommation)</option>
              <option value="adjust">Ajustement (delta signé)</option>
            </select>
          </label>
          <label>
            Quantité
            <input
              type="number"
              min={movementType === 'adjust' ? undefined : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <label className="span-note">
            Note
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Valider le mouvement
            </button>
          </div>
        </form>
        <p className="form-hint muted">
          Entrée et sortie : indiquez une valeur positive. Ajustement : utilisez un nombre positif ou négatif selon le
          delta souhaité.
        </p>
      </section>

      <div className="toolbar">
        <label className="field-inline">
          <span>Filtrer par produit</span>
          <select
            value={filterProduct}
            onChange={(e) => {
              setLoading(true)
              setFilterProduct(e.target.value)
            }}
          >
            <option value="">Tous</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
                <th>Date</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Delta</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const p = productMap.get(m.product_id)
                  return (
                    <tr key={m.id}>
                      <td>{new Date(m.created_at).toLocaleString('fr-FR')}</td>
                      <td>{p ? `${p.name} (${p.sku})` : `#${m.product_id}`}</td>
                      <td>
                        <span className={`pill pill-${m.movement_type}`}>{movementLabel(m.movement_type)}</span>
                      </td>
                      <td>
                        <strong className={m.quantity_delta < 0 ? 'delta-neg' : 'delta-pos'}>
                          {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                        </strong>
                      </td>
                      <td className="desc-cell">{m.note || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
