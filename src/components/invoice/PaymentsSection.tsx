import { Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "./PaymentCard";
import type { LocalInstallment } from "./types";

interface Props {
  installments: LocalInstallment[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof LocalInstallment, value: string | number) => void;
  onRemove: (id: string) => void;
}

export function PaymentsSection({ installments, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="card-elevated p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-accent" />
          Payments
        </h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {installments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No payments recorded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {installments.map((inst, idx) => (
            <PaymentCard
              key={inst.id}
              inst={inst}
              index={idx}
              onUpdate={(field, value) => onUpdate(inst.id, field, value)}
              onRemove={() => onRemove(inst.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
