import { useCallback, useEffect, useState } from 'react'
import { stockApi } from '../api/stockApi'
import type { Category } from '../types'
import { Modal } from '../components/Modal'

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems(await stockApi.categories.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setModalOpen(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setName(c.name)
    setDescription(c.description ?? '')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (editing) {
        await stockApi.categories.update(editing.id, {
          name: name.trim(),
          description: description.trim() || null,
        })
      } else {
        await stockApi.categories.create({
          name: name.trim(),
          description: description.trim() || null,
        })
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return
    setError(null)
    try {
      await stockApi.categories.delete(c.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Catégories</h1>
          <p className="page-lead">Regroupez vos produits pour filtrer l’inventaire.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Nouvelle catégorie
        </button>
      </header>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    Aucune catégorie pour l’instant.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="desc-cell">{c.description || '—'}</td>
                    <td className="actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => remove(c)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="category-form" className="btn btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <form id="category-form" className="form-grid" onSubmit={submit}>
          <label className="span-2">
            Nom
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="span-2">
            Description
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </form>
      </Modal>
    </div>
  )
}
