"use client";

import { DiffOp } from "@/lib/diff";

interface DiffViewProps {
  ops: DiffOp[];
  agentColor: string;
}

export default function DiffView({ ops, agentColor }: DiffViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 text-base leading-relaxed">
      {ops.map((op, i) => {
        if (op.type === "equal") {
          return (
            <span key={i} className="text-gray-200">
              {op.text}{" "}
            </span>
          );
        }
        if (op.type === "delete") {
          return (
            <span
              key={i}
              className="line-through opacity-50 text-gray-400"
            >
              {op.text}{" "}
            </span>
          );
        }
        // insert
        return (
          <span
            key={i}
            className="rounded px-0.5"
            style={{
              backgroundColor: agentColor + "30",
              borderBottom: `2px solid ${agentColor}`,
              color: "#fff",
            }}
          >
            {op.text}{" "}
          </span>
        );
      })}
    </div>
  );
}
