import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Category Management API
 * 
 * Handles CRUD operations for categories (Properties, Type of Operations, Type of Payments)
 * Updates both local config and Google Sheets via sync
 */

interface CategoryUpdate {
  type: 'property' | 'typeOfOperation' | 'typeOfPayment';
  action: 'add' | 'edit' | 'delete';
  oldValue?: string;
  newValue?: string;
  index?: number;
}

/**
 * POST /api/categories
 * Add, edit, or delete a category
 */
export async function POST(request: NextRequest) {
  try {
    const body: CategoryUpdate = await request.json();
    const { type, action, oldValue, newValue, index } = body;

    // Validate request
    if (!type || !action) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: type and action' },
        { status: 400 }
      );
    }

    // Read current config
    const configPath = path.join(process.cwd(), 'config', 'live-dropdowns.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { ok: false, error: 'Config file not found' },
        { status: 500 }
      );
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    // Get the appropriate array
    let items: string[] = [];
    if (type === 'property') {
      items = config.property || [];
    } else if (type === 'typeOfOperation') {
      items = config.typeOfOperation || [];
    } else if (type === 'typeOfPayment') {
      items = config.typeOfPayment || [];
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid category type' },
        { status: 400 }
      );
    }

    // Perform the action
    let modified = false;
    let message = '';

    switch (action) {
      case 'add':
        if (!newValue || !newValue.trim()) {
          return NextResponse.json(
            { ok: false, error: 'New value is required for add action' },
            { status: 400 }
          );
        }
        
        // Check for duplicates
        if (items.includes(newValue.trim())) {
          return NextResponse.json(
            { ok: false, error: 'This category already exists' },
            { status: 400 }
          );
        }
        
        items.push(newValue.trim());
        modified = true;
        message = `Added "${newValue}" to ${type}`;
        break;

      case 'edit':
        if (!oldValue || !newValue || !newValue.trim()) {
          return NextResponse.json(
            { ok: false, error: 'Both old and new values are required for edit action' },
            { status: 400 }
          );
        }
        
        const editIndex = items.indexOf(oldValue);
        if (editIndex === -1) {
          return NextResponse.json(
            { ok: false, error: 'Original category not found' },
            { status: 404 }
          );
        }
        
        // Check if new value already exists (but not the same as old value)
        if (newValue.trim() !== oldValue && items.includes(newValue.trim())) {
          return NextResponse.json(
            { ok: false, error: 'A category with this name already exists' },
            { status: 400 }
          );
        }
        
        items[editIndex] = newValue.trim();
        modified = true;
        message = `Updated "${oldValue}" to "${newValue}"`;
        break;

      case 'delete':
        if (index === undefined && !oldValue) {
          return NextResponse.json(
            { ok: false, error: 'Either index or oldValue is required for delete action' },
            { status: 400 }
          );
        }
        
        let deleteIndex = index;
        if (deleteIndex === undefined && oldValue) {
          deleteIndex = items.indexOf(oldValue);
        }
        
        if (deleteIndex === undefined || deleteIndex === -1 || deleteIndex >= items.length) {
          return NextResponse.json(
            { ok: false, error: 'Category not found' },
            { status: 404 }
          );
        }
        
        const deletedValue = items[deleteIndex];
        items.splice(deleteIndex, 1);
        modified = true;
        message = `Deleted "${deletedValue}" from ${type}`;
        break;

      default:
        return NextResponse.json(
          { ok: false, error: 'Invalid action. Must be add, edit, or delete' },
          { status: 400 }
        );
    }

    if (!modified) {
      return NextResponse.json(
        { ok: false, error: 'No changes were made' },
        { status: 400 }
      );
    }

    // Update the config object
    if (type === 'property') {
      config.property = items;
    } else if (type === 'typeOfOperation') {
      config.typeOfOperation = items;
    } else if (type === 'typeOfPayment') {
      config.typeOfPayment = items;
    }

    // Update timestamp
    config.fetchedAt = new Date().toISOString();
    config.source = 'webapp_edit';

    // Write back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    console.log(`[CATEGORIES] ${message}`);

    // Return success response
    return NextResponse.json({
      ok: true,
      message,
      data: {
        type,
        action,
        items,
        updatedAt: config.fetchedAt
      }
    });

  } catch (error) {
    console.error('[CATEGORIES] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to update category'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Bulk update categories (reorder, batch operations)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, items } = body;

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: type and items array' },
        { status: 400 }
      );
    }

    // Read current config
    const configPath = path.join(process.cwd(), 'config', 'live-dropdowns.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { ok: false, error: 'Config file not found' },
        { status: 500 }
      );
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    // Validate type
    if (!['property', 'typeOfOperation', 'typeOfPayment'].includes(type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid category type' },
        { status: 400 }
      );
    }

    // Update the config
    config[type] = items;
    config.fetchedAt = new Date().toISOString();
    config.source = 'webapp_bulk_edit';

    // Write back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    console.log(`[CATEGORIES] Bulk updated ${type} with ${items.length} items`);

    return NextResponse.json({
      ok: true,
      message: `Updated ${items.length} items in ${type}`,
      data: {
        type,
        items,
        updatedAt: config.fetchedAt
      }
    });

  } catch (error) {
    console.error('[CATEGORIES] Bulk update error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update categories'
      },
      { status: 500 }
    );
  }
}

