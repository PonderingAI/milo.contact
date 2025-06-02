# Multiple Media Detection Error - Fix Summary

## Problem Description
The issue described multiple problems with media duplicate detection:

1. **Multiple duplicates in media library**: Same media appearing multiple times in the database
2. **Selection confusion**: When selecting duplicate media in `/admin/projects/id/edit`, selecting one duplicate would visually select both but only count as one in the selection counter

## Root Causes Identified

### 1. Hash Algorithm Inconsistency
- **Client-side** (unified-media-input.tsx): Used `crypto.subtle.digest("SHA-256", arrayBuffer)`
- **Server-side** (bulk-upload/route.ts): Used `crypto.createHash("md5").update(fileBuffer).digest("hex")`
- **Impact**: Files would never be detected as duplicates because different hash algorithms produced different hashes for the same file

### 2. SQL Injection Vulnerability
- **Location**: `lib/media-utils.ts` in `checkFileDuplicate` and `checkUrlDuplicate` functions
- **Issue**: Direct string interpolation in Supabase queries: `query.or(\`metadata->fileHash.eq.${fileHash}\`)`
- **Impact**: Vulnerable to SQL injection and query failures with special characters

### 3. Race Condition Issues
- **Issue**: Multiple simultaneous uploads of the same file could all pass duplicate detection before any completed insertion
- **Impact**: Same file could be inserted multiple times into the database

### 4. Selection Logic Problems
- **Issue**: Selection logic only compared by `item.id`, but actual database duplicates have different IDs
- **Impact**: Selecting one duplicate wouldn't affect other duplicates, causing UI confusion

## Solutions Implemented

### 1. Fixed Hash Algorithm Consistency ✅
**File**: `app/api/bulk-upload/route.ts`
```typescript
// Before (MD5)
const fileHash = crypto.createHash("md5").update(fileBuffer).digest("hex")

// After (SHA-256)
const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex")
```

### 2. Fixed SQL Injection Vulnerability ✅
**File**: `lib/media-utils.ts`
```typescript
// Before (vulnerable)
query = query.or(`metadata->fileHash.eq.${fileHash}`)

// After (escaped)
const orConditions: string[] = []
if (fileHash) {
  orConditions.push(`metadata->>fileHash.eq."${fileHash.replace(/"/g, '""')}"`)
}
query = query.or(orConditions.join(','))
```

### 3. Added Race Condition Protection ✅
**File**: `app/api/bulk-upload/route.ts`
- Added `.select()` to the insert query to get inserted data
- Added race condition detection in the error handler
- If insert fails, check if another process inserted the same file
- Return appropriate duplicate response if race condition detected

### 4. Improved Selection Logic ✅
**File**: `components/admin/unified-media-library.tsx`
```typescript
// Before (ID only)
const isSelected = selectedItems.some(selected => selected.id === item.id)

// After (ID, URL, or filepath)
const isSelected = selectedItems.some(selected => 
  selected.id === item.id || 
  selected.public_url === item.public_url || 
  selected.filepath === item.filepath
)
```

### 5. Added Database Cleanup Feature ✅
**New File**: `app/api/cleanup-media-duplicates/route.ts`
- Groups media by file hash and public URL
- Identifies duplicates and keeps the earliest created item
- Removes duplicate entries from the database
- Returns count of removed duplicates

**UI**: Added "Cleanup Duplicates" button to media library interface

## Additional Improvements

### Testing
- Created `scripts/test-duplicate-detection.js` to verify hash consistency
- Added `tests/duplicate-detection.test.js` for integration testing
- Verified TypeScript compilation passes

### Deduplication Logic
- Enhanced `toggleItemSelection` to deduplicate by URL/filepath
- Prevents selecting multiple database duplicates of the same media
- Maintains correct selection count in UI

## How to Use the Fix

### For Administrators
1. **Immediate cleanup**: Use the "Cleanup Duplicates" button in the media library to remove existing duplicates
2. **Prevention**: New uploads will now properly detect duplicates and prevent insertion
3. **Selection**: Selecting media will now work correctly even if duplicates exist

### For Developers
1. **Hash consistency**: All duplicate detection now uses SHA-256 consistently
2. **Security**: Queries are properly escaped to prevent SQL injection
3. **Race conditions**: Server handles concurrent uploads gracefully
4. **Selection**: UI properly handles duplicate media items

## Testing Verification

Run the included test script:
```bash
node scripts/test-duplicate-detection.js
```

Expected output:
```
1. Hash consistency test: PASS
2. Query escaping test: PASS
Overall: ALL TESTS PASS
```

## Files Modified

1. `app/api/bulk-upload/route.ts` - Hash algorithm and race condition fixes
2. `lib/media-utils.ts` - Query escaping and improved duplicate detection
3. `components/admin/unified-media-library.tsx` - Selection logic and cleanup UI
4. `app/api/cleanup-media-duplicates/route.ts` - New cleanup endpoint (created)
5. `scripts/test-duplicate-detection.js` - Test script (created)
6. `tests/duplicate-detection.test.js` - Integration tests (created)

## Impact

- ✅ Prevents new duplicate media from being created
- ✅ Fixes selection issues with existing duplicates
- ✅ Provides cleanup tool for existing duplicates
- ✅ Improves security by preventing SQL injection
- ✅ Handles concurrent uploads gracefully
- ✅ Maintains UI consistency and correct selection counts