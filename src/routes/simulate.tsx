import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  PhoneCall,
  PhoneOff,
  Loader2,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { audio, getSavedUser, type VoiceChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulate")({
  head: () => ({ meta: [{ title: "Simulate Call — CALLSUP" }] }),
  component: SimulatePage,
});

interface DisplayMessage {
  id: string;
  role: "caller" | "agent";
  content: string;
  ts: Date;
  isAudio?: boolean;
}

type SimStatus = "idle" | "listening" | "processing" | "agent_thinking" | "agent_speaking";

const STATUS_LABELS: Record<SimStatus, string> = {
  idle: "Ready",
  listening: "Listening…",
  processing: "Processing audio…",
  agent_thinking: "Agent thinking…",
  agent_speaking: "Agent speaking…",
};

const STATUS_CLASSES: Record<SimStatus, string> = {
  idle: "bg-muted text-muted-foreground border-border",
  listening: "bg-red-50 text-red-700 border-red-200",
  processing: "bg-yellow-50 text-yellow-700 border-yellow-200",
  agent_thinking: "bg-blue-50 text-blue-700 border-blue-200",
  agent_speaking: "bg-green-50 text-green-700 border-green-200",
};

// ── Web Speech API types (not in lib.dom.d.ts by default) ────────────────────
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | null;
}

// ── Component ─────────────────────────────────────────────────────────────────
function SimulatePage() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<VoiceChatMessage[]>([]);
  const [convId, setConvId] = useState<string>("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SimStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const convIdRef = useRef<string>("");
  const businessIdRef = useRef<string>("default");
  const historyRef = useRef<VoiceChatMessage[]>([]);
  const escalatedRef = useRef(false);

  // Keep refs in sync with state so callbacks capture latest values
  useEffect(() => { convIdRef.current = convId; }, [convId]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { escalatedRef.current = escalated; }, [escalated]);

  useEffect(() => {
    if (!getSpeechRecognition()) setSpeechSupported(false);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText, status]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function fmtTime(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function stopRecorder() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stopListening() {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    stopRecorder();
    releaseStream();
  }

  function speakText(text: string, onEnd?: () => void) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en") && /female|woman/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null;
    if (preferred) utter.voice = preferred;
    utter.onend = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }

  // ── Core pipeline: text → agent reply → TTS ──────────────────────────────────
  async function handleTranscript(text: string, isAudio: boolean) {
    if (!text.trim()) return;
    setInterimText("");

    const callerMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "caller",
      content: text.trim(),
      ts: new Date(),
      isAudio,
    };
    setMessages((prev) => [...prev, callerMsg]);
    setStatus("agent_thinking");
    setError(null);

    try {
      const res = await audio.voiceChat({
        conv_id: convIdRef.current,
        business_id: businessIdRef.current,
        message: text.trim(),
        history: historyRef.current,
        first_turn: false,
      });
      const agentMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: res.reply,
        ts: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setHistory(res.history);
      setEscalated(res.escalated);
      setStatus("agent_speaking");
      speakText(res.reply, () => setStatus("idle"));
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Agent failed to respond. Is the backend running?");
      setStatus("idle");
    }
  }

  // ── Microphone pipeline ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (escalatedRef.current) return;
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Speech recognition is not supported. Use Chrome or Edge, or type below.");
      return;
    }

    setError(null);
    setInterimText("");
    setStatus("listening");

    // Start MediaRecorder — reuse stream acquired at conversation start if available
    try {
      const stream =
        streamRef.current ??
        (await navigator.mediaDevices.getUserMedia({ audio: true }));
      streamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(100);
      recorderRef.current = recorder;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setError(`Microphone permission denied: ${msg}. Please allow microphone access in your browser settings.`);
      setStatus("idle");
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (finalText) {
        setInterimText("");
        recognitionRef.current = null;
        stopRecorder();
        const chunks = [...audioChunksRef.current];
        setStatus("processing");

        // Fire-and-forget: upload audio blob to backend for logging
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("business_id", businessIdRef.current);
          fd.append("conv_id", convIdRef.current);
          fd.append("file", blob, "recording.webm");
          void audio.ingestAudio(fd).catch(() => {
            // fallback: store as text-based transcript
            void audio
              .simulateCall({
                business_id: businessIdRef.current,
                conv_id: convIdRef.current,
                script: `Caller: ${finalText.trim()}`,
              })
              .catch(() => undefined);
          });
        }

        void handleTranscript(finalText, true);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Microphone error: ${event.error}`);
      }
      setInterimText("");
      setStatus("idle");
      stopRecorder();
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Reset mic button if recognition ended without a final result
      if (recognitionRef.current) {
        recognitionRef.current = null;
        stopRecorder();
        setInterimText("");
        if (status === "listening") setStatus("idle");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopMic() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopRecorder();
    setInterimText("");
    setStatus("idle");
  }

  function toggleMic() {
    if (status === "listening") {
      stopMic();
    } else if (status === "idle") {
      void startListening();
    }
  }

  // ── Text input fallback ───────────────────────────────────────────────────────
  async function sendTextMessage() {
    const text = input.trim();
    if (!text || status !== "idle" || escalated) return;
    setInput("");
    await handleTranscript(text, false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendTextMessage();
    }
  }

  // ── Start / reset ─────────────────────────────────────────────────────────────
  function reset() {
    stopListening();
    window.speechSynthesis?.cancel();
    setStarted(false);
    setMessages([]);
    setHistory([]);
    setConvId("");
    setInput("");
    setStatus("idle");
    setInterimText("");
    setEscalated(false);
    setError(null);
  }

  async function startConversation() {
    const id = crypto.randomUUID();
    const businessId = getSavedUser()?.business_id ?? "default";
    businessIdRef.current = businessId;
    setConvId(id);
    convIdRef.current = id;
    setStatus("agent_thinking");
    setError(null);

    // Request microphone permission upfront so the browser prompts the user
    // immediately on "Start Call" rather than later when they tap the mic button.
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      // Permission denied or not available — user can still type; we'll show a
      // friendly hint after the call starts rather than blocking the entire flow.
    }
    try {
      const res = await audio.voiceChat({
        conv_id: id,
        business_id: businessId,
        message: "",
        history: [],
        first_turn: true,
      });
      const agentMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: res.reply,
        ts: new Date(),
      };
      setMessages([agentMsg]);
      setHistory(res.history);
      setEscalated(res.escalated);
      setStarted(true);
      setStatus("agent_speaking");
      speakText(res.reply, () => setStatus("idle"));
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Failed to start conversation. Is the backend running?");
      setStatus("idle");
    }
  }

  // ── Pre-start screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <AppShell title="Simulate Call" subtitle="Real audio simulation with AI agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PhoneCall className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Ready to simulate a call?</h2>
                <p className="text-sm text-muted-foreground">
                  Speak into your mic — your voice is transcribed live, sent to the AI agent,
                  and the agent responds both in text and audio, just like a real call.
                </p>
                {!speechSupported && (
                  <p className="text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2">
                    Speech recognition is not available in this browser. Chrome or Edge is
                    recommended. You can still type instead.
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                size="lg"
                onClick={() => void startConversation()}
                disabled={status === "agent_thinking"}
                className="gap-2"
              >
                {status === "agent_thinking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PhoneCall className="h-4 w-4" />
                )}
                {status === "agent_thinking" ? "Connecting…" : "Start Call"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const micActive = status === "listening";
  const busy = status !== "idle";

  // ── Active call ───────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Simulate Call"
      subtitle="Live call in progress"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </Button>
      }
    >
      <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto gap-3">
        {/* Pipeline status bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              STATUS_CLASSES[status]
            )}
          >
            {status === "listening" && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            {status === "processing" && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
            {status === "agent_thinking" && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
            {status === "agent_speaking" && <Volume2 className="h-3 w-3 shrink-0" />}
            {STATUS_LABELS[status]}
          </div>

          {escalated && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Escalated to human agent
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Chat messages */}
        <Card className="flex-1 overflow-y-auto">
          <CardContent className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  msg.role === "caller" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    msg.role === "caller"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.role === "caller" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    msg.role === "caller"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  )}
                >
                  {msg.isAudio && (
                    <div
                      className={cn(
                        "mb-1 flex items-center gap-1 text-[10px]",
                        msg.role === "caller" ? "justify-end text-primary-foreground/60" : "text-muted-foreground"
                      )}
                    >
                      <Mic className="h-3 w-3" />
                      <span>audio</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      msg.role === "caller"
                        ? "text-right text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {fmtTime(msg.ts)}
                  </p>
                </div>
              </div>
            ))}

            {/* Interim ghost bubble while listening */}
            {interimText && (
              <div className="flex items-end gap-2 flex-row-reverse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/40 text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-primary/15 px-4 py-2.5">
                  <p className="text-sm italic text-foreground/60 leading-relaxed">{interimText}</p>
                </div>
              </div>
            )}

            {/* Agent typing indicator */}
            {status === "agent_thinking" && (
              <div className="flex items-end gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </CardContent>
        </Card>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Mic button */}
          <Button
            size="lg"
            variant={micActive ? "destructive" : "default"}
            className={cn(
              "h-12 w-12 shrink-0 rounded-full p-0 transition-all",
              micActive && "ring-4 ring-destructive/30",
              status === "listening" && "scale-110"
            )}
            disabled={escalated || (busy && !micActive)}
            onClick={toggleMic}
            aria-label={micActive ? "Stop recording" : "Start recording"}
          >
            {micActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Text input fallback */}
          <Input
            ref={inputRef}
            placeholder={
              escalated
                ? "Call escalated — conversation ended"
                : busy && !micActive
                ? STATUS_LABELS[status]
                : "Or type a message…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy || escalated}
            className="flex-1"
          />

          <Button
            onClick={() => void sendTextMessage()}
            disabled={!input.trim() || busy || escalated}
            size="icon"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend / hint */}
        <div className="flex items-center justify-center gap-6 pb-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-2.5 w-2.5" />
            </span>
            You (Caller)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
              <Bot className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
            AI Agent
          </span>
          {speechSupported && (
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              {micActive ? "Tap mic to stop" : "Tap mic to speak"}
            </span>
          )}
        </div>
      </div>
    </AppShell>
  );
}
