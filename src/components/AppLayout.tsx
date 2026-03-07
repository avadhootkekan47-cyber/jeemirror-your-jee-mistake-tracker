import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, PlusCircle, History, BarChart3, Settings, LogOut, BookOpen, CalendarCheck, Sparkles, ClipboardCheck, MoreHorizontal, Crown } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const navItems = [
  { to: '/today', icon: Sparkles, label: 'Today' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/log', icon: PlusCircle, label: 'Log Mistake' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/revision', icon: BookOpen, label: 'Chapter Revision' },
  { to: '/mock-tests', icon: ClipboardCheck, label: 'Mock Tests' },
  { to: '/planner', icon: CalendarCheck, label: 'Planner' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const mobileBottomItems = navItems.slice(0, 4);
const moreItems = navItems.slice(4);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const displayName = profile?.name || profile?.full_name || user?.email?.split('@')[0] || '??';
  const initials = displayName !== '??'
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const planBadge = profile?.plan === 'premium' ? 'Premium' : profile?.plan === 'trial' ? 'Trial' : 'Expired';
  const planColor = profile?.plan === 'premium' ? 'bg-accent/15 text-accent' : profile?.plan === 'trial' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive';

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30">
        <div className="p-5 flex items-center gap-2">
          <img src="/logo.png" alt="JEEMirror logo" className="h-8 w-8 drop-shadow-[0_0_8px_hsl(253,63%,55%,0.4)]" />
          <h1 className="text-xl font-bold">
            <span className="text-gradient">JEE</span>Mirror
          </h1>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-primary border-l-2 border-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{displayName}</span>
              <span className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${planColor}`}>{planBadge}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav - glassmorphism */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border glass">
        {mobileBottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors min-h-[48px] justify-center ${
                isActive ? 'text-primary drop-shadow-[0_0_6px_hsl(253,63%,55%,0.5)]' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </NavLink>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors min-h-[48px] justify-center ${
            moreItems.some(i => location.pathname === i.to) ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* More drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[48px] ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={() => { signOut(); setMoreOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary min-h-[48px]"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
