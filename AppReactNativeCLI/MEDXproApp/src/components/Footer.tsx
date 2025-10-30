import React, {useEffect} from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import styles from '../styles/styles1';
import { Screens } from '../constants/screens'; // Importa correctamente desde constants

interface FooterProps {
  setCurrentScreen: (screen: Screens) => void;
}

function Footer({ setCurrentScreen }: FooterProps): React.JSX.Element {
  useEffect(() => {
    console.log('Pantalla actual:', setCurrentScreen); // 👈 Esto se ejecutará cada vez que cambie
  }, [setCurrentScreen]);

  /*const handleGoHome = () => {
    setCurrentScreen(Screens.Reporte); //Cambia temporalmente a otra pantalla
    setTimeout(() => setCurrentScreen(Screens.Home), 0); // Regresa a Home con un pequeño delay
  };*/
  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      //console.log(`No se puede abrir el enlace: ${url}`);
      Alert.alert('Error', `No se puede abrir el enlace: ${url}`);
    }
  };

  return (
    <View style={styles.footer}>

      {/* Contenedor del logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/Logo/DigitalPng/L_B_P_Gris.png')} style={styles.logoF} />
      </View>

      {/* Contenedor de los links de navegación */}
      <View style={styles.navLinks}>
        <TouchableOpacity onPress={() => console.log('Inicio presionado')}>
          <Text style={styles.navItemF}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Educación presionado')}>
          <Text style={styles.navItemF}>Educación</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Reporte presionado')}>
          <Text style={styles.navItemF}>Reporte</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() =>console.log('Evento presionado')}>
          <Text style={styles.navItemF}>Evento</Text>
        </TouchableOpacity>
      </View>

      {/* Contenedor de la versión */}
      <View style={styles.rightSection}>
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>2025 mEDX pro V 1.0</Text>
        </View>
      </View>

      {/* Contenedor para los iconos de redes sociales */}
      <View style={styles.socialIcons}>
        <TouchableOpacity onPress={() => openLink('https://www.facebook.com/profile.php?id=61572613422746')}>
          <Image source={require('../assets/Logo/facebook.png')} style={styles.iconF} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://www.instagram.com/medxproapp/')}>
          <Image source={require('../assets/Logo/instagram.png')} style={styles.iconF} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Footer;
