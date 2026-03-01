"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { JSON_FORMAT_INSTRUCTION } from "@/lib/agents";
import { useAgents } from "@/lib/AgentContext";
import { t } from "@/lib/i18n";
import ScoreBar from "@/components/ScoreBar";

interface Article {
  id: string;
  filename: string;
  content: string;
}

interface AgentResult {
  agentId: string;
  approval_score: number;
  key_disagreements: string[];
  perspective_summary: string;
}

interface ArticleResult {
  articleId: string;
  agentResults: AgentResult[];
}

interface Folder {
  id: string;
  name: string;
  articles: Article[];
  results: ArticleResult[];
}

export default function TunePage() {
  const { agents, locale, setLocale } = useAgents();
  const strings = t(locale);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  // --- Folder management ---

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const folder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      articles: [],
      results: [],
    };
    setFolders((prev) => [...prev, folder]);
    setSelectedFolderId(folder.id);
    setNewFolderName("");
    setCreatingFolder(false);
  }

  function handleDeleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
  }

  // --- Article management ---

  async function handleFileUpload(files: FileList | null) {
    if (!files || !selectedFolderId) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error("Upload failed:", await res.text());
          continue;
        }

        const { filename, content } = await res.json();

        const article: Article = {
          id: crypto.randomUUID(),
          filename,
          content,
        };

        setFolders((prev) =>
          prev.map((f) =>
            f.id === selectedFolderId
              ? { ...f, articles: [...f.articles, article], results: [] }
              : f
          )
        );
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDeleteArticle(articleId: string) {
    if (!selectedFolderId) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === selectedFolderId
          ? {
              ...f,
              articles: f.articles.filter((a) => a.id !== articleId),
              results: [],
            }
          : f
      )
    );
  }

  // --- Run test ---

  const handleRunTest = useCallback(async () => {
    if (!selectedFolder || selectedFolder.articles.length === 0) return;
    setIsRunning(true);

    const articleResults: ArticleResult[] = [];

    for (let i = 0; i < selectedFolder.articles.length; i++) {
      const article = selectedFolder.articles[i];
      setProgress(
        `${strings.evaluating} ${i + 1} ${strings.of} ${selectedFolder.articles.length}...`
      );

      const agentResults: AgentResult[] = [];

      const results = await Promise.allSettled(
        agents.map(async (agent) => {
          const systemPrompt =
            agent.persona + JSON_FORMAT_INSTRUCTION + strings.langSuffix;

          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: article.content,
              systemPrompt,
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return { agentId: agent.id, ...data } as AgentResult;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          agentResults.push(result.value);
        }
      }

      articleResults.push({ articleId: article.id, agentResults });
    }

    setFolders((prev) =>
      prev.map((f) =>
        f.id === selectedFolder.id ? { ...f, results: articleResults } : f
      )
    );

    setIsRunning(false);
    setProgress("");
  }, [selectedFolder, agents, strings]);

  // --- Score helpers ---

  function getAgentAvgScore(
    results: ArticleResult[],
    agentId: string
  ): number | null {
    const scores = results
      .flatMap((r) => r.agentResults)
      .filter((ar) => ar.agentId === agentId)
      .map((ar) => ar.approval_score);

    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  function getArticleAgentScore(
    results: ArticleResult[],
    articleId: string,
    agentId: string
  ): number | null {
    const ar = results
      .find((r) => r.articleId === articleId)
      ?.agentResults.find((a) => a.agentId === agentId);
    return ar?.approval_score ?? null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            &larr; {strings.backToEditor}
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {strings.tuneAgents}
            </h1>
          </div>
        </div>
        <button
          onClick={() => setLocale((l) => (l === "en" ? "fr" : "en"))}
          className="px-3 py-2 border border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          {locale === "en" ? "FR" : "EN"}
        </button>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Folder sidebar */}
        <div className="w-64 shrink-0 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {strings.folders}
            </h2>
            <button
              onClick={() => setCreatingFolder(true)}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
              title={strings.newFolder}
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {creatingFolder && (
              <div className="p-2">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  placeholder={strings.folderName}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
                  autoFocus
                />
              </div>
            )}

            {folders.length === 0 && !creatingFolder && (
              <p className="p-4 text-xs text-gray-600 italic">
                {strings.noFolders}
              </p>
            )}

            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3 py-2.5 cursor-pointer flex items-center justify-between group transition-colors ${
                  selectedFolderId === folder.id
                    ? "bg-gray-800/70 border-l-2 border-white"
                    : "hover:bg-gray-800/40 border-l-2 border-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {folder.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {folder.articles.length}{" "}
                    {folder.articles.length === 1
                      ? strings.articles.toLowerCase().slice(0, -1)
                      : strings.articles.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  {strings.deleteFolder}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Articles center panel */}
        <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0">
          {selectedFolder ? (
            <>
              {/* Folder header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-200">
                  {selectedFolder.name}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    {uploading ? "..." : strings.uploadArticle}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <button
                    onClick={handleRunTest}
                    disabled={
                      isRunning || selectedFolder.articles.length === 0
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-white text-gray-950 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRunning ? strings.running : strings.runTest}
                  </button>
                </div>
              </div>

              {/* Progress */}
              {progress && (
                <div className="px-4 py-2 bg-gray-800/50 text-xs text-gray-400 border-b border-gray-800">
                  {progress}
                </div>
              )}

              {/* Article list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedFolder.articles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-gray-600 italic">
                      {strings.noArticles}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 px-4 py-2 border border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
                    >
                      {strings.uploadHint}
                    </button>
                  </div>
                ) : (
                  selectedFolder.articles.map((article) => (
                    <div
                      key={article.id}
                      className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {article.filename}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {article.content.slice(0, 200)}
                            {article.content.length > 200 ? "..." : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="text-xs text-gray-600 hover:text-red-400 shrink-0 transition-colors"
                        >
                          {strings.deleteArticle}
                        </button>
                      </div>

                      {/* Per-article scores (inline) */}
                      {selectedFolder.results.length > 0 && (
                        <div className="mt-2 flex gap-3">
                          {agents.map((agent) => {
                            const score = getArticleAgentScore(
                              selectedFolder.results,
                              article.id,
                              agent.id
                            );
                            if (score === null) return null;
                            return (
                              <div
                                key={agent.id}
                                className="flex items-center gap-1.5"
                              >
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                  style={{
                                    backgroundColor: agent.color,
                                  }}
                                >
                                  {agent.avatar}
                                </div>
                                <span className="text-xs font-mono text-gray-400">
                                  {score}/10
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-600 italic">
                {folders.length === 0 ? strings.noFolders : strings.noArticles}
              </p>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {strings.results}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedFolder || selectedFolder.results.length === 0 ? (
              <p className="text-xs text-gray-600 italic">
                {strings.noResults}
              </p>
            ) : (
              agents.map((agent) => {
                const avg = getAgentAvgScore(
                  selectedFolder.results,
                  agent.id
                );
                if (avg === null) return null;
                const displayName =
                  strings.agentNames[agent.id] ?? agent.name;

                return (
                  <div
                    key={agent.id}
                    className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.avatar}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-gray-200 truncate">
                          {displayName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {strings.avgScore}
                        </p>
                      </div>
                    </div>
                    <ScoreBar score={avg} decimals />

                    {/* Per-article breakdown */}
                    <div className="space-y-1 pt-1">
                      {selectedFolder.articles.map((article) => {
                        const score = getArticleAgentScore(
                          selectedFolder.results,
                          article.id,
                          agent.id
                        );
                        if (score === null) return null;
                        return (
                          <div
                            key={article.id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-gray-500 truncate max-w-[60%]">
                              {article.filename}
                            </span>
                            <span className="text-xs font-mono text-gray-400">
                              {score}/10
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
