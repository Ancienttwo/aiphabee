import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * "Novice" vs "pro" only changes how deep the *explanation* goes — never the
 * underlying data or evidence (PRD AGT-12). Surfaces read this to pick copy
 * depth; numbers and provenance stay identical across modes.
 */
export type ResponseDepth = "novice" | "pro";

interface ResponseDepthContextValue {
  depth: ResponseDepth;
  setDepth: (depth: ResponseDepth) => void;
  toggle: () => void;
}

const ResponseDepthContext = createContext<ResponseDepthContextValue | null>(
  null,
);

export function ResponseDepthProvider({ children }: { children: ReactNode }) {
  const [depth, setDepth] = useState<ResponseDepth>("novice");
  const value = useMemo<ResponseDepthContextValue>(
    () => ({
      depth,
      setDepth,
      toggle: () => setDepth((d) => (d === "novice" ? "pro" : "novice")),
    }),
    [depth],
  );
  return (
    <ResponseDepthContext.Provider value={value}>
      {children}
    </ResponseDepthContext.Provider>
  );
}

export function useResponseDepth(): ResponseDepthContextValue {
  const ctx = useContext(ResponseDepthContext);
  if (!ctx) {
    throw new Error(
      "useResponseDepth must be used within a ResponseDepthProvider",
    );
  }
  return ctx;
}
