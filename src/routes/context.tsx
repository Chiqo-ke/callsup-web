import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, FileText, Pencil, Trash2, Clock } from "lucide-react";

export const Route = createFileRoute("/context")({
  head: () => ({ meta: [{ title: "Business Context — CALLSUP" }] }),
  component: ContextPage,
});

const alerts = [
  { id: "a-1", label: "Payment system outage", expires: "Today 18:00", content: "Payment processing is temporarily down. Do not promise same-day transactions; offer a callback instead." },
];
const items = [
  { id: "c-1", label: "Return Policy", type: "manual", updated: "2 days ago", content: "Customers may return products within 30 days of purchase for a full refund. Items must be in original condition…" },
  { id: "c-2", label: "Shipping options", type: "manual", updated: "5 days ago", content: "Standard shipping (5–7 days, free over $50). Express (2 days, $14.99). Overnight (1 day, $29.99)…" },
  { id: "c-3", label: "Holiday hours", type: "manual", updated: "1 week ago", content: "We are closed on December 25th, January 1st, and Thanksgiving Day…" },
  { id: "c-4", label: "Pricing-2026.pdf", type: "file", updated: "3 weeks ago", content: "Uploaded pricing sheet covering all SKUs and tiers for 2026…" },
];

function ContextPage() {
  return (
    <AppShell
      title="Business Context"
      subtitle="Knowledge documents the AI uses on every call"
      actions={<Button className="gap-2"><Plus className="h-4 w-4" /> Add document</Button>}
    >
      {alerts.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardHeader className="flex-row items-center gap-2 pb-3">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <CardTitle className="text-base">Active alerts</CardTitle>
            <span className="text-sm text-muted-foreground ml-1">Surfaced prominently in the AI prompt</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-md bg-card border border-border p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Alert</Badge>
                    <span className="font-semibold text-foreground">{a.label}</span>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Expires {a.expires}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{a.content}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Business information</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {items.map((it) => (
              <div key={it.id} className="bg-card p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${it.type === "file" ? "bg-info/15 text-info" : "bg-primary/10 text-primary"}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{it.label}</div>
                      <div className="text-xs text-muted-foreground">Updated {it.updated} · {it.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{it.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
