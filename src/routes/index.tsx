import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PhoneIncoming, AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
} from "lucide-react";
import { queue, type DashboardStats, type EscalationTicket } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — CALLSUP" }] }),
  component: DashboardPage,
});

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtSeconds(s: number | null): string {
  if (s === null || s === undefined) return "--";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "warning" | "success" | "info";
}) {
  const toneBg = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
  }[tone];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-semibold mt-2 text-foreground">{value}</p>
          </div>
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${toneBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketRow({ ticket }: { ticket: EscalationTicket }) {
  const shortId = ticket.id.slice(0, 8);
  return (
    <Link to="/queue" className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
      <div className="font-mono text-sm text-muted-foreground w-24">{shortId}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground truncate">{ticket.reason}</div>
      </div>
      <Badge
        variant={ticket.priority === "high" ? "destructive" : "secondary"}
        className="capitalize"
      >
        {ticket.priority}
      </Badge>
      <div className="text-sm text-muted-foreground w-20 text-right">
        {relativeTime(ticket.created_at)}
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-center text-sm text-muted-foreground">{message}</div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<EscalationTicket[]>([]);
  const [pending, setPending] = useState<EscalationTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      queue.stats(),
      queue.list(),
      queue.list("pending"),
    ])
      .then(([s, all, pend]) => {
        setStats(s);
        setRecent(all.slice(0, 5));
        setPending(pend.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      title="Operations Dashboard"
      subtitle="Real-time overview of your AI-powered call center"
      actions={
        <Link to="/queue">
          <Button>Open queue <ArrowUpRight className="h-4 w-4" /></Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Stat
          icon={PhoneIncoming}
          label="Calls handled today"
          value={loading ? "—" : String(stats?.calls_handled_today ?? 0)}
          tone="primary"
        />
        <Stat
          icon={AlertTriangle}
          label="Pending escalations"
          value={loading ? "—" : String(stats?.pending_escalations ?? 0)}
          tone="warning"
        />
        <Stat
          icon={CheckCircle2}
          label="Resolved today"
          value={loading ? "—" : String(stats?.resolved_today ?? 0)}
          tone="success"
        />
        <Stat
          icon={Clock}
          label="Avg. handling time"
          value={loading ? "—" : fmtSeconds(stats?.avg_handling_time_seconds ?? null)}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent escalations</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest tickets across all statuses</p>
            </div>
            <Link to="/queue"><Button variant="outline" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recent.length === 0
                ? <EmptyState message={loading ? "Loading…" : "No escalations yet"} />
                : recent.map((t) => <TicketRow key={t.id} ticket={t} />)
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Tickets requiring human attention</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Pending — awaiting a human agent</p>
            </div>
            <Link to="/queue"><Button variant="outline" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pending.length === 0
                ? <EmptyState message={loading ? "Loading…" : "No pending tickets"} />
                : pending.map((t) => <TicketRow key={t.id} ticket={t} />)
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
