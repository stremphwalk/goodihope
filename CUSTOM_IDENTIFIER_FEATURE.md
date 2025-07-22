# Custom Identifier Feature

## Overview

The Custom Identifier feature provides each user with a unique 6-character identifier (4 letters + 2 numbers) that can be used for temporary team collaboration and group formation. This prepares the foundation for future team-based features.

## Format

- **Pattern**: XXXX## (4 uppercase letters + 2 numbers)
- **Examples**: ABCD12, EFGH34, JKLM56
- **Excluded characters**: I, O (to avoid confusion with 1, 0)

## Database Schema

### Users Table
```sql
ALTER TABLE users ADD COLUMN custom_identifier TEXT UNIQUE;
CREATE INDEX idx_users_custom_identifier ON users(custom_identifier);
```

### Migration Files
- `migrations/0002_add_custom_identifier.sql` - Database migration
- `migrations/meta/0002_snapshot.json` - Schema snapshot

## API Endpoints

### GET /api/user/identifier
Get the current user's custom identifier.

**Response:**
```json
{
  "customIdentifier": "ABCD12",
  "formattedIdentifier": "ABCD 12",
  "isNew": false
}
```

### POST /api/user/identifier/regenerate
Generate a new custom identifier for the current user.

**Response:**
```json
{
  "customIdentifier": "EFGH34",
  "formattedIdentifier": "EFGH 34",
  "message": "Custom identifier regenerated successfully"
}
```

### GET /api/users/by-identifier/:identifier
Look up a user by their custom identifier (for team features).

**Response:**
```json
{
  "customIdentifier": "ABCD12",
  "formattedIdentifier": "ABCD 12",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Implementation Details

### Backend Files
- `server/customIdentifierUtils.ts` - Utility functions for identifier generation and validation
- `server/routes.ts` - API endpoint implementations
- `shared/schema.ts` - Updated database schema

### Frontend Files
- `client/src/components/CustomIdentifierDisplay.tsx` - React component for displaying/managing identifiers
- `client/src/pages/custom-identifier.tsx` - Page component

### Key Functions

#### `generateCustomIdentifier()`
Generates a random identifier following the XXXX## pattern.

#### `isValidCustomIdentifier(identifier)`
Validates that an identifier follows the correct format.

#### `generateUniqueCustomIdentifier()`
Generates a unique identifier that's not already in use.

#### `formatCustomIdentifier(identifier)`
Formats an identifier for display (adds space: "ABCD 12").

## Features

### Automatic Generation
- New users automatically receive a custom identifier upon first login
- Existing users without identifiers get one generated on first access

### User Control
- Users can regenerate their identifier at any time
- Copy identifier to clipboard functionality
- Visual feedback for actions

### Security
- Identifiers are unique across all users
- No personal information is exposed
- Can be regenerated for security purposes

### Team Collaboration Ready
- Lookup users by identifier (for future team features)
- No sensitive data exposed in lookups
- Prepared for temporary group formation

## Usage Examples

### Frontend Integration
```tsx
import { CustomIdentifierDisplay } from './components/CustomIdentifierDisplay';

// In your component
<CustomIdentifierDisplay />
```

### API Usage
```javascript
// Get user's identifier
const response = await fetch('/api/user/identifier', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Regenerate identifier
const response = await fetch('/api/user/identifier/regenerate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Look up user by identifier
const response = await fetch('/api/users/by-identifier/ABCD12', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Future Enhancements

This feature is designed to support future team collaboration features:

1. **Temporary Team Groups**: Users can form temporary teams using identifiers
2. **Shared Workspaces**: Team members can share dot phrases and presets
3. **Collaborative Notes**: Multiple users can work on the same medical notes
4. **Team Analytics**: Track team usage and collaboration patterns

## Migration Notes

When deploying this feature:

1. Run the database migration: `drizzle-kit migrate`
2. Existing users will get identifiers on their next login
3. The system gracefully handles users without identifiers
4. All API endpoints include proper error handling

## Security Considerations

- Identifiers are randomly generated and don't contain personal information
- Users can regenerate identifiers for security
- API endpoints require authentication
- Lookup endpoints only return minimal user information
- No sensitive data is exposed in identifier lookups 