import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PhoneIncoming, AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
  TrendingUp, TrendingDown,
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — CALLSUP" }] }),
  component: DashboardPage,
});

const callVolume = [
  { day: "Mon", calls: 142, escalations: 12 },
  { day: "Tue", calls: 168, escalations: 9 },
  { day: "Wed", calls: 195, escalations: 18 },
  { day: "Thu", calls: 174, escalations: 14 },
  { day: "Fri", calls: 220, escalations: 22 },
  { day: "Sat", calls: 98, escalations: 6 },
  { day: "Sun", calls: 76, escalations: 4 },
];

const reasonsData = [
  { reason: "Refund", count: 28 },
  { reason: "Billing", count: 22 },
  { reason: "Cancellation", count: 18 },
  { reason: "Technical", count: 15 },
  { reason: "Manager req.", count: 11 },
];

const recent = [
  { id: "T-2841", customer: "Call #call-001", reason: "Customer requested manager", priority: "high", time: "2 min ago" },
  { id: "T-2840", customer: "Call #call-002", reason: "Refund over $500 requested", priority: "high", time: "8 min ago" },
  { id: "T-2839", customer: "Call #call-003", reason: "Repeated technical failure", priority: "medium", time: "21 min ago" },
  { id: "T-2838", customer: "Call #call-004", reason: "Billing dispute", priority: "medium", time: "44 min ago" },
];

function Stat({ icon: Icon, label, value, delta, positive, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; delta: string; positive?: boolean; tone: "primary" | "warning" | "success" | "info";
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
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {positive ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          <span className={positive ? "text-success font-medium" : "text-destructive font-medium"}>{delta}</span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
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
        <Stat icon={PhoneIncoming} label="Calls handled today" value="1,073" delta="+12.4%" positive tone="primary" />
        <Stat icon={AlertTriangle} label="Pending escalations" value="14" delta="+3" tone="warning" />
        <Stat icon={CheckCircle2} label="Resolved today" value="289" delta="+8.1%" positive tone="success" />
        <Stat icon={Clock} label="Avg. handling time" value="4m 12s" delta="-18s" positive tone="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Call volume</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Calls vs escalations — last 7 days</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callVolume} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.18 258)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.55 0.18 258)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                  <XAxis dataKey="day" stroke="oklch(0.5 0.025 256)" fontSize={13} />
                  <YAxis stroke="oklch(0.5 0.025 256)" fontSize={13} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.012 250)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="calls" stroke="oklch(0.42 0.16 258)" strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="escalations" stroke="oklch(0.65 0.15 60)" strokeWidth={2} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top escalation reasons</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">This week</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonsData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.5 0.025 256)" fontSize={13} />
                  <YAxis type="category" dataKey="reason" stroke="oklch(0.5 0.025 256)" fontSize={13} width={90} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.012 250)", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="oklch(0.42 0.16 258)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent escalations</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Tickets requiring human attention</p>
          </div>
          <Link to="/queue"><Button variant="outline" size="sm">View all</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <Link key={t.id} to="/queue" className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="font-mono text-sm text-muted-foreground w-20">{t.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{t.customer}</div>
                  <div className="text-sm text-muted-foreground truncate">{t.reason}</div>
                </div>
                <Badge variant={t.priority === "high" ? "destructive" : "secondary"} className="capitalize">{t.priority}</Badge>
                <div className="text-sm text-muted-foreground w-20 text-right">{t.time}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
