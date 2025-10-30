import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import BASE_URL from '../../constants/config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AuthLoading = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('🔍 Iniciando verificación de login...');
      try {
        const token = await AsyncStorage.getItem('token');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        console.log('📦 Token obtenido:', token);
        console.log('📦 isLoggedIn:', isLoggedIn);

        if (token && isLoggedIn === 'true') {
          console.log('✅ Token e isLoggedIn válidos. Verificando con el backend...');
          const response = await axios.post(`${BASE_URL}/userdata`, {
            token: token,
          });

          console.log('📡 Respuesta del backend:', response.data);

          if (response.data.status === 'OK') {
            // El token es válido, ir al layout principal
            console.log('✅ Token válido. Navegando a MainLayout.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainLayout' }],
            });
          } else {
            console.warn('⚠️ No logueado o token inválido. Redirigiendo a Home.');
            throw new Error('Usuario no encontrado');
          }
        } else {
          throw new Error('No logueado');
        }
      } catch (error) {
        // Token inválido o error al conectar
        console.error('❌ Error en checkLoginStatus:', error);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.setItem('isLoggedIn', 'false');

        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E65B00" />
    </View>
  );
};

export default AuthLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
    
  },
});
