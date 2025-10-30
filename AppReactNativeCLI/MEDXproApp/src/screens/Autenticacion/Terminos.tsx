import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  BackHandler,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import axios from 'axios';
import BASE_URL from '../../constants/config';

export default function Terminos() {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAccept = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token no encontrado. Inicia sesión nuevamente.');
        return;
      }

      // 🔹 Enviar aceptación de términos al backend
      const res = await axios.put(`${BASE_URL}/userdataUpdate`, {
        token,
        termsAccepted: true,
        termsVersion: '1.0',
      });

      if (res.data.status === 'OK') {
        await AsyncStorage.setItem('termsAccepted', 'true');

        // 🔸 Animación de salida antes de navegar
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          navigation.navigate('VerificacionUsuario');
        });
      } else {
        Alert.alert('Error', 'No se pudo registrar la aceptación de los términos.');
      }
    } catch (error) {
      console.error('Error al aceptar términos:', error);
      Alert.alert('Error', 'Ocurrió un problema al aceptar los términos.');
    }
  };

  const handleReject = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Rechazar términos',
        'Si rechazas los términos no podrás usar la aplicación. ¿Deseas salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
    } else {
      Alert.alert(
        'Rechazar términos',
        'Si rechazas los términos no podrás usar la aplicación. ¿Deseas salir de la app?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: () =>
              Alert.alert(
                'Cierre de app',
                'Por favor, presiona el botón de inicio para cerrar la app.'
              ),
          },
        ]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.title}>Términos y Condiciones</Text>

        <Text style={styles.text}>
          Bienvenido a <Text style={styles.highlight}>mEDXproApp</Text>
          {'\n\n'}
          mEDXproApp no sustituye el conocimiento científico adquirido durante los cursos de
          especialización médica relacionados con el diagnóstico neuromuscular. Nuestro
          objetivo es facilitar herramientas para optimizar la práctica clínica y
          proporcionar guías de referencia actualizadas.
          {'\n\n'}
          La utilidad final del producto es responsabilidad del usuario, quien deberá contar
          con cédula profesional o estar avalado por instituciones formadoras o consejos
          médicos.
          {'\n\n'}
          Descarga nuestro aviso de privacidad en{' '}
          <Text style={styles.link}
            onPress={() => Linking.openURL('https://www.medxproapp.com')}
          >www.medxproapp.com</Text>
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            activeOpacity={0.8}
            onPress={handleReject}
          >
            <Animated.Text style={styles.buttonText}>Rechazar</Animated.Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            activeOpacity={0.8}
            onPress={handleAccept}
          >
            <Animated.Text style={styles.buttonText}>Aceptar</Animated.Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 30,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#FF9500',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  text: {
    color: '#CCCCCC',
    fontSize: 14.3,
    lineHeight: 25,
    marginBottom: 30,
    textAlign: 'justify',
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  highlight: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  link: {
    color: '#FF9500',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#FF9500',
  },
  rejectButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'LuxoraGrotesk-Bold',
    fontSize: 16,
  },
});
