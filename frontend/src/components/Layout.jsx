import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useSpacesSocket from '../hooks/useSpacesSocket.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function Layout() {
  const { token } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const realtime = useSpacesSocket(token);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="fixed inset-0 z-20 bg-slate-900/30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <div className="md:pl-60">
        <Topbar connectionStatus={realtime.connectionStatus} onToggleMenu={() => setMenuOpen((open) => !open)} />
        <main className="mx-auto space-y-6 px-4 py-6 md:px-8">
          <Outlet context={realtime} />
        </main>
      </div>
    </div>
  );
}
