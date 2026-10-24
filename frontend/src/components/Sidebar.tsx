import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Factory,
  Truck,
  ArrowDownToLine,
  Boxes,
  Package,
  IndianRupee,
  FileCheck2,
  BarChart3,
  Users,
  Settings,
  ClipboardList
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const adminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Sugar Seasons', path: '/sugar-seasons', icon: CalendarDays },
    { name: 'Plant Management', path: '/masters/plants', icon: Building2 },
    { name: 'Production', path: '/production', icon: Factory },
    { name: 'Dispatches & Transfers', path: '/dispatches', icon: Truck },
    { name: 'Imports & Exports', path: '/imports-exports', icon: ArrowDownToLine },
    { name: 'Stock & Inventory', path: '/inventory', icon: Boxes },
    { name: 'Packaging Details', path: '/packaging', icon: Package },
    { name: 'Cane Dues Data', path: '/cane-dues', icon: IndianRupee },
    { name: 'Regulatory P2 Reports', path: '/regulatory/p2-reports', icon: FileCheck2 },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Integration Settings', path: '/admin/integrations', icon: Settings },
    { name: 'System Audit Logs', path: '/admin/audit-logs', icon: ClipboardList }
  ];

  const clerkNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Production Entry', path: '/production', icon: Factory },
    { name: 'Dispatch Entry', path: '/dispatches', icon: Truck },
    { name: 'Imports & Exports', path: '/imports-exports', icon: ArrowDownToLine },
    { name: 'Stock Management', path: '/inventory', icon: Boxes },
    { name: 'Packaging Entry', path: '/packaging', icon: Package },
    { name: 'Cane Dues Entry', path: '/cane-dues', icon: IndianRupee },
    { name: 'Monthly P2 Report', path: '/regulatory/p2-reports', icon: FileCheck2 }
  ];

  const navItems = isAdmin ? adminNav : clerkNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full min-h-0 overflow-hidden select-none">
      {/* Role Banner */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {isAdmin ? 'ADMINISTRATOR CONSOLE' : 'FACTORY CLERK CONSOLE'}
        </span>
        <div className="text-xs text-slate-700 font-semibold mt-0.5 truncate">
          {isAdmin ? 'Organization Overview' : `Assigned Plant: ${user ? user.username : ''}`}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 border-r-4 border-red-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status footer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span>NSWS Gateway</span>
          <span className="inline-flex items-center text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          API v1.3 | Gov of India
        </div>
      </div>
    </aside>
  );
};
