import { useOnlineStatus } from "@/lib/service-worker";
import { WifiOff } from "@/components/icons";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", ...EASE }}
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="clay-sm flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            <WifiOff className="size-4 text-destructive" />
            <span>Offline - Perubahan akan disimpan saat online</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
