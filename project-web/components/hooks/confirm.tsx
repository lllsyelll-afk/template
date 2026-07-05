import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";

export interface ConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface ConfirmationContextType {
  confirmation:
    | (ConfirmationOptions & {
        open: boolean;
        resolve?: (value: boolean) => void;
      })
    | null;
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
  hideConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [confirmation, setConfirmation] =
    useState<ConfirmationContextType["confirmation"]>(null);

  const showConfirmation = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmation({
          ...options,
          open: true,
          resolve,
        });
      });
    },
    [],
  );

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmation?.onConfirm) {
      await confirmation.onConfirm();
    }
    confirmation?.resolve?.(true);
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleCancel = useCallback(() => {
    confirmation?.onCancel?.();
    confirmation?.resolve?.(false);
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  return (
    <ConfirmationContext.Provider
      value={{ confirmation, showConfirmation, hideConfirmation }}
    >
      {children}
      {confirmation && (
        <ConfirmationDialog
          {...confirmation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onOpenChange={(open) => !open && hideConfirmation()}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

function ConfirmationDialog({
  open,
  onOpenChange,
  title = "Confirm",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={isLoading}>
            {confirmText}
          </Button>
          <Button
            className="bg-background text-foreground"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmationProvider");
  }
  return context.showConfirmation;
}
