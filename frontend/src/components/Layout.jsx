import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'OP';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      path: '/',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Fleet Assets',
      icon: 'local_shipping',
      path: '/vehicles',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Drivers',
      icon: 'badge',
      path: '/drivers',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Trip Dispatch',
      icon: 'route',
      path: '/trips',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Maintenance',
      icon: 'build',
      path: '/maintenance',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Fuel & Expenses',
      icon: 'payments',
      path: '/expenses',
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Analytics & Reports',
      icon: 'leaderboard',
      path: '/analytics',
      roles: ['Fleet Manager', 'Financial Analyst']
    }
  ];

  const activeItem = navItems.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  }) || navItems[0];

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[260px] h-screen fixed left-0 top-0 bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider flex-col py-stack-md z-50 border-r border-outline">
        <div className="px-6 mb-8">
          <h1 className="font-headline-md text-headline-md font-bold text-on-primary-container">Waybound</h1>
          <p className="opacity-60 text-[10px] tracking-widest mt-1">Fleet Ops v2.4</p>
        </div>
        <nav className="flex-1 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-6 py-3 transition-colors duration-150 ${
                  isActive
                    ? 'text-primary-fixed bg-tertiary-container font-bold border-l-4 border-secondary'
                    : 'text-on-primary-container opacity-70 hover:opacity-100 hover:bg-tertiary-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-outline-variant/20 pt-4">
          <div className="px-6 py-3 flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-sm bg-primary border border-outline-variant flex items-center justify-center font-bold text-xs text-on-primary">
              {getInitials(user?.name)}
            </div>
            <div className="truncate">
              <p className="text-[10px] font-bold text-primary-fixed truncate">{user?.name}</p>
              <p className="text-[9px] opacity-60 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-6 py-3 text-on-primary-container opacity-70 hover:opacity-100 hover:bg-tertiary-container transition-colors duration-150 text-left"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="w-[260px] h-screen bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider flex flex-col py-stack-md relative z-50 border-r border-outline">
            <div className="px-6 mb-8 flex justify-between items-center">
              <div>
                <h1 className="font-headline-md text-headline-md font-bold text-on-primary-container">Waybound</h1>
                <p className="opacity-60 text-[10px] tracking-widest mt-1">Fleet Ops v2.4</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-on-primary-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-6 py-3 transition-colors duration-150 ${
                      isActive
                        ? 'text-primary-fixed bg-tertiary-container font-bold border-l-4 border-secondary'
                        : 'text-on-primary-container opacity-70 hover:opacity-100 hover:bg-tertiary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-outline-variant/20 pt-4">
              <div className="px-6 py-3 flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-sm bg-primary border border-outline-variant flex items-center justify-center font-bold text-xs text-on-primary">
                  {getInitials(user?.name)}
                </div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-primary-fixed truncate">{user?.name}</p>
                  <p className="text-[9px] opacity-60 truncate">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center px-6 py-3 text-on-primary-container opacity-70 hover:opacity-100 hover:bg-tertiary-container transition-colors duration-150 text-left"
              >
                <span className="material-symbols-outlined mr-3">logout</span>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-[260px]">
        {/* TopAppBar */}
        <header className="bg-surface h-16 border-b border-outline-variant flex items-center justify-between px-margin-page fixed top-0 left-0 right-0 lg:left-[260px] z-40">
          <div className="flex items-center gap-4 lg:gap-8">
            <button className="lg:hidden text-primary" onClick={() => setMobileMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-md text-headline-md font-black text-primary truncate">Waybound Control</span>
            <nav className="hidden md:flex items-center space-x-6 text-on-surface-variant font-label-caps text-xs">
              <span className={`pb-1 ${location.pathname === '/' || location.pathname === '/vehicles' || location.pathname === '/drivers' ? 'text-primary border-b-2 border-primary font-bold' : ''}`}>FLEET</span>
              <span className={`pb-1 ${location.pathname === '/trips' || location.pathname === '/maintenance' ? 'text-primary border-b-2 border-primary font-bold' : ''}`}>LOGISTICS</span>
              <span className={`pb-1 ${location.pathname === '/expenses' || location.pathname === '/analytics' ? 'text-primary border-b-2 border-primary font-bold' : ''}`}>SAFETY & FINANCE</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:scale-95 duration-75">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:scale-95 duration-75 hidden sm:inline">help_outline</span>
            
            {/* User role pill */}
            <span className="hidden sm:inline bg-surface-container border border-outline-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] text-on-surface-variant uppercase">
              {user?.role}
            </span>

            <div className="w-8 h-8 rounded-sm bg-primary border border-outline-variant flex items-center justify-center font-bold text-xs text-on-primary">
              {getInitials(user?.name)}
            </div>
            <button onClick={logout} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Canvas */}
        <main className="flex-1 pt-16 flex flex-col">
          <div className="p-margin-page max-w-container-max w-full mx-auto flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
