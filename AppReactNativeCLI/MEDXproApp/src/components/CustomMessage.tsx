import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseMs?: number; // Optional auto-close time in milliseconds
};

function CustomMessage({ visible, title, message, onClose, autoCloseMs = 10000 }: Props): React.JSX.Element {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible) {
      timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
    }
    return () => clearTimeout(timer);
  }, [visible, autoCloseMs, onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            style={styles.messageContainer}
            contentContainerStyle={{ paddingVertical: 5 }}
          >
            <Text style={styles.message}>{message}</Text>
          </ScrollView>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default CustomMessage;

const styles = StyleSheet.create({
  overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)', // fondo más oscuro
      alignItems: 'center',
      justifyContent: 'center',
    },
    box: {
      width: '85%',
      maxHeight: '70%',
      backgroundColor: '#1E1E1E', // gris oscuro / casi negro
      padding: 25,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E65800', // borde naranja sutil
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#E65800', // título en naranja
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: '#FFFFFF', // mensaje en blanco
    },
    messageContainer: {
      width: '100%',
      marginBottom: 20,
    },
    btn: {
      backgroundColor: '#E65800', // botón naranja
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 10,
    },
    btnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
});
