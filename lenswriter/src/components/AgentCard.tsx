"use client";

import { useState } from "react";
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
  onUpdate: (id: string, updates: { name: string; persona: string }) => void;
  onImprove: (agentId: string) => void;
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
  locale,
  feedback,
  loading,
  error,
  improveLoading,
  hasActiveChanges,
  onUpdate,
  onImprove,
}: AgentCardProps) {
  const strings = t(locale);
  const displayName = strings.agentNames[agent.id] ?? agent.name;

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(agent.name);
  const [draftPersona, setDraftPersona] = useState(agent.persona);

  function handleEdit() {
    setDraftName(agent.name);
    setDraftPersona(agent.persona);
    setEditing(true);
  }

  function handleSave() {
    onUpdate(agent.id, {
      name: draftName.trim(),
      persona: draftPersona.trim(),
    });
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        {editing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
            autoFocus
          />
        ) : (
          <h3
            className="font-semibold text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
            onClick={handleEdit}
            title={locale === "fr" ? "Cliquez pour modifier" : "Click to edit"}
          >
            {displayName}
          </h3>
        )}
        {!editing && (
          <button
            onClick={handleEdit}
            className="ml-auto text-gray-600 hover:text-gray-400 transition-colors"
            title={locale === "fr" ? "Modifier l'agent" : "Edit agent"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        )}
      </div>

      {/* Edit mode */}
      {editing && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wide">
            Description / Persona
          </label>
          <textarea
            value={draftPersona}
            onChange={(e) => setDraftPersona(e.target.value)}
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 leading-relaxed resize-y focus:outline-none focus:border-gray-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {locale === "fr" ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={!draftName.trim() || !draftPersona.trim()}
              className="px-3 py-1.5 text-xs text-gray-950 bg-white rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {locale === "fr" ? "Enregistrer" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Feedback content (only when not editing) */}
      {!editing && (
        <>
          {loading && <SkeletonCard />}

          {error && (
            <p className="text-sm text-red-400">
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
                  {strings.perspective}
                </p>
                <p className="text-sm text-gray-300 italic">
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
            <p className="text-sm text-gray-600 italic">{strings.emptyState}</p>
          )}
        </>
      )}
    </div>
  );
}
