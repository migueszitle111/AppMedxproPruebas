import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';

export default function PinLogin() {
  const [inputPin, setInputPin] = useState('');
  const navigation = useNavigation<NavigationProp>();

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

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Ingresa tu PIN"
        secureTextEntry
        value={inputPin}
        onChangeText={setInputPin}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />
      <Button title="Ingresar" onPress={verificarPin} />
    </View>
  );
}
