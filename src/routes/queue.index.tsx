import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Radio } from "lucide-react";
import { queue, type EscalationTicket } from "@/lib/api";

export const Route = createFileRoute("/queue/")({
  component: QueuePage,
});

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[s] ?? ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="capitalize">{s}</span>
    </span>
  );
}

function QueuePage() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    queue.list().then(setTickets).catch(console.error);

    const source = queue.stream((ticket) => {
      setTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === ticket.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = ticket;
          return next;
        }
        return [ticket, ...prev];
      });
    });

    source.addEventListener("open", () => setSseConnected(true));
    source.addEventListener("error", () => setSseConnected(false));

    return () => source.close();
  }, []);

  const filtered = tickets.filter((t) => {
    if (activeTab !== "all" && t.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.reason.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    claimed: tickets.filter((t) => t.status === "claimed").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <AppShell
      title="Escalation Queue"
      subtitle="Tickets created when the AI hands off to a human agent"
      actions={
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border ${sseConnected ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
          <Radio className={`h-4 w-4 ${sseConnected ? "animate-pulse" : ""}`} />
          {sseConnected ? "Live stream connected" : "Connecting…"}
        </div>
      }
    >
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All <span className="ml-1.5 text-xs text-muted-foreground">{counts.all}</span></TabsTrigger>
              <TabsTrigger value="pending">Pending <span className="ml-1.5 text-xs text-destructive font-semibold">{counts.pending}</span></TabsTrigger>
              <TabsTrigger value="claimed">Claimed <span className="ml-1.5 text-xs text-muted-foreground">{counts.claimed}</span></TabsTrigger>
              <TabsTrigger value="resolved">Resolved <span className="ml-1.5 text-xs text-muted-foreground">{counts.resolved}</span></TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex-1" />
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reason, ID…"
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground text-sm">
                      No tickets found.
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium">{t.id}</div>
                      <div className="text-xs text-muted-foreground">{t.conv_id ?? "—"}</div>
                    </td>
                    <td className="px-4 py-4 max-w-md">
                      <div className="text-sm text-foreground line-clamp-2">{t.reason}</div>
                      {t.rule_triggered && <div className="text-xs text-muted-foreground mt-1">Rule: {t.rule_triggered}</div>}
                    </td>
                    <td className="px-4 py-4">{priorityBadge(t.priority)}</td>
                    <td className="px-4 py-4">{statusBadge(t.status)}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{t.claimed_by ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">{relativeTime(t.created_at)}</td>
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

