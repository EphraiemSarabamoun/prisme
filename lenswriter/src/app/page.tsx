"use client";

import { useState, useCallback } from "react";
import { defaultAgents, JSON_FORMAT_INSTRUCTION, Agent } from "@/lib/agents";
import AgentCard, { AgentFeedback } from "@/components/AgentCard";
import { Locale, t } from "@/lib/i18n";

type FeedbackState = Record<
  string,
  { data: AgentFeedback | null; loading: boolean; error: string | null }
>;

export default function Home() {
  const [text, setText] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const strings = t(locale);
  const [agents, setAgents] = useState<Agent[]>(() => defaultAgents);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(() =>
    Object.fromEntries(
      defaultAgents.map((a) => [
        a.id,
        { data: null, loading: false, error: null },
      ])
    )
  );

  const handleUpdateAgent = useCallback(
    (id: string, updates: { name: string; persona: string }) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const fetchFeedback = useCallback(async () => {
    if (!text.trim()) return;

    setFeedbackState((prev) =>
      Object.fromEntries(
        agents.map((a) => [
          a.id,
          { ...prev[a.id], loading: true, error: null },
        ])
      )
    );

    await Promise.allSettled(
      agents.map(async (agent) => {
        try {
          const systemPrompt =
            agent.persona + JSON_FORMAT_INSTRUCTION + strings.langSuffix;

          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, systemPrompt }),
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data: AgentFeedback = await res.json();

          setFeedbackState((prev) => ({
            ...prev,
            [agent.id]: { data, loading: false, error: null },
          }));
        } catch (err) {
          setFeedbackState((prev) => ({
            ...prev,
            [agent.id]: {
              data: prev[agent.id].data,
              loading: false,
              error: err instanceof Error ? err.message : "Unknown error",
            },
          }));
        }
      })
    );
  }, [text, agents, strings.langSuffix]);

  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">LensWriter</h1>
          <p className="text-xs text-gray-500">{strings.tagline}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 tabular-nums">
            {wordCount} {wordCount === 1 ? strings.word : strings.words}
          </span>
          <button
            onClick={() => setLocale((l) => (l === "en" ? "fr" : "en"))}
            className="px-3 py-2 border border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          <button
            onClick={fetchFeedback}
            disabled={!text.trim()}
            className="px-4 py-2 bg-white text-gray-950 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {strings.getPerspectives}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor pane */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={strings.placeholder}
            className="flex-1 w-full bg-transparent resize-none p-6 text-gray-200 placeholder:text-gray-700 text-base leading-relaxed focus:outline-none"
            spellCheck
          />
        </div>

        {/* Agent sidebar */}
        <aside className="w-96 shrink-0 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            {strings.perspectives}
          </h2>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              locale={locale}
              feedback={feedbackState[agent.id]?.data ?? null}
              loading={feedbackState[agent.id]?.loading ?? false}
              error={feedbackState[agent.id]?.error ?? null}
              onUpdate={handleUpdateAgent}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
