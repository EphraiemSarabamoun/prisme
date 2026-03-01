"use client";

import { useState, useCallback } from "react";
import { agents } from "@/lib/agents";
import AgentCard, { AgentFeedback } from "@/components/AgentCard";

type FeedbackState = Record<
  string,
  { data: AgentFeedback | null; loading: boolean; error: string | null }
>;

export default function Home() {
  const [text, setText] = useState("");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(() =>
    Object.fromEntries(
      agents.map((a) => [a.id, { data: null, loading: false, error: null }])
    )
  );

  const fetchFeedback = useCallback(async () => {
    if (!text.trim()) return;

    // Set all agents to loading
    setFeedbackState((prev) =>
      Object.fromEntries(
        agents.map((a) => [
          a.id,
          { ...prev[a.id], loading: true, error: null },
        ])
      )
    );

    // Fire parallel requests
    await Promise.allSettled(
      agents.map(async (agent) => {
        try {
          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              systemPrompt: agent.systemPrompt,
            }),
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
  }, [text]);

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
          <p className="text-xs text-gray-500">
            See your writing through every lens
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 tabular-nums">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <button
            onClick={fetchFeedback}
            disabled={!text.trim()}
            className="px-4 py-2 bg-white text-gray-950 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Get Perspectives
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
            placeholder="Start writing your article here..."
            className="flex-1 w-full bg-transparent resize-none p-6 text-gray-200 placeholder:text-gray-700 text-base leading-relaxed focus:outline-none"
            spellCheck
          />
        </div>

        {/* Agent sidebar */}
        <aside className="w-96 shrink-0 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            Perspectives
          </h2>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              feedback={feedbackState[agent.id]?.data ?? null}
              loading={feedbackState[agent.id]?.loading ?? false}
              error={feedbackState[agent.id]?.error ?? null}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
