import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  ShieldAlert,
  BookOpen,
  PhoneCall,
  Settings,
  Bell,
  Search,
  Building2,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/queue", label: "Escalation Queue", icon: Inbox, badge: 4 },
  { to: "/conversations", label: "Conversations", icon: PhoneCall },
  { to: "/rules", label: "Escalation Rules", icon: ShieldAlert },
  { to: "/context", label: "Business Context", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title, subtitle, actions }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            C
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">CALLSUP</div>
            <div className="text-xs opacity-70">AI Call Center</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/50">
            <Building2 className="h-5 w-5 opacity-80" />
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-sm font-medium truncate">{user?.business_name ?? "My Business"}</div>
              <div className="text-xs opacity-70 truncate">Pro plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 shrink-0 border-b border-border bg-card px-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tickets, conversations…" className="pl-9 h-10 bg-background" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-medium">{user?.username ?? ""}</div>
                <div className="text-xs text-muted-foreground">Supervisor</div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>

        {/* Page header */}
        <div className="px-8 pt-8 pb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions}
        </div>

        <main className="flex-1 px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}
