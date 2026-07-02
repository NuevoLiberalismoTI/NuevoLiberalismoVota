'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Plus, ShieldCheck, LogOut, ChevronRight, SlidersHorizontal, Users } from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function getPageTitle(pathname) {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname === '/admin/nueva') return 'Nueva sesión';
  if (pathname === '/admin/usuarios') return 'Administradores';
  if (pathname === '/admin/parametricas') return 'Parámetricas';
  if (pathname === '/admin/militantes') return 'Militantes';
  if (pathname.startsWith('/admin/sesion/')) return 'Gestión de sesión';
  return 'Admin';
}

const NAV_ITEMS = [
  {
    group: 'PANEL',
    items: [
      { label: 'Dashboard',    href: '/admin',        Icon: LayoutDashboard, exact: true  },
      { label: 'Nueva sesión', href: '/admin/nueva',  Icon: Plus,            exact: false },
    ],
  },
  {
    group: 'DIRECTORIO',
    items: [
      { label: 'Militantes', href: '/admin/militantes', Icon: Users, exact: false },
    ],
  },
  {
    group: 'CONFIGURACIÓN',
    items: [
      { label: 'Administradores', href: '/admin/usuarios',     Icon: ShieldCheck,      exact: false },
      { label: 'Parámetricas',    href: '/admin/parametricas', Icon: SlidersHorizontal, exact: false },
    ],
  },
];

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [usuario,      setUsuario]      = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) {
      router.replace('/');
      return;
    }
    const u = JSON.parse(stored);
    if (u.rol !== 'admin') {
      router.replace('/');
      return;
    }
    setUsuario(u);
    setCargandoAuth(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    router.push('/');
  };

  if (cargandoAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

  const isActive = (href, exact) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <Image
            src={LOGO}
            alt="Nuevo Liberalismo"
            width={130}
            height={44}
            className="object-contain"
            priority
          />
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Panel Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5">
          {NAV_ITEMS.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">
                {group}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map(({ label, href, Icon, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <button
                      key={href}
                      onClick={() => router.push(href)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-semibold transition-all ${
                        active
                          ? 'bg-brand text-white rounded-xl'
                          : 'text-gray-600 hover:bg-gray-50 rounded-xl'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{usuario?.nombre}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{usuario?.cedula}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0">
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <span className="font-semibold text-gray-500">Nuevo Liberalismo</span>
            <ChevronRight size={12} />
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-gray-700">{pageTitle}</span>
          </nav>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
