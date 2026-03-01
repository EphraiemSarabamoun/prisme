export default function ScoreBar({
  score,
  decimals = false,
}: {
  score: number;
  decimals?: boolean;
}) {
  const percentage = (score / 10) * 100;
  const color =
    score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
        {decimals ? score.toFixed(1) : score}/10
      </span>
    </div>
  );
}
