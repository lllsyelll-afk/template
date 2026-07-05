import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
interface ConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}
export default function Confirmation({
  open,
  onOpenChange,
  title = "Confirm",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };
  const handleConfirm = () => {
    onConfirm();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-5/6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={isLoading}>
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
