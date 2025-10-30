import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Switch,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Configuracion() {
  // --- PIN ---
  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [secure, setSecure] = useState(true);
  const [storedPin, setStoredPin] = useState('');

  // --- Huella ---
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const checkData = async () => {
      try {
        // Revisar si hay PIN
        const creds = await Keychain.getGenericPassword({ service: 'app-pin' });
        if (creds) {
          setHasPin(true);
          setPin(creds.password);
          setStoredPin(creds.password);
        }

        // Revisar si hay huella habilitada
        const bio = await Keychain.getGenericPassword({
          service: 'app-biometric',
          authenticationPrompt: { title: 'Confirmar identidad' },
        });
        if (bio) setBiometricEnabled(true);
      } catch (error) {
        console.log('Error al verificar credenciales:', error);
      }
    };
    checkData();
  }, []);

  // --- Guardar PIN ---
  const guardarPin = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }
    try {
      await Keychain.setGenericPassword('user', pin, {
        service: 'app-pin',
      });
      Alert.alert('Éxito', 'PIN guardado correctamente');
      setHasPin(true);
      setStoredPin(pin);
      setEditMode(false);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar el PIN');
    }
  };
  // --- Eliminar PIN ---
  const eliminarPin = async () => {
    try {
      await Keychain.resetGenericPassword({ service: 'app-pin' });
      setHasPin(false);
      setPin('');
      setStoredPin('');
      setEditMode(false);
      Alert.alert('Éxito', 'PIN eliminado correctamente');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo eliminar el PIN');
    }
  };

  const cancelarEdicion = () => {
    setEditMode(false);
    setPin(storedPin);
    setSecure(true);
  };

// --- Habilitar huella ---
const habilitarHuella = async () => {
  try {
    await Keychain.setGenericPassword('user', 'biometric-enabled', {
      service: 'app-biometric',
      authenticationPrompt: { title: 'Registrar huella' },
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    });
    await AsyncStorage.setItem('biometricEnabled', 'true');
    setBiometricEnabled(true);
    Alert.alert('Éxito', 'Huella habilitada correctamente');
  } catch (error: any) {
    console.log('Error al habilitar huella:', error);

    // Si el error es porque no hay huellas registradas en el dispositivo
    if (error.message?.toLowerCase().includes('no enrolled') ||
        error.message?.toLowerCase().includes('not enrolled')) {
      Alert.alert(
        'No se puede habilitar la huella',
        'No se encontró ninguna huella registrada en este dispositivo.'
      );
    } else {
      Alert.alert('Error', 'No se pudo habilitar la huella');
    }

    setBiometricEnabled(false);
  }
};

  // --- Deshabilitar huella ---
  const deshabilitarHuella = async () => {
    try {
      await Keychain.resetGenericPassword({ service: 'app-biometric' });
      await AsyncStorage.setItem('biometricEnabled', 'false');
      setBiometricEnabled(false);
      Alert.alert('Éxito', 'Huella eliminada');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo eliminar la huella');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración de Seguridad</Text>

      {/* ----- SECCIÓN PIN ----- */}
      <Text style={styles.sectionTitle}>PIN</Text>
      {hasPin && !editMode ? (
        <View style={styles.row}>
          <Text style={styles.label}>PIN:</Text>
          <TextInput value={pin} secureTextEntry editable={false} style={styles.input} />
          <TouchableOpacity
            style={[styles.button, { marginLeft: 15 }]}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>PIN:</Text>
            <TextInput
              placeholder="Ingresa tu PIN"
              placeholderTextColor="#888"
              secureTextEntry={secure}
              keyboardType="numeric"
              maxLength={6}
              value={pin}
              onChangeText={setPin}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Image
                source={
                  secure
                    ? require('../../assets/Iconos/PNG/eye_off.png')
                    : require('../../assets/Iconos/PNG/eye.png')
                }
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={guardarPin}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>


            {hasPin && (
              <>
               <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#b00020' }]}
                  onPress={eliminarPin}
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Eliminar PIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#555' }]}
                  onPress={cancelarEdicion}
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}

      {/* ----- SECCIÓN HUELLA ----- */}
      <Text style={styles.sectionTitle}>Huella digital</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Usar huella</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={(value) => {
            if (value) habilitarHuella();
            else deshabilitarHuella();
          }}
          thumbColor={biometricEnabled ? '#FFA500' : '#888'}
        />
      </View>
      <Text style={styles.note}>
        ⚠️ Para usar esta función es necesario tener registrada al menos una huella en tu dispositivo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    //fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  note: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginLeft: 5,
    marginRight: 10,
    textAlign: 'left',
    fontFamily: 'LuxoraGrotesk-Light',
  },
  sectionTitle: {
    color: '#FFA500',
    fontSize: 18,
    //fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
    fontFamily: 'LuxoraGrotesk-Book',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
    //fontWeight: '600',
    fontFamily: 'LuxoraGrotesk-Light',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA500',
    color: '#fff',
    fontSize: 18,
    paddingVertical: 8,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  eyeIcon: {
    width: 22,
    height: 22,
    marginLeft: 10,
    tintColor: '#FFA500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    backgroundColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: '#121212',
    //fontWeight: '600',
    fontSize: 14,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 0,
  },
  saveButtonText: {
    color: '#121212',
    //fontWeight: '700',
    fontSize: 16,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
});
