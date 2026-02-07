import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "./types";

interface Props {
  isNew: boolean;
  invoiceNumber: string;
  status: InvoiceStatus;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function InvoiceFormHeader({
  isNew,
  invoiceNumber,
  status,
  isSaving,
  onBack,
  onSave,
}: Props) {
  const statusStyles: Record<InvoiceStatus, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    unpaid: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {isNew ? "New Invoice" : invoiceNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew ? "Create a new invoice" : "Edit invoice details"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "px-3 py-1 text-xs font-semibold rounded-full capitalize",
            statusStyles[status]
          )}
        >
          {status}
        </span>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
