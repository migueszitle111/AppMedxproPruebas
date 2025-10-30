import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {NavigationProp} from '../../navigation/types';
import { ScrollView } from 'react-native-gesture-handler';
import {launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';
import BASE_URL from '../../constants/config';

function Registro(): React.JSX.Element {
  const [name, setName] = useState('');
  const [nameVerify, setNameVerify] = useState(false);
  const [lastname, setLastName] = useState('');
  const [lastnameVerify, setLastNameVerify] = useState(false);
  const [idprofessional, setIdProfessional] = useState('');
  const [idprofessionalVerify, setIdProfessionalVerify] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [specialtyVerify, setSpecialtyVerify] = useState(false);
  const [email, setEmail] = useState('');
  const [emailVerify, setEmailVerify] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVerify, setPasswordVerify] = useState(false);
  //const [roles, setRoles] = useState('');
  //const [rolesVerify, setRolesVerify] = useState(false);
  const [imageUrl, setImageUrl] = useState<any>(null);
  //const [imageUrlVerify, setImageUrlVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<NavigationProp>();  // Usamos el tipo NavigationProp

  async function handleSubmit() {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('lastname', lastname);
    formData.append('idprofessional', idprofessional);
    formData.append('specialty', specialty);
    formData.append('email', email);
    formData.append('password', password);
    //formData.append('roles', roles);

    if (imageUrl) {
      formData.append('image', {
        uri: imageUrl.uri,
        type: imageUrl.type,
        name: imageUrl.fileName || 'photo.jpg',
      });
    } else {
      Alert.alert('Error', 'Por favor, selecciona una imagen');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/registrar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'OK') {
        Alert.alert('Registro exitoso');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', response.data.data || 'No se pudo registrar');
      }
    } catch (error) {
      Alert.alert('Error', 'Algo salió mal al registrar');
      console.error(error);
    }
  }

  function handleName(e: string) {
    const nameVar = e;
    console.log(nameVar);

    setName(nameVar);
    setNameVerify(false);

    if (nameVar.length > 1){
      setNameVerify(true);
    }
  }

  function handleLastName(e: string) {
    setLastName(e);
    setLastNameVerify(e.length > 1);
  }

  function handleIdProfessional(e: string) {
    setIdProfessional(e);
    setIdProfessionalVerify(e.length > 1);
  }

  function handleSpecialty(e: string) {
    setSpecialty(e);
    setSpecialtyVerify(e.length > 1);
  }

  function handleEmail(e: string) {
    const emailVar = e;
    setEmail(emailVar);
    setEmailVerify(false);
    if (/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(emailVar)){
      setEmail(emailVar);
      setEmailVerify(true);
    }
  }

  function handlePassword(e: string) {
    const passwordVar = e;
    setPassword(passwordVar);
    setPasswordVerify(false);

    if (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6}/.test(passwordVar)){
      setPassword(passwordVar);
      setPasswordVerify(true);
    }
  }

  //function handleRoles(e: string) {
  //  setRoles(e);
  //  setRolesVerify(e.length > 1);
  //}

  //function handleImageUrl(e: string) {
  //  setImageUrl(e);
  //  setImageUrlVerify(e.length > 1);
  //}

  function handlePickImage() {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      console.log('Respuesta de launchImageLibrary:', response);

      if (response.didCancel) {
        console.log('Selección de imagen cancelada por el usuario.');
        return;
      }

      if (response.errorCode) {
        console.log('Error al seleccionar imagen:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setImageUrl(response.assets[0]);
        console.log('Imagen seleccionada:', response.assets[0]);
      } else {
        console.log('No se encontraron assets en la respuesta.');
      }
    });
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Image source={require('../../assets/Logo/DigitalPng/L_H_Blanco.png')} style={styles.logo} />
        <Text style={styles.title}>Registrarse</Text>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#aaa" onChangeText={handleName} />
          {name.length > 0 && (
            <Text style={nameVerify ? styles.successText : styles.errorText}>
              {nameVerify ? 'Nombre valido' : 'El nombre debe de contener más caracteres'}
            </Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor="#aaa" onChangeText={handleLastName} />
          {lastname.length > 0 && (
            <Text style={lastnameVerify ? styles.successText : styles.errorText}>
              {lastnameVerify ? 'Apellido valido' : 'El apellido debe de contener más caracteres'}
            </Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Cedula" placeholderTextColor="#aaa" onChangeText={handleIdProfessional} />
          {idprofessional.length > 0 && (
            <Text style={idprofessionalVerify ? styles.successText : styles.errorText}>
              {idprofessionalVerify ? 'Cedula valida' : 'La cedula debe de contener más caracteres'}
            </Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Especialidad" placeholderTextColor="#aaa" onChangeText={handleSpecialty} />
          {specialty.length > 0 && (
            <Text style={specialtyVerify ? styles.successText : styles.errorText}>
              {specialtyVerify ? 'Especialidad valida' : 'La especialidad debe de contener más caracteres'}
            </Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#aaa" onChangeText={handleEmail} />
          {email.length > 0 && (
            <Text style={emailVerify ? styles.successText : styles.errorText}>
              {emailVerify ? 'Correo valido' : 'Correo invalido'}
            </Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} placeholder="Contraseña" placeholderTextColor="#aaa" onChangeText={handlePassword} secureTextEntry={!showPassword}/>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Image
                source={showPassword
                  ? require('../../assets/Iconos/PNG/eye.png')
                  : require('../../assets/Iconos/PNG/eye_off.png')} style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <Text style={passwordVerify ? styles.successText : styles.errorText}>
              {passwordVerify ? 'Contraseña valida' : 'Contraseña invalida: Debe contener más caracteres[minuscula, mayuscula, numero y simbolos'}
            </Text>
          )}
        </View>
        {/*
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Roles" placeholderTextColor="#aaa" onChangeText={handleRoles} />
          {roles.length > 0 && (
            <Text style={rolesVerify ? styles.successText : styles.errorText}>
              {rolesVerify ? 'Rol valido' : 'El rol debe de contener más caracteres'}
            </Text>
          )}
        </View>*/}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage()}>
            <Text style={{color: 'white', fontSize: 15, fontFamily: 'LuxoraGrotesk-Bold'}}>Seleccionar Imagen</Text>
          </TouchableOpacity>
          {imageUrl && (
            <Image source={{uri: imageUrl.uri}} style={styles.selectedImage} />
          )}
        </View>
        <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>¿Ya tienes cuenta? Inicia sesión</Text>
      </View>
    </ScrollView>
  );
}
export default Registro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingVertical: 10,
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain', //Ajusta la imagen al tamaño del contenedor
  },
  title: {
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  inputContainer: {
    width: '95%',
    marginBottom: 20,
  },
  inputPassword: {
    flex: 1,
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingRight: 10,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  button: {
    backgroundColor: '#E65800',
    paddingVertical: 15,
    borderRadius: 8,
    width: '85%',
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
    marginTop: 15,
    textDecorationLine: 'underline',
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 5,
  },
  imagePicker: {
    backgroundColor: '#D61A1A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
    alignSelf: 'center',
  },
});
