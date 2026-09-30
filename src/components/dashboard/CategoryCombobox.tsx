import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

/**
 * Kategori yang bisa diketik bebas ATAU dipilih dari daftar. Popupnya pakai
 * Popover, jadi ikut tema clay persis seperti dropdown Dompet — bukan datalist
 * gelap bawaan browser.
 */
export function CategoryCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih atau tulis kategori",
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
  const [open, setOpen] = useState(false);

  // Sedang menulis potongan kata? Saring daftarnya. Tapi kalau isinya persis
  // salah satu opsi (baru dipilih), tampilkan semua lagi.
  const query = value.trim().toLowerCase();
  const exact = options.some((option) => option.toLowerCase() === query);
  const visible =
    query && !exact
      ? options.filter((option) => option.toLowerCase().includes(query))
      : options;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative" data-combobox-field>
          <Input
            id={id}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pr-11"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Buka pilihan kategori"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronsUpDown className="size-4" />
            </button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-popover-trigger-width)] p-1.5"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            // Klik balik ke input tidak menutup daftar, biar lanjut ngetik.
            const target = event.target as HTMLElement;
            if (target.closest("[data-combobox-field]")) {
              event.preventDefault();
            }
          }}
        >
          {visible.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              Belum ada yang cocok — tulis kategori bebas, nanti tersimpan
              apa adanya.
            </p>
          ) : (
            <ul
              role="listbox"
              aria-label={label}
              className="flex max-h-56 flex-col gap-0.5 overflow-y-auto"
            >
              {visible.map((option) => {
                const active = option.toLowerCase() === query;
                return (
                  <li key={option} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option}</span>
                      {active && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
