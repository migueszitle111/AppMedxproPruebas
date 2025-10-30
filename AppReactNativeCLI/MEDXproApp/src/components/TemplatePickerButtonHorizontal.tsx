// src/components/TemplatePickerButtonHorizontal.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import TemplatePickerModalHorizontal, { PlantillaId } from './TemplatePickerModalHorizontal';

export default function TemplatePickerButtonHorizontal({
  value,
  onChange,
  label = 'Plantilla H',
}: {
  value: PlantillaId;
  onChange: (id: PlantillaId) => void;
  label?: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          marginLeft: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#ff4500',
        }}
      >
        <Text style={{ color: '#fff' }}>
          {label}: {value === 'none' ? '—' : value}
        </Text>
      </TouchableOpacity>

      <TemplatePickerModalHorizontal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={onChange}
      />
    </>
  );
}
