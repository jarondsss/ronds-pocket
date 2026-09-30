import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SaveStatusValue {
  /** Jumlah penulisan yang sedang berjalan. */
  pending: number;
  /** Jalankan sebuah penulisan sambil melaporkan statusnya ke badge. */
  run: <Result>(work: () => Promise<Result>) => Promise<Result>;
}

const SaveStatusContext = createContext<SaveStatusValue | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);

  const run = useCallback(
    async <Result,>(work: () => Promise<Result>): Promise<Result> => {
      setPending((count) => count + 1);
      try {
        return await work();
      } finally {
        setPending((count) => Math.max(0, count - 1));
      }
    },
    [],
  );

  const value = useMemo<SaveStatusValue>(() => ({ pending, run }), [pending, run]);

  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus(): SaveStatusValue {
  const ctx = useContext(SaveStatusContext);
  if (ctx === null) {
    throw new Error(
      "useSaveStatus cuma bisa dipakai di dalam <SaveStatusProvider>.",
    );
  }
  return ctx;
}

/** Pintasan supaya halaman cukup memanggil `save(() => mutation({...}))`. */
export function useSaveTracker() {
  const { run } = useSaveStatus();
  return run;
}
