"use client";

import { useRef, useState } from "react";
import { Paperclip, Sparkles, X, ChevronDown } from "lucide-react";
import { uploadReference } from "@/utils/api";

export interface FormData {
  title: string;
  document_type: string;
  topic: string;
  style: string;
  additional_instructions: string;
  reference_content?: string;
}

interface Props {
  onGenerate: (data: FormData) => void;
  generating: boolean;
}

const DOCUMENT_TYPES = [
  "Business Report",
  "Technical Document",
  "Research Paper",
  "Project Proposal",
  "User Guide / Tutorial",
  "Business Plan",
  "White Paper",
  "Case Study",
  "Executive Summary",
  "Meeting Minutes",
  "Marketing Strategy",
  "Product Specification",
];

const STYLES = [
  "professional",
  "academic",
  "technical",
  "persuasive",
  "casual",
];

export default function DocumentForm({ onGenerate, generating }: Props) {
  const [form, setForm] = useState<FormData>({
    title: "",
    document_type: "Business Report",
    topic: "",
    style: "professional",
    additional_instructions: "",
  });

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceFile(file);
    setUploadError(null);
    setUploading(true);
    try {
      const text = await uploadReference(file);
      setForm((f) => ({ ...f, reference_content: text }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      setReferenceFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setReferenceFile(null);
    setUploadError(null);
    setForm((f) => ({ ...f, reference_content: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.topic.trim()) return;
    onGenerate(form);
  };

  const field =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-4"
    >
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Document Settings
      </h2>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Document Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Q3 Performance Analysis Report"
          className={field}
          required
        />
      </div>

      {/* Document type */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Document Type
        </label>
        <div className="relative">
          <select
            value={form.document_type}
            onChange={(e) =>
              setForm({ ...form, document_type: e.target.value })
            }
            className={`${field} appearance-none pr-8`}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Style pills */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Writing Style
        </label>
        <div className="flex gap-2 flex-wrap">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, style: s })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                form.style === s
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/40"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Topic / Description
        </label>
        <textarea
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          placeholder="Describe what the document should cover in detail. The more context you provide, the better the output."
          rows={5}
          className={`${field} resize-none`}
          required
        />
      </div>

      {/* Additional instructions */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Additional Instructions{" "}
          <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={form.additional_instructions}
          onChange={(e) =>
            setForm({ ...form, additional_instructions: e.target.value })
          }
          placeholder="e.g. Include a risk analysis section, use Chicago citation style…"
          rows={2}
          className={`${field} resize-none`}
        />
      </div>

      {/* Reference file upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">
          Reference Document{" "}
          <span className="text-slate-600">(optional — PDF, DOCX, TXT, MD)</span>
        </label>

        {!referenceFile ? (
          <label className="flex items-center gap-2 w-full cursor-pointer border border-dashed border-slate-600 hover:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span>{uploading ? "Uploading…" : "Click to attach a reference file"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.text"
              onChange={handleFileChange}
              disabled={uploading || generating}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="flex items-center justify-between gap-2 bg-indigo-950/40 border border-indigo-500/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="text-sm text-indigo-300 truncate">{referenceFile.name}</span>
              {form.reference_content && (
                <span className="text-xs text-slate-500 flex-shrink-0">
                  ({Math.round(form.reference_content.length / 1000)}k chars)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={removeFile}
              disabled={generating}
              className="text-slate-500 hover:text-slate-300 flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-400">{uploadError}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={generating || !form.title.trim() || !form.topic.trim()}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-indigo-900/30 disabled:shadow-none"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating document…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Document
          </>
        )}
      </button>
    </form>
  );
}
