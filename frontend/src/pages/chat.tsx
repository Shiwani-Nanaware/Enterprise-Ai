/**
 * AI Chat page — real API, guardrails, markdown, citations, conversation memory.
 */

import * as React from "react";
import {
  motion, AnimatePresence as _AnimatePresence,
} from "framer-motion";
import {
  Send, Bot, Copy, RotateCcw as _RotateCcw, ThumbsUp, ThumbsDown,
  Plus, MessageSquare, Sparkles, FileText, Check, X,
  Edit2, Trash2, Square, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { formatRelativeTime, formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Message, Conversation } from "@/types";

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// Simple markdown renderer for bold, code blocks, and lists
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono border border-border/50">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(<p key={i} className="font-semibold text-foreground mt-2">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} className="ml-4 list-disc text-sm leading-relaxed">{renderInline(line.slice(2))}</li>);
    } else if (line.match(/^\d+\./)) {
      elements.push(<li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{renderInline(line.replace(/^\d+\.\s*/, ""))}</li>);
    } else if (line === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

// Source citation card
function SourceCard({ source, index }: { source: NonNullable<Message["sources"]>[number]; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <button
      onClick={() => setExpanded((p) => !p)}
      className="w-full flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-left hover:bg-muted/70 transition-colors"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background border border-border text-xs font-bold text-muted-foreground">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground truncate">{source.document_title}</p>
          <Badge variant="secondary" className="text-2xs shrink-0">
            {Math.round(source.similarity_score * 100)}%
          </Badge>
        </div>
        <p className={cn("mt-0.5 text-xs text-muted-foreground leading-relaxed", expanded ? "" : "line-clamp-2")}>
          {source.content_preview}
        </p>
      </div>
      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
    </button>
  );
}

// Guardrail violation notice
function GuardrailNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}

// Message bubble
function MessageBubble({ message }: { message: Message }) {
  const { user } = useAuthStore();
  const { submitFeedback } = useChatStore();
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "user";
  const isGuardrail = message.role === "system";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isGuardrail) return <GuardrailNotice message={message.content} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("group flex items-end gap-3", isUser && "flex-row-reverse")}
    >
      <div className="shrink-0 mb-1">
        {isUser ? (
          <Avatar size="sm"><AvatarFallback>{user ? getInitials(user.full_name) : "U"}</AvatarFallback></Avatar>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>
      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground text-sm"
            : "rounded-bl-sm bg-muted text-foreground border border-border/50"
        )}>
          {isUser ? <p className="text-sm leading-relaxed">{message.content}</p> : <MarkdownContent content={message.content} />}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full space-y-1.5 pl-1">
            <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">Sources</p>
            {message.sources.map((src, i) => <SourceCard key={i} source={src} index={i} />)}
          </div>
        )}
        <div className={cn("flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", isUser && "flex-row-reverse")}>
          <p className="text-2xs text-muted-foreground/60 px-1">
            {formatRelativeTime(message.created_at)}
            {message.latency_ms && ` · ${(message.latency_ms / 1000).toFixed(1)}s`}
            {message.tokens_used > 0 && ` · ${message.tokens_used} tok`}
          </p>
          {!isUser && (
            <>
              <Tooltip content={copied ? "Copied!" : "Copy"}>
                <button onClick={handleCopy} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Copy">
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </Tooltip>
              <Tooltip content="Good response">
                <button onClick={() => submitFeedback(message.id, "positive")}
                  className={cn("flex h-6 w-6 items-center justify-center rounded transition-colors", message.feedback === "positive" ? "text-success" : "text-muted-foreground hover:text-success hover:bg-muted")}
                  aria-label="Good response">
                  <ThumbsUp className="h-3 w-3" />
                </button>
              </Tooltip>
              <Tooltip content="Bad response">
                <button onClick={() => submitFeedback(message.id, "negative")}
                  className={cn("flex h-6 w-6 items-center justify-center rounded transition-colors", message.feedback === "negative" ? "text-danger" : "text-muted-foreground hover:text-danger hover:bg-muted")}
                  aria-label="Bad response">
                  <ThumbsDown className="h-3 w-3" />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Conversation list item with rename
function ConversationItem({
  conversation, isActive, onSelect, onDelete, onRename,
}: {
  conversation: Conversation; isActive: boolean;
  onSelect: () => void; onDelete: () => void; onRename: (title: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(conversation.title);

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { onRename(title); setEditing(false); }
    if (e.key === "Escape") { setTitle(conversation.title); setEditing(false); }
  };

  return (
    <div className={cn("group relative rounded-lg transition-all", isActive ? "bg-primary/10" : "hover:bg-muted")}>
      {editing ? (
        <input
          autoFocus value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleRename}
          onBlur={() => { onRename(title); setEditing(false); }}
          className="w-full rounded-lg bg-background border border-primary/30 px-3 py-2 text-xs focus:outline-none"
        />
      ) : (
        <button onClick={onSelect} className="w-full px-3 py-2.5 text-left">
          <p className={cn("text-xs font-medium truncate", isActive ? "text-primary" : "text-foreground")}>{conversation.title}</p>
          <p className="text-2xs text-muted-foreground/70 mt-0.5">{formatRelativeTime(conversation.updated_at)}</p>
        </button>
      )}
      {!editing && (
        <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground">
            <Edit2 className="h-2.5 w-2.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-danger">
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Suggested prompts start screen
function SuggestedPrompts({ onSelect }: { onSelect: (p: string) => void }) {
  const { suggestedPrompts } = useChatStore();
  const [activeCategory, setActiveCategory] = React.useState(0);
  const current = suggestedPrompts[activeCategory];
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-glow mx-auto">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">How can I help you today?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ask about FinSolve documents, policies, or business topics.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {suggestedPrompts.map((cat, i) => (
            <button key={cat.category} onClick={() => setActiveCategory(i)}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeCategory === i ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
              )}>
              <span>{cat.icon}</span>{cat.category}
            </button>
          ))}
        </div>
        <div className="grid gap-2.5">
          {current?.prompts.map((prompt) => (
            <motion.button key={prompt} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(prompt)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm text-foreground hover:border-primary/30 hover:bg-primary/3 hover:text-primary transition-all">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Main Chat Page
export default function ChatPage() {
  const {
    conversations, activeConversationId, messages, isStreaming, error,
    setActiveConversation, loadConversations, sendMessage, deleteConversation,
    renameConversation, clearError, clearForUser,
  } = useChatStore();
  const { user } = useAuthStore();

  const [input, setInput] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Scope chat to the logged-in user and load their conversations
  React.useEffect(() => {
    if (user?.id) {
      clearForUser(user.id);
      loadConversations();
    }
  // user.id is stable after login — only re-run on user switch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-scroll
  React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMessages, isStreaming]);

  // Clear error after 5s
  React.useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 5000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [error]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="text-sm font-semibold text-foreground">Conversations</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setActiveConversation(null)} aria-label="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.filter((c) => c.status === "active").length > 0 && (
            <div>
              <p className="px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">Recent</p>
              {conversations.filter((c) => c.status === "active").map((conv) => (
                <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === activeConversationId}
                  onSelect={() => setActiveConversation(conv.id)}
                  onDelete={() => setDeleteTarget(conv.id)}
                  onRename={(t) => renameConversation(conv.id, t)} />
              ))}
            </div>
          )}
          {conversations.filter((c) => c.status === "archived").length > 0 && (
            <div className="mt-2">
              <p className="px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">Archived</p>
              {conversations.filter((c) => c.status === "archived").map((conv) => (
                <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === activeConversationId}
                  onSelect={() => setActiveConversation(conv.id)}
                  onDelete={() => setDeleteTarget(conv.id)}
                  onRename={(t) => renameConversation(conv.id, t)} />
              ))}
            </div>
          )}
        </div>
        {activeConversation && (
          <div className="shrink-0 border-t border-border p-3">
            <p className="text-2xs text-muted-foreground">Session tokens</p>
            <p className="text-sm font-semibold text-foreground">{formatNumber(activeConversation.total_tokens_used)}</p>
            <p className="text-2xs text-muted-foreground">Model: {activeConversation.model_used ?? "llama3-70b-8192"}</p>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{activeConversation?.title ?? "New Conversation"}</p>
              <p className="text-xs text-muted-foreground">Ask questions about FinSolve documents</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="success" dot className="text-xs hidden sm:flex">Groq Llama3</Badge>
            <Button variant="ghost" size="icon-sm" onClick={() => setActiveConversation(null)} aria-label="New chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-auto max-w-3xl px-4 pt-4">
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                <p className="text-sm text-danger flex-1">{error}</p>
                <button onClick={clearError} className="text-danger/60 hover:text-danger"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
          {activeMessages.length === 0 ? (
            <SuggestedPrompts onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {activeMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isStreaming && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-3 rounded-xl border border-border bg-background p-3 shadow-soft focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask about FinSolve documents… (Shift+Enter for new line)"
                className="flex-1 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 min-h-[24px] max-h-40"
                autoResize rows={1} aria-label="Chat input" />
              <Tooltip content={isStreaming ? "Stop" : "Send (Enter)"}>
                <Button size="icon-sm" onClick={handleSend} disabled={!input.trim() && !isStreaming} className="shrink-0" aria-label="Send">
                  {isStreaming ? <Square className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </Tooltip>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground/60">
              Responses are grounded in your uploaded documents. Always verify critical information.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete conversation"
        description="This conversation and all its messages will be permanently deleted."
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { if (deleteTarget) deleteConversation(deleteTarget); setDeleteTarget(null); }} />
    </div>
  );
}
