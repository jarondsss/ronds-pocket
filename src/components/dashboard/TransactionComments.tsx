import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatShortDate } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Trash2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

export function TransactionComments({
  transactionId,
  currentUserId,
}: {
  transactionId: Id<"transactions">;
  currentUserId: Id<"users">;
}) {
  const comments = useQuery(api.comments.list, { transactionId });
  const addComment = useMutation(api.comments.add);
  const removeComment = useMutation(api.comments.remove);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      await addComment({ transactionId, text });
      setText("");
      toast.success("Komentar ditambahkan.");
    } catch (error) {
      toastError(error, "Gagal menambahkan komentar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"transaction_comments">) => {
    try {
      await removeComment({ id });
      toast.success("Komentar dihapus.");
    } catch (error) {
      toastError(error, "Gagal menghapus komentar.");
    }
  };

  if (comments === undefined) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          Komentar {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {comments.length > 0 && (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId;
            return (
              <li
                key={comment._id}
                className="clay-sm flex flex-col gap-2 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {comment.authorAvatar && (
                      <span className="text-lg">{comment.authorAvatar}</span>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {comment.authorName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatShortDate(comment.created_at)}
                      </span>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(comment._id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Hapus komentar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{comment.text}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis komentar..."
          maxLength={500}
          disabled={submitting}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || submitting}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
