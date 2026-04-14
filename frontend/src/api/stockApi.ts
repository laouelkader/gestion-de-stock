import type {
  Category,
  DashboardStats,
  MovementType,
  Product,
  SalesReport,
  StockMovement,
  Supplier,
} from '../types'
import { api, apiUrl } from './client'

export const stockApi = {
  health: () => api.get<{ status: string }>('/health'),

  stats: {
    dashboard: () => api.get<DashboardStats>('/api/stats/dashboard'),
  },

  reports: {
    sales: (params?: { from_date?: string; to_date?: string }) => {
      const q = new URLSearchParams()
      if (params?.from_date) q.set('from_date', params.from_date)
      if (params?.to_date) q.set('to_date', params.to_date)
      const s = q.toString()
      return api.get<SalesReport>(`/api/reports/sales${s ? `?${s}` : ''}`)
    },
    salesPdf: async (params?: { from_date?: string; to_date?: string }): Promise<void> => {
      const q = new URLSearchParams()
      if (params?.from_date) q.set('from_date', params.from_date)
      if (params?.to_date) q.set('to_date', params.to_date)
      const s = q.toString()
      const res = await fetch(apiUrl(`/api/reports/sales/pdf${s ? `?${s}` : ''}`))
      if (!res.ok) {
        throw new Error('Échec du téléchargement PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rapport-ventes.pdf'
      a.click()
      URL.revokeObjectURL(url)
    },
  },

  categories: {
    list: () => api.get<Category[]>('/api/categories'),
    create: (body: { name: string; description?: string | null }) =>
      api.post<Category>('/api/categories', body),
    update: (id: number, body: { name?: string; description?: string | null }) =>
      api.patch<Category>(`/api/categories/${id}`, body),
    delete: (id: number) => api.delete(`/api/categories/${id}`),
  },

  suppliers: {
    list: () => api.get<Supplier[]>('/api/suppliers'),
    create: (body: {
      name: string
      contact_name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
    }) => api.post<Supplier>('/api/suppliers', body),
    update: (
      id: number,
      body: Partial<{
        name: string
        contact_name: string | null
        email: string | null
        phone: string | null
        address: string | null
      }>,
    ) => api.patch<Supplier>(`/api/suppliers/${id}`, body),
    delete: (id: number) => api.delete(`/api/suppliers/${id}`),
  },

  products: {
    list: (params?: { category_id?: number; low_stock_only?: boolean; q?: string }) => {
      const q = new URLSearchParams()
      if (params?.category_id != null) q.set('category_id', String(params.category_id))
      if (params?.low_stock_only) q.set('low_stock_only', 'true')
      if (params?.q) q.set('q', params.q)
      const s = q.toString()
      return api.get<Product[]>(`/api/products${s ? `?${s}` : ''}`)
    },
    exportCsv: async (): Promise<void> => {
      const res = await fetch(apiUrl('/api/products/export/csv'))
      if (!res.ok) {
        throw new Error('Échec de l’export CSV')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'produits.csv'
      a.click()
      URL.revokeObjectURL(url)
    },
    create: (body: {
      name: string
      sku: string
      description?: string | null
      quantity?: number
      reorder_level?: number
      unit_price?: string | number
      category_id?: number | null
      supplier_id?: number | null
    }) => api.post<Product>('/api/products', body),
    update: (
      id: number,
      body: Partial<{
        name: string
        sku: string
        description: string | null
        quantity: number
        reorder_level: number
        unit_price: string | number
        category_id: number | null
        supplier_id: number | null
      }>,
    ) => api.patch<Product>(`/api/products/${id}`, body),
    delete: (id: number) => api.delete(`/api/products/${id}`),
  },

  movements: {
    list: (params?: { product_id?: number; skip?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.product_id != null) q.set('product_id', String(params.product_id))
      if (params?.skip != null) q.set('skip', String(params.skip))
      if (params?.limit != null) q.set('limit', String(params.limit))
      const s = q.toString()
      return api.get<StockMovement[]>(`/api/movements${s ? `?${s}` : ''}`)
    },
    create: (body: {
      product_id: number
      movement_type: MovementType
      quantity: number
      note?: string | null
    }) => api.post<StockMovement>('/api/movements', body),
  },
}
