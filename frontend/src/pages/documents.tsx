/**
 * Documents page — real API with drag-drop upload, progress, search, filters.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Search, LayoutGrid, List, FileText, FileSpreadsheet, FileCode,
  MoreHorizontal, Trash2, Clock, Layers, CheckCircle2, AlertCircle,
  Loader2, X, Plus, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { listDocuments, uploadDocument, deleteDocument } from "@/services/documents-service";
import { formatFileSize, formatRelativeTime } from "@/utils/format";
import type { Document, DocumentStatus } from "@/types";
import { cn } from "@/utils/cn";

type ViewMode = "grid" | "list";

const DEPARTMENTS = ["general", "finance", "marketing", "hr", "engineering"];

const statusConfig: Record<DocumentStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: React.ElementType }> = {
  indexed: { label: "Indexed", variant: "success", icon: CheckCircle2 },
  processing: { label: "Processing", variant: "warning", icon: Loader2 },
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
  archived: { label: "Archived", variant: "secondary", icon: Layers },
};

const fileTypeIcons: Record<string, React.ElementType> = {
  pdf: FileText, xlsx: FileSpreadsheet, docx: FileText, txt: FileText, md: FileCode, csv: FileText,
};
const fileTypeColors: Record<string, string> = {
  pdf: "text-danger bg-danger/10", xlsx: "text-success bg-success/10",
  docx: "text-primary bg-primary/10", txt: "text-muted-foreground bg-muted",
  md: "text-accent-500 bg-accent/10", csv: "text-success bg-success/10",
};

interface UploadItem { file: File; department: string; title: string; progress: number; status: "pending" | "uploading" | "done" | "error"; error?: string; }

function UploadZone({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [dragging, setDragging] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [dept, setDept] = React.useState("general");
  const { success: toastSuccess, error: toastError } = useToast();

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const items: UploadItem[] = Array.from(files).map((f) => ({
      file: f, department: dept, title: f.name.replace(/\.[^.]+$/, ""), progress: 0, status: "pending",
    }));
    setUploads((prev) => [...prev, ...items]);
  };

  const processUploads = async () => {
    for (let i = 0; i < uploads.length; i++) {
      const item = uploads[i];
      if (item.status !== "pending") continue;
      setUploads((prev) => prev.map((u, idx) => idx === i ? { ...u, status: "uploading", progress: 30 } : u));
      try {
        await uploadDocument(item.file, item.department, item.title);
        setUploads((prev) => prev.map((u, idx) => idx === i ? { ...u, status: "done", progress: 100 } : u));
        toastSuccess("Uploaded", `${item.file.name} is being indexed.`);
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message ?? "Upload failed";
        setUploads((prev) => prev.map((u, idx) => idx === i ? { ...u, status: "error", progress: 0, error: msg } : u));
        toastError("Upload failed", msg);
      }
    }
    onSuccess();
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div
        className={cn("relative rounded-xl border-2 border-dashed p-8 text-center transition-all",
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
        <button onClick={onClose} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Drop files here or{" "}
              <label className="cursor-pointer text-primary hover:underline">
                browse<input type="file" className="sr-only" accept=".pdf,.docx,.txt,.md,.csv" multiple onChange={(e) => addFiles(e.target.files)} />
              </label>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, MD, CSV · up to 50 MB each</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Department:</span>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs capitalize">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.file.name}</p>
                {item.status === "uploading" && <Progress value={item.progress} className="mt-1 h-1" />}
                {item.status === "error" && <p className="text-2xs text-danger">{item.error}</p>}
              </div>
              <Badge variant={item.status === "done" ? "success" : item.status === "error" ? "destructive" : item.status === "uploading" ? "warning" : "secondary"} className="text-2xs shrink-0">
                {item.status}
              </Badge>
            </div>
          ))}
          <Button onClick={processUploads} disabled={uploads.every((u) => u.status !== "pending")} className="w-full">
            Upload {uploads.filter((u) => u.status === "pending").length} file(s)
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: () => void }) {
  const FileIcon = fileTypeIcons[doc.file_type] ?? FileText;
  const iconClass = fileTypeColors[doc.file_type] ?? "text-muted-foreground bg-muted";
  const status = statusConfig[doc.status];
  const StatusIcon = status.icon;
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <FileIcon className="h-5 w-5" />
        </div>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-40">
            <DropdownSeparator />
            <DropdownItem destructive className="gap-2" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1">{doc.title}</p>
        <p className="text-xs text-muted-foreground truncate">{doc.filename}</p>
        {(doc as any).department && <Badge variant="secondary" className="mt-2 text-2xs capitalize">{(doc as any).department}</Badge>}
      </div>
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn("h-3.5 w-3.5", status.variant === "success" ? "text-success" : status.variant === "warning" ? "text-warning animate-spin" : status.variant === "destructive" ? "text-danger" : "text-muted-foreground")} />
          <Badge variant={status.variant} className="text-2xs">{status.label}</Badge>
        </div>
        <div className="text-right">
          <p className="text-2xs text-muted-foreground">{formatFileSize(doc.file_size_bytes)}</p>
          <p className="text-2xs text-muted-foreground">{doc.chunk_count} chunks</p>
        </div>
      </div>
    </motion.div>
  );
}

const PAGE_SIZE = 12;

export default function DocumentsPage() {
  const [docs, setDocs] = React.useState<Document[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [showUpload, setShowUpload] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const debouncedSearch = useDebounce(search, 400);

  const fetchDocs = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listDocuments({
        page, page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        file_type: typeFilter !== "all" ? typeFilter : undefined,
      });
      setDocs(resp.data);
      setTotal(resp.total);
    } catch {
      toastError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  React.useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget);
      toastSuccess("Document deleted");
      fetchDocs();
    } catch (err: any) {
      toastError("Delete failed", err?.response?.data?.error?.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">Documents</motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">Manage and index your organization's knowledge base.</motion.p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocs}><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh</Button>
          <Button onClick={() => setShowUpload(!showUpload)} leftIcon={<Plus className="h-4 w-4" />}>Upload Document</Button>
        </div>
      </div>

      <AnimatePresence>{showUpload && <UploadZone onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchDocs(); }} />}</AnimatePresence>

      <div className="flex flex-wrap gap-3">
        {[{ label: "Total", value: total, filter: "all" }, { label: "Indexed", value: docs.filter((d) => d.status === "indexed").length, filter: "indexed" }, { label: "Processing", value: docs.filter((d) => d.status === "processing").length, filter: "processing" }, { label: "Failed", value: docs.filter((d) => d.status === "failed").length, filter: "failed" }].map((s) => (
          <button key={s.label} onClick={() => { setStatusFilter(s.filter); setPage(1); }}
            className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all", statusFilter === s.filter ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:border-primary/20 hover:bg-muted/30")}>
            <span className="font-semibold">{s.value}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex-1 max-w-sm">
            <Input type="search" placeholder="Search documents…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftAdornment={<Search className="h-4 w-4" />}
              rightAdornment={search && <button onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>} />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "pdf", "docx", "csv", "txt", "md"].map((type) => (
              <button key={type} onClick={() => { setTypeFilter(type); setPage(1); }}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all", typeFilter === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {type === "all" ? "All types" : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/50 shrink-0">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")} aria-label="Grid view"><LayoutGrid className="h-3.5 w-3.5" /></Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon-sm" onClick={() => setViewMode("list")} aria-label="List view"><List className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents found"
          description={debouncedSearch ? `No documents match "${debouncedSearch}".` : "Upload your first document to build the knowledge base."}
          action={{ label: "Upload document", onClick: () => setShowUpload(true) }} />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {docs.map((doc) => <DocumentCard key={doc.id} doc={doc} onDelete={() => setDeleteTarget(doc.id)} />)}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {docs.map((doc) => {
                const FileIcon = fileTypeIcons[doc.file_type] ?? FileText;
                const status = statusConfig[doc.status];
                return (
                  <div key={doc.id} className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/20 hover:bg-muted/30 transition-all">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", fileTypeColors[doc.file_type] ?? "text-muted-foreground bg-muted")}>
                      <FileIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="sm:col-span-2 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.filename}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="text-2xs">{status.label}</Badge>
                        {(doc as any).department && <Badge variant="secondary" className="text-2xs capitalize hidden md:inline-flex">{(doc as any).department}</Badge>}
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.file_size_bytes)}</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>{formatRelativeTime(doc.created_at)}</span>
                      </div>
                    </div>
                    <button onClick={() => setDeleteTarget(doc.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-danger hover:bg-muted transition-all shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete document" description="This document and all its indexed chunks will be permanently removed." confirmLabel="Delete document" variant="danger" onConfirm={handleDelete} />
    </div>
  );
}
