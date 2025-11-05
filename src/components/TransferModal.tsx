import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import CustomPicker from './CustomPicker';
import type { TransferRequest } from '../types';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transfer: TransferRequest) => Promise<void>;
  accounts: string[];
  preselectedAccount?: string;
}

export default function TransferModal({
  visible,
  onClose,
  onSubmit,
  accounts,
  preselectedAccount,
}: TransferModalProps) {
  const [fromAccount, setFromAccount] = useState(preselectedAccount || '');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter out selected "from" account from "to" options
  const toAccountOptions = accounts.filter(acc => acc !== fromAccount);

  const handleSubmit = async () => {
    // Validation
    if (!fromAccount) {
      Alert.alert('Validation Error', 'Please select the source account');
      return;
    }

    if (!toAccount) {
      Alert.alert('Validation Error', 'Please select the destination account');
      return;
    }

    if (fromAccount === toAccount) {
      Alert.alert('Validation Error', 'Source and destination must be different');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      const transfer: TransferRequest = {
        fromAccount,
        toAccount,
        amount: amountNum,
        note: note.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      await onSubmit(transfer);

      // Reset form
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setNote('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Transfer Failed',
        error instanceof Error ? error.message : 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Transfer Funds</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* From Account */}
            <CustomPicker
              label="From Account"
              selectedValue={fromAccount}
              onValueChange={setFromAccount}
              items={accounts}
              placeholder="Select source account"
              required
            />

            {/* To Account */}
            <CustomPicker
              label="To Account"
              selectedValue={toAccount}
              onValueChange={setToAccount}
              items={toAccountOptions}
              placeholder="Select destination account"
              required
            />

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                placeholderTextColor="#666666"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Note (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note for this transfer"
                placeholderTextColor="#666666"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>Complete Transfer</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: COLORS.YELLOW,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '100%',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.YELLOW,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.2,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '700',
  },
});
