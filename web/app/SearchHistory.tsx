"use client";
import { useEffect, useState } from "react";

type Row = { id: number; query: string; created_at: string };

export default function SearchHistory({
  supabase,
  refreshKey,
  onSelect,
}: {
  supabase: any;
  refreshKey: number;
  onSelect: (q: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("search_history")
      .select("id, query, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => setRows(data || []));
  }, [supabase, refreshKey]);

  async function remove(id: number) {
    await supabase.from("search_history").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Recent searches</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No searches yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => onSelect(r.query)}
                className="truncate text-left text-slate-300 hover:text-white"
              >
                {r.query}
              </button>
              <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                {new Date(r.created_at).toLocaleString()}
                <button type="button" onClick={() => remove(r.id)} className="hover:text-red-400">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}