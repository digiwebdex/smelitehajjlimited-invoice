import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineItemCard } from "./LineItemCard";
import type { LocalItem } from "./types";

interface Props {
  items: LocalItem[];
  errors: Record<string, string | undefined>;
  onAdd: () => void;
  onUpdate: (id: string, field: keyof LocalItem, value: string | number) => void;
  onRemove: (id: string) => void;
}

export function LineItemsSection({ items, errors, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="card-elevated p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-accent" />
          Line Items
        </h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <LineItemCard
            key={item.id}
            item={item}
            index={idx}
            canRemove={items.length > 1}
            fieldErrors={{
              title: errors[`items.${idx}.title`],
              qty: errors[`items.${idx}.qty`],
              unitPrice: errors[`items.${idx}.unitPrice`],
            }}
            onUpdate={(field, value) => onUpdate(item.id, field, value)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
