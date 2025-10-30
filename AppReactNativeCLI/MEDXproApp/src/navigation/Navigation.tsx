import React from 'react';
//import { NavigationContainer } from '@react-navigation/native'; //Se usa como el contenedor principal de navegación, importado de @react-navigation/native.
//import HomeScreen2 from '../screens/HomeScreen2';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; //Se importa el método createNativeStackNavigator de @react-navigation/native-stack.
import EducacionScreen from '../screens/EducacionScreen';
import ReporteScreen from '../screens/Menus/MenuReporte';
import EventosScreen from '../screens/EventosScreen';
import { RootStackParamList } from '../navigation/types';
import NavMenuReporte from './NavMenuReporte';

// Definir el tipo de rutas
// 📌 Se define un tipo para las rutas de la aplicación, que se utilizará en la navegación de pestañas.

const Stack = createNativeStackNavigator<RootStackParamList>();
// Crear el componente de pestañas
// Se le pasa el tipo RootTabParamList para definir las rutas de la aplicación.
// Componente de navegación
function Navigation(): React.JSX.Element {
  return (
    // Se envuelve la navegación en el contenedor de navegación.
    /* Se define la navegación de pestañas con las rutas y opciones de estilo. */
    <Stack.Navigator screenOptions={{ headerShown: false   }}>
      <Stack.Screen name="OtraPantalla" component={NavMenuReporte} />
      <Stack.Screen name="Educacion" component={EducacionScreen} />
      <Stack.Screen name="ReporteM" component={ReporteScreen} />
      <Stack.Screen name="Eventos" component={EventosScreen} />
      <Stack.Screen name="Neuronopatia" component={ReporteScreen} />
      <Stack.Screen name="Neuronopatia" component={ReporteScreen} />
    </Stack.Navigator>
  );
}


export default Navigation;
