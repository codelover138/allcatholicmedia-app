import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CountryCode } from 'libphonenumber-js/max';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PHONE_COUNTRIES } from '@/lib/phone';

export function PhoneCountryPicker({ country, onSelect }: {
  country: CountryCode;
  onSelect: (country: CountryCode) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = PHONE_COUNTRIES.find((item) => item.code === country)!;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? PHONE_COUNTRIES.filter((item) =>
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          `+${item.callingCode}`.includes(query))
      : PHONE_COUNTRIES;
  }, [search]);

  return (
    <>
      <View style={styles.field}>
        <ThemedText type="smallBold" style={styles.label}>Country code</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Country code, ${selected.name}, plus ${selected.callingCode}`}
          onPress={() => setOpen(true)}
          style={[styles.select, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText numberOfLines={1}>{selected.code} +{selected.callingCode} ▾</ThemedText>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <ThemedText style={styles.heading}>Select country code</ThemedText>
            <Pressable onPress={() => { setOpen(false); setSearch(''); }} accessibilityRole="button">
              <ThemedText themeColor="blue">Done</ThemedText>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search country or code"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<ThemedText themeColor="textSecondary" style={styles.empty}>No countries found.</ThemedText>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, plus ${item.callingCode}`}
                onPress={() => { onSelect(item.code); setOpen(false); setSearch(''); }}
                style={[styles.option, { borderBottomColor: theme.border }]}>
                <ThemedText style={styles.countryName}>{item.name}</ThemedText>
                <ThemedText themeColor="textSecondary">+{item.callingCode}</ThemedText>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { width: 118, gap: Spacing.one + 2 },
  label: { fontSize: 12.5, letterSpacing: 0.4, opacity: 0.9 },
  select: { minHeight: 48, borderWidth: 1, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 10 },
  modal: { flex: 1, paddingHorizontal: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
  heading: { color: '#f3f6fa', fontSize: 20, fontWeight: '700' },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: Spacing.two },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, gap: 10 },
  countryName: { flex: 1 },
  empty: { paddingVertical: Spacing.four, textAlign: 'center' },
});
