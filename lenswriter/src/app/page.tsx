"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { JSON_FORMAT_INSTRUCTION } from "@/lib/agents";
import { useAgents } from "@/lib/AgentContext";
import AgentCard, { AgentFeedback } from "@/components/AgentCard";
import RichEditor from "@/components/RichEditor";
import DiffView from "@/components/DiffView";
import { diffWords } from "@/lib/diff";
import { stripHtml } from "@/lib/stripHtml";
import { t } from "@/lib/i18n";
import { useLocalStorage } from "@/lib/useLocalStorage";

type FeedbackState = Record<
  string,
  { data: AgentFeedback | null; loading: boolean; error: string | null }
>;

interface PendingChanges {
  agentId: string;
  agentColor: string;
  agentName: string;
  revisedText: string;
}

function collectTextExcluding(node: Node, excludeDiffType: string): string {
  let result = "";
  for (const child of Array.from(node.childNodes)) {
    if (child instanceof HTMLElement) {
      if (child.dataset.diff === excludeDiffType) continue;
      result += collectTextExcluding(child, excludeDiffType);
    } else if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent ?? "";
    }
  }
  return result;
}

export default function Home() {
  const { agents, locale, setLocale, theme, setTheme } = useAgents();
  const strings = t(locale);
  const [htmlContent, setHtmlContent] = useLocalStorage("lw:editorHtml", "");
  const plainText = useMemo(() => stripHtml(htmlContent), [htmlContent]);

  const [feedbackState, setFeedbackState] = useState<FeedbackState>(() =>
    Object.fromEntries(
      agents.map((a) => [
        a.id,
        { data: null, loading: false, error: null },
      ])
    )
  );
  const [pendingChanges, setPendingChanges] = useState<PendingChanges | null>(
    null
  );
  const [improveLoadingId, setImproveLoadingId] = useState<string | null>(null);
  const diffRef = useRef<HTMLDivElement>(null);

  const diffOps = useMemo(() => {
    if (!pendingChanges) return null;
    return diffWords(plainText, pendingChanges.revisedText);
  }, [plainText, pendingChanges]);

  const fetchFeedback = useCallback(async () => {
    if (!plainText.trim()) return;

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
            body: JSON.stringify({ text: plainText, systemPrompt }),
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
  }, [plainText, agents, strings.langSuffix]);

  const handleImprove = useCallback(
    async (agentId: string) => {
      const agent = agents.find((a) => a.id === agentId);
      const feedback = feedbackState[agentId]?.data;
      if (!agent || !feedback || !plainText.trim()) return;

      setImproveLoadingId(agentId);

      try {
        const res = await fetch("/api/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: plainText,
            persona: agent.persona,
            feedback,
            lang: locale,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const displayName = strings.agentNames[agent.id] ?? agent.name;

        setPendingChanges({
          agentId: agent.id,
          agentColor: agent.color,
          agentName: displayName,
          revisedText: data.revisedText,
        });
      } catch (err) {
        console.error("Improve error:", err);
      } finally {
        setImproveLoadingId(null);
      }
    },
    [agents, feedbackState, plainText, locale, strings.agentNames]
  );

  function handleAcceptChanges() {
    if (!pendingChanges) return;
    const edited = diffRef.current?.innerText ?? "";
    setHtmlContent(`<p>${edited.trim()}</p>`);
    setPendingChanges(null);
  }

  function handleRejectChanges() {
    if (diffRef.current) {
      const result = collectTextExcluding(diffRef.current, "insert");
      setHtmlContent(`<p>${result.trim()}</p>`);
    }
    setPendingChanges(null);
  }

  const wordCount = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">LensWriter</h1>
          <p className="text-xs text-gray-500">
            {strings.tagline}
            <span className="mx-1.5 text-gray-300 dark:text-gray-700">|</span>
            <span className="text-orange-500 font-medium">Powered by Mistral</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 tabular-nums">
            {wordCount} {wordCount === 1 ? strings.word : strings.words}
          </span>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          <button
            onClick={() => setLocale((l) => (l === "en" ? "fr" : "en"))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          <Link
            href="/tune"
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {strings.tuneAgents}
          </Link>
          <button
            onClick={fetchFeedback}
            disabled={!plainText.trim() || !!pendingChanges}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {strings.getPerspectives}
          </button>
        </div>
      </header>

      {/* Review banner */}
      {pendingChanges && (
        <div
          className="px-6 py-2.5 flex items-center justify-between shrink-0 border-b"
          style={{
            backgroundColor: pendingChanges.agentColor + "15",
            borderColor: pendingChanges.agentColor + "40",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pendingChanges.agentColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {strings.reviewingChanges}{" "}
              <strong style={{ color: pendingChanges.agentColor }}>
                {pendingChanges.agentName}
              </strong>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectChanges}
              className="px-3 py-1.5 text-xs font-medium border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {strings.rejectAll}
            </button>
            <button
              onClick={handleAcceptChanges}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-white"
              style={{ backgroundColor: pendingChanges.agentColor }}
            >
              {strings.acceptAll}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor pane */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-800">
          {pendingChanges && diffOps ? (
            <DiffView
              ref={diffRef}
              ops={diffOps}
              agentColor={pendingChanges.agentColor}
            />
          ) : (
            <RichEditor
              content={htmlContent}
              onUpdate={setHtmlContent}
              placeholder={strings.placeholder}
            />
          )}
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
              improveLoading={improveLoadingId === agent.id}
              hasActiveChanges={!!pendingChanges}
              onImprove={handleImprove}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
