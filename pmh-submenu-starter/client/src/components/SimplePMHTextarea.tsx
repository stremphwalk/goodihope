import React, { useState, useRef, useEffect } from 'react';

interface SimplePMHTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  entryId?: string;
}

export const SimplePMHTextarea: React.FC<SimplePMHTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 1,
  disabled = false,
  entryId = '',
}) => {
  const [localValue, setLocalValue] = useState<string>(() => value);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const prevEntryIdRef = useRef<string>(entryId);

  // Sync from parent when switching fields or when not focused and parent value changes
  useEffect(() => {
    if (entryId !== prevEntryIdRef.current) {
      setLocalValue(value);
      prevEntryIdRef.current = entryId;
      return;
    }
    if (!isFocused && value !== localValue) {
      setLocalValue(value);
    }
  }, [entryId, value, isFocused, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => {
    setIsFocused(false);
    onChange(localValue);
  };

  return (
    <textarea
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      rows={rows}
      disabled={disabled}
      style={{
        resize: 'vertical',
        minHeight: rows === 1 ? '36px' : undefined,
      }}
    />
  );
};

export default SimplePMHTextarea;
