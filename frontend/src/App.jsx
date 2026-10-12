import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OperationPage from './pages/OperationPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SpacesPage from './pages/SpacesPage.jsx';
import RatesPage from './pages/RatesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="operation" element={<OperationPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route element={<RoleRoute role="ADMIN" />}>
            <Route path="reports" element={<ReportsPage />} />
            <Route path="spaces" element={<SpacesPage />} />
            <Route path="rates" element={<RatesPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
