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
  const isUserTypingRef = useRef(false);

  // Update internal value when external value changes (but not during typing)
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isUserTypingRef.current = true;
    setInternalValue(newValue);
    onChange(newValue);
    
    // Reset typing flag after a brief delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}