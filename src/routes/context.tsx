import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, AlertTriangle, FileText, Pencil, Trash2, Clock, Loader2, X } from "lucide-react";
import { context, type ContextItem } from "@/lib/api";

export const Route = createFileRoute("/context")({
  component: ContextPage,
});

interface FormState {
  label: string;
  content: string;
  type: string;
  is_alert: boolean;
  expires_at: string;
}

const EMPTY_FORM: FormState = { label: "", content: "", type: "manual", is_alert: false, expires_at: "" };

function ContextPage() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ContextItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setItems(await context.list());
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to load context");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: ContextItem) {
    setEditTarget(item);
    setForm({
      label: item.label,
      content: item.content,
      type: item.type ?? "manual",
      is_alert: item.is_alert ?? false,
      expires_at: item.expires_at ?? "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    try {
      await context.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to delete");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await context.update(editTarget.id, {
          label: form.label,
          content: form.content,
          is_alert: form.is_alert,
          expires_at: form.expires_at || undefined,
        });
        setItems((prev) => prev.map((i) => (i.id === editTarget.id ? updated : i)));
      } else {
        const created = await context.create({
          label: form.label,
          content: form.content,
          type: form.type,
          is_alert: form.is_alert,
          expires_at: form.expires_at || undefined,
        });
        setItems((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const alerts = items.filter((i) => i.is_alert);
  const docs = items.filter((i) => !i.is_alert);

  if (loading) {
    return (
      <AppShell title="Business Context" subtitle="Knowledge documents the AI uses on every call">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Business Context"
      subtitle="Knowledge documents the AI uses on every call"
      actions={<Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add document</Button>}
    >
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{editTarget ? "Edit document" : "New document"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            <textarea
              className="w-full min-h-24 rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Content"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_alert} onChange={(e) => setForm((f) => ({ ...f, is_alert: e.target.checked }))} />
                Mark as alert
              </label>
              {form.is_alert && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Expires at:</span>
                  <Input type="datetime-local" className="w-48 h-8 text-xs" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
                </div>
              )}
              {!editTarget && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="manual">manual</option>
                    <option value="file">file</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.label || !form.content}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {a.expires_at && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Expires {new Date(a.expires_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{a.content}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Business information</CardTitle></CardHeader>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No documents yet. Add one above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
              {docs.map((it) => (
                <div key={it.id} className="bg-card p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${it.type === "file" ? "bg-info/15 text-info" : "bg-primary/10 text-primary"}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{it.label}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(it.updated_at).toLocaleDateString()} · {it.type ?? "manual"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(it.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{it.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
