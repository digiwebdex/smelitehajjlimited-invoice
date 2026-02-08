import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPickerField = ({ label, value, onChange }: ColorPickerFieldProps) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-md border-2 border-gray-200 cursor-pointer overflow-hidden flex-shrink-0"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm font-mono mt-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
