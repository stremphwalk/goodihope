# Extracted Files for Note Type Selection Analysis

## Core Files Extracted

### 1. `client/src/pages/review-of-systems.tsx` (Lines 1-250)
**Key Issues:**
- Note type state (`noteType`, `admissionType`, `progressType`) is NOT persisted
- Large useEffect dependency array (12 dependencies) causing excessive re-renders
- No localStorage/sessionStorage for note type selection
- State resets when navigating between sections

**Critical Code:**
```typescript
const [noteType, setNoteType] = useState<NoteType>(null);
const [admissionType, setAdmissionType] = useState<NoteSubtype>("general");
const [progressType, setProgressType] = useState<NoteSubtype>("general");

// This effect runs on EVERY state change
useEffect(() => {
  handleOptionChange();
}, [medications, processedLabValues, pmhText, noteType, admissionType, progressType, chiefComplaint, selectedPeSystems, intubationValues, impressionText, selectedSymptoms, selectedTemplate]);
```

### 2. `client/src/components/MainLayout.tsx` (Lines 1-150)
**Key Issues:**
- Forces suboption reset when menu changes
- Multiple useEffect hooks that trigger re-renders
- Navigation state management conflicts with note type selection

**Critical Code:**
```typescript
// This effect resets suboption when menu changes
useEffect(() => {
  setMedicalNotesOpen(selectedMenu === 'medical-notes');
  setSmartOptionsOpen(selectedMenu === 'smart-options');
  const menu = MAIN_MENUS.find((m) => m.key === selectedMenu);
  if (menu && menu.subOptions.length > 0 && !menu.subOptions.some(sub => sub?.key === selectedSubOption)) {
    setSelectedSubOption(menu.subOptions[0]?.key || '');
  }
}, [selectedMenu, selectedSubOption, MAIN_MENUS, setSelectedSubOption]);
```

### 3. `client/src/App.tsx` (Complete file)
**Key Issues:**
- Only persists `selectedMenu` and `selectedSubOption` in sessionStorage
- No persistence for note type selection
- Context providers may cause unnecessary re-renders

**Critical Code:**
```typescript
// Only these states are persisted
useEffect(() => {
  sessionStorage.setItem('selectedMenu', selectedMenu);
}, [selectedMenu]);

useEffect(() => {
  sessionStorage.setItem('selectedSubOption', selectedSubOption);
}, [selectedSubOption]);

// NOTE: No persistence for noteType, admissionType, progressType
```

### 4. `client/src/contexts/AuthContext.tsx` (Complete file)
**Key Issues:**
- useMemo dependency array includes all callback functions
- May cause unnecessary re-renders when auth state changes
- Callback functions recreated on every render

**Critical Code:**
```typescript
// This useMemo includes all callbacks in dependencies
const value: AuthContextType = useMemo(() => ({
  user,
  session,
  isAuthenticated: !!session,
  isLoading,
  error,
  login,
  register,
  logout,
  clearError,
  signinRedirect,
}), [user, session, isLoading, error, login, register, logout, clearError, signinRedirect]);
```

### 5. `client/src/contexts/LanguageContext.tsx` (Lines 620-644)
**Key Issues:**
- No memoization of context value
- Creates new object on every render
- May cause unnecessary re-renders

**Critical Code:**
```typescript
// No memoization - creates new object every render
return (
  <LanguageContext.Provider value={{ language, setLanguage, t }}>
    {children}
  </LanguageContext.Provider>
);
```

### 6. `client/src/components/NoteTypeSection.tsx` (Complete file)
**Key Issues:**
- Uses `useLanguage()` hook which may cause re-renders
- No memoization of noteTypes array
- Recreates noteTypes array on every language change

**Critical Code:**
```typescript
const { language } = useLanguage();

// This array is recreated on every render
const noteTypes = [
  {
    id: 'admission',
    name: language === 'fr' ? 'Note d\'Admission' : 'Admission Note',
    // ... more items
  },
  // ... more note types
];
```

### 7. `client/src/main.tsx` (Complete file)
**Key Issues:**
- Multiple context providers nested
- StrictMode may cause double renders in development
- Provider order may affect re-render behavior

**Critical Code:**
```typescript
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

## Root Cause Analysis

### 1. **State Persistence Problem**
- Note type selection (`noteType`, `admissionType`, `progressType`) is NOT persisted
- Only menu navigation state is persisted in sessionStorage
- When user navigates or alt-tabs, note type selection is lost

### 2. **Excessive Re-rendering**
- Large useEffect dependency arrays trigger on every state change
- Context providers not properly memoized
- Language context creates new objects on every render

### 3. **Navigation State Conflicts**
- MainLayout forces suboption reset when menu changes
- No preservation of note type when switching sections
- Route changes don't maintain note type selection

### 4. **Context Provider Issues**
- AuthContext includes all callbacks in useMemo dependencies
- LanguageContext has no memoization
- Multiple providers may cause cascading re-renders

## Recommended Fixes

### 1. **Add Note Type Persistence**
```typescript
// In review-of-systems.tsx
useEffect(() => {
  const savedNoteType = sessionStorage.getItem('noteType');
  const savedAdmissionType = sessionStorage.getItem('admissionType');
  const savedProgressType = sessionStorage.getItem('progressType');
  
  if (savedNoteType) setNoteType(savedNoteType as NoteType);
  if (savedAdmissionType) setAdmissionType(savedAdmissionType as NoteSubtype);
  if (savedProgressType) setProgressType(savedProgressType as NoteSubtype);
}, []);

useEffect(() => {
  if (noteType) sessionStorage.setItem('noteType', noteType);
  else sessionStorage.removeItem('noteType');
}, [noteType]);
```

### 2. **Optimize Context Providers**
```typescript
// In LanguageContext.tsx
const value = useMemo(() => ({
  language,
  setLanguage,
  t
}), [language, setLanguage]);
```

### 3. **Reduce useEffect Dependencies**
```typescript
// In review-of-systems.tsx
const handleOptionChange = useCallback(() => {
  // ... implementation
}, [/* only essential dependencies */]);

useEffect(() => {
  handleOptionChange();
}, [handleOptionChange]);
```

### 4. **Memoize Note Type Components**
```typescript
// In NoteTypeSection.tsx
const noteTypes = useMemo(() => [
  // ... note types array
], [language]);
```

## Testing Scenarios

1. **Select note type → Navigate to different section → Return**
   - Expected: Note type selection preserved
   - Current: Note type selection lost

2. **Select note type → Alt-tab → Return**
   - Expected: Note type selection preserved
   - Current: Note type selection lost

3. **Select note type → Refresh page**
   - Expected: Note type selection preserved
   - Current: Note type selection lost

4. **Switch between note types rapidly**
   - Expected: Smooth transitions, no excessive re-renders
   - Current: May cause performance issues

## Files Ready for Analysis

All the critical files have been extracted and are ready for your analysis. The main issues are:

1. **Missing persistence** for note type selection
2. **Excessive re-rendering** due to large dependency arrays
3. **Context provider optimization** needed
4. **Navigation state conflicts** causing state loss

You can now analyze these files to implement the fixes for the note type selection issues. 