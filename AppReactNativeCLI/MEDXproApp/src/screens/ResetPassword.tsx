import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';
import axios from 'axios';
import BASE_URL from '../constants/config';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
    const navigation = useNavigation<NavigationProp>();  // Usamos el tipo NavigationProp para la navegación

  const handleResetPassword = () => {
    if (!email || !newPassword) {
      Alert.alert('Campos requeridos', 'Por favor, completa todos los campos.');
      return;
    }

    axios.post(`${BASE_URL}/reset-password`, {
      email,
      newPassword
    })
    .then(res => {
      if (res.data.status === 'OK') {
        Alert.alert('Éxito', 'La contraseña ha sido actualizada correctamente.');
        navigation.navigate('Login'); // volver a Login
      } else {
        Alert.alert('Error', res.data.data || 'No se pudo cambiar la contraseña.');
      }
    })
    .catch(err => {
      console.error(err);
      Alert.alert('Error', 'Error al conectar con el servidor.');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restablecer Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Button title="Cambiar contraseña" onPress={handleResetPassword} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15 },
});
