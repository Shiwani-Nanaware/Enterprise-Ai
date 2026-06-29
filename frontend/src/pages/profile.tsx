/**
 * Profile page — user profile, stats, and account management.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import {
  Mail, Building2, Briefcase, Edit3, Camera,
  MessageSquare, FileText, Zap, TrendingUp, Save,
} from "lucide-react";

const activityStats = [
  { label: "Conversations", value: "247", icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
  { label: "Documents read", value: "89", icon: FileText, color: "text-accent-500", bg: "bg-accent/10" },
  { label: "Tokens used", value: "182k", icon: Zap, color: "text-warning", bg: "bg-warning/10" },
  { label: "Avg response", value: "1.9s", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
];

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { success: toastSuccess } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: user?.full_name ?? "",
    department: user?.department ?? "",
    job_title: user?.job_title ?? "",
  });

  if (!user) return null;

  const handleSave = () => {
    setUser({ ...user, ...formData });
    setIsEditing(false);
    toastSuccess("Profile updated", "Your profile has been saved successfully.");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">
          Profile
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
          Your personal information and activity overview.
        </motion.p>
      </div>

      {/* Profile hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar size="xl">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <button
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted hover:bg-muted-foreground/10 transition-colors"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    <Badge variant="default" className="capitalize text-xs">{user.role.replace("_", " ")}</Badge>
                    <Badge variant={user.is_active ? "success" : "destructive"} className="text-xs">
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {user.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                {user.job_title && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {user.job_title} {user.department && `· ${user.department}`}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Member since {formatDateTime(user.created_at)}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Edit profile
              </Button>
            </div>

            {/* Activity stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {activityStats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2 rounded-xl border border-border p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} aria-hidden="true" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground text-center">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Account Details</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full name</label>
                    <Input
                      value={isEditing ? formData.full_name : user.full_name}
                      onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                      readOnly={!isEditing}
                      leftAdornment={<Edit3 className="h-4 w-4" aria-hidden="true" />}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email address</label>
                    <Input value={user.email} readOnly leftAdornment={<Mail className="h-4 w-4" aria-hidden="true" />} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Department</label>
                    <Input
                      value={isEditing ? formData.department : (user.department ?? "")}
                      onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                      readOnly={!isEditing}
                      placeholder="Not specified"
                      leftAdornment={<Building2 className="h-4 w-4" aria-hidden="true" />}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Job title</label>
                    <Input
                      value={isEditing ? formData.job_title : (user.job_title ?? "")}
                      onChange={(e) => setFormData((p) => ({ ...p, job_title: e.target.value }))}
                      readOnly={!isEditing}
                      placeholder="Not specified"
                      leftAdornment={<Briefcase className="h-4 w-4" aria-hidden="true" />}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>Save changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="activity">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent actions on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Started conversation", detail: "Q2 Financial Risk Analysis", time: "2024-06-21T09:15:00Z", type: "chat" },
                    { action: "Viewed document", detail: "Employee Handbook 2024.docx", time: "2024-06-20T14:30:00Z", type: "doc" },
                    { action: "Started conversation", detail: "Product Roadmap Q3 Priorities", time: "2024-06-19T11:00:00Z", type: "chat" },
                    { action: "Updated profile", detail: "Changed job title", time: "2024-06-18T09:00:00Z", type: "profile" },
                    { action: "Started conversation", detail: "Security Audit Requirements", time: "2024-06-15T10:00:00Z", type: "chat" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.type === "chat" ? "bg-primary/10" : item.type === "doc" ? "bg-accent/10" : "bg-muted"}`}>
                        {item.type === "chat"
                          ? <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          : item.type === "doc"
                          ? <FileText className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
                          : <Edit3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <p className="text-2xs text-muted-foreground/60 shrink-0">{formatRelativeTime(item.time)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
