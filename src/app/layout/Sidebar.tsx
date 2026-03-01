import React, { memo, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '../../shared/utils/cn';
import { 
  FileText, Settings, History, ChevronLeft, ChevronRight,
  Sparkles, LayoutDashboard, Info
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', label: 'Analyze', icon: FileText },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
  { path: '/about', label: 'About', icon: Info },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const NavItem = memo(({ 
  item, 
  isActive, 
  collapsed 
}: { 
  item: typeof navItems[0]; 
  isActive: boolean; 
  collapsed: boolean;
}) => {
  const Icon = item.icon;
  
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
        isActive 
          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full" />
      )}
      <Icon className={cn(
        'w-5 h-5 flex-shrink-0 transition-colors',
        isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 group-hover:text-gray-600'
      )} />
      {!collapsed && (
        <span className="font-medium whitespace-nowrap">{item.label}</span>
      )}
    </Link>
  );
});

const SidebarComponent: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 flex flex-col shadow-xl shadow-gray-200/50 dark:shadow-none',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="h-20 flex items-center px-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fadeIn">
              <span className="font-bold text-xl text-gray-900 dark:text-white">DocuIntel</span>
              <p className="text-xs text-gray-400">Document Analysis</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem 
            key={item.path} 
            item={item} 
            isActive={activePath === item.path}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-5 py-4 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
          <p>v1.0.0 MIT License</p>
          <p className="mt-1">Privacy-first document analysis</p>
        </div>
      )}
    </aside>
  );
};

export const Sidebar = memo(SidebarComponent);
