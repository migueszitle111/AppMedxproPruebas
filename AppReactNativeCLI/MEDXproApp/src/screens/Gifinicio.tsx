import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types'; // Ajusta según la ubicación de tus tipos
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GifInicio = () => {
  const navigation = useNavigation<NavigationProp>();

  /*useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('AuthLoading'); // Cambia al nombre exacto de tu pantalla de bienvenida
    }, 6000); // Duración en milisegundos. 6000 = 6 segundos

    return () => clearTimeout(timer);
  }, [ navigation ]);*/
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si existe un PIN
        const pin = await Keychain.getGenericPassword({ service: 'app-pin' });
        // Verificar si existe huella habilitada (⚠️ sin authenticationPrompt aquí)
        //const bio = await Keychain.getGenericPassword({ service: 'app-biometric' });
        const bioFlag = await AsyncStorage.getItem('biometricEnabled');

        if (pin || bioFlag === 'true') {
          // Si existe PIN o Huella → mandar a AuthChoice
          navigation.replace('AuthChoice');
        } else {
          // Si no hay ninguno → pasar directo a AuthLoading
          navigation.replace('AuthLoading');
        }
      } catch (error) {
        console.log('Error verificando credenciales:', error);
        // fallback → AuthLoading
        navigation.replace('AuthLoading');
      }
    };

    // Espera 6 segundos mostrando el GIF, luego verifica
    const timer = setTimeout(() => {
      checkAuth();
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FastImage
        source={require('../assets/GifmDEXpro/mEDXpro.gif')} // Cambia esta ruta al archivo real de tu GIF
        style={styles.gif}
        resizeMode={FastImage.resizeMode.contain}
      />
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Puedes cambiar el fondo si quieres
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: 500,
    height: 500,
  },
});

export default GifInicio;
