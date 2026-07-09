import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const PublicBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const getHomePath = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'superadmin') return '/superadmin';
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'staff') return '/staff/dashboard';
    return '/dashboard';
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Estimates', to: '/estimator', icon: FileText },
    { label: 'Contractors', to: '/directory', icon: Users },
    { label: 'Materials', to: '/marketplace', icon: ShoppingCart },
    { label: 'Profile', to: getHomePath(), icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 flex justify-between items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center gap-1 transition-colors ${
              active ? 'text-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-black uppercase">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
