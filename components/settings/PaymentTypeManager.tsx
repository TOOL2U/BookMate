'use client';

import { useState, useEffect } from 'react';
import { Loader2, Edit2, Trash2, Plus, Check, X, AlertCircle, Info } from 'lucide-react';

export default function PaymentTypeManager() {
  const [paymentTypes, setProperties] = useState<string[]>([]);
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
      const res = await fetch('/api/categories/paymentTypes');
      const result = await res.json();

      if (result.ok && result.data) {
        setProperties(result.data.paymentTypes || []);
      } else {
        throw new Error(result.error || 'Failed to load paymentTypes');
      }
    } catch (error) {
      console.error('Error fetching paymentTypes:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load paymentTypes', 'error');
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
      showToast('Updating payment type...', 'info');

      const res = await fetch('/api/categories/paymentTypes', {
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
        throw new Error(result.error || 'Failed to update payment type');
      }

      setProperties(result.data.paymentTypes);
      showToast('Payment Type updated successfully', 'success');
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating payment type:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update payment type', 'error');
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
      showToast('Deleting payment type...', 'info');

      const res = await fetch('/api/categories/paymentTypes', {
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
        throw new Error(result.error || 'Failed to delete payment type');
      }

      setProperties(result.data.paymentTypes);
      showToast('Payment Type deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting payment type:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete payment type', 'error');
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
      showToast('Payment Type name cannot be empty', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      showToast('Adding payment type...', 'info');

      const res = await fetch('/api/categories/paymentTypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          newValue: newValue.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to add payment type');
      }

      setProperties(result.data.paymentTypes);
      showToast('Payment Type added successfully', 'success');
      handleCancelAdd();
    } catch (error) {
      console.error('Error adding payment type:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add payment type', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-slate-700/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              💳 Payment Type Management
            </h2>
            <p className="text-sm text-slate-400">
              Manage paymentTypes from Google Sheets • {paymentTypes.length} {paymentTypes.length === 1 ? 'payment type' : 'paymentTypes'}
            </p>
          </div>
          <button
            onClick={handleStartAdd}
            disabled={isUpdating || isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment Type
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-900/20 border-b border-blue-700/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">
              Real-Time Google Sheets Integration
            </h3>
            <p className="text-slate-300 text-xs">
              Properties are stored in <strong>Data sheet (Column D)</strong>. Changes automatically update the <strong>P&L sheet</strong> via Apps Script.
              All formulas, totals, and formatting are managed automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Payment Type Name
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {/* Add new row */}
                {isAdding && (
                  <tr className="bg-blue-900/10">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <Plus className="w-4 h-4 text-blue-500" />
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
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSaveAdd}
                          disabled={isUpdating || !newValue.trim()}
                          className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                          title="Save"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelAdd}
                          disabled={isUpdating}
                          className="p-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Existing paymentTypes */}
                {paymentTypes.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
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
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      ) : (
                        <span className="text-white font-medium">{item}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingIndex === idx ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveEdit(item)}
                            disabled={isUpdating || !editValue.trim()}
                            className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Save"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="p-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(idx, item)}
                            disabled={isUpdating || isAdding}
                            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleDelete(idx, item)}
                            disabled={isUpdating || isAdding}
                            className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {paymentTypes.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-slate-400">No paymentTypes found</p>
                      <p className="text-sm text-slate-500 mt-1">Click &quot;Add Payment Type&quot; to create your first payment type</p>
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
          <div className={`px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border ${
            toast.type === 'success'
              ? 'bg-green-900/90 border-green-700/50 text-green-100'
              : toast.type === 'error'
              ? 'bg-red-900/90 border-red-700/50 text-red-100'
              : 'bg-blue-900/90 border-blue-700/50 text-blue-100'
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
