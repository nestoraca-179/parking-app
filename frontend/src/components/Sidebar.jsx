import { NavLink } from 'react-router-dom';
import es from '../i18n/es.js';
import { useAuth } from '../context/AuthContext.jsx';

const COMMON_ITEMS = [
  { to: '/', key: 'dashboard', end: true },
  { to: '/operation', key: 'operation' },
  { to: '/tickets', key: 'tickets' },
  { to: '/invoices', key: 'invoices' },
];

const ADMIN_ITEMS = [
  { to: '/reports', key: 'reports' },
  { to: '/spaces', key: 'spaces' },
  { to: '/rates', key: 'rates' },
  { to: '/users', key: 'users' },
];

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {es.nav[item.key]}
    </NavLink>
  );
}

export default function Sidebar({ open, onNavigate }) {
  const { isAdmin } = useAuth();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-200 bg-white p-4 transition-transform md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-6 px-2">
        <p className="text-base font-semibold text-slate-900">{es.app.name}</p>
        <p className="text-xs text-slate-500">{es.app.tagline}</p>
      </div>
      <nav className="space-y-1">
        {COMMON_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} onNavigate={onNavigate} />
        ))}
        {isAdmin && (
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
            {ADMIN_ITEMS.map((item) => (
              <NavItem key={item.key} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
