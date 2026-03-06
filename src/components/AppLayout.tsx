import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, PlusCircle, History, BarChart3, Settings, LogOut, BookOpen, CalendarCheck, Sparkles, ClipboardCheck, MoreHorizontal } from 'lucide-react';
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

const mobileBottomItems = navItems.slice(0, 4); // Today, Dashboard, Log, History
const moreItems = navItems.slice(4); // Revision, Mock Tests, Planner, Analytics, Settings

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const displayName = profile?.name || user?.email?.split('@')[0] || '??';
  const initials = displayName !== '??'
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar fixed inset-y-0 left-0 z-30">
        <div className="p-5 flex items-center gap-2">
          <img src="/logo.png" alt="JEEMirror logo" className="h-8 w-8" />
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
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium truncate">{displayName}</span>
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
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav - 4 items + More */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card">
        {mobileBottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </NavLink>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={() => { signOut(); setMoreOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
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
