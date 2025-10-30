// src/components/TemplatePickerModalHorizontal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/** Mantén el mismo contrato que usas en Visual.tsx */
export type PlantillaId = 'none' | 'A' | 'B' | 'C';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: PlantillaId) => void;
};

type TemplateOption = {
  id: PlantillaId;
  label: string;
  accent: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'A', label: 'Plantilla A', accent: '#111111' },
  { id: 'B', label: 'Plantilla B', accent: '#ff7a00' },
  { id: 'C', label: 'Plantilla C', accent: '#7a7a7a' },
  { id: 'none', label: 'Sin plantilla', accent: '#e5e5e5' },
];

const chunkOptions = (items: TemplateOption[], size: number): TemplateOption[][] => {
  const rows: TemplateOption[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
};

export default function TemplatePickerModalHorizontal({ visible, onClose, onSelect }: Props) {
  const optionRows = React.useMemo(() => chunkOptions(TEMPLATE_OPTIONS, 2), []);

  const handleSelect = (id: PlantillaId) => {
    onSelect(id);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Elige una plantilla </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsWrapper}>
          {optionRows.map((row, idx) => (
            <View
              key={`row_${idx}`}
              style={[styles.optionsRow, idx < optionRows.length - 1 && styles.optionsRowSpacing]}
            >
              {row.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionTitle}>{option.label}</Text>

                  {/* Preview circular (igual al vertical) */}
                  <View style={styles.preview}>
                    <View
                      style={[
                        styles.previewCircle,
                        { borderColor: option.accent },
                        option.id === 'none' && styles.previewCircleNone,
                      ]}
                    >
                      <View
                        style={[
                          styles.previewCircleInner,
                          { backgroundColor: option.accent },
                          option.id === 'none' && styles.previewCircleInnerNone,
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {row.length === 1 && <View style={styles.optionSpacer} />}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '80%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#ff4500',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    marginLeft: 12,
  },
  optionsWrapper: {
    marginTop: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  optionsRowSpacing: {
    marginBottom: 16,
  },
  optionSpacer: {
    width: '45%',
    minWidth: 140,
    opacity: 0,
  },
  optionCard: {
    width: '45%',
    minWidth: 140,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    alignItems: 'center',
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  preview: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  // === Preview circular (idéntico al vertical) ===
  previewCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  previewCircleInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  previewCircleNone: {
    borderWidth: 3,
  },
  previewCircleInnerNone: {
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cancelButton: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ff4500',
  },
  cancelText: {
    color: '#ff4500',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
