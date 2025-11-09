'use client';

import { useState, useEffect } from 'react';
import { Loader2, Edit2, Trash2, Plus, Check, X, AlertCircle, Info, Building2 } from 'lucide-react';

export default function PropertyManager() {
  const [properties, setProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories/properties');
      const result = await res.json();

      if (result.ok && result.data) {
        setProperties(result.data.properties || []);
      } else {
        throw new Error(result.error || 'Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleStartEdit = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditValue(currentValue);
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleSaveEdit = async (oldValue: string) => {
    if (!editValue.trim() || editValue.trim() === oldValue) {
      handleCancelEdit();
      return;
    }

    try {
      setIsUpdating(true);
      showToast('Updating property...', 'info');

      const res = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          oldValue,
          newValue: editValue.trim(),
          index: editingIndex,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update property');
      }

      setProperties(result.data.properties);
      showToast('Property updated successfully', 'success');
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating property:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update property', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (index: number, value: string) => {
    if (!confirm(`Delete "${value}"?\n\nThis will also remove it from the P&L sheet.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      showToast('Deleting property...', 'info');

      const res = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          oldValue: value,
          index,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to delete property');
      }

      setProperties(result.data.properties);
      showToast('Property deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting property:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete property', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewValue('');
    setEditingIndex(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewValue('');
  };

  const handleSaveAdd = async () => {
    if (!newValue.trim()) {
      showToast('Property name cannot be empty', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      showToast('Adding property...', 'info');

      const res = await fetch('/api/categories/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          newValue: newValue.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to add property');
      }

      setProperties(result.data.properties);
      showToast('Property added successfully', 'success');
      handleCancelAdd();
    } catch (error) {
      console.error('Error adding property:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add property', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      {/* Header */}
      <div className="border-b border-border-card p-6 bg-bg-app/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-accent/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">
                Property Management
              </h2>
              <p className="text-sm text-text-secondary">
                Manage properties from Google Sheets • {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
          </div>
          <button
            onClick={handleStartAdd}
            disabled={isUpdating || isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 text-black font-medium transition-all duration-200 shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-bg-app/60 border-b border-border-card p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-text-primary font-semibold text-sm mb-1">
              Real-Time Google Sheets Integration
            </h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Properties are stored in <strong>Data sheet (Column C)</strong>. Changes automatically update the <strong>P&amp;L sheet</strong> via Apps Script.
              All formulas, totals, and formatting are managed automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-app/80">
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Property Name
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card/60">
                {/* Add new row */}
                {isAdding && (
                  <tr className="bg-accent/10">
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <Plus className="w-4 h-4 text-accent" />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveAdd();
                          if (e.key === 'Escape') handleCancelAdd();
                        }}
                        placeholder="e.g., Downtown Office"
                        autoFocus
                        disabled={isUpdating}
                        className="w-full bg-bg-card border border-border-card rounded-xl2 px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSaveAdd}
                          disabled={isUpdating || !newValue.trim()}
                          className="p-2 bg-success/20 hover:bg-success/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-success/40"
                          title="Save"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 text-success animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 text-success" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelAdd}
                          disabled={isUpdating}
                          className="p-2 bg-border-card/60 hover:bg-border-card disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-border-card"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Existing properties */}
                {properties.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-bg-card/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      {editingIndex === idx ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                          disabled={isUpdating}
                          className="w-full bg-bg-card border border-border-card rounded-xl2 px-3 py-2 text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                        />
                      ) : (
                        <span className="text-text-primary font-medium">{item}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingIndex === idx ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveEdit(item)}
                            disabled={isUpdating || !editValue.trim()}
                            className="p-2 bg-success/20 hover:bg-success/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-success/40"
                            title="Save"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 text-success animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-success" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="p-2 bg-border-card/60 hover:bg-border-card disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-border-card"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-text-secondary" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(idx, item)}
                            disabled={isUpdating || isAdding}
                            className="p-2 bg-accent/15 hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-accent/40"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-accent" />
                          </button>
                          <button
                            onClick={() => handleDelete(idx, item)}
                            disabled={isUpdating || isAdding}
                            className="p-2 bg-error/10 hover:bg-error/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 transition-colors border border-error/40"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {properties.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-text-secondary">No properties found</p>
                      <p className="text-sm text-text-tertiary mt-1">Click &quot;Add Property&quot; to create your first property</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className={`px-6 py-4 rounded-xl2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm border ${
            toast.type === 'success'
              ? 'bg-success/90 border-success text-text-primary'
              : toast.type === 'error'
              ? 'bg-error/90 border-error text-text-primary'
              : 'bg-info/90 border-info text-text-primary'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
              <p className="font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
