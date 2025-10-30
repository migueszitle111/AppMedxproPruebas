import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

interface ComentarioModalProps {
  visible: boolean;
  title?: string;
  initialComentario: string;
  onSave: (newComentario: string) => void;
  onCancel: () => void;
}

const ComentarioModal: React.FC<ComentarioModalProps> = ({
  visible,
  title = 'Comentario sobre caso clínico',
  initialComentario,
  onSave,
  onCancel,
}) => {
  const [editedComentario, setEditedComentario] = useState(initialComentario);

  // Sincronizar con el texto inicial cuando el modal se abre
  useEffect(() => {
    if (visible) {
      setEditedComentario(initialComentario);
    }
  }, [visible, initialComentario]);

  const handleSave = () => {
    onSave(editedComentario.trim());
  };

  const handleCancel = () => {
    setEditedComentario(initialComentario); // Restaurar el texto original
    onCancel();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay} pointerEvents="auto">
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.modalContent}>
          <TextInput
            style={styles.textInput}
            value={editedComentario}
            onChangeText={setEditedComentario}
            placeholder="Comentario sobre caso clínico..."
            placeholderTextColor="#666"
            multiline
            autoFocus
            scrollEnabled={true}
            textAlignVertical="top"
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Footer con botones */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#222',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#333',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'LuxoraGrotesk-Light',
    textAlign: 'justify',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#222',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#ff4500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ComentarioModal;