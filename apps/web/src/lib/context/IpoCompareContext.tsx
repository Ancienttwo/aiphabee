import { createContext, useContext, useState, type ReactNode } from "react";

/** Max securities comparable side-by-side (ANA-01 / prototype). */
export const IPO_COMPARE_MAX = 5;

interface IpoCompareState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

/**
 * Shared IPO compare selection. Lets the pipeline (row toggle) build a basket
 * that the `/ipos/compare` page consumes, so the selection survives navigation
 * between routes. Capped at `IPO_COMPARE_MAX`.
 */
const IpoCompareContext = createContext<IpoCompareState>({
  ids: [],
  toggle: () => {},
  clear: () => {},
  has: () => false,
});

export function IpoCompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setIds((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= IPO_COMPARE_MAX
          ? cur
          : [...cur, id],
    );
  const clear = () => setIds([]);
  const has = (id: string) => ids.includes(id);
  return (
    <IpoCompareContext.Provider value={{ ids, toggle, clear, has }}>
      {children}
    </IpoCompareContext.Provider>
  );
}

export function useIpoCompare(): IpoCompareState {
  return useContext(IpoCompareContext);
}
