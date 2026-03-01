"use client";

import { Agent } from "@/lib/agents";

export interface AgentFeedback {
  approval_score: number;
  key_disagreements: string[];
  perspective_summary: string;
}

interface AgentCardProps {
  agent: Agent;
  feedback: AgentFeedback | null;
  loading: boolean;
  error: string | null;
}

function ScoreBar({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const color =
    score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono font-bold text-gray-300 w-8 text-right">
        {score}/10
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="h-2 bg-gray-700 rounded-full animate-pulse-subtle" />
      <div className="h-4 bg-gray-800 rounded animate-pulse-subtle w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-800 rounded animate-pulse-subtle" />
        <div className="h-3 bg-gray-800 rounded animate-pulse-subtle w-5/6" />
      </div>
    </div>
  );
}

export default function AgentCard({
  agent,
  feedback,
  loading,
  error,
}: AgentCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        <h3 className="font-semibold text-sm text-gray-200">{agent.name}</h3>
      </div>

      {loading && <SkeletonCard />}

      {error && (
        <p className="text-sm text-red-400">Failed to get feedback: {error}</p>
      )}

      {feedback && !loading && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Approval
            </p>
            <ScoreBar score={feedback.approval_score} />
          </div>

          {feedback.key_disagreements.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Disagreements
              </p>
              <ul className="space-y-1">
                {feedback.key_disagreements.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-gray-600 mt-0.5 shrink-0">
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
              Perspective
            </p>
            <p className="text-sm text-gray-300 italic">
              &ldquo;{feedback.perspective_summary}&rdquo;
            </p>
          </div>
        </div>
      )}

      {!feedback && !loading && !error && (
        <p className="text-sm text-gray-600 italic">
          Write something and click &ldquo;Get Perspectives&rdquo; to see
          feedback.
        </p>
      )}
    </div>
  );
}
