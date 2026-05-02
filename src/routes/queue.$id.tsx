import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Bot, CheckCircle2, UserCheck, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/queue/$id")({
  head: () => ({ meta: [{ title: "Ticket — CALLSUP" }] }),
  component: TicketDetailPage,
});

const conversation = [
  { role: "assistant", content: "Hello, this is Acme Inc. How may I assist you today?" },
  { role: "user", content: "I've been charged twice for my subscription this month and I'm furious." },
  { role: "assistant", content: "I'm sorry to hear that. Can you confirm the email address associated with your account?" },
  { role: "user", content: "It's [REDACTED_EMAIL]. This is the third time this happens." },
  { role: "assistant", content: "Thank you. I can see two charges on your account. I'll need a manager to authorize the refund." },
  { role: "user", content: "Then get me a manager. Now." },
  { role: "assistant", content: "I understand. I've opened a support ticket for you. A human agent will be with you shortly — please hold the line." },
];

function TicketDetailPage() {
  const { id } = Route.useParams();
  return (
    <AppShell
      title={`Ticket ${id}`}
      subtitle="Escalated from AI agent · call-001"
      actions={
        <Link to="/queue">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to queue</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b border-border">
              <div>
                <CardTitle className="text-lg">Conversation transcript</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">7 messages · escalated 2 min ago</p>
              </div>
              <Badge variant="destructive">High priority</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[560px] overflow-y-auto">
              {conversation.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                    {m.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[15px] ${m.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
            <CardContent>
              <textarea className="w-full min-h-28 rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Add a note for your team…" />
              <div className="mt-3 flex justify-end"><Button size="sm">Save note</Button></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start gap-2"><UserCheck className="h-4 w-4" /> Claim ticket</Button>
              <Button variant="outline" className="w-full justify-start gap-2"><CheckCircle2 className="h-4 w-4" /> Mark resolved</Button>
              <Button variant="ghost" className="w-full justify-start gap-2"><FileText className="h-4 w-4" /> Export transcript</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Row label="Ticket ID" value={<span className="font-mono">{id}</span>} />
              <Row label="Conversation" value={<span className="font-mono">call-001</span>} />
              <Row label="Reason" value="Customer requested human manager for billing dispute" />
              <Row label="Rule triggered" value="Manager request (high)" />
              <Row label="Created" value={<span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 2 min ago</span>} />
              <Row label="Status" value={<Badge className="bg-destructive/10 text-destructive border border-destructive/20">Pending</Badge>} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground text-right">{value}</div>
    </div>
  );
}
