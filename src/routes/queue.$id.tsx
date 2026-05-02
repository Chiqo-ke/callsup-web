import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Bot, CheckCircle2, UserCheck, Clock, Loader2 } from "lucide-react";
import { queue, auth, type EscalationTicket } from "@/lib/api";

export const Route = createFileRoute("/queue/$id")({
  head: () => ({ meta: [{ title: "Ticket — CALLSUP" }] }),
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { id } = Route.useParams();
  const [ticket, setTicket] = useState<EscalationTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    queue.get(id)
      .then(setTicket)
      .catch((e) => setError(e.message ?? "Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleClaim() {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const me = await auth.me();
      const updated = await queue.update(id, { status: "claimed", claimed_by: me.username });
      setTicket(updated);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to claim ticket");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolve() {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await queue.update(id, { status: "resolved", claimed_by: ticket.claimed_by ?? "" });
      setTicket(updated);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to resolve ticket");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Loading…" subtitle="">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading ticket…
        </div>
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell title="Error" subtitle="">
        <div className="py-12 text-center text-destructive">{error ?? "Ticket not found"}</div>
      </AppShell>
    );
  }

  const msgCount = ticket.conversation_history?.length ?? 0;

  return (
    <AppShell
      title={`Ticket ${ticket.id}`}
      subtitle={`Escalated from AI agent · ${ticket.conv_id}`}
      actions={
        <Link to="/queue">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to queue</Button>
        </Link>
      }
    >
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b border-border">
              <div>
                <CardTitle className="text-lg">Conversation transcript</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{msgCount} messages</p>
              </div>
              <PriorityBadge priority={ticket.priority} />
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[560px] overflow-y-auto">
              {(ticket.conversation_history ?? []).map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                    {m.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[15px] ${m.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {msgCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No conversation history available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ticket.status === "pending" && (
                <Button className="w-full justify-start gap-2" onClick={handleClaim} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Claim ticket
                </Button>
              )}
              {ticket.status !== "resolved" && (
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleResolve} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark resolved
                </Button>
              )}
              {ticket.status === "resolved" && (
                <p className="text-sm text-success text-center py-2">Ticket resolved</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Row label="Ticket ID" value={<span className="font-mono">{ticket.id}</span>} />
              <Row label="Conversation" value={<span className="font-mono">{ticket.conv_id}</span>} />
              <Row label="Reason" value={ticket.reason} />
              {ticket.rule_triggered && <Row label="Rule triggered" value={ticket.rule_triggered} />}
              <Row label="Created" value={<span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(ticket.created_at).toLocaleString()}</span>} />
              <Row label="Status" value={<StatusBadge status={ticket.status} />} />
              {ticket.claimed_by && <Row label="Claimed by" value={ticket.claimed_by} />}
              {ticket.summary && <Row label="Summary" value={ticket.summary} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground text-right">{value}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") return <Badge variant="destructive" className="capitalize">{priority}</Badge>;
  if (priority === "medium") return <Badge className="capitalize bg-warning text-warning-foreground">{priority}</Badge>;
  return <Badge variant="secondary" className="capitalize">{priority}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-destructive/10 text-destructive border-destructive/20",
    claimed: "bg-info/10 text-info border-info/20",
    resolved: "bg-success/10 text-success border-success/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[status] ?? ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="capitalize">{status}</span>
    </span>
  );
}
