import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, PlusCircle, History, BarChart3, Settings, LogOut, BookOpen, CalendarCheck, Sparkles, ClipboardCheck, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import FloatingActionButton from '@/components/FloatingActionButton';

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

  // Theme toggle
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jeemirror-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('jeemirror-theme', theme);
  }, [theme]);

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
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="JEEMirror logo" className="h-8 w-8 drop-shadow-[0_0_8px_hsl(253,63%,55%,0.4)]" />
            <h1 className="text-xl font-bold">
              <span className="text-gradient">JEE</span>Mirror
            </h1>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors touch-target"
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all touch-target ${
                  isActive
                    ? 'bg-sidebar-accent text-foreground border-l-2 border-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
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
              <span className="text-sm font-medium truncate block text-foreground">{displayName}</span>
              <span className={`text-xs font-semibold rounded-md px-1.5 py-0.5 ${planColor}`}>{planBadge}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            aria-label="Logout"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground touch-target"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile FAB */}
      <FloatingActionButton />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border glass" aria-label="Mobile navigation">
        {mobileBottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors touch-target justify-center ${
                isActive ? 'text-primary drop-shadow-[0_0_6px_hsl(253,63%,55%,0.5)]' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="More navigation options"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors touch-target justify-center ${
            moreItems.some(i => location.pathname === i.to) ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* More drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {/* Theme toggle in drawer */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground touch-target"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {moreItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  aria-label={item.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={() => { signOut(); setMoreOpen(false); }}
              aria-label="Logout"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground touch-target"
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
