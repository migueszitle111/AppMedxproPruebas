import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ReporteScreen from '../screens/ReporteScreen';
import TecnicasScreen from '../screens/TecnicasScreen';
import MainLayout from '../screens/MainLayout';
import renderScreen from '../screens/HomeScreen2'; 

const Stack = createStackNavigator();

function Navigation() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Reporte" component={ReporteScreen} />
        <Stack.Screen name="Técnicas" component={TecnicasScreen} />

      </Stack.Navigator>
  );
}

export default Navigation;
