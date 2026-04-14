import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { MovementsPage } from './pages/MovementsPage'
import { ProductsPage } from './pages/ProductsPage'
import { SalesReportPage } from './pages/SalesReportPage'
import { SuppliersPage } from './pages/SuppliersPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="produits" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="fournisseurs" element={<SuppliersPage />} />
        <Route path="mouvements" element={<MovementsPage />} />
        <Route path="rapports/ventes" element={<SalesReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
