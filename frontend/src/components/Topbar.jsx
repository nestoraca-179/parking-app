import es from '../i18n/es.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';

const STATUS_STYLES = {
  connected: 'bg-green-500',
  connecting: 'bg-amber-400',
  reconnecting: 'bg-amber-400',
  disconnected: 'bg-red-500',
};

export default function Topbar({ connectionStatus, onToggleMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label={es.nav.openMenu}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 md:hidden"
      >
        {es.nav.openMenu}
      </button>
      <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[connectionStatus]}`} />
        {es.connection[connectionStatus]}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
          <p className="text-xs text-slate-500">{es.roles[user?.role]}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          {es.nav.logout}
        </Button>
      </div>
    </header>
  );
}
