interface Props {
  message?: string;
}

export default function LoadingState({ message }: Props) {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
