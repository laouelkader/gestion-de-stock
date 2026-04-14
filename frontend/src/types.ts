export type MovementType = 'in' | 'out' | 'adjust'

export interface Category {
  id: number
  name: string
  description: string | null
}

export interface Supplier {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
}

export interface Product {
  id: number
  name: string
  sku: string
  description: string | null
  quantity: number
  reorder_level: number
  unit_price: string
  category_id: number | null
  supplier_id: number | null
}

export interface StockMovement {
  id: number
  product_id: number
  quantity_delta: number
  movement_type: MovementType
  note: string | null
  created_at: string
}

export interface DashboardStats {
  total_products: number
  low_stock_count: number
  total_stock_value: string
  movements_last_7_days: number
  total_categories: number
  total_suppliers: number
}

export interface SalesDayPoint {
  day: string
  units: number
  value: string
}

export interface SalesReport {
  from_date: string
  to_date: string
  series: SalesDayPoint[]
  totals: { units: number; value: string }
  note: string
}
