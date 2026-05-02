import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CALLSUP" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-sidebar-primary flex items-center justify-center font-bold text-sidebar-primary-foreground">C</div>
          <div className="text-lg font-semibold">CALLSUP</div>
        </div>
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">The control center for AI-driven customer support.</h2>
          <p className="text-base opacity-80">Manage escalations, refine AI behavior, and keep your team in sync — all in one professional workspace built for service teams.</p>
          <div className="grid grid-cols-3 gap-6 pt-4">
            <div><div className="text-2xl font-semibold">98.4%</div><div className="text-sm opacity-70">Resolution rate</div></div>
            <div><div className="text-2xl font-semibold">2.1s</div><div className="text-sm opacity-70">Avg response</div></div>
            <div><div className="text-2xl font-semibold">24/7</div><div className="text-sm opacity-70">Coverage</div></div>
          </div>
        </div>
        <div className="text-sm opacity-60">© 2026 Callsup Inc.</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl">Welcome back</h1>
              <p className="text-muted-foreground mt-1">Sign in to your operations workspace</p>
            </div>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="alice" className="h-11" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a className="text-sm text-primary hover:underline" href="#">Forgot?</a>
                </div>
                <Input id="password" type="password" placeholder="••••••••" className="h-11" />
              </div>
              <Link to="/" className="block">
                <Button className="w-full h-11 text-base">Sign in</Button>
              </Link>
            </form>
            <div className="text-sm text-center text-muted-foreground">
              New to Callsup?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Create a workspace</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
