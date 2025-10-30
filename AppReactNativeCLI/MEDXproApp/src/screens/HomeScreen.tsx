import React, { useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Image, ImageBackground, StyleSheet } from 'react-native';
import styles from '../styles/styles1'; // Importamos los estilos globales

import { Screens } from '../constants/screens'; // Importa correctamente desde constants
//import ReporteScreen from './ReporteScreen';
import { NavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import CardItem from '../components/CardItem';
import { videos } from './Videos/videos_info'; // Importa la lista de videos

// funcion de la pantalla de inicio
function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  // Estado para manejar la pantalla actual
  const [currentScreen] = useState<Screens>(Screens.Home);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const primerVideo = videos[0]; // Obtener el primer video de la lista
  const primerThumbnail = primerVideo?.thumbnail || require('../assets/PrincipalPng/P_1_Movil.png');

  useEffect(() => {
    console.log('Pantalla actual:', currentScreen); // 👈 Esto se ejecutará cada vez que cambie
  }, [currentScreen]);

  const handleComingSoon = () => {
    setShowComingSoon(true);
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
      tipo: Screens.Videos,
      titulo: '',
      descripcion: '',
      imagenes: [
        //require('../assets/PrincipalPng/P_1_Movil.png'),
        primerThumbnail, // Usar el thumbnail del primer video o una imagen por defecto
        require('../assets/PrincipalPng/P_1_Movil_Boton.png'),
      ],
    },
    {
      id: '2',
      tipo: Screens.Reporte,
      titulo: 'REPORTE ANATÓMICO',
      descripcion: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
      imagenes: [
        require('../assets/PrincipalPng/P_2_Movil.png'),
      ],
    },
    {
      id: '3',
      tipo: Screens.Reporte,
      titulo: '',
      imagenes: [
        // require('../assets/PrincipalPng/LP-16.png'),
      ],
    },
    {
      id: '4',
      tipo: Screens.Educacion,
      titulo: 'EDUCACIÓN',
      descripcion: 'Entra a nuestra sección de educación para descubrir más sobre cursos y recursos educativos.',
      imagenes: [
        require('../assets/PrincipalPng/P_4_Movil.png'),
      ],
    },
    {
      id: '5',
      tipo: Screens.EnviarCorreo,
      //titulo: 'COLABORACIONES',
      imagenes: [
        // require('../assets/PrincipalPng/LP-10.png'),
      ],
    },
    {
      id: '6',
      tipo: Screens.Shop,
      //titulo: 'COLABORACIONES',
      imagenes: [
        // require('../assets/PrincipalPng/LP-20.png'),
      ],
    },
    {
      id: '7',
      tipo: Screens.Shop,
      //titulo: 'COLABORACIONES',
      imagenes: [
        // require('../assets/PrincipalPng/LP-21.png'),
      ],
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
            <TouchableOpacity style={styles.iconItemD} onPress={() => navigation.navigate('ReporteMenu')}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Reporte]} style={styles.iconImage} />
                <Text style={styles.iconText}>Reporte</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => navigation.navigate('Técnicas')}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Tecnicas]} style={styles.iconImage} />
                <Text style={styles.iconText}>Técnicas</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => navigation.navigate('Videos')}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Videos]} style={styles.iconImage} />
                <Text style={styles.iconText}>Videos</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={handleComingSoon}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Podcast]} style={styles.iconImage} />
                <Text style={styles.iconText}>Podcast</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={() => navigation.navigate('Perlas')}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Perlas]} style={styles.iconImage} />
                <Text style={styles.iconText}>Perlas</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={handleComingSoon}>
              <View style={styles.iconContainer}>
                <Image source={icons[Screens.Ultrasonidos]} style={styles.iconImage} />
                <Text style={styles.iconText}>Ultrasonido</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItemD} onPress={handleComingSoon}>
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
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardItem
              id={item.id}
              tipo={item.tipo}
              titulo={item.titulo}
              descripcion={item.descripcion}
              imagenes={item.imagenes}
              customStyle={
                item.id === '5'
                  ? { marginBottom: -20, }
                  : item.id === '6'
                  ? { height: 260, }
                  : item.id === '7'
                  ? { height: 260, marginTop: 0, }
                  : { }
              }
              imageStyles={
                item.id === '1'
                  ? [
                      {
                        container: { width: '100%', height: 230 }, // primera imagen (fondo)
                        image: { resizeMode: 'cover' },
                      },
                      {
                        container: {position: 'absolute', width: '100%', height: '100%', marginHorizontal: -52.5,},
                        image: { resizeMode: 'contain' },
                      },
                    ]
                : item.id === '3'
                ? [
                  {
                    container: { width: '100%', height: undefined, aspectRatio: 16 / 9, backgroundColor: '#000', // opcional para rellenar espacios
                    }, image: { resizeMode: 'contain',},
                  },
                ] : item.id === '5'
                ? [
                  {
                    container: { width: '100%',}, 
                    image: { resizeMode: 'contain',},
                  },
                ] : item.id === '6'
                ? [
                  {
                    container: { width: '100%', height:'100%',},
                    image: { resizeMode: 'cover', height: '140%'},
                  },
                ] : item.id === '7'
                ? [
                  {
                    container: { width: '100%', height:'100%',},
                    image: { resizeMode: 'cover', height: '140%'},
                  },
                ]
                : undefined
              }
              overlayStyle={
                item.id === '6'
                  ? { backgroundColor: 'rgba(0, 0, 0, 0.0)' }
                  : item.id === '7'
                  ? { backgroundColor: 'rgba(0, 0, 0, 0.0)' }
                  : undefined
              }
            />
          )}

        />
      </View>
      {/* Overlay de Próximamente */}
      {showComingSoon && (
        <View style={stylesModal.overlay}>
          <View style={stylesModal.modalBox}>
            <Text style={stylesModal.modalTitle}>Próximamente</Text>
            <Text style={stylesModal.modalText}>Disponible próximamente en una siguiente actualización.</Text>
            <TouchableOpacity style={stylesModal.closeBtn} onPress={() => setShowComingSoon(false)}>
              <Text style={{ color: '#fff', fontFamily: 'LuxoraGrotesk-Book', fontSize: 16 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default HomeScreen;

const stylesModal = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 10,
    color: '#FF6F00',
  },
  modalText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  closeBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 25,
  },
});