/**
 * Settings page — real API connected, persists to MongoDB.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/components/ui/toast";
import {
  Palette, Bell, Shield, Brain, Sun, Moon, Monitor,
  Check, Lock, Key, Save, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getSettings, updateSettings, resetSettings } from "@/services/settings-service";
import type { AppSettings } from "@/services/settings-service";

type Theme = "light" | "dark" | "system";

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: React.ElementType; label: string; desc: string }[] = [
    { value: "light", icon: Sun, label: "Light", desc: "Clean and bright interface" },
    { value: "dark", icon: Moon, label: "Dark", desc: "Easy on the eyes at night" },
    { value: "system", icon: Monitor, label: "System", desc: "Follows your OS preference" },
  ];
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Theme</h3>
      <p className="text-xs text-muted-foreground mb-4">Choose your preferred color scheme.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map(({ value, icon: Icon, label, desc }) => (
          <button key={value} onClick={() => setTheme(value)}
            className={cn("relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all",
              theme === value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-muted/30"
            )} aria-pressed={theme === value}>
            {theme === value && (
              <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <Icon className={cn("h-6 w-6", theme === value ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-xs font-semibold", theme === value ? "text-primary" : "text-foreground")}>{label}</p>
              <p className="text-2xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AISettings({ settings, onChange }: { settings: AppSettings; onChange: (k: keyof AppSettings, v: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">LLM Model</h3>
        <select value={settings.llm_model} onChange={(e) => onChange("llm_model", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="llama3-70b-8192">Llama3 70B (Groq)</option>
          <option value="llama3-8b-8192">Llama3 8B (Groq)</option>
          <option value="mixtral-8x7b-32768">Mixtral 8x7B (Groq)</option>
          <option value="gemma-7b-it">Gemma 7B (Groq)</option>
        </select>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <h3 className="text-sm font-semibold">Temperature</h3>
          <span className="text-xs text-muted-foreground">{settings.llm_temperature}</span>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={settings.llm_temperature}
          onChange={(e) => onChange("llm_temperature", parseFloat(e.target.value))}
          className="w-full accent-primary" />
        <div className="flex justify-between text-2xs text-muted-foreground mt-1">
          <span>Focused (0)</span><span>Creative (1)</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <h3 className="text-sm font-semibold">Top K Results</h3>
          <span className="text-xs text-muted-foreground">{settings.top_k}</span>
        </div>
        <input type="range" min="1" max="10" step="1" value={settings.top_k}
          onChange={(e) => onChange("top_k", parseInt(e.target.value))}
          className="w-full accent-primary" />
        <p className="text-2xs text-muted-foreground mt-1">Number of document chunks retrieved per query</p>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <h3 className="text-sm font-semibold">Similarity Threshold</h3>
          <span className="text-xs text-muted-foreground">{settings.similarity_threshold}</span>
        </div>
        <input type="range" min="0.3" max="0.99" step="0.05" value={settings.similarity_threshold}
          onChange={(e) => onChange("similarity_threshold", parseFloat(e.target.value))}
          className="w-full accent-primary" />
        <p className="text-2xs text-muted-foreground mt-1">Minimum similarity score for document retrieval</p>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const { success: toastSuccess } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          <Input type={showCurrent ? "text" : "password"} placeholder="Current password" leftAdornment={<Lock className="h-4 w-4" />}
            rightAdornment={<button type="button" onClick={() => setShowCurrent((p) => !p)} className="text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>} />
          <Input type="password" placeholder="New password" leftAdornment={<Key className="h-4 w-4" />} />
          <Input type="password" placeholder="Confirm new password" leftAdornment={<Key className="h-4 w-4" />} />
          <Button onClick={() => toastSuccess("Password updated")}>Update password</Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    getSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      toastSuccess("Settings saved", "Your preferences have been saved.");
    } catch {
      toastError("Save failed", "Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const defaults = await resetSettings();
      setSettings(defaults);
      toastSuccess("Settings reset", "Settings restored to defaults.");
    } catch {
      toastError("Reset failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">Settings</motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
          Manage your preferences and account settings.
        </motion.p>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="appearance">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance" className="gap-2"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2"><Brain className="h-3.5 w-3.5" />AI & RAG</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance">
            <Card><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize how Enterprise AI looks.</CardDescription></CardHeader>
              <CardContent><AppearanceSettings /></CardContent></Card>
          </TabsContent>
          <TabsContent value="ai">
            <Card><CardHeader><CardTitle>AI & RAG Settings</CardTitle><CardDescription>Configure the AI model and retrieval parameters. Saved to MongoDB.</CardDescription></CardHeader>
              <CardContent>
                {loading ? <p className="text-sm text-muted-foreground">Loading settings…</p> :
                  settings ? <AISettings settings={settings} onChange={handleChange} /> :
                  <p className="text-sm text-muted-foreground">Could not load settings. Are you logged in?</p>}
                {settings && (
                  <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Reset to defaults
                    </Button>
                    <Button onClick={handleSave} isLoading={saving}>
                      <Save className="h-4 w-4 mr-2" />Save settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
              <CardContent>
                {settings && (
                  <div className="space-y-4">
                    {[
                      { key: "notifications_email" as keyof AppSettings, label: "Email notifications", desc: "Security alerts and weekly digests" },
                      { key: "notifications_in_app" as keyof AppSettings, label: "In-app notifications", desc: "Real-time platform alerts" },
                      { key: "guardrails_enabled" as keyof AppSettings, label: "Guardrails enabled", desc: "Block prompt injection and PII leakage" },
                      { key: "pii_masking_enabled" as keyof AppSettings, label: "PII masking", desc: "Auto-redact personal data in AI responses" },
                    ].map(({ key, label, desc }) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <div onClick={() => handleChange(key, !settings[key])}
                          className={cn("relative flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
                            settings[key] ? "bg-primary" : "bg-muted-foreground/30")}>
                          <div className={cn("absolute h-4.5 w-4.5 rounded-full bg-white shadow transition-transform",
                            settings[key] ? "translate-x-5.5" : "translate-x-0.5")} />
                        </div>
                      </label>
                    ))}
                    <div className="mt-4 flex justify-end">
                      <Button onClick={handleSave} isLoading={saving}><Save className="h-4 w-4 mr-2" />Save preferences</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card><CardHeader><CardTitle>Security</CardTitle></CardHeader>
              <CardContent><SecuritySettings /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
