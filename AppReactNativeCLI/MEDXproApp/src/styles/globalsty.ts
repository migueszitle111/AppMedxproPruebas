import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
    resizeMode: 'contain', // Ajusta la imagen al tamaño del contenedor
  },
  title: {
    color: 'white',
    fontSize: 40,
    marginBottom: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  input: {
    width: '80%',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    color: 'white',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'orange',
    padding: 15,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 19,
    fontFamily: 'WorkSans-Bold',
  },
  link: {
    color: 'white',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default globalStyles;
