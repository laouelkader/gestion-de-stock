import { useCallback, useEffect, useState } from 'react'
import { stockApi } from '../api/stockApi'
import type { Supplier } from '../types'
import { Modal } from '../components/Modal'

const empty = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
}

export function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(empty)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems(await stockApi.suppliers.list())
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
    setForm({ ...empty })
    setModalOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name,
      contact_name: s.contact_name ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
    })
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    }
    try {
      if (editing) {
        await stockApi.suppliers.update(editing.id, payload)
      } else {
        await stockApi.suppliers.create(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function remove(s: Supplier) {
    if (!window.confirm(`Supprimer le fournisseur « ${s.name} » ?`)) return
    setError(null)
    try {
      await stockApi.suppliers.delete(s.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Fournisseurs</h1>
          <p className="page-lead">Contacts et rattachement aux produits.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Nouveau fournisseur
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
                <th>Contact</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucun fournisseur. Ajoutez-en pour les lier aux produits.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.contact_name || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td className="actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => remove(s)}>
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
        title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="supplier-form" className="btn btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <form id="supplier-form" className="form-grid" onSubmit={submit}>
          <label className="span-2">
            Raison sociale / nom
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            Interlocuteur
            <input
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
          </label>
          <label>
            Téléphone
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </label>
          <label className="span-2">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="span-2">
            Adresse
            <textarea rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </label>
        </form>
      </Modal>
    </div>
  )
}
