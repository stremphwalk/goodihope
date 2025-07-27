import { useState, useEffect, useRef, useCallback } from 'react';

// Global state store for component state persistence across unmounts
const persistedStateStore = new Map<string, any>();

// Session storage backup for critical state
const sessionStorageBackup = new Map<string, boolean>();

/**
 * Hook that persists component state across unmounts using a global store with session storage backup
 * @param key - Unique identifier for this state
 * @param initialValue - Initial value if no persisted state exists
 * @param parentValue - Value from parent component to sync with
 * @param onParentChange - Callback to update parent state
 * @param enableSessionBackup - Whether to backup to sessionStorage for tab persistence
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  parentValue?: T,
  onParentChange?: (value: T) => void,
  enableSessionBackup: boolean = false
) {
  // Get persisted value or use initial value
  const getInitialState = useCallback((): T => {
    // First try session storage if enabled
    if (enableSessionBackup) {
      try {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue !== null) {
          const parsed = JSON.parse(sessionValue);
          // For string values, check if non-empty
          if (typeof parsed === 'string' && parsed.trim().length > 0) {
            persistedStateStore.set(key, parsed);
            return parsed as T;
          }
          // For non-string values, accept any truthy value or 0/false
          if (typeof parsed !== 'string' && (parsed || parsed === 0 || parsed === false)) {
            persistedStateStore.set(key, parsed);
            return parsed as T;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse session storage for key ${key}:`, error);
      }
    }

    // Then try in-memory store
    if (persistedStateStore.has(key)) {
      const persisted = persistedStateStore.get(key);
      // For strings, only use if non-empty
      if (typeof persisted === 'string' && persisted.trim().length > 0) {
        return persisted as T;
      }
      // For non-strings, use if truthy or 0/false
      if (typeof persisted !== 'string' && (persisted || persisted === 0 || persisted === false)) {
        return persisted as T;
      }
    }
    
    // Finally try parent value if it has meaningful content
    if (parentValue !== undefined) {
      if (typeof parentValue === 'string' && parentValue.trim().length > 0) {
        return parentValue;
      }
      if (typeof parentValue !== 'string' && (parentValue || parentValue === 0 || parentValue === false)) {
        return parentValue;
      }
    }
    
    return initialValue;
  }, [key, initialValue, parentValue, enableSessionBackup]);

  const [localValue, setLocalValue] = useState<T>(getInitialState());
  const onParentChangeRef = useRef(onParentChange);

  // Keep callback ref updated
  useEffect(() => {
    onParentChangeRef.current = onParentChange;
  }, [onParentChange]);

  // Persist to session storage when enabled
  const persistToSession = useCallback((value: T) => {
    if (enableSessionBackup) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to persist to session storage for key ${key}:`, error);
      }
    }
  }, [key, enableSessionBackup]);

  // Initialize from persisted state on mount - only once
  useEffect(() => {
    const initialState = getInitialState();
    if (initialState !== localValue) {
      setLocalValue(initialState);
    }
  }, []); // Empty dependency array - only run once on mount

  // Sync with parent value when it changes (for template defaults)
  useEffect(() => {
    if (parentValue !== undefined && parentValue !== localValue) {
      // For strings: only sync if local is empty and parent has content
      if (typeof parentValue === 'string') {
        const shouldSync = 
          (!localValue || (typeof localValue === 'string' && localValue.trim() === '')) &&
          parentValue.trim() !== '';
        
        if (shouldSync) {
          setLocalValue(parentValue as T);
          persistedStateStore.set(key, parentValue);
          persistToSession(parentValue);
        }
      }
      // For non-strings: sync if local is falsy and parent is truthy
      else {
        const shouldSync = !localValue && (parentValue || parentValue === 0 || parentValue === false);
        if (shouldSync) {
          setLocalValue(parentValue as T);
          persistedStateStore.set(key, parentValue);
          persistToSession(parentValue);
        }
      }
    }
  }, [parentValue, localValue, key, persistToSession]);

  // Update local state and persist it
  const setPersistedValue = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prev: T) => T)(localValue) : value;
    setLocalValue(newValue);
    persistedStateStore.set(key, newValue);
    persistToSession(newValue);
  }, [key, localValue, persistToSession]);

  // Sync to parent on blur
  const syncToParent = useCallback(() => {
    if (onParentChangeRef.current) {
      onParentChangeRef.current(localValue);
    }
  }, [localValue]);

  // Clear persisted state (useful for reset)
  const clearPersistedState = useCallback(() => {
    persistedStateStore.delete(key);
    if (enableSessionBackup) {
      sessionStorage.removeItem(key);
    }
    setLocalValue(initialValue);
    if (onParentChangeRef.current) {
      onParentChangeRef.current(initialValue);
    }
  }, [key, initialValue, enableSessionBackup]);

  // Get all persisted keys (useful for debugging)
  const getAllPersistedKeys = useCallback(() => {
    return Array.from(persistedStateStore.keys());
  }, []);

  return {
    value: localValue,
    setValue: setPersistedValue,
    syncToParent,
    clearPersistedState,
    getAllPersistedKeys
  };
}