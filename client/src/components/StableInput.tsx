import React, { useState, useRef, useEffect } from 'react';

interface StableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function StableInput({ value, onChange, placeholder, className }: StableInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only update internal value when external value changes and input is not focused
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    // Don't call onChange during typing - only on blur
  };

  const handleBlur = () => {
    // Only update parent when user finishes typing (leaves the field)
    onChange(internalValue);
  };

  const handleFocus = () => {
    // Ensure we're using the latest external value when focusing
    setInternalValue(value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
}