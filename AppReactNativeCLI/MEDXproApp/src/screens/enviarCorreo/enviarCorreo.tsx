import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import BASE_URL from '../../constants/config';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import CustomMessage from '../../components/CustomMessage';

const EnviarCorreo = () => {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [imagenes, setImagenes] = useState<any[]>([]);
  const navigation = useNavigation<NavigationProp>();

  const [messageQueue, setMessageQueue] = useState<{ title: string; message: string }[]>([]);

  // Mostrar el primer mensaje de la cola
  const currentMsg = messageQueue[0];

  // 👉 Funciones para abrir/cerrar el mensaje
  const showMessage = (title: string, message: string) => {
    setMessageQueue(prev => [...prev, { title, message }]);
  };
  const hideMessage = () => {
    setMessageQueue(prev => prev.slice(1));
  };

  const handleSeleccionarImagen = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
      if (response.assets) {
        setImagenes([...imagenes, ...response.assets]);
      }
    });
  };

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      Alert.alert('Error', 'Por favor escribe un mensaje antes de enviar.');
      return;
    }

    const formData = new FormData();
    formData.append('asunto', asunto || 'Colaboración con MedXPro');
    formData.append('mensaje', mensaje);

    imagenes.forEach((img, index) => {
      formData.append('imagenes', {
        uri: img.uri,
        type: img.type,
        name: img.fileName || `imagen_${index}.jpg`,
      });
    });

    try {
      const res = await axios.post(`${BASE_URL}/enviar-correo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === 'OK') {
        Alert.alert('Éxito', 'Tu mensaje ha sido enviado correctamente.');
        setAsunto('');
        setMensaje('');
        setImagenes([]);
      } else {
        Alert.alert('Error', 'No se pudo enviar el mensaje.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Ocurrió un problema al enviar el mensaje.');
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/Logo/DigitalPng/L_V_Blanco.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Colabora con nosotros</Text>
      <Text style={styles.subtitle}>
        Envíanos los resultados de tus pacientes a{' '}
        <Text style={styles.email}>lab@medxproapp.com</Text>{'\n'}
        y forma parte del laboratorio más grande de Latinoamérica.
      </Text>

      <TextInput
        placeholder="Asunto (opcional)"
        placeholderTextColor="#aaa"
        value={asunto}
        onChangeText={setAsunto}
        style={styles.input}
      />

      <TextInput
        placeholder="Escribe tu mensaje aquí..."
        placeholderTextColor="#aaa"
        value={mensaje}
        onChangeText={setMensaje}
        multiline
        style={[styles.input, styles.textArea]}
      />

      <TouchableOpacity style={styles.imageButton} onPress={handleSeleccionarImagen}>
        <Text style={styles.imageButtonText}>Adjuntar Imágenes</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {imagenes.map((img, i) => (
          <Image key={i} source={{ uri: img.uri }} style={styles.previewImage} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => showMessage('Próximamente', 'En una próxima actualización.')}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </ScrollView>

    <CustomMessage
        visible={!!currentMsg}
        title={currentMsg?.title || ''}
        message={currentMsg?.message || ''}
        onClose={hideMessage}
      />
    </View>
  );
};

export default EnviarCorreo;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  title: {
    color: '#FFA500',
    fontSize: 22,
    fontFamily: 'LuxoraGrotesk-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Light',
    marginBottom: 25,
  },
  email: {
    color: '#FFA500',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    fontFamily: 'LuxoraGrotesk-Book',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#EE6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  imageButtonText: {
    color: 'white',
    fontFamily: 'LuxoraGrotesk-Bold',
    fontSize: 15,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    margin: 5,
  },
  button: {
    backgroundColor: '#EE6B00',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#121212',
    fontFamily: 'LuxoraGrotesk-Bold',
    textAlign: 'center',
    fontSize: 16,
  },
  backButton: {
  alignSelf: 'flex-start',
  marginBottom: 10,
  backgroundColor: '#121212',
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: 8,
},
backButtonText: {
  color: 'white',
  fontFamily: 'LuxoraGrotesk-Bold',
  fontSize: 14,
},
});
