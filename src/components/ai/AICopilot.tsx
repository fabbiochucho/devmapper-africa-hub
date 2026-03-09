import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, FileText, Shield, Sparkles, Leaf, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import AICopilotQuickActions from "./AICopilotQuickActions";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type CopilotContext = "general" | "compliance" | "report_draft" | "carbon";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot`;

const contextOptions: { value: CopilotContext; label: string; icon: React.ReactNode }[] = [
  { value: "general", label: "General", icon: <Sparkles className="h-3 w-3" /> },
  { value: "compliance", label: "Compliance", icon: <Shield className="h-3 w-3" /> },
  { value: "report_draft", label: "Report Draft", icon: <FileText className="h-3 w-3" /> },
  { value: "carbon", label: "Carbon", icon: <Leaf className="h-3 w-3" /> },
];

export default function AICopilot({ projectData }: { projectData?: any }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<CopilotContext>("general");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load most recent conversation on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_conversations")
      .select("id, messages, context_type")
      .eq("user_id", user.id)
      .eq("context_type", context)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setConversationId(data[0].id);
          const saved = data[0].messages as any[];
          if (Array.isArray(saved) && saved.length > 0) {
            setMessages(saved.map((m: any) => ({ role: m.role, content: m.content })));
          }
        }
      });
  }, [user, context]);

  // Persist conversation to ai_conversations table
  const persistConversation = useCallback(async (msgs: Message[]) => {
    if (!user || msgs.length === 0) return;
    const payload = {
      user_id: user.id,
      context_type: context,
      context_id: projectData?.id || null,
      messages: msgs as any,
      title: msgs[0]?.content?.slice(0, 80) || "Untitled",
      updated_at: new Date().toISOString(),
    };

    if (conversationId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: msgs as any, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      const { data } = await supabase
        .from("ai_conversations")
        .insert([payload])
        .select("id")
        .single();
      if (data) setConversationId(data.id);
    }
  }, [user, context, conversationId, projectData]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          context,
          projectData,
        }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please top up in workspace settings.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Persist after full response
      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantSoFar }];
      setMessages(finalMessages);
      persistConversation(finalMessages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Copilot
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={newConversation} className="h-7 text-xs gap-1">
              <History className="h-3 w-3" />New
            </Button>
            {contextOptions.map(opt => (
              <Button
                key={opt.value}
                size="sm"
                variant={context === opt.value ? "default" : "outline"}
                onClick={() => setContext(opt.value)}
                className="h-7 text-xs gap-1"
              >
                {opt.icon}{opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden pb-3">
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {messages.length === 0 && (
              <div className="text-center py-6 text-muted-foreground space-y-4">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">How can I help?</p>
                <p className="text-sm mt-1">Ask about compliance gaps, draft reports, or get project insights.</p>
                <AICopilotQuickActions
                  onAction={(prompt, ctx) => {
                    setContext(ctx as CopilotContext);
                    setInput(prompt);
                    // Auto-send after a tick so context updates
                    setTimeout(() => {
                      const el = document.querySelector('[data-copilot-send]') as HTMLButtonElement;
                      el?.click();
                    }, 100);
                  }}
                  hasProjectData={!!projectData}
                  disabled={loading}
                />
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about compliance, SDGs, or draft a report..."
            className="min-h-[40px] max-h-[100px] resize-none"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
