import { EASE } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Bell, Check, History } from "@/components/icons";
import { useNavigate } from "react-router";

function relativeLabel(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

interface NotificationInsightCardProps {
  bookId: Id<"books">;
}

export function NotificationInsightCard({ bookId }: NotificationInsightCardProps) {
  const navigate = useNavigate();
  const notifications = useQuery(
    api.books.notifications,
    bookId ? { bookId } : "skip"
  );
  const markRead = useMutation(api.books.markNotificationsRead);

  const unread = useMemo(
    () => (notifications ?? []).filter((n) => n.read_at === undefined).length,
    [notifications]
  );

  const latest = (notifications ?? [])[0];
  const recent = (notifications ?? []).slice(0, 3);

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg font-extrabold flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Kabar terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Belum ada kabar dari teman satu pocket.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => navigate("/dashboard/riwayat")}
          >
            <History className="size-4" />
            Lihat riwayat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg font-extrabold flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Kabar terbaru
          </CardTitle>
          {unread > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Check className="size-3" />
              {unread} belum dibaca
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {latest && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`flex items-start gap-3 rounded-xl p-3 ${
              latest.read_at === undefined ? "bg-primary/10" : "bg-card/80 border border-border/50"
            }`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-xs font-black text-primary">
              {latest.actor_name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                <span className="font-bold">{latest.actor_name}</span>{" "}
                <span className={latest.read_at === undefined ? "font-bold" : "text-muted-foreground"}>
                  {latest.message}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {latest.label}
                {latest.detail ? ` · ${latest.detail}` : ""}
                {" · "}
                {relativeLabel(latest.created_at)}
              </p>
            </div>
          </motion.div>
        )}

        {recent.length > 1 && (
          <div className="border-t border-border/50 pt-2 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {recent.length > 2 ? `3 terbaru` : `${recent.length} terbaru`}
            </p>
            {recent.slice(0, 3).map((item, idx) => (
              <div
                key={item._id}
                className="flex items-center gap-2 text-xs text-muted-foreground py-1"
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-bold">{item.actor_name}</span>{" "}
                  <span className="truncate">{item.message}</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {relativeLabel(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {unread > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs mt-1"
            onClick={() => {
              void markRead({ bookId }).catch(() => {});
            }}
          >
            <Check className="size-3.5" />
            Tandai semua sudah dibaca
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => navigate("/dashboard/riwayat")}
        >
          <History className="size-4" />
          Lihat semua di Riwayat
        </Button>
      </CardContent>
    </Card>
  );
}
