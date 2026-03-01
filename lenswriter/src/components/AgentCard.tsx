"use client";

import { Agent } from "@/lib/agents";
import { Locale, t } from "@/lib/i18n";
import ScoreBar from "@/components/ScoreBar";

export interface AgentFeedback {
  approval_score: number;
  key_disagreements: string[];
  perspective_summary: string;
}

interface AgentCardProps {
  agent: Agent;
  locale: Locale;
  feedback: AgentFeedback | null;
  loading: boolean;
  error: string | null;
  improveLoading: boolean;
  hasActiveChanges: boolean;
  onImprove: (agentId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse-subtle" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle w-5/6" />
      </div>
    </div>
  );
}

export default function AgentCard({
  agent,
  locale,
  feedback,
  loading,
  error,
  improveLoading,
  hasActiveChanges,
  onImprove,
}: AgentCardProps) {
  const strings = t(locale);
  const displayName = strings.agentNames[agent.id] ?? agent.name;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {displayName}
        </h3>
      </div>

      {loading && <SkeletonCard />}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {strings.feedbackError} {error}
        </p>
      )}

      {feedback && !loading && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {strings.approval}
            </p>
            <ScoreBar score={feedback.approval_score} />
          </div>

          {feedback.key_disagreements.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {strings.disagreements}
              </p>
              <ul className="space-y-1">
                {feedback.key_disagreements.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-gray-400 dark:text-gray-600 mt-0.5 shrink-0">
                      &bull;
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {strings.perspective}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              &ldquo;{feedback.perspective_summary}&rdquo;
            </p>
          </div>

          {/* Suggest edits button */}
          <button
            onClick={() => onImprove(agent.id)}
            disabled={improveLoading || hasActiveChanges}
            className="w-full mt-1 px-3 py-2 text-xs font-medium border rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderColor: agent.color + "60",
              color: agent.color,
            }}
          >
            {improveLoading
              ? locale === "fr"
                ? "Chargement..."
                : "Loading..."
              : strings.suggestEdits}
          </button>
        </div>
      )}

      {!feedback && !loading && !error && (
        <p className="text-sm text-gray-400 dark:text-gray-600 italic">{strings.emptyState}</p>
      )}
    </div>
  );
}
