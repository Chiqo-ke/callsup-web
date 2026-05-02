import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, PhoneCall, User, Bot, Loader2 } from "lucide-react";
import { queue, audio, type EscalationTicket, type TranscriptSegment } from "@/lib/api";

export const Route = createFileRoute("/conversations")({
  head: () => ({ meta: [{ title: "Conversations — CALLSUP" }] }),
  component: ConversationsPage,
});

function ConversationsPage() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queue.list()
      .then((list) => {
        setTickets(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e: unknown) => {
        const err = e as { message?: string };
        setError(err.message ?? "Failed to load conversations");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const ticket = tickets.find((t) => t.id === selectedId);
    if (!ticket?.conv_id) { setSegments([]); return; }
    setTranscriptLoading(true);
    audio.getTranscript(ticket.conv_id)
      .then(setSegments)
      .catch(() => setSegments([]))
      .finally(() => setTranscriptLoading(false));
  }, [selectedId, tickets]);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.id.toLowerCase().includes(q) || t.conv_id?.toLowerCase().includes(q) || t.reason?.toLowerCase().includes(q);
  });

  const current = tickets.find((t) => t.id === selectedId) ?? null;

  function formatTs(ts: number) {
    const m = Math.floor(ts / 60);
    const s = Math.floor(ts % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <AppShell title="Conversations" subtitle="Recordings, transcripts and outcomes">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Conversations" subtitle="Recordings, transcripts and outcomes">
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <Card>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets…" className="pl-9 h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <CardContent className="p-0 max-h-[640px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">No conversations found.</p>
            )}
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-4 transition-colors ${active ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground font-mono text-sm">{t.id.slice(0, 8)}…</span>
                      </div>
                      <Badge variant={t.status === "pending" ? "destructive" : t.status === "claimed" ? "default" : "secondary"} className="capitalize">{t.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{t.reason ?? "No reason"}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {current && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground font-mono">{current.id}</div>
                    <div className="text-xl font-semibold text-foreground mt-1">{current.conv_id ?? "—"}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Priority: <span className="font-medium capitalize">{current.priority}</span>
                      {current.created_at && <> · {new Date(current.created_at).toLocaleString()}</>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <Badge variant={current.status === "pending" ? "destructive" : current.status === "claimed" ? "default" : "secondary"} className="capitalize mt-1">{current.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base">Transcript</h3>
              {transcriptLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading transcript…</div>
              )}
              {!transcriptLoading && segments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {current?.conv_id ? "No transcript available." : "Select a ticket with a conversation ID to view transcript."}
                </p>
              )}
              {!transcriptLoading && segments.length > 0 && (
                <div className="space-y-3">
                  {segments.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${s.speaker !== "customer" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                        {s.speaker !== "customer" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize text-foreground">{s.speaker}</span>
                          {s.start_ts != null && <span className="text-xs text-muted-foreground font-mono">{formatTs(s.start_ts)}</span>}
                          {s.confidence != null && <span className="text-xs text-muted-foreground">· {Math.round(s.confidence * 100)}%</span>}
                        </div>
                        <p className="text-[15px] text-foreground">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
