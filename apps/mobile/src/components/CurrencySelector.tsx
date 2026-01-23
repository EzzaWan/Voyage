import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CurrencySelector() {
  const { selectedCurrency, setCurrency, loading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const selectedInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectorText}>{loading ? '...' : selectedCurrency}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setIsOpen(false)} 
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              style={styles.list}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCurrency;
                return (
                  <TouchableOpacity
                    style={[styles.currencyItem, isSelected && styles.currencyItemSelected]}
                    onPress={() => handleSelect(item.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyCode, isSelected && styles.currencyCodeSelected]}>
                        {item.code}
                      </Text>
                      <Text style={styles.currencyName}>{item.name}</Text>
                    </View>
                    <View style={styles.currencyRight}>
                      <Text style={[styles.currencySymbol, isSelected && styles.currencySymbolSelected]}>
                        {item.symbol}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// Compact version for header
export function CurrencyButton() {
  const { selectedCurrency, loading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrency } = useCurrency();

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.compactButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.compactButtonText}>{loading ? '...' : selectedCurrency}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setIsOpen(false)} 
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              style={styles.list}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCurrency;
                return (
                  <TouchableOpacity
                    style={[styles.currencyItem, isSelected && styles.currencyItemSelected]}
                    onPress={() => handleSelect(item.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyCode, isSelected && styles.currencyCodeSelected]}>
                        {item.code}
                      </Text>
                      <Text style={styles.currencyName}>{item.name}</Text>
                    </View>
                    <View style={styles.currencyRight}>
                      <Text style={[styles.currencySymbol, isSelected && styles.currencySymbolSelected]}>
                        {item.symbol}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Main Selector
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectorText: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.text,
    marginRight: 6,
  },
  chevron: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  
  // Compact Button
  compactButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactButtonText: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  
  // List
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 40,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyItemSelected: {
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md * 2,
    borderRadius: theme.borderRadius.md,
    borderBottomWidth: 0,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  currencyCodeSelected: {
    color: theme.colors.primary,
  },
  currencyName: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginRight: 10,
  },
  currencySymbolSelected: {
    color: theme.colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});




