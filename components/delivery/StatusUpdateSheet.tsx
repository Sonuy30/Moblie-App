import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { updateDeliveryStatus, DeliveryStatus } from '@/api/delivery';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  orderId: string;
  currentStatus: string;
  deliveryToken: string;
  onClose: () => void;
}

export default function StatusUpdateSheet({
  orderId,
  currentStatus,
  deliveryToken,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const nextStatus: Record<string, DeliveryStatus> = {
    packed:           'shipped',
    shipped:          'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  const nextLabel: Record<string, string> = {
    packed:           'Mark as Shipped',
    shipped:          'Mark as Out for Delivery',
    out_for_delivery: 'Mark as Delivered',
  };

  const mutation = useMutation({
    mutationFn: () => updateDeliveryStatus(orderId, {
      status: nextStatus[currentStatus],
      deliveryToken,
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-deliveries'] });
      onClose();
      Alert.alert('Success', 'Status updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Update failed. Check your connection.');
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{nextLabel[currentStatus]}</Text>
      <TextInput
        style={styles.input}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
      />
      <Pressable 
        style={[styles.button, mutation.isPending && styles.buttonDisabled]} 
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending ? 'Updating...' : nextLabel[currentStatus]}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#185FA5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
