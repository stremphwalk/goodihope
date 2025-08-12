import type { PMHItem } from "@/types/pmh";
import { repeatSpaces } from "./caret";
export function renderPMH(items:PMHItem[], indentSpaces=4){
  const ind=repeatSpaces(indentSpaces), out:string[]=[];
  items.forEach((it,idx)=>{ out.push(`${idx+1}. ${it.title}`); it.context.forEach(c=>out.push(`${ind}- ${c}`)); if(idx<items.length-1) out.push(""); });
  return out.join("\n");
}