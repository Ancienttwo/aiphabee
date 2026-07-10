import { createContext, useContext, useMemo, type ReactNode } from "react";
import { authClient } from "../auth-client";

export interface Session {
  userId?: string;
  email?: string;
  name?: string;
  isAuthenticated: boolean;
  isPending: boolean;
}

interface BetterAuthSessionUser {
  email: string;
  id: string;
  name: string;
}

const ANONYMOUS_SESSION: Session = {
  isAuthenticated: false,
  isPending: false,
};

const SessionContext = createContext<Session>(ANONYMOUS_SESSION);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const value = useMemo(
    () => toSessionState(data?.user, isPending),
    [data?.user, isPending],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  return useContext(SessionContext);
}

export function toSessionState(
  user: BetterAuthSessionUser | null | undefined,
  isPending: boolean,
): Session {
  if (!user) {
    return {
      isAuthenticated: false,
      isPending,
    };
  }

  return {
    email: user.email,
    isAuthenticated: true,
    isPending,
    name: user.name,
    userId: user.id,
  };
}
