# 🎯 Phase 3: Category Management System

## Overview

Phase 3 introduces full CRUD (Create, Read, Update, Delete) capabilities for managing business categories directly from the webapp. All changes automatically sync to Google Sheets and roll out to both web and mobile apps.

## Features Implemented

### ✅ **1. Full Category Editing**
- **Add New Categories** - Create new properties, expense types, or payment methods
- **Edit Existing Categories** - Rename or modify category names inline
- **Delete Categories** - Remove unused categories with confirmation dialog
- **Real-time Updates** - Changes reflect immediately in the UI

### ✅ **2. Google Sheets Sync**
- **Bidirectional Sync** - Changes sync from webapp → Google Sheets
- **Sync Status Tracking** - Visual indicators show when changes need syncing
- **One-Click Sync** - "Sync to Sheets" button appears when changes are pending
- **Automatic Mobile Rollout** - Mobile app picks up changes via `/api/options` endpoint

### ✅ **3. Enhanced UI/UX**
- **Inline Editing** - Edit categories directly in the table
- **Keyboard Shortcuts** - Enter to save, Escape to cancel
- **Loading States** - Visual feedback during operations
- **Toast Notifications** - Success/error messages for all actions
- **Sync Status Banner** - Shows sync state and last sync time

### ✅ **4. Data Validation**
- **Duplicate Prevention** - Can't add categories that already exist
- **Empty Value Protection** - Can't save empty category names
- **Confirmation Dialogs** - Delete actions require confirmation
- **Error Handling** - Graceful error messages for all failures

## Architecture

### API Endpoints

#### **POST /api/categories**
Handles add, edit, and delete operations for categories.

**Request Body:**
```json
{
  "type": "property" | "typeOfOperation" | "typeOfPayment",
  "action": "add" | "edit" | "delete",
  "oldValue": "string (for edit/delete)",
  "newValue": "string (for add/edit)",
  "index": "number (optional, for delete)"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Added 'New Property' to property",
  "data": {
    "type": "property",
    "action": "add",
    "items": ["Property 1", "Property 2", "New Property"],
    "updatedAt": "2025-11-01T12:00:00.000Z"
  }
}
```

#### **PUT /api/categories**
Handles bulk updates (reordering, batch operations).

**Request Body:**
```json
{
  "type": "property" | "typeOfOperation" | "typeOfPayment",
  "items": ["Item 1", "Item 2", "Item 3"]
}
```

#### **POST /api/categories/sync**
Syncs local changes back to Google Sheets.

**Response:**
```json
{
  "ok": true,
  "message": "Successfully synced categories to Google Sheets",
  "data": {
    "updatedRanges": 3,
    "totalCells": 45,
    "syncedAt": "2025-11-01T12:00:00.000Z",
    "details": {
      "properties": 7,
      "operations": 33,
      "payments": 4
    }
  }
}
```

#### **GET /api/categories/sync**
Checks sync status.

**Response:**
```json
{
  "ok": true,
  "data": {
    "lastSynced": "2025-11-01T12:00:00.000Z",
    "lastModified": "2025-11-01T12:05:00.000Z",
    "needsSync": true,
    "source": "webapp_edit",
    "counts": {
      "properties": 7,
      "operations": 33,
      "payments": 4
    }
  }
}
```

### Component Structure

#### **CategoryTable Component**
Enhanced table component with full editing capabilities.

**Props:**
```typescript
interface CategoryTableProps {
  title: string;
  description: string;
  items: string[];
  loading: boolean;
  icon: string;
  categoryType: 'property' | 'typeOfOperation' | 'typeOfPayment';
  onUpdate: (type, action, oldValue?, newValue?, index?) => Promise<void>;
  isUpdating?: boolean;
}
```

**Features:**
- Inline editing with input fields
- Add new row at the top
- Edit/Delete buttons for each row
- Loading states during operations
- Keyboard shortcuts (Enter/Escape)

#### **Settings Page**
Main page for category management.

**State Management:**
```typescript
const [data, setData] = useState<OptionsData | null>(null);
const [loading, setLoading] = useState(true);
const [isUpdating, setIsUpdating] = useState(false);
const [isSyncing, setIsSyncing] = useState(false);
const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
const [toast, setToast] = useState<Toast | null>(null);
```

**Key Functions:**
- `fetchOptions()` - Load categories from `/api/options`
- `fetchSyncStatus()` - Check if sync is needed
- `handleUpdate()` - Handle add/edit/delete operations
- `handleSyncToSheets()` - Sync changes to Google Sheets

## Data Flow

### 1. **Add New Category**
```
User clicks "Add New" 
→ Input row appears
→ User types name and clicks Save
→ POST /api/categories (action: add)
→ Update config/live-dropdowns.json
→ Return updated items
→ Update UI state
→ Show success toast
→ Sync status changes to "Pending"
```

### 2. **Edit Category**
```
User clicks Edit button
→ Row becomes editable
→ User changes name and clicks Save
→ POST /api/categories (action: edit)
→ Update config/live-dropdowns.json
→ Return updated items
→ Update UI state
→ Show success toast
→ Sync status changes to "Pending"
```

### 3. **Delete Category**
```
User clicks Delete button
→ Confirmation dialog appears
→ User confirms
→ POST /api/categories (action: delete)
→ Update config/live-dropdowns.json
→ Return updated items
→ Update UI state
→ Show success toast
→ Sync status changes to "Pending"
```

### 4. **Sync to Google Sheets**
```
User clicks "Sync to Sheets"
→ POST /api/categories/sync
→ Read config/live-dropdowns.json
→ Clear existing ranges in Google Sheets
→ Batch update all ranges
→ Update config with lastSyncedToSheets timestamp
→ Return sync results
→ Show success toast
→ Sync status changes to "All Synced"
```

## File Structure

```
app/
├── api/
│   ├── categories/
│   │   ├── route.ts          # CRUD operations
│   │   └── sync/
│   │       └── route.ts      # Google Sheets sync
│   └── options/
│       └── route.ts          # Read categories (existing)
├── settings/
│   └── page.tsx              # Main settings page
components/
└── settings/
    └── CategoryTable.tsx     # Editable table component
config/
└── live-dropdowns.json       # Category data storage
docs/
└── PHASE_3_CATEGORY_MANAGEMENT.md  # This file
```

## Usage Guide

### For Users

1. **Navigate to Settings**
   - Click "Settings" in the sidebar
   - View all current categories

2. **Add a New Category**
   - Click "Add New" button on any category table
   - Type the category name
   - Press Enter or click the green checkmark
   - Category is added immediately

3. **Edit a Category**
   - Click the blue Edit button next to any category
   - Modify the name
   - Press Enter or click the green checkmark
   - Category is updated immediately

4. **Delete a Category**
   - Click the red Delete button next to any category
   - Confirm the deletion in the dialog
   - Category is removed immediately

5. **Sync to Google Sheets**
   - After making changes, a "Sync to Sheets" button appears
   - Click the button to push changes to Google Sheets
   - Wait for success confirmation
   - Changes are now available in mobile app

### For Developers

#### Adding a New Category Type

1. Update the API types:
```typescript
// app/api/categories/route.ts
type: 'property' | 'typeOfOperation' | 'typeOfPayment' | 'newType'
```

2. Update the config structure:
```json
// config/live-dropdowns.json
{
  "property": [...],
  "typeOfOperation": [...],
  "typeOfPayment": [...],
  "newType": [...]
}
```

3. Add to settings page:
```tsx
<CategoryTable
  title="New Type"
  description="Description of new type"
  items={data?.newType || []}
  loading={loading}
  icon="🆕"
  categoryType="newType"
  onUpdate={handleUpdate}
  isUpdating={isUpdating}
/>
```

## Security Considerations

1. **No Authentication** - Currently no auth on category endpoints
   - Consider adding PIN protection like admin page
   - Or use session-based auth

2. **Data Validation** - All inputs are validated
   - Empty values rejected
   - Duplicates prevented
   - Type checking enforced

3. **Google Sheets Access** - Uses service account
   - Credentials stored in `config/google-credentials.json`
   - Requires edit permissions on sheet

## Future Enhancements

### Planned Features
- [ ] **Drag-and-Drop Reordering** - Reorder categories by dragging
- [ ] **Archive Categories** - Hide without deleting
- [ ] **Category Icons** - Custom icons for each category
- [ ] **Bulk Import/Export** - CSV import/export
- [ ] **Category Groups** - Organize into collapsible groups
- [ ] **Usage Statistics** - Show how often each category is used
- [ ] **Undo/Redo** - Undo recent changes
- [ ] **Change History** - Audit log of all changes

### Technical Improvements
- [ ] **Optimistic Updates** - Update UI before API response
- [ ] **Debounced Sync** - Auto-sync after period of inactivity
- [ ] **Conflict Resolution** - Handle concurrent edits
- [ ] **Offline Support** - Queue changes when offline
- [ ] **Real-time Sync** - WebSocket updates across devices

## Testing

### Manual Testing Checklist

- [ ] Add new property
- [ ] Add new type of operation
- [ ] Add new type of payment
- [ ] Edit existing category
- [ ] Delete category with confirmation
- [ ] Cancel delete operation
- [ ] Try to add duplicate category (should fail)
- [ ] Try to save empty category (should fail)
- [ ] Sync changes to Google Sheets
- [ ] Verify changes appear in mobile app
- [ ] Test keyboard shortcuts (Enter/Escape)
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test toast notifications

### API Testing

```bash
# Add category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"type":"property","action":"add","newValue":"Test Property"}'

# Edit category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"type":"property","action":"edit","oldValue":"Test Property","newValue":"Updated Property"}'

# Delete category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"type":"property","action":"delete","oldValue":"Updated Property"}'

# Sync to sheets
curl -X POST http://localhost:3000/api/categories/sync

# Check sync status
curl http://localhost:3000/api/categories/sync
```

## Troubleshooting

### Common Issues

**Issue:** "Config file not found"
- **Solution:** Run `node sync-sheets.js` to create initial config

**Issue:** "Google Sheets authentication failed"
- **Solution:** Check `config/google-credentials.json` exists and is valid

**Issue:** "Permission denied" when syncing
- **Solution:** Ensure service account has edit access to the sheet

**Issue:** Changes not appearing in mobile app
- **Solution:** Mobile app caches `/api/options` - restart app or wait for cache expiry

**Issue:** Duplicate category error
- **Solution:** Category names must be unique - choose a different name

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check server logs for API errors
4. Verify Google Sheets permissions
5. Test with `sync-sheets.js` to ensure sheet structure is correct

---

**Phase 3 Status:** ✅ **COMPLETE**

All category management features are now live and ready for use!

