import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Sparkles, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/rules")({
  head: () => ({ meta: [{ title: "Escalation Rules — CALLSUP" }] }),
  component: RulesPage,
});

const rules = [
  { id: "r-1", text: "Escalate if customer mentions a refund over $500", refined: "If the customer requests a refund exceeding $500, escalate the call immediately to a senior agent.", priority: "high", active: true },
  { id: "r-2", text: "Transfer to human if customer is very angry", refined: "When the customer expresses sustained anger, profanity, or threats, escalate the call to a human agent.", priority: "high", active: true },
  { id: "r-3", text: "Escalate if customer mentions cancellation", refined: "If the customer states intent to cancel their account, escalate to a retention specialist.", priority: "medium", active: true },
  { id: "r-4", text: "Escalate technical issues unresolved after 2 attempts", refined: "If a technical problem persists after two troubleshooting attempts, hand off to support engineering.", priority: "medium", active: false },
  { id: "r-5", text: "Escalate any mention of legal action", refined: "If the customer references lawyers, lawsuits, or legal action, escalate to compliance.", priority: "high", active: true },
];

function priorityBadge(p: string) {
  if (p === "high") return <Badge variant="destructive" className="capitalize">{p}</Badge>;
  if (p === "medium") return <Badge className="capitalize bg-warning text-warning-foreground hover:bg-warning/90">{p}</Badge>;
  return <Badge variant="secondary" className="capitalize">{p}</Badge>;
}

function RulesPage() {
  return (
    <AppShell
      title="Escalation Rules"
      subtitle="Define when the AI hands a conversation to a human agent"
      actions={<Button className="gap-2"><Plus className="h-4 w-4" /> New rule</Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {rules.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {priorityBadge(r.priority)}
                      {!r.active && <Badge variant="outline">Disabled</Badge>}
                    </div>
                    <p className="text-foreground font-medium">{r.text}</p>
                    <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                        <Sparkles className="h-3.5 w-3.5" /> AI-refined for the model
                      </div>
                      <p className="text-sm text-muted-foreground">{r.refined}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={r.active} />
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">How rules work</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Active rules are injected into the AI agent's system prompt on every call turn. The AI consults them when deciding whether to escalate.</p>
              <p>Toggle <span className="font-medium text-foreground">AI refinement</span> when creating a rule to let the model rewrite it for clarity — your original wording is preserved.</p>
              <p>Higher priority rules surface in tickets so your team can triage quickly.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
