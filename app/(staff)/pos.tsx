import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '@/api/client';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import Toast from 'react-native-toast-message';

interface InventoryItem {
  _id: string;
  item: {
    _id: string;
    itemCode: string;
    itemName: string;
    unitPrice: number;
    gstRate?: number;
    posEnabled: boolean;
    posConfig?: {
      posPrice?: number;
      barcode?: string;
    };
  };
  warehouse?: {
    _id: string;
    warehouseName: string;
  };
  quantity: number;
}

interface POSCustomer {
  _id: string;
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  isWalkIn: boolean;
}

interface CartItem {
  inventoryId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  price: number;
  qty: number;
  maxStock: number;
  gstRate: number;
  unit: string;
}

export default function POSScreen() {
  const [loading, setLoading] = useState(false);
  
  // Customers state
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<POSCustomer | null>(null);
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Inventory search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Cart & checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentReceived, setPaymentReceived] = useState('');

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await client.get<{ success: boolean; data: POSCustomer[] }>('/api/pos/customers');
      if (res.data?.success && res.data.data) {
        setCustomers(res.data.data);
        // Default to first Walk-in customer or first found
        const walkIn = res.data.data.find(c => c.isWalkIn || c.name.toLowerCase().includes('walk-in'));
        if (walkIn) {
          setSelectedCustomer(walkIn);
        } else if (res.data.data.length > 0) {
          setSelectedCustomer(res.data.data[0]);
        }
      }
    } catch (err) {
      console.warn('[POS] Failed to load POS customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve();
      if (active) {
        void loadCustomers();
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: newCustName.trim(),
        mobile: newCustPhone.trim() || undefined,
        email: newCustEmail.trim() || undefined,
        gstin: newCustGstin.trim() || undefined,
      };
      const res = await client.post<{ success: boolean; data: POSCustomer }>('/api/pos/customers', payload);
      if (res.data?.success && res.data.data) {
        const created = res.data.data;
        setCustomers(prev => [created, ...prev]);
        setSelectedCustomer(created);
        setShowCustModal(false);
        // Clear fields
        setNewCustName('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustGstin('');
        Toast.show({ type: 'success', text1: 'Customer selected', text2: created.name });
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      Alert.alert('Error', error.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInventory = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await client.get<{ success: boolean; data: InventoryItem[] }>('/api/inventory', {
        params: {
          posOnly: true,
          search: query,
          limit: 10,
        },
      });
      if (res.data?.success && res.data.data) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.warn('[POS] Inventory search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const addToCart = (item: InventoryItem) => {
    const invId = item._id;
    const existing = cart.find(c => c.inventoryId === invId);
    
    // Check stock availability
    const availableQty = item.quantity;
    if (availableQty <= 0) {
      Alert.alert('Out of Stock', `${item.item.itemName} has no stock in this warehouse.`);
      return;
    }

    if (existing) {
      if (existing.qty >= availableQty) {
        Alert.alert('Limit Reached', `Only ${availableQty} units available in stock.`);
        return;
      }
      setCart(prev => prev.map(c => c.inventoryId === invId ? { ...c, qty: c.qty + 1 } : c));
    } else {
      // Determine POS price (posPrice overrides unitPrice if set)
      const price = item.item.posConfig?.posPrice || item.item.unitPrice || 0;
      const newItem: CartItem = {
        inventoryId: invId,
        itemId: item.item._id,
        itemCode: item.item.itemCode,
        itemName: item.item.itemName,
        price,
        qty: 1,
        maxStock: availableQty,
        gstRate: item.item.gstRate || 18,
        unit: 'piece',
      };
      setCart(prev => [...prev, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
    Toast.show({ type: 'success', text1: 'Added to cart', text2: item.item.itemName, position: 'bottom' });
  };

  const updateCartQty = (invId: string, newQty: number) => {
    const item = cart.find(c => c.inventoryId === invId);
    if (!item) return;

    if (newQty <= 0) {
      setCart(prev => prev.filter(c => c.inventoryId !== invId));
      return;
    }

    if (newQty > item.maxStock) {
      Alert.alert('Insufficient Stock', `Only ${item.maxStock} units available.`);
      return;
    }

    setCart(prev => prev.map(c => c.inventoryId === invId ? { ...c, qty: newQty } : c));
  };

  // --- Financial Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = Math.round(subtotal * (parseFloat(discountPercent) || 0) / 100);
  const netTotal = Math.max(0, subtotal - discount);

  // 18% GST (inclusive): netTotal = taxableAmount * (1 + gstRate/100)
  // We compute tax per item to be precise or use average 18%
  let totalCGST = 0;
  let totalSGST = 0;
  let taxableAmount = 0;

  cart.forEach(item => {
    const itemSub = (item.price * item.qty);
    const itemDisc = Math.round(itemSub * (parseFloat(discountPercent) || 0) / 100);
    const itemNet = Math.max(0, itemSub - itemDisc);
    const itemGstRate = item.gstRate;
    
    const itemTaxable = itemNet / (1 + itemGstRate / 100);
    const itemGst = itemNet - itemTaxable;
    
    taxableAmount += itemTaxable;
    totalCGST += itemGst / 2;
    totalSGST += itemGst / 2;
  });

  const grandTotal = netTotal;
  const receivedAmt = parseFloat(paymentReceived) || 0;
  const changeAmt = receivedAmt > grandTotal ? receivedAmt - grandTotal : 0;
  const dueAmt = receivedAmt < grandTotal ? grandTotal - receivedAmt : 0;

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select or add a customer');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Error', 'Your POS cart is empty');
      return;
    }
    if (!paymentReceived) {
      Alert.alert('Error', 'Please enter payment received amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        items: cart.map(c => ({
          inventoryId: c.inventoryId,
          itemName: c.itemName,
          qty: c.qty,
          price: c.price,
          gstRate: c.gstRate,
        })),
        discount: parseFloat(discountPercent) || 0,
        payment: {
          received: receivedAmt,
        },
        totals: {
          netTotal: parseFloat(netTotal.toFixed(2)),
          taxableAmount: parseFloat(taxableAmount.toFixed(2)),
          cgst: parseFloat(totalCGST.toFixed(2)),
          sgst: parseFloat(totalSGST.toFixed(2)),
          grandTotal: parseFloat(grandTotal.toFixed(2)),
        },
      };

      const res = await client.post<{
        success: boolean;
        customInvoiceNo: string;
        dueAmount: number;
        message?: string;
      }>('/api/pos/checkout', payload);

      if (res.data?.success) {
        const invoiceNo = res.data.customInvoiceNo;
        const due = res.data.dueAmount;
        
        Alert.alert(
          'Sale Completed',
          `Invoice: ${invoiceNo}\n${due > 0 ? `Remaining Due: ${formatINR(due)}` : 'Payment status: Paid'}`,
          [{ text: 'OK', onPress: () => resetPOS() }]
        );
      } else {
        Alert.alert('Error', res.data.message || 'Checkout failed');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Checkout Failed', error.response?.data?.message || error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const resetPOS = () => {
    setCart([]);
    setDiscountPercent('0');
    setPaymentReceived('');
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>POS Terminal</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetPOS} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={colors.error} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Customer Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Select Customer</Text>
              </View>
              <TouchableOpacity style={styles.addCustBtn} onPress={() => setShowCustModal(true)}>
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.addCustText}>Add Customer</Text>
              </TouchableOpacity>
            </View>

            {loadingCustomers ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <View style={styles.custPickerContainer}>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={styles.pickerArrow} />
                <FlatList
                  data={customers}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.custScroll}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => {
                    const isSelected = selectedCustomer?._id === item._id;
                    return (
                      <TouchableOpacity
                        style={[styles.custChip, isSelected && styles.custChipSelected]}
                        onPress={() => setSelectedCustomer(item)}
                      >
                        <Text style={[styles.custChipText, isSelected && styles.custChipTextSelected]}>
                          {item.name} {item.mobile ? `(${item.mobile.slice(-4)})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
            {selectedCustomer && (
              <View style={styles.custDetails}>
                <Text style={styles.custDetailText}>
                  Active: <Text style={{ fontWeight: '700' }}>{selectedCustomer.name}</Text>
                  {selectedCustomer.mobile ? ` | Mobile: ${selectedCustomer.mobile}` : ''}
                  {selectedCustomer.gstin ? ` | GSTIN: ${selectedCustomer.gstin}` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Product Search Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitleLabel}>Search Items</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by code, name, barcode..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => { void handleSearchInventory(text); }}
              />
              {searching && <ActivityIndicator color={colors.primary} style={styles.searchSpinner} />}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.resultsDropdown}>
                {searchResults.map(item => {
                  const price = item.item.posConfig?.posPrice || item.item.unitPrice || 0;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.resultItem}
                      onPress={() => addToCart(item)}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName} numberOfLines={1}>{item.item.itemName}</Text>
                        <Text style={styles.resultSub}>
                          Code: {item.item.itemCode} | Stock: {item.quantity} | {item.warehouse?.warehouseName || 'No Warehouse'}
                        </Text>
                      </View>
                      <Text style={styles.resultPrice}>{formatINR(price)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* POS Cart Items */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitleLabel}>POS Cart ({cart.length} items)</Text>
            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Ionicons name="cart-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyCartText}>No items added. Use the search bar above.</Text>
              </View>
            ) : (
              <View style={styles.cartList}>
                {cart.map(item => (
                  <View key={item.inventoryId} style={styles.cartItem}>
                    <View style={styles.cartInfo}>
                      <Text style={styles.cartName} numberOfLines={1}>{item.itemName}</Text>
                      <Text style={styles.cartMeta}>
                        {formatINR(item.price)} each | Max: {item.maxStock}
                      </Text>
                    </View>
                    
                    <View style={styles.cartRight}>
                      {/* Stepper */}
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateCartQty(item.inventoryId, item.qty - 1)}
                        >
                          <Ionicons name="remove" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.stepVal}>{item.qty}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateCartQty(item.inventoryId, item.qty + 1)}
                        >
                          <Ionicons name="add" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.itemTotal}>{formatINR(item.price * item.qty)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Calculations Summary */}
          {cart.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleLabel}>Bill Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatINR(subtotal)}</Text>
              </View>
              
              {/* Discount inputs */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount (%)</Text>
                <TextInput
                  style={styles.discountInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={discountPercent}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val) || 0;
                    if (parsed >= 0 && parsed <= 100) setDiscountPercent(val);
                  }}
                />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Net Taxable</Text>
                <Text style={styles.summaryValue}>{formatINR(taxableAmount)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST (9%)</Text>
                <Text style={styles.summaryValue}>{formatINR(totalCGST)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST (9%)</Text>
                <Text style={styles.summaryValue}>{formatINR(totalSGST)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{formatINR(grandTotal)}</Text>
              </View>

              {/* Settlement Section */}
              <View style={styles.settleContainer}>
                <View style={styles.settleRow}>
                  <Text style={styles.settleLabel}>Payment Received (₹)</Text>
                  <TextInput
                    style={styles.receivedInput}
                    keyboardType="numeric"
                    placeholder="Enter Cash/Online"
                    placeholderTextColor={colors.textMuted}
                    value={paymentReceived}
                    onChangeText={setPaymentReceived}
                  />
                </View>

                {receivedAmt > 0 && (
                  <View style={styles.settleInfo}>
                    {changeAmt > 0 ? (
                      <Text style={[styles.settleInfoText, { color: colors.success }]}>
                        Change to Return: <Text style={{ fontWeight: '900' }}>{formatINR(changeAmt)}</Text>
                      </Text>
                    ) : null}
                    {dueAmt > 0 ? (
                      <Text style={[styles.settleInfoText, { color: colors.error }]}>
                        Due Amount (Debt): <Text style={{ fontWeight: '900' }}>{formatINR(dueAmt)}</Text>
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Checkout Action Button */}
              <TouchableOpacity
                style={[styles.checkoutBtn, loading && styles.checkoutDisabled]}
                onPress={() => { void handleCheckout(); }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={colors.white} />
                    <Text style={styles.checkoutBtnText}>Complete POS Sale</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Add Customer Modal */}
        <Modal
          visible={showCustModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCustModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add POS Customer</Text>
                <TouchableOpacity onPress={() => setShowCustModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalForm}>
                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter customer name"
                    value={newCustName}
                    onChangeText={setNewCustName}
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter mobile (10-digit)"
                    keyboardType="phone-pad"
                    value={newCustPhone}
                    onChangeText={setNewCustPhone}
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="customer@email.com"
                    keyboardType="email-address"
                    value={newCustEmail}
                    onChangeText={setNewCustEmail}
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>GSTIN (Tax ID)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    autoCapitalize="characters"
                    value={newCustGstin}
                    onChangeText={setNewCustGstin}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmit, loading && styles.modalSubmitDisabled]}
                  onPress={() => { void handleCreateCustomer(); }}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.modalSubmitText}>Save & Select</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addCustBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  addCustText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  cartInfo: {
    flex: 1,
    gap: 2,
  },
  cartItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cartList: {
    marginTop: spacing.xs,
  },
  cartMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  cartName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cartRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  checkoutBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 14,
  },
  checkoutBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  checkoutDisabled: {
    backgroundColor: colors.textMuted,
  },
  custChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  custChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  custChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  custChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  custDetailText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  custDetails: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    padding: 10,
  },
  custPickerContainer: {
    position: 'relative',
  },
  custScroll: {
    paddingRight: 20,
  },
  discountInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    textAlign: 'right',
    width: 60,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 10,
  },
  emptyCartBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    gap: 8,
    paddingVertical: 40,
  },
  emptyCartText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  grandTotalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  grandTotalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  inputField: {
    gap: 6,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemTotal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    width: 70,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    padding: spacing.lg,
    width: '100%',
  },
  modalForm: {
    gap: 16,
    paddingVertical: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSubmit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: 8,
    paddingVertical: 12,
  },
  modalSubmitDisabled: {
    backgroundColor: colors.textMuted,
  },
  modalSubmitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  pickerArrow: {
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 2,
  },
  receivedInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'right',
    width: 140,
  },
  resetBtn: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  resetText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  resultName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  resultPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  resultSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  resultsDropdown: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 4,
    marginTop: 4,
    maxHeight: 250,
    paddingHorizontal: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  searchSpinner: {
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 2,
    gap: 10,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  settleContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  settleInfo: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  settleInfoText: {
    fontSize: 13,
  },
  settleLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  settleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepBtn: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stepVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: 30,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
