import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface ExportSuccessData {
  filename: string;
  path: string;
}

interface ExportSuccessModalProps {
  exportSuccess: ExportSuccessData | null;
  onClose: () => void;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
  exportSuccess,
  onClose,
}) => {
  const [isPresionarCerrar, setIsPresionarCerrar] = React.useState(false);
  const [isPresionarAbrir, setIsPresionarAbrir] = React.useState(false);

  if (!exportSuccess) return null;

  const handleOpen = async () => {
    try {
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.android.actionViewIntent(
          exportSuccess.path,
          'application/pdf'
        );
      } else if (Platform.OS === 'ios') {
        await ReactNativeBlobUtil.ios.openDocument(exportSuccess.path);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        `No se pudo abrir el archivo.\n\n${error?.message ?? error}`
      );
    }
  };

  return (
    <View style={styles.successOverlay}>
      <View style={styles.successCard}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: isPresionarCerrar ? 'red' : '#111' }]}
          onPressIn={() => setIsPresionarCerrar(true)}
          onPressOut={() => setIsPresionarCerrar(false)}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.successTitle}>¡Reporte listo!</Text>
        <Text style={styles.successFilename}>{exportSuccess.filename}</Text>
        <Text style={styles.successHint}>Se guardó en:</Text>
        <Text
          style={styles.successPath}
          numberOfLines={2}
          ellipsizeMode="middle"
        >
          {exportSuccess.path}
        </Text>
        <View style={styles.successButtonsRow}>
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: isPresionarAbrir ? 'red' : '#ff4500' }]}
            onPressIn={() => setIsPresionarAbrir(true)}
            onPressOut={() => setIsPresionarAbrir(false)}
            onPress={handleOpen}
            activeOpacity={0.85}
          >
            <Text style={styles.successButtonText}>Abrir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  successCard: {
    width: '80%',
    //maxWidth: 340,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#ff9e4eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    color: '#ff4500',
    fontSize: 20,
    //fontWeight: '700',
    fontFamily: 'LuxoraGrotesk-Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  successFilename: {
    color: '#fff',
    fontSize: 15,
    //fontWeight: '600',
    fontFamily: 'LuxoraGrotesk-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successHint: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  successPath: {
    color: '#ddd',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  successButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  successButton: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ff4500',
    borderWidth: 1,
    borderColor: '#ff4500',
    alignItems: 'center',
  },
  successButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#666',
  },
  successButtonText: {
    color: '#fff',
    //fontWeight: '700',
    fontFamily: 'LuxoraGrotesk-Bold',
    fontSize: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  closeButton: {
    position: 'absolute',
    //marginTop: 12,
    //marginLeft: 12,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
});
