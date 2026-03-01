"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Agent, defaultAgents } from "@/lib/agents";
import { Locale } from "@/lib/i18n";

interface AgentContextType {
  agents: Agent[];
  updateAgent: (id: string, updates: { name: string; persona: string }) => void;
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(() => defaultAgents);
  const [locale, setLocale] = useState<Locale>("en");

  const updateAgent = useCallback(
    (id: string, updates: { name: string; persona: string }) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  return (
    <AgentContext.Provider value={{ agents, updateAgent, locale, setLocale }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgents must be used within AgentProvider");
  return ctx;
}
