"use client";

import { Bot, ListOrdered, PenLine, PackageCheck } from "lucide-react";
import { type AgentEvent } from "@/utils/api";

interface Props {
  events: AgentEvent[];
  generating: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toolLabel(name: string): string {
  return name.replace(/_/g, " ");
}

function ToolBadge({ name }: { name: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    plan_document_outline: {
      icon: <ListOrdered className="w-3.5 h-3.5" />,
      cls: "text-blue-400 bg-blue-950/60 border-blue-800/50",
    },
    write_section: {
      icon: <PenLine className="w-3.5 h-3.5" />,
      cls: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
    },
    finalize_document: {
      icon: <PackageCheck className="w-3.5 h-3.5" />,
      cls: "text-amber-400 bg-amber-950/60 border-amber-800/50",
    },
  };
  const style = map[name] ?? {
    icon: <Bot className="w-3.5 h-3.5" />,
    cls: "text-slate-400 bg-slate-800 border-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${style.cls}`}
    >
      {style.icon}
      {toolLabel(name)}
    </span>
  );
}

// ── Event row ─────────────────────────────────────────────────────────────

function EventRow({ event }: { event: AgentEvent }) {
  if (event.type === "tool_call" && event.name) {
    const args = event.args as Record<string, unknown> | undefined;
    const subtitle =
      event.name === "write_section"
        ? (args?.heading as string) ?? ""
        : event.name === "plan_document_outline"
        ? `${(args?.sections as unknown[])?.length ?? 0} sections`
        : "";

    return (
      <div className="flex items-start gap-2 py-2">
        <ToolBadge name={event.name} />
        {subtitle && (
          <span className="text-xs text-slate-500 mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  if (event.type === "outline_planned") {
    const sections = event.sections as Array<{ id: string; heading: string }>;
    return (
      <ol className="ml-2 pl-3 border-l border-slate-700 space-y-0.5 pb-1">
        {sections?.map((s, i) => (
          <li key={s.id ?? i} className="text-xs text-slate-500">
            {i + 1}.&nbsp;{s.heading}
          </li>
        ))}
      </ol>
    );
  }

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AgentLog({ events, generating }: Props) {
  const visible = events.filter(
    (e) => e.type === "tool_call" || e.type === "outline_planned"
  );

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Agent Activity
        </h3>
        {generating && (
          <div className="ml-auto flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full pulse-dot"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event list */}
      <div className="max-h-72 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-xs text-slate-600 py-1">
            Waiting for agent to start…
          </p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {visible.map((event, i) => (
              <EventRow key={i} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
