import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Play, PhoneCall, User, Bot } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/conversations")({
  head: () => ({ meta: [{ title: "Conversations — CALLSUP" }] }),
  component: ConversationsPage,
});

const calls = [
  { id: "call-001", customer: "+1 (555) 0142", duration: "4m 18s", started: "10:24", outcome: "escalated", confidence: 0.94 },
  { id: "call-002", customer: "+1 (555) 0188", duration: "2m 44s", started: "10:18", outcome: "resolved", confidence: 0.97 },
  { id: "call-003", customer: "+1 (555) 0220", duration: "6m 02s", started: "10:09", outcome: "escalated", confidence: 0.91 },
  { id: "call-004", customer: "+1 (555) 0301", duration: "1m 51s", started: "09:56", outcome: "resolved", confidence: 0.98 },
  { id: "call-005", customer: "+1 (555) 0344", duration: "3m 22s", started: "09:48", outcome: "resolved", confidence: 0.96 },
];

const segments = [
  { speaker: "agent" as const, ts: "00:00", text: "Hello, this is Acme Inc, how may I assist you today?", confidence: 0.99 },
  { speaker: "customer" as const, ts: "00:05", text: "Hi, I need help with my recent order — it arrived damaged.", confidence: 0.94 },
  { speaker: "agent" as const, ts: "00:11", text: "I'm sorry to hear that. Could you share your order number?", confidence: 0.98 },
  { speaker: "customer" as const, ts: "00:18", text: "It's order number twelve thirty-four five.", confidence: 0.92 },
  { speaker: "agent" as const, ts: "00:24", text: "Thank you, I've located the order. I'll process a replacement at no cost.", confidence: 0.97 },
];

function ConversationsPage() {
  const [selected, setSelected] = useState("call-001");
  const current = calls.find((c) => c.id === selected)!;

  return (
    <AppShell title="Conversations" subtitle="Recordings, transcripts and outcomes">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <Card>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search calls…" className="pl-9 h-10" />
            </div>
          </div>
          <CardContent className="p-0 max-h-[640px] overflow-y-auto">
            <div className="divide-y divide-border">
              {calls.map((c) => {
                const active = c.id === selected;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`w-full text-left p-4 transition-colors ${active ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{c.customer}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{c.started}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground font-mono">{c.id}</div>
                      <Badge variant={c.outcome === "escalated" ? "destructive" : "secondary"} className="capitalize">{c.outcome}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm text-muted-foreground font-mono">{current.id}</div>
                  <div className="text-xl font-semibold text-foreground mt-1">{current.customer}</div>
                  <div className="text-sm text-muted-foreground mt-1">Started {current.started} · Duration {current.duration}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">STT confidence</div>
                    <div className="text-lg font-semibold text-success">{Math.round(current.confidence * 100)}%</div>
                  </div>
                  <Button className="gap-2"><Play className="h-4 w-4" /> Play recording</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base">Transcript</h3>
              <div className="space-y-3">
                {segments.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${s.speaker === "agent" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                      {s.speaker === "agent" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize text-foreground">{s.speaker}</span>
                        <span className="text-xs text-muted-foreground font-mono">{s.ts}</span>
                        <span className="text-xs text-muted-foreground">· {Math.round(s.confidence * 100)}%</span>
                      </div>
                      <p className="text-[15px] text-foreground">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
