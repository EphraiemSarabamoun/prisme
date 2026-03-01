"use client";

import { useEffect } from "react";
import { useAgents } from "@/lib/AgentContext";

export default function ThemeSync() {
  const { theme } = useAgents();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
