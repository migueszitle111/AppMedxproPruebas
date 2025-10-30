import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import globalStyles from '../styles/globalsty';
import { NavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

function PantallaInicio(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>(); // Usamos el tipo NavigationProp para la navegación

  return (
    <View style={globalStyles.container}>
      <Image source={require('../assets/Logo/DigitalPng/L_H_Blanco.png')} style={globalStyles.logo} />
      <Text style={globalStyles.title}>¡Bienvenido!</Text>

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.navigate('Registro')}>
        <Text style={globalStyles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}


export default PantallaInicio;
