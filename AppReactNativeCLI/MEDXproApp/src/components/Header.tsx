import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, TouchableHighlight, Modal, TouchableWithoutFeedback } from 'react-native';
import styles from '../styles/styles1';
import { NavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type Props = {
  onStartLogout: () => void;
  onLogoutFinish: () => void;
};

function Header({ onStartLogout, onLogoutFinish }: Props): React.JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  //const [isCargaCerrar, setIsCargaCerrar] = useState(false)
  // Estado para manejar la pantalla actual
  //const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.Home);

  async function signOut(){
    setMenuVisible(false);
    onStartLogout();//muestra el indicador
    try {
      console.log('🔴 Cerrar sesión presionado');
      //AsyncStorage.setItem('isLoggedIn', '');
      //AsyncStorage.setItem('token', '');
      //navigation.navigate('Home');

      // Cierra sesión de Google si el usuario está autenticado por Google
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
        console.log('✅ Usuario desconectado de Google');
      }

      //Elimina el token y marca como deslogueado
      await AsyncStorage.removeItem('token');
      await AsyncStorage.setItem('isLoggedIn', 'false');

      //Redirecciona al login
      // Redirige al Login limpiando la pila de navegación
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 3000);

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      onLogoutFinish();//oculta el indicador
    }
  }

  const NavegarSiNoEsActual = (IrRuta: string) => {
    const RutaActual = navigation.getState().routes[navigation.getState().index].name;

    if (RutaActual !== IrRuta) {
      navigation.navigate(IrRuta as never); //Cambia de pantalla solo si es diferente
    }

    setMenuVisible(false); //Cierra el menú sin importar si navegaste o no
  };


  return (
    <View style={styles.headerContainer}>
      {/* Logo - anterior: '../assets/Logo/DigitalPng/L_H_Blanco.png'> */}
      <View style={styles.logoMenuContainer}>
        <View style={styles.logoWrapper}>
          <TouchableOpacity onPress={() => NavegarSiNoEsActual('PantallaPrincipal')}>
            <Image
              source={require('../assets/Logo/DigitalPng/L_B_P_Gris.png')}
              style={styles.logoP}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>


      {/* Menú Desplegable */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContainer}>
              {/* Botón de cerrar */}
              <TouchableOpacity style={styles.menuClose} onPress={() => setMenuVisible(false)}>
                <Text style={styles.closeIcon}>✖</Text>
              </TouchableOpacity>

              {/* Opciones del Menú */}
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('PantallaPrincipal')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/Logo/DigitalPng/L_V_Negro.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Inicio</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('Educacion')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/03_Íconos/03_02_PNG/I_Education.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Educación</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('ReporteMenu')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/Iconos/PNG/I_Reporte_Gris.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Reporte</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('Shop')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/03_Íconos/03_02_PNG/I_Star.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Shop</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('Perfil')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/03_Íconos/03_02_PNG/I_Profile.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Perfil</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="rgba(230, 81, 0, 0.3)" style={styles.menuItemH} onPress={() => NavegarSiNoEsActual('Configuracion')}>
                <View style={styles.menuItemContainer}>
                  <Image source={require('../assets/03_Íconos/03_02_PNG/I_Lock.png')} style={styles.menuItemIcon} />
                  <Text style={styles.menuTextH}>Pin/Huella</Text>
                </View>
              </TouchableHighlight>

              {/* Cerrar sesión con mejor diseño */}
              <TouchableHighlight underlayColor="rgba(255, 0, 0, 0.2)" style={styles.logoutButton} onPress={signOut}>
                <View style={styles.menuItemOut}>
                  <Image source={require('../assets/03_Íconos/03_02_PNG/I_Out.png')} style={styles.IconOut} />
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export default Header;
