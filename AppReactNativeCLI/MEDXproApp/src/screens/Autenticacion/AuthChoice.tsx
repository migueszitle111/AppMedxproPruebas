import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [modo, setModo] = useState<'loading' | 'choice' | 'pin' | 'huella'>('loading');
  const [inputPin, setInputPin] = useState('');
  const [tienePin, setTienePin] = useState(false);
  const [tieneHuella, setTieneHuella] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  // Animaciones
  const translateY = useSharedValue(0);        // mueve las opciones arriba/abajo
  const formOpacity = useSharedValue(0);      // opacidad del formulario
  const formTranslateY = useSharedValue(20);  // pequeño slide del formulario

  // Revisar si existe PIN al montar
  /*useEffect(() => {
    const checkPin = async () => {
      try {
        const creds = await Keychain.getGenericPassword({ service: 'app-pin' });
        if (!creds) {
          // no hay PIN → enviar a Gifinicio
          navigation.replace('Gifinicio');
        } else {
          // hay PIN → mostrar elección
          setModo('choice');
        }
      } catch (error) {
        console.log('Error al verificar PIN:', error);
        navigation.replace('Gifinicio'); // fallback si hay error
      }
    };

    checkPin();
  }, [navigation]);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const bio = await Keychain.getGenericPassword({
          service: 'app-biometric',
          //authenticationPrompt: { title: 'Verificando huella' },
        });

        if (bio) {
          // Huella habilitada → mostrar opción
          setModo('choice'); // o mostrar botón huella
        } else {
          // No habilitada → solo mostrar PIN
          setModo('pin');
        }
      } catch (error) {
        console.log('Huella no habilitada o error:', error);
        setModo('pin');
      }
    };

    checkBiometric();
  }, []);*/
    // Revisar si hay PIN o Huella al montar
  useEffect(() => {
    const checkAuthMethods = async () => {
      try {
        const pin = await Keychain.getGenericPassword({ service: 'app-pin' });
        //const bio = await Keychain.getGenericPassword({ service: 'app-biometric' });
        const bioFlag = await AsyncStorage.getItem('biometricEnabled');

        setTienePin(!!pin);
        setTieneHuella(bioFlag === 'true');

        if (pin && bioFlag === 'true') {
          setModo('choice'); // mostrar ambos
        } else if (pin) {
          setModo('pin'); // solo PIN
        } else if (bioFlag === 'true') {
          setModo('huella'); // solo Huella
        } else {
          // ningún método → regresar a Gifinicio
          navigation.replace('AuthLoading');
        }
      } catch (error) {
        console.log('Error al verificar métodos:', error);
        navigation.replace('AuthLoading');
      }
    };

    checkAuthMethods();
  }, [navigation]);

  // Control de animaciones según modo
  useEffect(() => {
    if (modo === 'choice') {
      translateY.value = withTiming(0, { duration: 420 });
      formOpacity.value = withTiming(0, { duration: 220 });
      formTranslateY.value = withTiming(20, { duration: 300 });
    } else {
      translateY.value = withTiming(-80, { duration: 420 });
      formOpacity.value = withTiming(1, { duration: 320 });
      formTranslateY.value = withTiming(0, { duration: 320 });
    }
  }, [modo, translateY, formOpacity, formTranslateY]);

  const optionsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const pinScale = useSharedValue(1);
  const huellaScale = useSharedValue(1);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));
  const huellaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: huellaScale.value }],
  }));

  const handleSelect = (type: 'pin' | 'huella') => {
    setModo(type);
  };

  const volverChoice = () => setModo('choice');

  const verificarPin = async () => {
    try {
      const creds = await Keychain.getGenericPassword({ service: 'app-pin' });

      if (!creds) {
        Alert.alert('Error', 'No hay PIN configurado. Ve a Configuración.');
        return;
      }

      if (creds.password === inputPin) {
        navigation.replace('AuthLoading'); // acceso concedido
      } else {
        Alert.alert('Error', 'PIN incorrecto');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo verificar el PIN');
    }
  };

  // Dentro del modo 'huella'
  const autenticarHuella = async () => {
    try {
      // Intenta obtener credenciales protegidas por biometría
      const creds = await Keychain.getGenericPassword({
        service: 'app-biometric',
        authenticationPrompt: { title: 'Verificando huella...' },
      });

      if (creds) {
        // Acceso concedido
        navigation.replace('AuthLoading');
      } else {
        Alert.alert('Error', 'No se pudo autenticar con la huella');
      }
    } catch (error: any) {
      if (error.message.includes('User canceled')) {
        // Usuario canceló el prompt
        console.log('Huella cancelada por usuario');
      } else {
        Alert.alert('Error', 'Autenticación fallida: ' + error.message);
      }
    }
  };


  // Pantalla de carga inicial mientras se revisa el PIN
  if (modo === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Opciones lado a lado (PIN / Huella) */}
      <Animated.View style={[styles.optionsRow, optionsStyle]}>
        <Animated.View style={[styles.optionWrapper, pinStyle]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.optionCard,
              !tienePin && styles.optionCardDisabled, // deshabilitar si no hay PIN
              modo === 'pin' ? styles.optionCardActive : undefined,
            ]}
            onPress={() => {
              if (!tienePin){Alert.alert('PIN no configurado', 'Debes configurar un PIN primero'); return;}
              handleSelect('pin')}}
            onPressIn={() => (pinScale.value = withTiming(0.95, { duration: 120 }))}
            onPressOut={() => (pinScale.value = withTiming(1, { duration: 120 }))}
          >
            <Text style={[styles.optionTitle, modo === 'pin' ? styles.optionTitleActive : undefined,
              !tienePin && styles.optionTitleDisabled,
            ]}>
              PIN
            </Text>
            <Text style={[styles.optionSubtitle, !tienePin && styles.optionSubtitleDisabled]}>Código numérico</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.optionWrapper, huellaStyle]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.optionCard,
              !tieneHuella && styles.optionCardDisabled, // 🔒 si no hay huella
              modo === 'huella' ? styles.optionCardActive : undefined,
            ]}
            onPress={() => {
              if (!tieneHuella) {
                Alert.alert('Huella no configurada', 'Debes activar la huella en la aplicación antes de usar esta opción.');
                return;
              }
              handleSelect('huella');
            }}
            onPressIn={() => (huellaScale.value = withTiming(0.95, { duration: 120 }))}
            onPressOut={() => (huellaScale.value = withTiming(1, { duration: 120 }))}
          >
            <Text style={[styles.optionTitle, modo === 'huella' ? styles.optionTitleActive : undefined,
              !tieneHuella && styles.optionTitleDisabled,
            ]}>
              Huella
            </Text>
            <Text style={[styles.optionSubtitle, !tieneHuella && styles.optionSubtitleDisabled]}>Huella-biométrica</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Formulario / UI que aparece debajo */}
      <Animated.View style={[styles.formContainer, formStyle]}>
        {modo === 'pin' && (
          <>
            <TextInput
              placeholder="Ingresa tu PIN"
              placeholderTextColor="#999"
              secureTextEntry
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              value={inputPin}
              onChangeText={setInputPin}
              style={styles.input}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={verificarPin} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostButton} onPress={volverChoice} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Volver</Text>
            </TouchableOpacity>
          </>
        )}

        {modo === 'huella' && (
          <>
            <Text style={styles.infoText}>Coloca tu dedo en el sensor para autenticar.</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={autenticarHuella}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Escanear Huella</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostButton} onPress={volverChoice} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Volver</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 6,
  },
  optionWrapper: { flex: 1, marginHorizontal: 8 },
  optionCard: {
    marginHorizontal: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  optionCardActive: {
    backgroundColor: '#FFA500',
    shadowOpacity: 0.45,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  optionTitleActive: {
    color: '#121212',
  },
  optionSubtitle: {
    marginTop: 6,
    color: '#bbb',
    fontSize: 12,
    textAlign: 'center',
  },
  optionCardDisabled: {
    backgroundColor: '#ccc', // grisado
    borderColor: '#aaa',
  },
  optionTitleDisabled: {
    color: '#666',
  },
  optionSubtitleDisabled: {
    color: '#888',
  },
  formContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  input: {
    width: '86%',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    color: '#fff',
    fontSize: 18,
    paddingVertical: 10,
    marginBottom: 18,
    textAlign: 'center',
  },

  primaryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    alignItems: 'center',
    width: '60%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
  },

  ghostButton: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  ghostText: {
    color: '#aaa',
    fontSize: 14,
  },

  infoText: {
    color: '#ddd',
    marginBottom: 18,
    fontSize: 15,
  },
});
