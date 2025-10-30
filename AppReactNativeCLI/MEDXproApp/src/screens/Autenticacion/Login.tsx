import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes, } from '@react-native-google-signin/google-signin';
import BASE_URL from '../../constants/config';

function Login(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NavigationProp>();  // Usamos el tipo NavigationProp para la navegación
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit() {
    console.log(email,password);

    if (!email.trim() && !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Correo requerido', 'Por favor, ingresa tu correo.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Contraseña requerida', 'Por favor, ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);// Activar el indicador de carga

    const userData = {
      email: email,
      password,
    };
    axios
      .post(`${BASE_URL}/login`, userData) //http://192.168.88.168:5001/login 192.168.88.254
      .then(async res => {console.log(res.data);
        console.log('Respuesta completa del backend:', res.data);
        if(res.data.status === 'ok'){
          Alert.alert('Login Exitoso', 'El usuario ha iniciado sesión correctamente.');
          await AsyncStorage.setItem('token', res.data.data);
          await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));
          //navigation.navigate('Home');

          navigation.reset({
            index: 0,
            routes: [{ name: 'MainLayout' }],
          });
        }else{
          //Alert.alert('Error', JSON.stringify(res.data));
          Alert.alert('No se pudo iniciar sesión', 'El correo o contraseña es incorrecto.');
        }
      })
      .catch(error => {
        console.error('Error al iniciar sesión:', error);
        Alert.alert('Error', 'Error al iniciar sesión.');
      })
      .finally(() => setIsLoading(false));// Desactivar el indicador de carga
  }

  const signInWithGoogle = async () => {
    setIsLoading(true);// Activar el indicador de carga
    console.log('Entró a signInWithGoogle');
    try {
      await GoogleSignin.hasPlayServices(); // Verifica servicios de Google
      console.log('Tiene Play Services');

      const userInfo = await GoogleSignin.signIn(); // Abre el login de Google
      console.log('userInfo completo:', JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.data?.idToken;

      if (idToken) {
        console.log('Entramos a la condicion del token');
        // 🔁 Enviar el idToken al backend
        const res = await axios.post(`${BASE_URL}/login-google`, { idToken });

        if (res.data.status === 'ok') {
          await AsyncStorage.setItem('token', res.data.data);
          await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));

          Alert.alert('Login Exitoso', 'Has iniciado sesión con Google correctamente.');

          navigation.reset({
            index: 0,
            routes: [{ name: 'MainLayout' }],
          });
        } else {
          Alert.alert('Error', JSON.stringify(res.data));
        }
      } else {
        Alert.alert('Error', 'No se pudo obtener el idToken del usuario de Google');
      }
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      //Alert.alert('Error', `No se pudo iniciar sesión con Google: ${error.message || JSON.stringify(error)}`);

      if (error?.code) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert('Error', 'Iniciando sesión con Google...');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Error', 'Servicios de Google no disponibles.');
            break;
          default:
            Alert.alert('No se pudo iniciar sesión', `Error al iniciar sesión con Google: ${error.message || JSON.stringify(error)}`);
            break;
        }
      }
    } finally {
      setIsLoading(false);// Desactivar el indicador de carga
    }
  };

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="always">
      <View style={styles.container}>
        <Image source={require('../../assets/Logo/DigitalPng/L_H_Blanco.png')} style={styles.logo} />
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo:</Text>
        <TextInput style={styles.input} placeholder="Ingrese su correo" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} />

        <View style={styles.inputContainer}>
          <Text style={styles.labelPassword}>Contraseña:</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} placeholder="Ingrese su contraseña" placeholderTextColor="#aaa" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Image source={showPassword ? require('../../assets/Iconos/PNG/eye.png') : require('../../assets/Iconos/PNG/eye_off.png')} style={styles.eyeIcon} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>──────── O Inicia Sesión Con ────────</Text>

        <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle}>
          <Image source={require('../../assets/Logo/L_Google.png')} style={styles.socialLogo} />
          <Text style={styles.socialButtonText}>Iniciar Sesión con Google</Text>
        </TouchableOpacity>

        {/*<TouchableOpacity style={styles.socialButton} onPress={() => navigation.navigate('MainLayout')}>
          <Image source={require('../../assets/Logo/L_Facebook.png')} style={styles.socialLogo} />
          <Text style={styles.socialButtonText}>Iniciar Sesión con Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={{ color: '#1787FF', textAlign: 'center', marginTop: 10, fontFamily: 'LuxoraGrotesk-Regular' }}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>*/}

        <Text style={styles.link} onPress={() => navigation.navigate('Registro')}>¿No tienes cuenta? Regístrate</Text>
      </View>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E65800" />
        </View>
      )}
    </ScrollView>
  );
}

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain', // Ajusta la imagen al tamaño del contenedor
  },
  title: {
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  label: {
    color: 'white',
    alignSelf: 'flex-start',
    marginLeft: 20,
    fontFamily: 'LuxoraGrotesk-Regular',
    fontSize: 15,
  },
  input: {
    width: '90%',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    marginBottom: 10,
    fontFamily: 'LuxoraGrotesk-Regular',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#E65800',
    padding: 15,
    borderRadius: 5,
    width: '90%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  link: {
    color: 'orange',
    marginTop: 10,
    textDecorationLine: 'underline',
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  //Estilos para el botón de inicio de sesión con Google
  socialButton: {
    flexDirection: 'row',
    alignContent: 'center',
    backgroundColor: '#111',
    padding: 10,
    borderRadius: 5,
    width: '85%',
    marginTop: 10,
    justifyContent: 'center',
  },
  socialLogo: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  socialButtonText: {
    color: 'white',
    marginTop: 3,
    fontSize: 14.5,
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  orText: {
    color: '#aaa',
    marginVertical: 10,
    marginTop: 20,
    fontFamily: 'LuxoraGrotesk-Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  inputContainer: {
    width: '90%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingRight: 10,
  },
  inputPassword: {
    flex: 1,
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 15,
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  labelPassword: {
    color: 'white',
    alignSelf: 'flex-start',
    fontFamily: 'LuxoraGrotesk-Regular',
    fontSize: 15,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
});
