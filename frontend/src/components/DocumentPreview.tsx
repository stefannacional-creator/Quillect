"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Download, Copy, Check } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { downloadAsPdf } from "@/utils/api";

interface Props {
  document: string;
  generating: boolean;
  title?: string;
}

export default function DocumentPreview({ document, generating, title = "document" }: Props) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(document);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadAsPdf(document, title);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!document && !generating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center bg-slate-800/20 border border-dashed border-slate-700/50 rounded-xl gap-3">
        <div className="p-5 bg-slate-800/60 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-600" />
        </div>
        <div>
          <p className="text-slate-400 font-medium">No document yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Fill in the form and click&nbsp;
            <span className="text-indigo-400">Generate Document</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-slate-300">
            Document Preview
          </span>
          {generating && (
            <span className="text-xs text-indigo-400 animate-pulse ml-1">
              • Writing…
            </span>
          )}
        </div>

        {document && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-500 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                  Building PDF…
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {generating && !document ? (
          <div className="flex items-center justify-center h-40">
            <LoadingState message="Agent is writing your document…" />
          </div>
        ) : (
          <article
            className={`
              prose prose-invert prose-slate max-w-none
              prose-headings:text-slate-100 prose-headings:font-semibold
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300
              prose-strong:text-slate-100 prose-strong:font-semibold
              prose-em:text-slate-300
              prose-blockquote:border-l-indigo-500 prose-blockquote:border-l-4
              prose-blockquote:bg-indigo-950/30 prose-blockquote:px-4 prose-blockquote:py-1
              prose-blockquote:text-slate-300 prose-blockquote:not-italic prose-blockquote:rounded-r-lg
              prose-code:text-indigo-300 prose-code:bg-slate-900/70 prose-code:px-1 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700/50
              prose-hr:border-slate-700/50
              prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
              prose-table:text-slate-300 prose-thead:text-slate-200
            `}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {document}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
