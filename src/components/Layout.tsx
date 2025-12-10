import { ReactNode } from 'react';
import { LayoutDashboard, TrendingUp, Battery } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-zen-cardHover text-zen-accent' : 'text-gray-400 hover:text-white'}`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-screen bg-zen-dark text-white overflow-hidden">
    <aside className="w-64 bg-zen-sidebar border-r border-gray-800 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-10 text-zen-accent">
        <Battery size={32} />
        <h1 className="text-2xl font-bold tracking-wider">ZENFINITY</h1>
      </div>
      <nav className="space-y-2">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/trends" icon={TrendingUp} label="Long-term Trends" />
      </nav>
    </aside>
    <main className="flex-1 overflow-y-auto p-8">{children}</main>
  </div>
);