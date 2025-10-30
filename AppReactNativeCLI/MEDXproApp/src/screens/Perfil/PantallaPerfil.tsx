import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import BASE_URL from '../../constants/config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type UserData = {
  name: string;
  lastname: string;
  idprofessional: string;
  specialty: string;
  email: string;
  password: string;
  //roles: string;
  imageUrl: string;
};

export default function PerfilScreen() {
  const navigation = useNavigation<NavigationProp>();
  //const [userData, setUserData] = useState('');
  const [userData, setUserData] = useState<UserData>({
    name: '',
    lastname: '',
    idprofessional: '',
    specialty: '',
    email: '',
    password: '',
    //roles: '',
    imageUrl: '',
  });

  const [editableField, setEditableField] = useState<string | null>(null);
  const [nombre, setNombre] = useState(userData.name);
  const [apellido, setApellido] = useState(userData.lastname);
  const [cedula, setCedula] = useState(userData.idprofessional);
  const [especialidad, setEspecialidad] = useState(userData.specialty);
  const [correo, setCorreo] = useState(userData.email);
  const [contrasena, setContrasena] = useState(userData.password);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  async function getData() {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token:',token);

      //const response = await axios.post('http://192.168.0.10:5001/userdata', {token: token});
      //console.log('Respuesta del servidor:',response.data);
      axios
        .post(`${BASE_URL}/userdata`, {token: token})
        .then(res => {
          console.log('Respuesta del servidor:',res.data);
          setUserData(res.data.data);
        });
    } catch (error) {
      console.error('Error al obtener el token:', error);
    }
    //axios.post('http:192.168.0.10:5001/userdata', {token: getToken()})
    //.then(res => console.log(res.data));
  }

  useEffect(()=>{
    getData();
  },[]);

  useEffect(() => {
    if (userData.name) {
      setNombre(userData.name);
      setApellido(userData.lastname);
      setCedula(userData.idprofessional);
      setEspecialidad(userData.specialty);
      setCorreo(userData.email);
      //setContrasena(userData.password);
      setContrasena('');
      setFotoPerfil(userData.imageUrl || null);
    }
  }, [userData]);

  const seleccionarImagen = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.assets && response.assets.length > 0) {
          setFotoPerfil(response.assets[0].uri || null);
        }
      }
    );
  };

  const guardarCambios = async() => {
    try{
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('token', token || '');
      formData.append('name', nombre);
      formData.append('lastname', apellido);
      formData.append('idprofessional', cedula);
      formData.append('specialty', especialidad);
      if (contrasena.trim() !== '') {
        formData.append('password', contrasena);
      }
      //formData.append('roles', userData.roles);

      if (fotoPerfil && fotoPerfil !== userData.imageUrl) {
        const filename = fotoPerfil.split('/').pop();
        const extension = filename?.split('.').pop() || 'jpg';
        formData.append('image', {
          uri: fotoPerfil,
          name: filename,
          type: `image/${extension}`,
        } as any); // Agregamos el tipo de archivo
      }

      const response = await axios.put(`${BASE_URL}/userdataUpdate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'OK') {
        setUserData(response.data.data);
        Alert.alert('Datos actualizados correctamente');
      } else {
        Alert.alert('Error al actualizar');
      }
    }
    catch(error){
      console.error(error);
      Alert.alert('Error al intentar actualizar');
    }

    setEditableField(null);
  };

  const eliminarCuenta = async () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Quieres eliminar tu cuenta?',
      [
        {
          text: 'Cancelar',
          onPress: () => console.log('Cancelado'),
          style: 'cancel',
        },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await axios.delete(`${BASE_URL}/deleteUser`, {
                data: { token },
              });

              if (response.data.status === 'OK') {
                await AsyncStorage.removeItem('token');
                Alert.alert('Tu cuenta ha sido eliminada');
                // Redirigir a Login u otra pantalla inicial
                // Cierra sesión de Google si el usuario está autenticado por Google
                const currentUser = await GoogleSignin.getCurrentUser();
                if (currentUser) {
                  await GoogleSignin.signOut();
                  console.log('✅ Usuario desconectado de Google');
                }
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else {
                Alert.alert('Error al eliminar la cuenta');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Hubo un error al intentar eliminar la cuenta');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderField = (fieldName: string, label: string, value: string, setValue: React.Dispatch<React.SetStateAction<string>>, isPassword = false) => {
    if (editableField === fieldName) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}:</Text>
          <TextInput
            style={styles.inputEditable}
            value={value}
            onChangeText={setValue}
            secureTextEntry={isPassword}
            onSubmitEditing={guardarCambios}
          />
        </View>
      );
    }
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.textoField}>{value}</Text>
        <TouchableOpacity
          onPress={() => setEditableField(fieldName)}
          style={styles.botonEditar}>
          {/* Reemplazo el texto "Editar" con el ícono */}
          <Image source={require('../../assets/03_Íconos/03_02_PNG/editar.png')} style={styles.iconoEditar}/>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Icono/logo de la aplicación */}
      <Image source={require('../../assets/Logo/DigitalPng/L_H_Blanco.png')} style={styles.icono} />

      {/* Círculo de foto de perfil */}
      <View style={styles.profilePictureContainer}>
        {fotoPerfil ? (
          <Image source={{ uri: fotoPerfil || userData.imageUrl }} style={styles.profilePicture} />
        ) : (
          <View style={styles.placeholderPicture}>
            <Text style={styles.placeholderText}>Logo</Text>
          </View>
        )}
        <TouchableOpacity onPress={seleccionarImagen} style={styles.botonArchivo}>
          <Text style={styles.textoArchivo}>Seleccionar Logo</Text>
        </TouchableOpacity>
      </View>

      {renderField('nombre', 'Nombre', nombre, setNombre)}
      {renderField('apellido', 'Apellido', apellido, setApellido)}
      {renderField('cedula', 'Cédula profesional', cedula, setCedula)}
      {renderField('especialidad', 'Especialidad', especialidad, setEspecialidad)}
      {renderField('correo', 'Correo electrónico', correo, setCorreo)}
      {renderField('contrasena', 'Contraseña', contrasena, setContrasena, true)}

      <View style={styles.contenedorBotones}>
        <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
          <Text style={styles.textoGuardar}>Guardar Cambios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonEliminar} onPress={eliminarCuenta}>
          <Text style={styles.textoEliminar}>Eliminar Cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    padding: 20,
  },
  icono: {
    width: 170,
    height: 70,
    alignSelf: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  placeholderPicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonArchivo: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  textoArchivo: {
    color: '#000',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    fontFamily: 'Quando-Regular',
  },
  textoField: {
    color: '#ccc',
    fontSize: 13,
    flex: 2,
    fontFamily: 'Quando-Regular',
  },
  inputEditable: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    borderRadius: 5,
    width: 200,
    maxWidth: 200,
    height: 40,
    textAlignVertical: 'center',
    marginRight: 60,
  },
  botonEditar: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  iconoEditar: {
    width: 35, // Ajusta el tamaño según el diseño del icono
    height: 35,
  },
  botonGuardar: {
    backgroundColor: '#ff7300',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginTop: 20,
  },
  textoGuardar: {
    color: '#fff',
    fontFamily: 'Quando-Regular',
    fontSize: 14,
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  botonEliminar: {
    backgroundColor: '#FF4D4D',
    padding: 8,
    borderRadius: 10,
    marginTop: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoEliminar: {
    color: 'white',
    fontFamily: 'Quando-Regular',
    fontSize: 14,
  },
  
});