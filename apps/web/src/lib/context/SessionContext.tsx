import { createContext, useContext, type ReactNode } from "react";

export interface Session {
  userId: string;
  email: string;
  plan: string;
  isAuthenticated: boolean;
}

/**
 * Phase 1 placeholder session. Real auth (PRD ACC-01: email / social /
 * passwordless) lands once Gate 0 clears; until then the app runs as this
 * mock user so the full shell is reachable. The API client has an injection
 * point reserved for the auth token (not sent in Phase 1).
 */
const MOCK_SESSION: Session = {
  userId: "mock-user-001",
  email: "researcher@aiphabee.dev",
  plan: "explorer",
  isAuthenticated: true,
};

const SessionContext = createContext<Session>(MOCK_SESSION);

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionContext.Provider value={MOCK_SESSION}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  return useContext(SessionContext);
}
