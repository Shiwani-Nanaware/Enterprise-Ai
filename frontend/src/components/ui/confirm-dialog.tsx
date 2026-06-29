/**
 * ConfirmDialog component — dangerous action confirmation with customizable variant.
 */

import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "./modal";
import { Button } from "./button";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const iconConfig = {
    danger: { icon: Trash2, bg: "bg-danger/10", color: "text-danger" },
    warning: { icon: AlertTriangle, bg: "bg-warning/10", color: "text-warning" },
    default: { icon: AlertTriangle, bg: "bg-muted", color: "text-muted-foreground" },
  };

  const { icon: Icon, bg, color } = iconConfig[variant];

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" showClose={false}>
        <ModalHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", color)} aria-hidden="true" />
            </div>
            <div>
              <ModalTitle>{title}</ModalTitle>
              <ModalDescription className="mt-1">{description}</ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
