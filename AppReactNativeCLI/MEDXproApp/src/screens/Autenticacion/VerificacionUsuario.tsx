import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Easing,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../constants/config';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { NavigationProp } from '../../navigation/types';

export default function VerificacionUsuario() {
  const [userData, setUserData] = useState<any>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newLogo, setNewLogo] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);

  const navigation = useNavigation<NavigationProp>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.post(`${BASE_URL}/userdata`, { token });

        if (res.data.status === 'OK') {
          setUserData(res.data.data);
          setOriginalData(res.data.data);
        } else {
          Alert.alert('Error', 'No se pudo obtener la información del usuario.');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    };
    fetchUser();
  }, []);

  const handleSelectLogo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
      });

      if (result.didCancel) return;

      const asset = result.assets?.[0];
      if (asset) {
        setNewLogo(asset);
        setUserData({ ...userData, logo: asset.uri });
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleSave = async () => {
    if (!editable) {
        Alert.alert('Bienvenido a mEDXpro', 'Puedes actualizar tus datos también en tu perfil.');
      navigation.reset({ index: 0, routes: [{ name: 'MainLayout' }] });
      return;
    }

    const safe = (val: any) => {
      if (val === null || val === undefined || val.trim?.() === '') return ' ';
      return val;
    };

    const hasChanges =
        newLogo ||
        safe(userData.name) !== safe(originalData.name) ||
        safe(userData.lastname) !== safe(originalData.lastname) ||
        safe(userData.idprofessional) !== safe(originalData.idprofessional) ||
        safe(userData.specialty) !== safe(originalData.specialty);

    if (!hasChanges) {
        Alert.alert('Sin cambios', 'No hay cambios para guardar.');
        setEditable(false);
        return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('token', token || ' ');
      formData.append('name', safe(userData.name || ' '));
      formData.append('lastname', safe(userData.lastname || ' '));
      formData.append('idprofessional', safe(userData.idprofessional || ' '));
      formData.append('specialty', safe(userData.specialty || ' '));

      // si se seleccionó un nuevo logo
      if (newLogo) {
        formData.append('image', {
          uri: newLogo.uri,
          type: newLogo.type || 'image/png',
          name: newLogo.fileName || 'logo.png',
        });
      }

      const res = await axios.put(`${BASE_URL}/userdataUpdate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === 'OK') {
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start();
        Alert.alert('Datos actualizados', 'Tu información ha sido actualizada correctamente.');
        setOriginalData(userData);
        setNewLogo(null);
        setEditable(false);
      } else {
        Alert.alert('Error', 'No se pudo actualizar la información.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la información.');
    } finally {
      setLoading(false);
    }
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FF7A00'],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#fff' }}>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      contentContainerStyle={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo superior */}
      <Image
        source={require('../../assets/Logo/DigitalPng/L_H_Blanco.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Título animado */}
      <Animated.Text style={[styles.title, { color: glowColor }]}>
        Queremos saber más sobre ti…!
      </Animated.Text>

      {/* --- Nombre --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={[styles.input, editable ? styles.editable : styles.readonly]}
          editable={editable}
          value={userData.name || ''}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
        />
      </View>

      {/* --- Apellido --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={[styles.input, editable ? styles.editable : styles.readonly]}
          editable={editable}
          value={userData.lastname || ''}
          onChangeText={(text) => setUserData({ ...userData, lastname: text })}
        />
      </View>

      {/* --- Cédula --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cédula profesional</Text>
        <TextInput
          style={[styles.input, editable ? styles.editable : styles.readonly]}
          editable={editable}
          keyboardType="numeric"
          value={userData.idprofessional || ''}
          onChangeText={(text) => setUserData({ ...userData, idprofessional: text })}
        />
      </View>

      {/* --- Especialidad --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Especialidad</Text>
        <TextInput
          style={[styles.input, editable ? styles.editable : styles.readonly]}
          editable={editable}
          value={userData.specialty || ''}
          onChangeText={(text) => setUserData({ ...userData, specialty: text })}
        />
      </View>

      {/* --- Logo --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Subir logotipo</Text>
        <TouchableOpacity
          style={[styles.logoUpload, editable ? styles.editable : styles.readonly]}
          onPress={() => editable && handleSelectLogo()}
        >
          {userData.logo ? (
            <Image
              source={{ uri: userData.logo }}
              style={{ width: 80, height: 80, borderRadius: 10 }}
            />
          ) : (
            <Text style={{ color: editable ? '#FF7A00' : '#888', fontFamily: 'LuxoraGrotesk-Regular', fontSize: 15 }}>
              Seleccionar archivo
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Botones --- */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.iconButton, editable && styles.iconButtonActive]}
          onPress={() => setEditable(!editable)}
        >
          <Image
            source={require('../../assets/03_Íconos/03_02_PNG/editar.png')}
            style={{ resizeMode: 'contain', width: 35, height: 35, tintColor: editable ? '#fff' : '#FF7A00' }}
          />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
          <TouchableOpacity style={editable ? styles.savesButton : styles.acceptButton} onPress={handleSave}>
            <Text style={styles.buttonText}>{editable ? 'Guardar' : 'Aceptar'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
    logo: {
    width: 200,
    height: 80,
    marginBottom: 25,
    alignSelf: 'center',
  },
  title: {
    color: '#FF7A00',
    fontSize: 26,
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    color: '#E0E0E0',
    marginBottom: 5,
    fontSize: 14.5,
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  editable: {
    borderColor: '#FF7A00',
  },
  readonly: {
    borderColor: '#2C2C2C',
  },
  logoUpload: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  iconButton: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconButtonActive: {
    backgroundColor: '#FF7A00',
  },
  acceptButton: {
    backgroundColor: '#FF7A00',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#e0d1c4ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  savesButton: {
    backgroundColor: '#d23100ff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
    fontSize: 18,
  },
});
