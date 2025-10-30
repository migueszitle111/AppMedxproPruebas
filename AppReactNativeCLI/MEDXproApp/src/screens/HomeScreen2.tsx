import React, { useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Image, ImageBackground } from 'react-native';
import styles from '../styles/styles1'; // Importamos los estilos globales
import MenuReporte from './Menus/MenuReporte';
import VideosScreen from './VideosScreen';
import PodcastScreen from './PodcastScreen';
import NoticiasScreen from './NoticiasScreen';
import EventosScreen from './EventosScreen';
import EducacionScreen from './EducacionScreen';
import Perlas from './MenuDPrincipal/Perlas';
import Ultrasonidos from './MenuDPrincipal/Ultrasonidos';
import Monitoreo from './MenuDPrincipal/Monitoreo';
import MenuTecnicas from './Menus/MenuTecnicas';
import { Screens } from '../constants/screens'; // Importa correctamente desde constants
//import ReporteScreen from './ReporteScreen';

// funcion de la pantalla de inicio
function HomeScreen(): React.JSX.Element {
  // Estado para manejar la pantalla actual
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.Home);
  useEffect(() => {
    console.log('Pantalla actual:', currentScreen); // 👈 Esto se ejecutará cada vez que cambie
  }, [currentScreen]);

  const screenComponents: Record<Screens, React.ComponentType> = {
    [Screens.Reporte]: MenuReporte,
    [Screens.Tecnicas]: MenuTecnicas,
    [Screens.Videos]: VideosScreen,
    [Screens.Podcast]: PodcastScreen,
    [Screens.Noticias]: NoticiasScreen,
    [Screens.Eventos]: EventosScreen,
    [Screens.Educacion]: EducacionScreen, // ✅ Agrega la pantalla de educación
    [Screens.Perlas]: Perlas,
    [Screens.Ultrasonidos]: Ultrasonidos,
    [Screens.Monitoreo]: Monitoreo,
    [Screens.Home]: HomeScreen,
  };

  const renderScreen = () => {
    if (!screenComponents[currentScreen]) {
      console.error(`Error: Pantalla "${currentScreen}" no encontrada.`);
      return <HomeScreen />;
    }
    return React.createElement(screenComponents[currentScreen]);
  };

  const icons = {
    [Screens.Reporte]: require('../assets/Iconos/PNG/I_Reporte_Gris.png'),
    [Screens.Tecnicas]: require('../assets/Iconos/PNG/mEDX_128_Protocolos.png'),
    [Screens.Videos]: require('../assets/Iconos/PNG/mEDX_128_Videos.png'),
    [Screens.Podcast]: require('../assets/Iconos/PNG/mEDX_128_Podcast.png'),
    [Screens.Perlas]: require('../assets/Iconos/PNG/mEDX_64_Perlas.png'),
    [Screens.Ultrasonidos]: require('../assets/Iconos/PNG/mEDX_64_Ultrasonido.png'),
    [Screens.Monitoreo]: require('../assets/Iconos/PNG/mEDX_64_Monitoreo.png'),
  };

  const data = [
    {
      id: '1',
      tipo: Screens.Reporte,
      titulo: '',
      descripcion: '',
      imagen: require('../assets/PrincipalPng/P_1_Movil.png'),
    },
    {
      id: '2',
      tipo: Screens.Reporte,
      titulo: 'REPORTE ANATÓMICO',
      descripcion: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
      imagen: require('../assets/PrincipalPng/P_2_Movil.png'),
    },
    {
      id: '3',
      tipo: Screens.Home,
      titulo: 'La mejor experiencia solo en nuestra app.',
      imagen: require('../assets/PrincipalPng/P_3_App_Movil.png'),
    },
    {
      id: '4',
      tipo: Screens.Home,
      titulo: 'EDUCACIÓN',
      descripcion: 'Entra a nuestra sección de educación para descubrir más sobre cursos y recursos educativos.',
      imagen: require('../assets/PrincipalPng/P_4_Movil.png'),
    },
  ];

  return (
    // Contenedor principal de la pantalla de inicio

    <View style={styles.container} key={currentScreen}>
      {/* Barra de búsqueda */}
      {/* Menú deslizable */}
      {currentScreen === Screens.Home && (
        <View style={styles.fixedMenu}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Reporte)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Reporte]} style={styles.iconImage} />
                <Text style={styles.iconText}>Reporte</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Tecnicas)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Tecnicas]} style={styles.iconImage} />
                <Text style={styles.iconText}>Técnicas</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Videos)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Videos]} style={styles.iconImage} />
                <Text style={styles.iconText}>Videos</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Podcast)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Podcast]} style={styles.iconImage} />
                <Text style={styles.iconText}>Podcast</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Noticias)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Perlas]} style={styles.iconImage} />
                <Text style={styles.iconText}>Perlas</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Eventos)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Ultrasonidos]} style={styles.iconImage} />
                <Text style={styles.iconText}>Ultrasonidos</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => setCurrentScreen(Screens.Noticias)}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Monitoreo]} style={styles.iconImage} />
                <Text style={styles.iconText}>Monitoreo</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* Solo renderizar la pantalla seleccionada */}
      <View style={styles.container}>
        {currentScreen === Screens.Home ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setCurrentScreen(item.tipo)} style={styles.card}>
                <ImageBackground source={item.imagen} style={styles.imageBackground} imageStyle={styles.imageStyle}>
                  <View style={styles.overlay}>
                    <Text style={styles.cardTitle}>{item.titulo}</Text>
                    {item.descripcion && <Text style={styles.cardDescription}>{item.descripcion}</Text>}
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />
        ) : (
          renderScreen()
        )}
      </View>
    </View>
  );
}

export default HomeScreen;
