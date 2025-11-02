'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import Toast from '@/components/Toast';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PaymentTypeManager() {
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPaymentType, setNewPaymentType] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const fetchPaymentTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories/payments');
      const result = await response.json();

      if (result.ok) {
        setPaymentTypes(result.data.paymentTypes || []);
      } else {
        showToast(result.error || 'Failed to load payment types', 'error');
      }
    } catch (error) {
      showToast('Failed to load payment types', 'error');
      console.error('Error fetching payment types:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payment types on mount
  useEffect(() => {
    fetchPaymentTypes();
  }, [fetchPaymentTypes]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAdd = async () => {
    if (!newPaymentType.trim()) {
      showToast('Payment type name cannot be empty', 'error');
      return;
    }

    try {
      const response = await fetch('/api/categories/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          newValue: newPaymentType.trim(),
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setPaymentTypes(result.data.paymentTypes || []);
        setNewPaymentType('');
        showToast('Payment type added successfully', 'success');
      } else {
        showToast(result.error || 'Failed to add payment type', 'error');
      }
    } catch (error) {
      showToast('Failed to add payment type', 'error');
      console.error('Error adding payment type:', error);
    }
  };

  const handleEdit = async (index: number) => {
    if (!editValue.trim()) {
      showToast('Payment type name cannot be empty', 'error');
      return;
    }

    try {
      const response = await fetch('/api/categories/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          oldValue: paymentTypes[index],
          newValue: editValue.trim(),
          index,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setPaymentTypes(result.data.paymentTypes || []);
        setEditingIndex(null);
        setEditValue('');
        showToast('Payment type updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to update payment type', 'error');
      }
    } catch (error) {
      showToast('Failed to update payment type', 'error');
      console.error('Error editing payment type:', error);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm(`Delete "${paymentTypes[index]}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/categories/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          oldValue: paymentTypes[index],
          index,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setPaymentTypes(result.data.paymentTypes || []);
        showToast('Payment type deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete payment type', 'error');
      }
    } catch (error) {
      showToast('Failed to delete payment type', 'error');
      console.error('Error deleting payment type:', error);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(paymentTypes[index]);
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
            Payment Type Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage payment types in Google Sheets (Data!D2:D)
          </p>
        </div>

        {/* Add New Payment Type */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPaymentType}
              onChange={(e) => setNewPaymentType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
              placeholder="Enter new payment type..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newPaymentType.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Payment Type
            </button>
          </div>
        </div>

        {/* Payment Types List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Current Payment Types ({paymentTypes.length})
            </h3>
            <button
              onClick={fetchPaymentTypes}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && paymentTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading payment types...
            </div>
          ) : paymentTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payment types found. Add your first payment type above.
            </div>
          ) : (
            <div className="space-y-2">
              {paymentTypes.map((paymentType, index) => (
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
                      <span className="flex-1 text-gray-900">{paymentType}</span>
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
            <strong>Note:</strong> Changes are immediately saved to Google Sheets (Data!D2:D).
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
