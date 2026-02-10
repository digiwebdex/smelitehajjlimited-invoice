import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocalInstallment } from "./types";

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "bKash",
  "Nagad",
  "Others",
];

interface Props {
  inst: LocalInstallment;
  index: number;
  onUpdate: (field: keyof LocalInstallment, value: string | number) => void;
  onRemove: () => void;
}

export function PaymentCard({ inst, index, onUpdate, onRemove }: Props) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-green-700">
          Payment #{index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Amount</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ৳
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={inst.amount || ""}
              onChange={(e) => onUpdate("amount", parseFloat(e.target.value) || 0)}
              className="pl-7 text-right tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            value={inst.paid_date}
            onChange={(e) => onUpdate("paid_date", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Method</Label>
          <Select
            value={inst.payment_method || "Bank Transfer"}
            onValueChange={(value) => onUpdate("payment_method", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
