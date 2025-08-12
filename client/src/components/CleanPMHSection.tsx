import React from "react";
import { PMHEditor } from "@/components/pmh/PMHEditor";

interface CleanPMHSectionProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export default function CleanPMHSection({ value, onChange, onBlur }: CleanPMHSectionProps) {
  return (
    <PMHEditor
      initialValue={value}
      onChange={(raw, items, rendered) => {
        onChange?.(raw);
      }}
      onBlur={onBlur}
    />
  );
}