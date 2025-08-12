import React from "react";
import { PMHEditor } from "@/components/pmh/PMHEditor";
import type { PMHItem } from "@/types/pmh";

export default function PastMedicalHistorySection(){
  const handleChange = React.useCallback((raw:string, items:PMHItem[], rendered:string)=>{
    // persist as you wish (debounced internally)
  },[]);
  return <div className="p-4"><PMHEditor onChange={handleChange}/></div>;
}
