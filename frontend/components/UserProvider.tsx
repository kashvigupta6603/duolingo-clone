"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface Ctx {
  user: User | null;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
}

const UserCtx = createContext<Ctx>({ user: null, setUser: () => {}, refresh: async () => {} });
export const useUser = () => useContext(UserCtx);

export default function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    try {
      setUser(await api<User>("/api/me"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <UserCtx.Provider value={{ user, setUser, refresh }}>{children}</UserCtx.Provider>;
}