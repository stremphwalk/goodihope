import type { PMHItem } from "@/types/pmh";
function isContextLine(s:string){ if(!s) return false; const t=s.replace(/\t/g,"    "); return /^\s+-\s/.test(t) || /^\s+\S/.test(t); }
function normalizeContextText(s:string){ return s.replace(/^\s+/,"").replace(/^-(\s+)?/,"").trimEnd(); }
export function parsePMH(raw:string): PMHItem[] {
  const items:PMHItem[]=[]; let cur:PMHItem|null=null;
  for(const line of (raw||"").replace(/\r\n?/g,"\n").split("\n")){
    const trimmed=line.trim(); if(!trimmed) continue;
    if(isContextLine(line)){ const ctx=normalizeContextText(line); if(!cur){ cur={title:ctx,context:[]}; items.push(cur);} else cur.context.push(ctx); }
    else { cur={title:trimmed,context:[]}; items.push(cur); }
  }
  return items;
}