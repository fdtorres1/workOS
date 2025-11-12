'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckSquare, 
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelRightOpen
} from 'lucide-react';
import { useSidebar } from './sidebar-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/people', label: 'People', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/deals', label: 'Deals', icon: TrendingUp },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!isMobileOpen)}
          className="h-10 w-10"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-16 lg:w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className={cn(
            'flex h-16 items-center border-b px-4 relative',
            isCollapsed && 'lg:flex-col lg:justify-center lg:gap-2 lg:py-2'
          )}>
            <Link 
              href="/dashboard" 
              className={cn(
                'flex items-center gap-2 transition-all',
                isCollapsed ? 'lg:flex-col' : 'flex-1'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className={cn(
                'text-xl font-bold whitespace-nowrap transition-all',
                isCollapsed && 'lg:hidden'
              )}>WorkOS</span>
            </Link>
            
            {/* Desktop toggle button - top right when expanded, prominent when collapsed */}
            <Button
              variant={isCollapsed ? "outline" : "ghost"}
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                'hidden lg:flex flex-shrink-0 transition-all',
                isCollapsed 
                  ? 'h-9 w-9 border-2 hover:bg-accent hover:border-primary/20' 
                  : 'h-8 w-8 relative',
                'hover:bg-accent'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full h-11 transition-all',
                      isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
                      isActive && 'bg-accent font-semibold'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      'whitespace-nowrap transition-all',
                      isCollapsed && 'lg:hidden'
                    )}>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t p-4">
            <Link 
              href="/settings" 
              onClick={() => setMobileOpen(false)}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Button
                variant="ghost"
                className={cn(
                  'w-full h-11 transition-all',
                  isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
                  pathname === '/settings' && 'bg-accent font-semibold'
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  'whitespace-nowrap transition-all',
                  isCollapsed && 'lg:hidden'
                )}>Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </aside>
    </>
  );
}

