'use client';

import { useState } from 'react';
import { Loader2, Edit2, Trash2, Plus, Check, X } from 'lucide-react';

interface CategoryTableProps {
  title: string;
  description: string;
  items: string[];
  loading: boolean;
  icon: string;
  categoryType: 'property' | 'typeOfOperation' | 'typeOfPayment';
  onUpdate: (type: string, action: 'add' | 'edit' | 'delete', oldValue?: string, newValue?: string, index?: number) => Promise<void>;
  isUpdating?: boolean;
}

export default function CategoryTable({
  title,
  description,
  items,
  loading,
  icon,
  categoryType,
  onUpdate,
  isUpdating = false
}: CategoryTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');

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
      await onUpdate(categoryType, 'edit', oldValue, editValue.trim());
      handleCancelEdit();
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleDelete = async (index: number, value: string) => {
    if (!confirm(`Are you sure you want to delete "${value}"?\n\nThis cannot be undone.`)) {
      return;
    }

    try {
      await onUpdate(categoryType, 'delete', value, undefined, index);
    } catch (error) {
      console.error('Error deleting:', error);
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
      handleCancelAdd();
      return;
    }

    try {
      await onUpdate(categoryType, 'add', undefined, newValue.trim());
      handleCancelAdd();
    } catch (error) {
      console.error('Error adding:', error);
    }
  };
  return (
    <div className="bg-gradient-to-br from-bg-card to-black backdrop-blur-sm border border-border-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>

              <h2 className="font-bebasNeue text-2xl text-white uppercase tracking-wide">{title}</h2>
              <p className="font-aileron text-sm text-text-secondary">{description}</p>
            </div>
          </div>
          <button
            onClick={handleStartAdd}
            disabled={loading || isUpdating || isAdding}
            className="font-aileron px-4 py-2 bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-yellow animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-black/50">
                <th className="font-bebasNeue text-left px-6 py-3 text-xs text-text-secondary uppercase tracking-wider">
                  #
                </th>
                <th className="font-bebasNeue text-left px-6 py-3 text-xs text-text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="font-bebasNeue text-right px-6 py-3 text-xs text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {/* Add new row */}
              {isAdding && (
                <tr className="bg-yellow/10">
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    <Plus className="w-4 h-4 text-yellow" />
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
                      placeholder="Enter new category name..."
                      autoFocus
                      disabled={isUpdating}
                      className="w-full bg-bg-card border border-border-card rounded-lg px-3 py-2 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50"
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
                        className="p-2 bg-bg-card hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-border-card"
                        title="Cancel"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing items */}
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className="bg-bg-card hover:bg-black/50 transition-colors"
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
                        className="font-aileron w-full bg-bg-card border border-border-card rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50"
                      />
                    ) : (
                      <span className="font-aileron text-white font-medium">{item}</span>
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
                          className="p-2 bg-bg-card hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-border-card"
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
                          className="p-2 bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-glow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-black" />
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

              {items.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <p className="font-aileron text-text-secondary">No items found</p>
                    <p className="font-aileron text-sm text-text-secondary mt-1">Click &quot;Add New&quot; to create your first category</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

