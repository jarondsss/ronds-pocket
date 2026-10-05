import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRupiah } from "@/lib/format";
import { useQuery } from "convex/react";
import { ArrowRight } from "@/components/icons";

export function SplitBalance({ bookId }: { bookId: Id<"books"> }) {
  const balance = useQuery(api.splits.getBalance, { bookId });

  if (!balance) {
    return null; // Tidak ada partner atau tidak ada data split
  }

  const { partnerName, partnerAvatar, netBalance } = balance;

  if (netBalance === 0) {
    return null; // Sudah lunas, tidak perlu tampilkan
  }

  const isDebt = netBalance > 0;
  const amount = Math.abs(netBalance);

  return (
    <div className="clay-sm rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {partnerAvatar && <span className="text-2xl">{partnerAvatar}</span>}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {isDebt ? "Kamu harus bayar" : "Kamu punya piutang"}
            </span>
            <span className="text-sm font-bold">
              {isDebt ? "ke" : "dari"} {partnerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-bold ${isDebt ? "text-destructive" : "text-green-600"}`}
          >
            {formatRupiah(amount)}
          </span>
          {/* Future: Add settle up button here */}
        </div>
      </div>
    </div>
  );
}
