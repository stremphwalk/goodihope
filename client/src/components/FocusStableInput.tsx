import React, { useState, useRef, useEffect } from 'react';

interface FocusStableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
}

export function FocusStableInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  onFocus,
  onBlur,
  onClick
}: FocusStableInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    // No real-time updates - only on blur
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleClick = () => {
    onClick?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onChange(localValue);
    onBlur?.();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      placeholder={placeholder}
      className={className}
    />
  );
}