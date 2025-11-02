'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import Toast from '@/components/Toast';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PropertyManager() {
  const [properties, setProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProperty, setNewProperty] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories/properties');
      const result = await response.json();

      if (result.ok) {
        setProperties(result.data.properties || []);
      } else {
        showToast(result.error || 'Failed to load properties', 'error');
      }
    } catch (error) {
      showToast('Failed to load properties', 'error');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAdd = async () => {
    if (!newProperty.trim()) {
      showToast('Property name cannot be empty', 'error');
      return;
    }

    try {
      const response = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          newValue: newProperty.trim(),
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setProperties(result.data.properties || []);
        setNewProperty('');
        showToast('Property added successfully', 'success');
      } else {
        showToast(result.error || 'Failed to add property', 'error');
      }
    } catch (error) {
      showToast('Failed to add property', 'error');
      console.error('Error adding property:', error);
    }
  };

  const handleEdit = async (index: number) => {
    if (!editValue.trim()) {
      showToast('Property name cannot be empty', 'error');
      return;
    }

    try {
      const response = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          oldValue: properties[index],
          newValue: editValue.trim(),
          index,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setProperties(result.data.properties || []);
        setEditingIndex(null);
        setEditValue('');
        showToast('Property updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to update property', 'error');
      }
    } catch (error) {
      showToast('Failed to update property', 'error');
      console.error('Error editing property:', error);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm(`Delete "${properties[index]}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          oldValue: properties[index],
          index,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setProperties(result.data.properties || []);
        showToast('Property deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete property', 'error');
      }
    } catch (error) {
      showToast('Failed to delete property', 'error');
      console.error('Error deleting property:', error);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(properties[index]);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Property Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage properties in Google Sheets (Data!C2:C)
          </p>
        </div>

        {/* Add New Property */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProperty}
              onChange={(e) => setNewProperty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
              placeholder="Enter new property name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newProperty.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Property
            </button>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Current Properties ({properties.length})
            </h3>
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No properties found. Add your first property above.
            </div>
          ) : (
            <div className="space-y-2">
              {properties.map((property, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEdit(index);
                          } else if (e.key === 'Escape') {
                            cancelEdit();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEdit(index)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-900">{property}</span>
                      <button
                        onClick={() => startEdit(index)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Changes are immediately saved to Google Sheets (Data!C2:C).
            Apps Script will automatically rebuild the P&L sheet when you make changes.
          </p>
        </div>
      </Card>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </>
  );
}
