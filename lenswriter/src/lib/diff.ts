export type DiffOp = {
  type: "equal" | "insert" | "delete";
  text: string;
};

export function diffWords(oldText: string, newText: string): DiffOp[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  const n = oldTokens.length;
  const m = newTokens.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff ops
  const ops: DiffOp[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      ops.push({ type: "equal", text: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "insert", text: newTokens[j - 1] });
      j--;
    } else {
      ops.push({ type: "delete", text: oldTokens[i - 1] });
      i--;
    }
  }

  ops.reverse();

  // Merge consecutive ops of the same type
  const merged: DiffOp[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) {
      last.text += " " + op.text;
    } else {
      merged.push({ ...op });
    }
  }

  return merged;
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function applyInserts(ops: DiffOp[]): string {
  return ops
    .filter((op) => op.type !== "delete")
    .map((op) => op.text)
    .join(" ");
}
