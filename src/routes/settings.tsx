import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { auth, health, type UserProfile } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — CALLSUP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.me()
      .then(setProfile)
      .catch((e: unknown) => {
        const err = e as { message?: string };
        setError(err.message ?? "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    health.check()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  if (loading) {
    return (
      <AppShell title="Settings" subtitle="Workspace, team and integrations">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" subtitle="Workspace, team and integrations">
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input value={profile?.business_name ?? ""} className="h-11" readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Business ID</Label>
                  <Input value={profile?.business_id ?? ""} className="h-11 font-mono text-sm" readOnly />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={profile?.username ?? ""} className="h-11" readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? ""} className="h-11" readOnly />
                </div>
              </div>
              <div className="flex justify-end">
                <Button disabled title="Profile editing is not yet available">Save changes</Button>
              </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${apiStatus === "online" ? "bg-success" : apiStatus === "offline" ? "bg-destructive" : "bg-warning"}`} />
                  <span className="text-foreground">API</span>
                </div>
                <Badge variant={apiStatus === "online" ? "secondary" : apiStatus === "offline" ? "destructive" : "secondary"} className="capitalize">{apiStatus}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                {profile?.created_at && <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>}
              </div>
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
