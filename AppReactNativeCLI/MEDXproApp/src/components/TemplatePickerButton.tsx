// components/TemplatePickerButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import TemplatePickerModal, { PlantillaId } from './TemplatePickerModal';

export default function TemplatePickerButton({
  value,
  onChange,
}: {
  value: PlantillaId;
  onChange: (id: PlantillaId) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ff4500' }}
      >
        <Text style={{ color: '#fff' }}>
          Plantilla: {value === 'none' ? '—' : value}
        </Text>
      </TouchableOpacity>

      <TemplatePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={onChange}
      />
    </>
  );
}
