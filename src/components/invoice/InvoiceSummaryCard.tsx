import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./types";

interface Props {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  onVatRateChange: (rate: number) => void;
}

export function InvoiceSummaryCard({
  subtotal,
  vatRate,
  vatAmount,
  totalAmount,
  paidAmount,
  dueAmount,
  onVatRateChange,
}: Props) {
  return (
    <div className="card-elevated p-5 space-y-4 lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold text-foreground">Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums text-black">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="vatRate" className="text-muted-foreground">
            VAT %
          </Label>
          <Input
            id="vatRate"
            type="number"
            inputMode="decimal"
            value={vatRate || ""}
            onChange={(e) => onVatRateChange(parseFloat(e.target.value) || 0)}
            className="w-16 h-8 text-sm text-right tabular-nums"
            placeholder="0"
            min={0}
            max={100}
          />
          <span className="ml-auto font-medium tabular-nums text-black">
            {formatCurrency(vatAmount)}
          </span>
        </div>

        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-black">Total</span>
          <span className="font-bold text-lg tabular-nums text-black">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-success">
          <span>Paid</span>
          <span className="font-semibold tabular-nums">{formatCurrency(paidAmount)}</span>
        </div>

        <div
          className={cn(
            "flex justify-between p-3 rounded-lg font-semibold",
            dueAmount > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          )}
        >
          <span>{dueAmount > 0 ? "Due" : "Fully Paid"}</span>
          <span className="tabular-nums">{formatCurrency(dueAmount)}</span>
        </div>
      </div>
    </div>
  );
}
