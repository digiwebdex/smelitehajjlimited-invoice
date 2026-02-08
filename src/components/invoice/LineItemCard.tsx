import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency, type LocalItem } from "./types";

interface Props {
  item: LocalItem;
  index: number;
  canRemove: boolean;
  error?: string;
  onUpdate: (field: keyof LocalItem, value: string | number) => void;
  onRemove: () => void;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

function normalizeNumericInput(raw: string): string {
  return raw
    .trim()
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/[,\s৳]/g, "");
}

export function LineItemCard({
  item,
  index,
  canRemove,
  error,
  onUpdate,
  onRemove,
}: Props) {
  // Local string state allows free typing; synced from props and committed on blur
  const [qtyStr, setQtyStr] = useState(String(item.qty));
  const [priceStr, setPriceStr] = useState(String(item.unitPrice));

  // Sync local state when props change from outside (e.g., loading existing invoice)
  useEffect(() => {
    setQtyStr(String(item.qty));
  }, [item.qty]);

  useEffect(() => {
    setPriceStr(String(item.unitPrice));
  }, [item.unitPrice]);

  const commitQty = useCallback(() => {
    const normalized = normalizeNumericInput(qtyStr);
    const val = parseInt(normalized, 10) || 0;
    const finalVal = val < 1 ? 1 : val;
    onUpdate("qty", finalVal);
    setQtyStr(String(finalVal));
  }, [qtyStr, onUpdate]);

  const commitPrice = useCallback(() => {
    const normalized = normalizeNumericInput(priceStr);
    const val = parseFloat(normalized) || 0;
    const finalVal = val < 0 ? 0 : val;
    onUpdate("unitPrice", finalVal);
    setPriceStr(String(finalVal));
  }, [priceStr, onUpdate]);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      {/* Row 1: index + description */}
      <div className="flex items-start gap-3">
        <span className="mt-2.5 shrink-0 w-6 text-sm font-medium text-muted-foreground">
          {index + 1}.
        </span>
        <div className="flex-1 space-y-1">
          <Label className="sr-only">Description</Label>
          <Input
            value={item.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="Item description"
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Row 2: qty, unit price, total */}
      <div className="grid grid-cols-3 gap-3 pl-9">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9০-৯]*"
            value={qtyStr}
            onChange={(e) => setQtyStr(e.target.value)}
            onBlur={commitQty}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitQty();
              }
            }}
            className="text-right tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Unit Price</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ৳
            </span>
            <Input
              type="text"
              inputMode="decimal"
              pattern="[0-9০-৯]*\.?[0-9০-৯]*"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitPrice();
                }
              }}
              className="pl-7 text-right tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Total</Label>
          <div className="h-10 flex items-center justify-end pr-2 font-semibold tabular-nums text-foreground">
            {formatCurrency(item.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}
