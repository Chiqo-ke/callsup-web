import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — CALLSUP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Workspace, team and integrations">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input defaultValue="Acme Inc" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Business ID</Label>
                  <Input defaultValue="550e8400-e29b-41d4-a716-446655440000" className="h-11 font-mono text-sm" readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default greeting</Label>
                <Input defaultValue="Hello, this is Acme Inc, how may I assist you today?" className="h-11" />
              </div>
              <div className="flex justify-end"><Button>Save changes</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Voice & language</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                {["alloy", "nova", "onyx", "shimmer", "echo", "fable"].map((v, i) => (
                  <button key={v} className={`p-4 rounded-md border text-left transition-colors ${i === 0 ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                    <div className="font-medium text-foreground capitalize">{v}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">OpenAI TTS</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              <ToggleRow title="PII redaction" desc="Automatically scrub emails, phones, SSNs and card numbers." defaultOn />
              <ToggleRow title="Audio encryption at rest" desc="Recordings are encrypted with Fernet before being stored." defaultOn />
              <ToggleRow title="Enforce TLS in transit" desc="Reject any non-HTTPS request to the API." defaultOn />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Service status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Status label="API" status="healthy" />
              <Status label="OpenCode LLM" status="healthy" />
              <Status label="LLM adapter" status="healthy" />
              <Status label="STT (RapidAPI)" status="degraded" />
              <Status label="TTS (OpenAI)" status="healthy" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">Pro</div>
              <p className="text-sm text-muted-foreground mt-1">Unlimited calls · 5 seats · 90-day retention</p>
              <Button variant="outline" className="mt-4 w-full">Manage billing</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}

function Status({ label, status }: { label: string; status: "healthy" | "degraded" | "down" }) {
  const map = {
    healthy: { color: "bg-success", text: "Operational", variant: "secondary" as const },
    degraded: { color: "bg-warning", text: "Degraded", variant: "secondary" as const },
    down: { color: "bg-destructive", text: "Down", variant: "destructive" as const },
  }[status];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${map.color}`} />
        <span className="text-foreground">{label}</span>
      </div>
      <Badge variant={map.variant}>{map.text}</Badge>
    </div>
  );
}
