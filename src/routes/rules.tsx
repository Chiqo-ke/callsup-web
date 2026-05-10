import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Sparkles, Pencil, Trash2, Loader2, X } from "lucide-react";
import { rules as rulesApi, type EscalationRule } from "@/lib/api";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
});

interface FormState {
  rule_text: string;
  priority: string;
  refine_with_ai: boolean;
}

const EMPTY_FORM: FormState = { rule_text: "", priority: "medium", refine_with_ai: false };

function priorityBadge(p: string) {
  if (p === "high") return <Badge variant="destructive" className="capitalize">{p}</Badge>;
  if (p === "medium") return <Badge className="capitalize bg-warning text-warning-foreground hover:bg-warning/90">{p}</Badge>;
  return <Badge variant="secondary" className="capitalize">{p}</Badge>;
}

function RulesPage() {
  const [rulesList, setRulesList] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<EscalationRule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setRulesList(await rulesApi.list());
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(rule: EscalationRule) {
    try {
      const updated = await rulesApi.update(rule.id, { is_active: !rule.is_active });
      setRulesList((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to update rule");
    }
  }

  async function handleDelete(id: string) {
    try {
      await rulesApi.delete(id);
      setRulesList((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to delete rule");
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(rule: EscalationRule) {
    setEditTarget(rule);
    setForm({ rule_text: rule.rule_text, priority: rule.priority, refine_with_ai: false });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await rulesApi.update(editTarget.id, {
          rule_text: form.rule_text,
          priority: form.priority,
          refine_with_ai: form.refine_with_ai,
        });
        setRulesList((prev) => prev.map((r) => (r.id === editTarget.id ? updated : r)));
      } else {
        const created = await rulesApi.create({
          rule_text: form.rule_text,
          priority: form.priority,
          refine_with_ai: form.refine_with_ai,
        });
        setRulesList((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Escalation Rules" subtitle="Define when the AI hands a conversation to a human agent">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Escalation Rules"
      subtitle="Define when the AI hands a conversation to a human agent"
      actions={<Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> New rule</Button>}
    >
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{editTarget ? "Edit rule" : "New rule"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full min-h-20 rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe when to escalate…"
              value={form.rule_text}
              onChange={(e) => setForm((f) => ({ ...f, rule_text: e.target.value }))}
            />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Priority:</span>
                <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.refine_with_ai} onChange={(e) => setForm((f) => ({ ...f, refine_with_ai: e.target.checked }))} />
                Refine with AI
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.rule_text}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {rulesList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No rules yet. Create one above.</p>
          )}
          {rulesList.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {priorityBadge(r.priority)}
                      {!r.is_active && <Badge variant="outline">Disabled</Badge>}
                    </div>
                    <p className="text-foreground font-medium">{r.rule_text}</p>
                    {r.ai_refined_text && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                          <Sparkles className="h-3.5 w-3.5" /> AI-refined for the model
                        </div>
                        <p className="text-sm text-muted-foreground">{r.ai_refined_text}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={r.is_active} onCheckedChange={() => handleToggle(r)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
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
