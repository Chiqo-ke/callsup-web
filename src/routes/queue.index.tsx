import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Radio } from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Escalation Queue — CALLSUP" }] }),
  component: QueuePage,
});

const tickets = [
  { id: "T-2841", conv: "call-001", reason: "Customer requested manager — billing dispute over recurring charge", priority: "high", status: "pending", created: "2 min ago", agent: null, rule: "Manager request" },
  { id: "T-2840", conv: "call-002", reason: "Refund over $500 requested for damaged shipment", priority: "high", status: "pending", created: "8 min ago", agent: null, rule: "Refund > $500" },
  { id: "T-2839", conv: "call-003", reason: "Repeated technical failure on login flow, customer increasingly frustrated", priority: "medium", status: "claimed", created: "21 min ago", agent: "agent-jane", rule: null },
  { id: "T-2838", conv: "call-004", reason: "Account cancellation intent — high-value customer", priority: "high", status: "claimed", created: "44 min ago", agent: "agent-mike", rule: "Cancellation intent" },
  { id: "T-2837", conv: "call-005", reason: "Customer mentioned legal action regarding data privacy", priority: "high", status: "pending", created: "1h ago", agent: null, rule: "Legal mention" },
  { id: "T-2836", conv: "call-006", reason: "Billing inquiry — invoice clarification", priority: "low", status: "resolved", created: "2h ago", agent: "agent-jane", rule: null },
  { id: "T-2835", conv: "call-007", reason: "Service outage report from enterprise account", priority: "medium", status: "resolved", created: "3h ago", agent: "agent-mike", rule: null },
];

function priorityBadge(p: string) {
  if (p === "high") return <Badge variant="destructive" className="capitalize">{p}</Badge>;
  if (p === "medium") return <Badge className="capitalize bg-warning text-warning-foreground hover:bg-warning/90">{p}</Badge>;
  return <Badge variant="secondary" className="capitalize">{p}</Badge>;
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-destructive/10 text-destructive border-destructive/20",
    claimed: "bg-info/10 text-info border-info/20",
    resolved: "bg-success/10 text-success border-success/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[s]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="capitalize">{s}</span>
    </span>
  );
}

function QueuePage() {
  return (
    <AppShell
      title="Escalation Queue"
      subtitle="Tickets created when the AI hands off to a human agent"
      actions={
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 text-success text-sm font-medium border border-success/20">
          <Radio className="h-4 w-4 animate-pulse" /> Live stream connected
        </div>
      }
    >
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All <span className="ml-1.5 text-xs text-muted-foreground">7</span></TabsTrigger>
              <TabsTrigger value="pending">Pending <span className="ml-1.5 text-xs text-destructive font-semibold">3</span></TabsTrigger>
              <TabsTrigger value="claimed">Claimed <span className="ml-1.5 text-xs text-muted-foreground">2</span></TabsTrigger>
              <TabsTrigger value="resolved">Resolved <span className="ml-1.5 text-xs text-muted-foreground">2</span></TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex-1" />
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reason, ID…" className="pl-9 h-10" />
          </div>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filter</Button>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground bg-muted/30">
                  <th className="font-medium px-6 py-3">Ticket</th>
                  <th className="font-medium px-4 py-3">Reason</th>
                  <th className="font-medium px-4 py-3">Priority</th>
                  <th className="font-medium px-4 py-3">Status</th>
                  <th className="font-medium px-4 py-3">Agent</th>
                  <th className="font-medium px-4 py-3">Created</th>
                  <th className="font-medium px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium">{t.id}</div>
                      <div className="text-xs text-muted-foreground">{t.conv}</div>
                    </td>
                    <td className="px-4 py-4 max-w-md">
                      <div className="text-sm text-foreground line-clamp-2">{t.reason}</div>
                      {t.rule && <div className="text-xs text-muted-foreground mt-1">Rule: {t.rule}</div>}
                    </td>
                    <td className="px-4 py-4">{priorityBadge(t.priority)}</td>
                    <td className="px-4 py-4">{statusBadge(t.status)}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{t.agent ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">{t.created}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/queue/$id" params={{ id: t.id }}>
                        <Button variant="outline" size="sm">Open</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
