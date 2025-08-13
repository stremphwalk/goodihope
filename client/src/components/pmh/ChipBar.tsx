import React from "react";
import { PMH_CHIPS } from "@/lib/pmh/dictionary";
export function ChipBar({ onInsert }: { onInsert:(label:string)=>void }) {
  return (<div className="flex flex-wrap gap-2">
    {PMH_CHIPS.map(c=>(
      <button
        key={c}
        type="button"
        data-pmh-chip="1"
        onMouseDown={(e)=>{ e.preventDefault(); onInsert(c); }}
        className="px-3 py-1 rounded-2xl border text-sm hover:bg-gray-50 active:scale-[.98]">
        {c}
      </button>
    ))}
  </div>);
}