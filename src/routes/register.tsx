import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create workspace — CALLSUP" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground">C</div>
            <div className="text-lg font-semibold">CALLSUP</div>
          </div>
          <div>
            <h1 className="text-2xl">Create your workspace</h1>
            <p className="text-muted-foreground mt-1">Set up your business in less than a minute.</p>
          </div>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="biz">Business name</Label>
              <Input id="biz" placeholder="Acme Inc" className="h-11" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="alice" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="alice@acme.com" className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" className="h-11" />
            </div>
            <Link to="/" className="block">
              <Button className="w-full h-11 text-base">Create workspace</Button>
            </Link>
          </form>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
