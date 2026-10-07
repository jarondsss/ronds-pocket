import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function CategoryCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih kategori",
  maxLength = 40,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  maxLength?: number;
}) {
  const [custom, setCustom] = useState(false);
  const choices = [...new Set([...options, value].filter(Boolean))];

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={custom ? "custom" : value ? `category:${value}` : "none"}
        onValueChange={(next) => {
          setCustom(next === "custom");
          if (next !== "custom") {
            onChange(next === "none" ? "" : next.slice("category:".length));
          }
        }}
      >
        <SelectTrigger id={id} className="w-full data-[size=default]:h-11">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tanpa kategori</SelectItem>
          {choices.map((option) => (
            <SelectItem key={option} value={`category:${option}`}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value="custom">Tulis kategori baru</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <>
          <Label htmlFor={`${id}-custom`}>Nama kategori</Label>
          <Input
            id={`${id}-custom`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={maxLength}
            placeholder="Tulis nama kategori"
            autoComplete="off"
          />
        </>
      )}
    </div>
  );
}
