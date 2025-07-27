# Note Type Selection Analysis

## Files Involved in Note Type Selection

### Core Components
1. **`client/src/components/NoteTypeSection.tsx`** - Main note type selection component
2. **`client/src/components/NoteTypeSelector.tsx`** - Alternative note type selector component
3. **`client/src/pages/review-of-systems.tsx`** - Main page containing note type state management

### State Management
4. **`client/src/App.tsx`** - Main app with sessionStorage persistence for menu state
5. **`client/src/components/MainLayout.tsx`** - Layout component with navigation state management
6. **`client/src/contexts/AuthContext.tsx`** - Authentication context (potential re-render source)
7. **`client/src/contexts/LanguageContext.tsx`** - Language context (potential re-render source)

### Supporting Files
8. **`client/src/main.tsx`** - App entry point with context providers
9. **`client/src/pages/dot-phrase-manager.tsx`** - Page that uses MainLayout
10. **`client/src/pages/calculations.tsx`** - Page that uses MainLayout
11. **`client/src/pages/user-profile.tsx`** - Page that uses MainLayout
12. **`client/src/pages/not-found.tsx`** - Page that uses MainLayout
13. **`client/src/pages/groups.tsx`** - Page that uses MainLayout

## Identified Issues

### 1. Excessive Re-rendering Issues

#### Problem Areas:
- **AuthContext**: The `useMemo` dependency array includes all callback functions, which may cause unnecessary re-renders
- **LanguageContext**: No memoization of the context value
- **MainLayout**: Multiple useEffect hooks that trigger on every state change
- **ReviewOfSystems**: Large useEffect dependency array that triggers on every state change

#### Specific Issues:
```typescript
// In review-of-systems.tsx line 1457
useEffect(() => {
  handleOptionChange();
}, [medications, processedLabValues, pmhText, noteType, admissionType, progressType, chiefComplaint, selectedPeSystems, intubationValues, impressionText, selectedSymptoms, selectedTemplate]);
```

This effect has 12 dependencies and runs on every change to any of these states.

### 2. State Persistence Issues

#### Problem Areas:
- **SessionStorage**: Only persists `selectedMenu` and `selectedSubOption`, not `noteType`
- **LocalStorage**: Only persists `selectedTemplateId`, not note type selection
- **No persistence**: Note type selection (`noteType`, `admissionType`, `progressType`) is not persisted

#### Missing Persistence:
```typescript
// In review-of-systems.tsx - these states are NOT persisted
const [noteType, setNoteType] = useState<NoteType>(null);
const [admissionType, setAdmissionType] = useState<NoteSubtype>("general");
const [progressType, setProgressType] = useState<NoteSubtype>("general");
```

### 3. Navigation State Issues

#### Problem Areas:
- **MainLayout useEffect**: Forces suboption reset when menu changes
- **Route changes**: Don't preserve note type selection when navigating
- **Alt-tab refresh**: Browser behavior that clears non-persisted state

#### Specific Issues:
```typescript
// In MainLayout.tsx line 113
useEffect(() => {
  setMedicalNotesOpen(selectedMenu === 'medical-notes');
  setSmartOptionsOpen(selectedMenu === 'smart-options');
  const menu = MAIN_MENUS.find((m) => m.key === selectedMenu);
  if (menu && menu.subOptions.length > 0 && !menu.subOptions.some(sub => sub?.key === selectedSubOption)) {
    setSelectedSubOption(menu.subOptions[0]?.key || '');
  }
}, [selectedMenu, selectedSubOption, MAIN_MENUS, setSelectedSubOption]);
```

This effect resets the suboption when the menu changes, potentially losing note type selection.

### 4. Context Provider Issues

#### Problem Areas:
- **Multiple providers**: AuthProvider and LanguageProvider both wrapped around the app
- **No memoization**: LanguageContext value is not memoized
- **Callback dependencies**: AuthContext includes all callbacks in useMemo dependencies

## Recommended Analysis Steps

1. **Check re-render frequency**: Add console.logs to track when components re-render
2. **Analyze state flow**: Trace how note type selection flows through the component tree
3. **Identify persistence gaps**: Find where note type state is lost during navigation
4. **Review context usage**: Check if contexts are causing unnecessary re-renders
5. **Test navigation scenarios**: Verify state loss during tab switching and navigation

## Files to Extract for Analysis

### Primary Files (Must Analyze):
1. `client/src/pages/review-of-systems.tsx` - Main state management
2. `client/src/components/MainLayout.tsx` - Navigation state management
3. `client/src/App.tsx` - SessionStorage persistence
4. `client/src/contexts/AuthContext.tsx` - Potential re-render source
5. `client/src/contexts/LanguageContext.tsx` - Potential re-render source

### Secondary Files (For Context):
6. `client/src/components/NoteTypeSection.tsx` - Note type UI
7. `client/src/components/NoteTypeSelector.tsx` - Alternative note type UI
8. `client/src/main.tsx` - Context provider setup

### Supporting Files (For Complete Understanding):
9. `client/src/pages/dot-phrase-manager.tsx`
10. `client/src/pages/calculations.tsx`
11. `client/src/pages/user-profile.tsx`
12. `client/src/pages/not-found.tsx`
13. `client/src/pages/groups.tsx`

## Key Areas to Focus On

1. **State Persistence**: Why note type selection isn't persisted across navigation
2. **Re-render Optimization**: How to reduce unnecessary re-renders in contexts
3. **Navigation State**: How to preserve note type when switching between sections
4. **Browser Behavior**: How to handle alt-tab and page refresh scenarios
5. **Context Optimization**: How to optimize AuthContext and LanguageContext for better performance 