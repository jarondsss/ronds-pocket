import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface BookSummary {
  _id: Id<"books">;
  name: string;
  role: "owner" | "partner";
  created_at: number;
  memberCount: number;
  partnerCount: number;
}

interface BooksContextValue {
  books: BookSummary[];
  isLoading: boolean;
  activeBook: BookSummary | null;
  activeBookId: Id<"books"> | null;
  setActiveBookId: (id: Id<"books">) => void;
  isOwner: boolean;
}

const STORAGE_KEY = "bukukas.active-book";

const BooksContext = createContext<BooksContextValue | null>(null);

/**
 * Owns the list of books the user can see and which one is currently open.
 * Convex subscriptions keep the list live, so a newly joined book appears
 * without a refresh.
 */
export function BooksProvider({ children }: { children: ReactNode }) {
  const books = useQuery(api.books.listMine);
  const ensureDefault = useMutation(api.books.ensureDefault);
  const [storedId, setStoredId] = useState<Id<"books"> | null>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Id<"books"> | null) ?? null;
    } catch {
      return null;
    }
  });
  const requestedDefault = useRef(false);

  // A brand new account has no book yet — give it the default one.
  useEffect(() => {
    if (books === undefined) return;
    if (books.length > 0) {
      requestedDefault.current = false;
      return;
    }
    if (requestedDefault.current) return;
    requestedDefault.current = true;
    void ensureDefault().catch(() => {
      requestedDefault.current = false;
    });
  }, [books, ensureDefault]);

  const activeBookId = useMemo(() => {
    if (books === undefined || books.length === 0) return null;
    const stored = storedId ? books.find((b) => b._id === storedId) : undefined;
    return (stored ?? books[0])._id;
  }, [books, storedId]);

  const setActiveBookId = useCallback((id: Id<"books">) => {
    setStoredId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // storage unavailable (private mode) — in-memory selection still works
    }
  }, []);

  const value = useMemo<BooksContextValue>(() => {
    const list = books ?? [];
    const activeBook = list.find((b) => b._id === activeBookId) ?? null;
    return {
      books: list,
      isLoading: books === undefined,
      activeBook,
      activeBookId,
      setActiveBookId,
      isOwner: activeBook?.role === "owner",
    };
  }, [books, activeBookId, setActiveBookId]);

  return (
    <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
  );
}

export function useBooks(): BooksContextValue {
  const ctx = useContext(BooksContext);
  if (ctx === null) {
    throw new Error("useBooks harus dipakai di dalam <BooksProvider>.");
  }
  return ctx;
}
