import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Estilos para el header
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: '55%',
    backgroundColor: '#444',
    borderRadius: 8,
    borderColor: '#111',
    borderWidth: 1,
    paddingVertical: 15,
    marginTop: 55,
    marginRight: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 6,
  },
  menuClose: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  closeIcon: {
    fontSize: 22,
    color: '#fff',
  },
  menuItemH: {
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBlockColor: '#fff',
    borderRadius: 10,
  },
  menuItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  menuItemIcon: {
    width: 50,
    height: 40,
    marginRight: 10,
    tintColor: '#fff',
  },
  menuTextH: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'WorkSans-Medium',
  },
  IconOut: {
    width: 40,
    height: 40,
    marginRight: 10,
    tintColor: '#fff',
    },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'WorkSans-Medium',
  },
  menuItemOut: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginRight: 50,
  },
  headerContainer: {
    width: '100%',
    height: '15%', //100 
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',

  },
  logoContainerHeader: {
    width: '20%',
    alignItems: 'flex-start',
  },
  logoP: {
    width: 95, // 50% menos que los 170 originales
    height: 55, // 50% menos que los 90 originales
    resizeMode: 'contain',
  },
  menuButton: {
    position: 'absolute',
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  menuIcon: {
    fontSize: 28,
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#E85900',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoMenuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centra horizontalmente el contenido
    width: '100%',
    position: 'relative',
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center', // Centra el logo horizontalmente
  },

  mainContainer: {
    flex: 1, // Ocupa toda la pantalla
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1, // Permite que HomeScreen ocupe el espacio disponible
  },
  //___________________________________________________//
  /* 🔹 Estilos para el pie de página */
  footer: {
    width: '100%',
    height: 90,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // Contenedor del logo
  logoContainer: {
    width: '20%',
    alignItems: 'flex-start',
  },
  logoF: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginTop: -40, // Añade espacio entre el logo y los links de navegación
    marginLeft: -5, // Añade espacio entre el logo y el borde izquierdo
  },
  // Links de navegación
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '25%',
    marginLeft: -10,
    marginTop: -50, // Añade espacio entre el logo y los links de navegación
  },
  navItemF: {
    color: '#999',
    fontSize: 11,
    marginHorizontal: 5,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  // Contenedor de la versión
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  versionContainer: {
    marginBottom: 50, // Espacio entre la versión y los iconos
    marginLeft: 35, // Añade espacio entre el borde derecho y la versión
    width: '100%',
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 30, // Añade espacio entre el borde derecho y la versión
    fontFamily: 'LuxoraGrotesk-Light',
  },
  // Contenedor de iconos de redes sociales
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 10, // Asegura que los iconos estén alineados en la parte inferior
    marginLeft: 25, // Añade espacio entre el borde izquierdo y los iconos
  },
  iconF: {
    width: 25,
    height: 25,
    marginHorizontal: 5,
    tintColor: '#fff',
  },
  //___________Estilos para FlatList de HomeScreen2.tsx____________________________
  card: {
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    height: 'auto',
    width: 'auto',
  },
  imageBackground: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Quando-Regular',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#ddd',
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  superposedImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative', // importante para permitir superposición absoluta
  },
  //____________________________________________
  //___________________________________________________//
  /* 🔹 Estilos para el botón de menú deslizable*/
  fixedMenu: {
    height: 120, // Ajusta la altura según lo necesario
    width : '100%',
    backgroundColor: '#000', // Color de fondo del menú
    paddingHorizontal: 10, // Añade espacio interno al menú
  },
  menuToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 10,
  },
  menuToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  /* 🔹 Estilos para el menú deslizable */
  hiddenMenu: {
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  iconScroll: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10, // Espacio al inicio y al final del scroll
  },
  iconContainer: {
    alignItems: 'center', // Asegura que la imagen y el texto estén alineados en el centro
    justifyContent: 'center',
    height: 'auto',
  },
  iconItemD: {
    backgroundColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 20, // Añade espacio interno a los botones
    borderRadius: 5,
    marginRight: 10, // Añade espacio entre cada opción
  },
  footerText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  // Estilos para los iconos del menú
  iconItem: {
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 5,
  },
  iconText: {
    color: '#fff',
    fontSize: 13, // Ajusta el tamaño del texto
    textAlign: 'center',
    fontFamily: 'Quando-Regular',

  },
  iconImage: {
    width: 70, // Ajusta el tamaño según sea necesario
    height: 60,
    marginBottom: 5, // Espacio entre la imagen y el texto
    resizeMode: 'contain', // Ajusta la imagen al tamaño del contenedor
  },
  /* 🔹 Estilos para la sección de la aplicación con imagen */
  appPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6600',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 10,
    height: 200,
  },
  // Estilos para la imagen del banner
  bannerImage: {
    width: '100%', // Ajusta el tamaño según necesites
    height: 100,
    maxWidth: '50%', // Ajusta el tamaño máximo
    marginRight: 10, // Espacio entre la imagen y el texto
    borderRadius: 10, // Opcional, para bordes redondeados
    resizeMode: 'contain', // Ajusta la imagen al tamaño del contenedor
  },
  appTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appDescription: {
    color: '#fff',
    marginVertical: 10,
    width: '100%',
  },
  ContenedorPromo: {
    width: '100%',
    maxWidth: '60%',
  },
  // Estilos para el contenedor de la descripción
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navItem: {
    paddingVertical: 10,
  },
  navItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#f39c12',
  },
  navText: {
    color: '#fff',
    fontSize: 16,
  },
  navTextActive: {
    color: '#f39c12',
    fontWeight: 'bold',
  },
  sideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '60%',
    height: '100%',
    backgroundColor: '#111',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  closeText: {
    fontSize: 28,
    color: '#fff',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuText: {
    color: 'red',
    fontSize: 18,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain', // Ajusta la imagen al tamaño del contenedor
  },
  /* 🔹 Estilos para las publicaciones */
  publicacion: {
    backgroundColor: '#222',
    margin: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 5,
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOpacity: 0.1, // Sombra en iOS
    shadowRadius: 3, // Sombra en iOS
  },
  categoria: {
    color: '#ff6600',
    fontWeight: 'bold',
  },
  titulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  descripcion: {
    color: '#ccc',
  },
  //_______________--
  reporteCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  reporteImagen: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  tituloFl: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  descripcionFl: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  promoCard: {
    backgroundColor: '#d35400',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  promoImagen: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  storeIcon: {
    width: 120,
    height: 40,
    marginHorizontal: 5,
  },
  educacionCard: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  educacionImagen: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
});

export default styles;
