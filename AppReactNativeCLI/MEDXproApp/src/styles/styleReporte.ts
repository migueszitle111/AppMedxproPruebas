import { StyleSheet } from 'react-native';

const styleReporte = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
   
  },
  imagen: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  principalReporte: {

  },
  leftPanel: {

  },
  rightPanel: {

  },
  rightPanelNeuropatia: {

  },
  ContenedorSeccion: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  optionsSection: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 15,
    flex: 1,

  },
  //HEADER - REPORTES
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  tituloReporte: {
    backgroundColor: '#222',
    paddingVertical: 2,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '40%',
    height: '110%',
  },
  tituloText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Italic',
  },
  titleContainer: {
    backgroundColor: '#444',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 22,
    color: '#FFA500',
  },
  printButton: {
    backgroundColor: '#000',
    borderRadius: 10,
  },
  printIcon: {
    fontSize: 22,
    color: '#000',
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'LuxoraGrotesk-Bold',
    marginTop: 10,
  },
  // Top Bar ahora centra SOLO el input
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    backgroundColor: '#000',
  },
  // Input en Top Bar (nuevo contenedor)
  nombrePacienteContainerTop: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  // 🔘 Estilos para los iconos en círculo
  iconGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 5,
    
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ff4500',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  iconBackground: {
    width: '75%',
    height: '75%',
    resizeMode: 'contain',
    borderColor: '#ff4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#ff4500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedIcon: {
    backgroundColor: '#ff4500',
  },
  selectedIconText: {
    color: '#000',
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%', backgroundColor: '#222', borderRadius: 20,
    overflow: 'hidden', marginBottom: 16, position: 'relative' ,     
    
  },
  categoryContainer: {
    width: '70%',
    height: '50%',
    maxHeight: 250,
    paddingRight: 10,
    borderRightWidth: 10,
    
  },
  category: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 3,
    borderRadius: 20,
  },
  selectedCategory: {
    backgroundColor: 'orange',
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  selectedCategoryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  optionsContainer: {
    flex: 1,
    padding: 10,
  },
  option: {
    backgroundColor: '#111',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: 'white',
    fontSize: 13,
  },
  //Nuevos styles
  /*baseImage: {
    width: '100%',
    height: 450,
    resizeMode: 'contain',
    borderRadius: 20,
  },*/
  baseImage: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,0,0,0)',
    zIndex: 10,
  },
  reporteContainer: {
    marginTop: 20,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
     
  },
  reporteTitle: {
    fontSize: 18,
    color: 'orange',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 8,
  },
  reporteTexto: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'LuxoraGrotesk-Light',
    textAlign: 'justify',
  },
  reporteTextoLista: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'LuxoraGrotesk-Light',
    textAlign: 'center',
  },
  //Estilos para las figuras
  figuraIcono: {
    width: 80,
    height: 80,
    marginRight: 15,
    borderWidth: 3,
    tintColor: '#fff',
    
  },
  figuraContenedor: {
    position: 'absolute',
    zIndex: 20,
   
  },
  contenedorFiguras: {
    marginTop: 15,
    marginRight: 160,
    width: '50%',
    minHeight: 200,
    justifyContent: 'flex-start',
    borderRightWidth: 2,
    paddingVertical: 12,
  },
  tituloFiguras: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '180%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imagenCirculo: {
    width: 60,
    height: 60,
    borderRadius: 40,
    borderWidth: 2,
    //borderColor: '#FFA500',
    borderColor: '#fff',
  },
  imagenCuadro: {
    width: 60,
    height: 60,
    borderWidth: 2,
    //borderColor: '#FFA500',
    borderColor: '#fff',
    marginLeft: 20,
    
  },
BotonReporte: {
  width: 100, // O el tamaño que necesites
  height: 100, // Mantiene la forma cuadrada
  borderRadius: 10,
  overflow: 'hidden', // Importante para que la imagen no se salga de los bordes redondeados
},
backgroundBoton: {
  flex: 1, // Hace que la imagen de fondo ocupe todo el espacio del TouchableOpacity
  justifyContent: 'center', // Centra verticalmente el contenido (el texto)
  alignItems: 'center', // Centra horizontalmente el contenido (el texto)
  //backgroundColor: 'white'
},
imagenFondoBoton: {
  resizeMode: 'cover', // Asegura que la imagen cubra todo el fondo sin distorsionarse
  
},
inputReporte: {
  flex: 1, // Hace que el input ocupe el espacio restante
  height: 50, // Altura del input
  paddingVertical: 6,
  paddingHorizontal: 7,
  backgroundColor: '#000',
  borderRadius: 6,
  color: '#fff',
  borderWidth: 1,
  borderColor: '#666',
  width: '80%',
  fontFamily: 'LuxoraGrotesk-Light',
  marginRight: 20,
  
},
textoBotonReporte: {
  color: '#fff', // Color del texto (ajusta según el color de tu imagen)
  fontWeight: 'bold',
  fontSize: 16,
  textShadowColor: 'rgba(0, 0, 0, 0.75)', // Sombra para mejorar la legibilidad del texto sobre la imagen
  textShadowOffset: { width: -1, height: 1 },
  textShadowRadius: 10,
},
  botonEliminar: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFinalizar: {
    marginBottom: 10,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
  },
  botonFinalizarTexto: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Medium',
  },
  //Nombre del paciente
  nombrePacienteContainer: {
    alignItems: 'center',
    height: '120%',
    width: '65%',
  },
  pacienteTitulo: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  labelPaciente: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Light',
  },
  inputPaciente: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 7,
    backgroundColor: '#000',
    borderRadius: 6,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#666',
    width: '80%',
    marginLeft: -35,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  //____________________________-
  miniaturaContainer: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 120,
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    zIndex: 999,
    elevation: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  miniBaseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    
  },
  miniaturaContainer1: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    zIndex: 999,
    elevation: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  //Estilos para el spinner de cargado de cerrar sesion
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoutText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  //[--NUEVOS ESTILOS UTILIZADOS EN EL REPORTE DE NEUROPATIA--]
  baseImageNeurop: {
    //width: '100%',
    //height: 450,
    resizeMode: 'contain',
    
  },
  overlayButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  // Nuevo estilo para el contenedor que envuelve la imagen interactiva
  imageInteractionArea: {
    //width: '100%',
    //height: 444, // O un alto flexible como flex: 1, si se ajusta a tus necesidades
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Esto es CRUCIAL para que el contenido no se desborde
    backgroundColor: '#ffffffff', // Color de fondo para visualizar el área
    borderRadius: 10,
    marginVertical: 10,

  },
  animatedImageContainer: {
    // width: '100%',
    // height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    
    position: 'relative', // Importante para posicionar los overlays
  },
  fullSizeOverlayImage: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    left: 0,
    top: 0,
    resizeMode: 'contain',
    opacity: 0.9,
    
  },
  imageBackgroundButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'contain',
    
  },
  // Pila vertical para modo lista
  listaStack: {
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'column',
    marginLeft: 23,
    paddingBottom: 16,
  },
  botonGaleria: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  estadoImagenOk: {
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 12,
  },
  estadoImagenVacia: {
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 12,
  },
  // Input base
  inputComentario: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: '#111',
    textAlignVertical: 'top',
    fontSize: 14,
    marginTop: 8,
  },
  // Altura base utilizada por el componente
  inputComentarioFijo: {
    minHeight: 120,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  // Vista previa del comentario
  comentarioPreview: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111',
    marginTop: 8,
    marginBottom: 12,
  },
  comentarioPreviewText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  // Botón para agregar/editar comentario
  btnComentario: {
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnComentarioText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default styleReporte;

