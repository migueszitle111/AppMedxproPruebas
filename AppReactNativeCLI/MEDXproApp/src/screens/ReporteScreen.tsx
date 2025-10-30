import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image,ImageBackground, PermissionsAndroid, Platform, Permission, Alert, Animated, TextInput} from 'react-native';
//import Svg, { Path } from 'react-native-svg';
import Header from '../components/Header';
import {launchImageLibrary } from 'react-native-image-picker';
//import Reanimated, { useSharedValue, useAnimatedStyle, useAnimatedGestureHandler, runOnJS} from 'react-native-reanimated';
//import { PanGestureHandler } from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import FiguraMovible from '../components/FiguraMovible';
import { Figura } from '../navigation/types';
import styleReporte from '../styles/styleReporte';
import { escanearImagen } from '../utils/EscanearImagen';

const imagenCuerpo = require('../assets/CuerpoPng/Contorno_Fondo_Blanco.png');

const estructuraJerarquica = {
  titulo: 'Fibras',
  seleccionMultiple: false,
  opciones: [
    {
      nombre: 'Motora-Asta Anterior Medular',
      siguiente: {
        titulo: 'Clasificación',
        seleccionMultiple: false,
        opciones: [
          {
            nombre: 'Hereditaria',
            siguiente: {
              titulo: 'Denervación',
              seleccionMultiple: false,
              opciones: [
                {
                  nombre: 'Difusa Severa (++++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Abundante Progresiva (+++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Activa Moderada (++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Leve (+/+)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Inactiva',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
              ],
            },
          },
          {
            nombre: 'Adquirida',
            siguiente: {
              titulo: 'Denervación',
              seleccionMultiple: false,
              opciones: [
                {
                  nombre: 'Difusa Severa (++++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Abundante Progresiva (+++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Activa Moderada (++)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Leve (+/+)',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
                {
                  nombre: 'Inactiva',
                  siguiente: {
                    titulo: 'Distribución',
                    seleccionMultiple: true,
                    opciones: [
                      { nombre: 'Bulbar' },
                      { nombre: 'Cervical/Miembros Superiores' },
                      { nombre: 'Torácica' },
                      { nombre: 'Lumbar/Miembros Inferiores' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      nombre: 'Sensitiva-Ganglio de la Raíz Dorsal',
      siguiente: {
        titulo: 'Clasificación',
        seleccionMultiple: false,
        opciones: [
          {
            nombre: 'Hereditaria',
            siguiente: {
              titulo: 'Denervación',
              seleccionMultiple: false,
              opciones: [], // Puedes copiar aquí si quieres igualar las de Motora
            },
          },
          {
            nombre: 'Adquirida',
            siguiente: {
              titulo: 'Denervación',
              seleccionMultiple: false,
              opciones: [],
            },
          },
        ],
      },
    },
  ],
};

const zonasOverlay = {
  'Bulbar': { top: 10, height: 60 },
  'Cervical/Miembros Superiores': { top: 70, height: 90 },
  'Torácica': { top: 160, height: 90 },
  'Lumbar/Miembros Inferiores': { top: 250, height: 170 },
};

const imagenesOverlay: Record<string, any> = {
  'Bulbar': require('../assets/CuerpoPng/Neuronopatia/Bulbar.png'),
  'Cervical/Miembros Superiores': require('../assets/CuerpoPng/Neuronopatia/Cervical.png'),
  'Torácica': require('../assets/CuerpoPng/Neuronopatia/Toracico.png'),
  'Lumbar/Miembros Inferiores': require('../assets/CuerpoPng/Neuronopatia/Lumbar.png'),
};


function ReporteScreen(): React.JSX.Element {
  const [ruta, setRuta] = useState([estructuraJerarquica]);
  const [seleccionMultiple, setSeleccionMultiple] = useState<string[]>([]);
  const [resumen, setResumen] = useState<string[]>([]);
  //const [figuraActiva, setFiguraActiva] = useState<'circle' | 'square' | null>(null);
  //const [imagenFigura, setImagenFigura] = useState<string | null>(null);
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const scrollPrincipalRef = useRef<ScrollView>(null);
  const [mostrarMiniatura, setMostrarMiniatura] = useState(false);
  const [distribucionFinalizada, setDistribucionFinalizada] = useState(false);
  const [nombrePaciente, setNombrePaciente] = useState('');

  const nivelActual = ruta[ruta.length - 1];

  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setMostrarMiniatura(offsetY > 200); // Solo mostrar miniatura si scroll bajó más de 200px
  };

  const pedirPermiso = async(): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permisos: Permission[] = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];
        // Cámara
        //permisos.push(PermissionsAndroid.PERMISSIONS.CAMERA);

        // Android 13+
        if (Platform.Version >= 33) {
          permisos.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
        } else {
          permisos.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        }

        const granted = await PermissionsAndroid.requestMultiple(permisos);
        const camaraOk = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
        const lecturaOk =
          Platform.Version >= 33
            ? granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED
            : granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;

        if (camaraOk && lecturaOk) {
          console.log('✅ Permisos concedidos');
          return true;
        } else {
          console.log('❌ Algún permiso fue denegado');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      // iOS: puede manejarse con react-native-permissions si lo necesitas
      return true;
    }
  };

  const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
    const permiso = await pedirPermiso();
    if (!permiso) {
      console.warn('Permiso denegado para usar la cámara o galería');
      return;
    }

    try {
      Alert.alert('Seleccionar Imagen:',
        '¿Qué deseas hacer?',

        [
          {
              text: 'Tomar foto',
              onPress: async () => {
                const imagenEscaneada = await escanearImagen();

                if (imagenEscaneada) {
                  agregarFigura(tipo, imagenEscaneada);
                }else{
                  console.warn('No se pudo escanear la imagen');
                }
                /*launchCamera({ mediaType: 'photo', quality: 1 }, (res) => {
                  if (res.didCancel) {
                    console.log('El usuario canceló la cámara.');
                    return;
                  }
                  if (res.errorCode) {
                    console.error('Error al tomar foto:', res.errorMessage);
                    return;
                  }

                  if (res.assets?.length && res.assets[0].uri) {
                    agregarFigura(tipo, res.assets[0].uri);
                  }
                });*/
              },
          },
          {
            text: 'Seleccionar de la galería',
            onPress: () => {
              launchImageLibrary({ mediaType: 'photo', quality: 1 }, (res) => {
                if (res.didCancel) {
                  console.log('El usuario canceló la selección de imagen.');
                  return;
                }
                if (res.errorCode) {
                  console.error('Error al seleccionar imagen:', res.errorMessage);
                  return;
                }

                if (res.assets?.length && res.assets[0].uri) {
                  agregarFigura(tipo, res.assets[0].uri);
                }
              });
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],

      );
    } catch (error) {
      console.error('Error inesperado al seleccionar imagen:', error);
    }
  };

  const agregarFigura = (tipo: 'circle' | 'square', uri: string) => {
    const nuevaFigura = {
      id: uuid.v4(),
      tipo,
      uri,
      posicion: { x: 0, y: 0 },
    };
    setFiguras((prev) => [...prev, nuevaFigura]);
  };

  const actualizarPosicion = (id: string, x: number, y: number) => {
    setFiguras((prev) =>
      prev.map((fig) =>
        fig.id === id ? { ...fig, posicion: { x, y } } : fig
      )
    );
  };

  const eliminarFigura = (id: string) => {
    setFiguras((prev) => prev.filter((fig) => fig.id !== id));
  };

const avanzarNivel = (opcion: any) => {
  if (nivelActual.seleccionMultiple) {
    setSeleccionMultiple((prev) => {
      const nuevo = prev.includes(opcion.nombre)
        ? prev.filter((nombre) => nombre !== opcion.nombre)
        : [...prev, opcion.nombre];

      const nuevaEntrada = `${nivelActual.titulo}: ${nuevo.join(', ')}`;

      let actualizado = [...resumen];

      // Verifica si ya existe una entrada para esta categoría
      const indexExistente = resumen.findIndex(entry =>
        entry.startsWith(`${nivelActual.titulo}:`)
      );

      if (indexExistente !== -1) {
        // Reemplaza la entrada existente
        actualizado[indexExistente] = nuevaEntrada;
      } else {
        // Agrega la nueva entrada
        actualizado.push(nuevaEntrada);
      }

      setResumen(actualizado);
      return nuevo;
    });
  } else if (opcion.siguiente) {
    setRuta([...ruta, opcion.siguiente]);

    const nuevaEntrada = `${nivelActual.titulo}: ${opcion.nombre}`;
    const indexExistente = resumen.findIndex(entry =>
      entry.startsWith(`${nivelActual.titulo}:`)
    );

    let actualizado = [...resumen];

    if (indexExistente !== -1) {
      actualizado[indexExistente] = nuevaEntrada;
    } else {
      actualizado.push(nuevaEntrada);
    }

    setResumen(actualizado);
    setSeleccionMultiple([]);
  }
};

  const retrocederNivel = () => {

    if (nivelActual.titulo === 'Distribución' && distribucionFinalizada) {
      // Solo volver a mostrar las opciones de distribución
      setDistribucionFinalizada(false);
      setNombrePaciente(''); // Limpiar el nombre del paciente al retroceder
      return;
    }

    if (ruta.length > 1) {
      const nuevaRuta = ruta.slice(0, -1);
      setRuta(nuevaRuta);
      setResumen(resumen.slice(0, -1));
      setSeleccionMultiple([]);
      setNombrePaciente(''); // Limpiar el nombre del paciente al retroceder
    }
  };

  const reiniciar = () => {
    setRuta([estructuraJerarquica]);
    setResumen([]);
    setSeleccionMultiple([]);
    setNombrePaciente(''); // Limpiar el nombre del paciente al retroceder
  };

  useEffect(() => {
    if (
      (nivelActual.opciones.length > 2 || resumen.length > 1) &&
      scrollPrincipalRef.current
    ) {
      setTimeout(() => {
        scrollPrincipalRef.current?.scrollToEnd({ animated: true });
      }, 200); // Delay para asegurarse de que todo haya sido renderizado
    }
  }, [nivelActual, resumen]);

  const zonasSeleccionadas = nivelActual.titulo === 'Distribución' ? seleccionMultiple : [];

  return (
    <View style={styleReporte.container}>
      <Header />
      <View style={styleReporte.header}>
        {/* Título "Reporte" */}
        <View style={styleReporte.tituloReporte}>
          <Text style={styleReporte.tituloText}>Reporte</Text>
        </View>

        {/* Iconos */}
                <View style={styleReporte.iconContainer}>
                <TouchableOpacity style={styleReporte.iconCircle} onPress={retrocederNivel}>
                  <ImageBackground
                    source={require('../assets/03_Íconos/03_02_PNG/I_Out2.png')} // Cambia la ruta a tu imagen
                    style={[styleReporte.iconBackground, { borderWidth: 1.5, borderColor: '#ff4500', borderRadius: 16 }]}
                    imageStyle={{
                      borderRadius: 16,
                      width: '90%',
                      height: '90%',
                      resizeMode: 'contain',
                      backgroundColor: 'black',
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styleReporte.iconCircle} onPress={reiniciar}>
                  <ImageBackground
                    source={require('../assets/03_Íconos/03_02_PNG/I_Repeat2.png')} // Cambia la ruta a tu imagen
                    style={[styleReporte.iconBackground, { borderWidth: 1.5, borderColor: '#ff4500', borderRadius: 16 }]}
                    imageStyle={{
                      borderRadius: 16,
                      width: '90%',
                      height: '90%',
                      resizeMode: 'contain',
                      backgroundColor: 'black',
                    }}
                  />
                </TouchableOpacity>
                  <TouchableOpacity style={styleReporte.iconCircle}>
                  <ImageBackground
                    source={require('../assets/03_Íconos/03_02_PNG/I_Folder2.png')} // Cambia la ruta a tu imagen
                    style={[styleReporte.iconBackground, { borderWidth: 1.5, borderColor: '#ff4500', borderRadius: 16 }]}
                    imageStyle={{
                      borderRadius: 16,
                      width: '90%',
                      height: '90%',
                      resizeMode: 'contain',
                      backgroundColor: 'black',
                    }}
                  />
                </TouchableOpacity>
                  <TouchableOpacity style={[styleReporte.iconCircle, styleReporte.printButton]}>
                  <ImageBackground
                    source={require('../assets/03_Íconos/03_02_PNG/I_Print2.png')} // Cambia la ruta a tu imagen
                    style={[styleReporte.iconBackground, { borderWidth: 1.5, borderColor: '#ff4500', borderRadius: 16 }]}
                    imageStyle={{
                      borderRadius: 16,
                      width: '90%',
                      height: '90%',
                      resizeMode: 'contain',
                      backgroundColor: 'black',
                    }}
                  />
                </TouchableOpacity>
                </View>
              </View>

      <Animated.ScrollView contentContainerStyle={{ flexGrow: 1, }}
        ref={scrollPrincipalRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Imagen */}
        <View style={styleReporte.imageContainer} onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setLimitesContenedor({ width, height });
          }}
        >
          <Image source={imagenCuerpo} style={styleReporte.baseImage} />
          {figuras.map((figura) => (
            <FiguraMovible
              key={figura.id}
              id={figura.id}
              tipo={figura.tipo}
              uri={figura.uri}
              posicionInicial={figura.posicion}
              onEliminar={eliminarFigura}
              onActualizarPosicion={actualizarPosicion}
              limitesContenedor={limitesContenedor}
            />
          ))}
          {zonasSeleccionadas.map((zona, index) => (
            <View
              key={index}
              style={[
                styleReporte.overlay,
                zonasOverlay[zona as keyof typeof zonasOverlay],
              ]}
            />
          ))}

          {zonasSeleccionadas.map((zona, index) => {
            const overlay = zonasOverlay[zona as keyof typeof zonasOverlay];
            const imagen = imagenesOverlay[zona as keyof typeof imagenesOverlay];
            console.log('Zona:', zona, 'Imagen:', imagen);


            if (!overlay || !imagen) return null;

            return (
              <Image
                key={`overlay-img-${index}`}
                source={imagen}
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                  left: 0,
                  right: 0,
                  resizeMode: 'contain',
                  opacity: 0.9, // puedes ajustar opacidad según desees
                }}
              />
            );
          })}

        </View>

        {/* Reporte generado */}
        <View style={styleReporte.reporteContainer}>
          <Text style={styleReporte.reporteTitle}>Neuronopatía</Text>
            {/* Nombre del paciente */}
          {nombrePaciente.trim() !== '' && (
            <Text style={[styleReporte.reporteTexto, { fontWeight: 'bold', marginBottom: 5 }]}>
              Paciente: {nombrePaciente}
            </Text>
          )}
          {resumen.map((linea, index) => (
            <Text key={index} style={styleReporte.reporteTexto}>
              {linea}
            </Text>
          ))}

        </View>

        {/* Sección de opciones jerárquicas */}
        <View style={styleReporte.optionsSection}>
          <View style={styleReporte.ContenedorSeccion}>
            {!(nivelActual.titulo === 'Distribución' && distribucionFinalizada) && (
              <Text style={[styleReporte.titleText, { marginBottom: 10 }]}>{nivelActual.titulo}</Text>
            )}
            {nivelActual.titulo === 'Distribución' && !distribucionFinalizada && (
              <TouchableOpacity
                onPress={() => setDistribucionFinalizada(true)}
                style={{ marginBottom: 10, backgroundColor: '#444', padding: 10, borderRadius: 5 }}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>Finalizar selección</Text>
              </TouchableOpacity>
            )}
            {nivelActual.titulo === 'Distribución' && distribucionFinalizada ? (
              <View style={styleReporte.contenedorFiguras}>
                <View style={styleReporte.tituloFiguras}>
                  <TouchableOpacity onPress={() => {
                    manejarSeleccionImagen('circle');
                  }}>
                    <Image source={require('../assets/Figuras/circulo.png')} style={styleReporte.imagenCirculo} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    manejarSeleccionImagen('square');
                  }}>
                    <Image source={require('../assets/Figuras/cuadrado.png')} style={styleReporte.imagenCuadro} />
                  </TouchableOpacity>
                </View>
                {/*Campo para nombre del paciente */}
                <View style={styleReporte.nombrePacienteContainer}>
                  <Text style={styleReporte.labelPaciente}>Nombre del paciente</Text>
                  <TextInput
                    style={styleReporte.inputPaciente}
                    placeholder="Nombre del paciente"
                    value={nombrePaciente}
                    onChangeText={setNombrePaciente}
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

            ) : (
            <ScrollView style={[styleReporte.categoryContainer,
              nivelActual.titulo === 'Distribución' && { width: '63%', marginRight: 120 }
            ]} >
              {nivelActual.opciones.map((opcion: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[styleReporte.category, { backgroundColor: '#222' },
                    (nivelActual.seleccionMultiple && seleccionMultiple.includes(opcion.nombre))
                    ? { backgroundColor: 'orange' }
                    : { backgroundColor: '#222' },
                  ]}
                  onPress={() => avanzarNivel(opcion)}
                >
                  <Text style={styleReporte.categoryText}>{opcion.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    {/* MINIATURA FLOTANTE */}
    {mostrarMiniatura && limitesContenedor.width > 0 && limitesContenedor.height > 0 && nivelActual.titulo === 'Distribución' && (
      <View style={styleReporte.miniaturaContainer}>
        <Image source={imagenCuerpo} style={styleReporte.miniBaseImage} />
        {/* Figuras escaladas */}
        {figuras.map((figura) => {
          const escalaX = 100 / limitesContenedor.width;
          const escalaY = 150 / limitesContenedor.height;

          return (
            <Image
              key={figura.id}
              source={{ uri: figura.uri }}
              style={{
                position: 'absolute',
                left: figura.posicion.x * escalaX,
                top: figura.posicion.y * escalaY,
                width: 60 * escalaX,
                height: 60 * escalaY,
                borderRadius: figura.tipo === 'circle' ? 100 : 0,
                borderWidth: 1,
                borderColor: '#000',
              }}
            />
          );
        })}

        {zonasSeleccionadas.map((zona, index) => {
          
          const overlay = zonasOverlay[zona as keyof typeof zonasOverlay];
          const imagen = imagenesOverlay[zona as keyof typeof imagenesOverlay];

          if (!overlay || !imagen) return null;

          return (
            <Image
              key={`mini-overlay-${index}`}
              source={imagen}
              style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
                left: 0,
                right: 0,
                resizeMode: 'contain',
                opacity: 0.8,
              }}
            />
          );
        })

        }

        {/* Zonas seleccionadas escaladas */}
        {zonasSeleccionadas.map((zona, index) => {
          const original = zonasOverlay[zona as keyof typeof zonasOverlay];
          if (!original) return null;

          const escalaY = 190 / limitesContenedor.height;

          const scaledOverlay = {
            position: 'absolute' as const,
            top: original.top * escalaY,
            height: original.height * escalaY,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255, 165, 0, 0)', // naranja con opacidad
          };

          return <View key={index} style={scaledOverlay} />;
        })}

      </View>
    )}
    </View>
  );
}

export default ReporteScreen;


// 🎨 **Estilos mejorados**
//const styleReporte = StyleSheet.create({

//});
