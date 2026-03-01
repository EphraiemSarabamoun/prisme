export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}
