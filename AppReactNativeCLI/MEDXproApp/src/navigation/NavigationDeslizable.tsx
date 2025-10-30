import React from 'react';
//import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen2';
import ReporteScreen from '../screens/Menus/MenuReporte';
import TecnicasScreen from '../screens/TecnicasScreen';
import VideosScreen from '../screens/VideosScreen';
import PodcastScreen from '../screens/PodcastScreen';
import NoticiasScreen from '../screens/NoticiasScreen';
import EventosScreen from '../screens/EventosScreen';
import { View } from 'react-native';
import styles from '../styles/styles1';
import MainLayout from '../screens/MainLayout';
//import Header from '../components/Header';

const Stack = createNativeStackNavigator();

export default function NavigationDeslizable() {
  return (
    <View style={styles.mainContainer}>
      <Stack.Navigator screenOptions={({headerShown: false})}>
          <Stack.Screen name="Inicio" component={HomeScreen}/>
          <Stack.Screen name="ReporteM" component={ReporteScreen} />
          <Stack.Screen name="Técnicas" component={TecnicasScreen} />
          <Stack.Screen name="Videos" component={VideosScreen} />
          <Stack.Screen name="Podcast" component={PodcastScreen} />
          <Stack.Screen name="Noticias" component={NoticiasScreen} />
          <Stack.Screen name="Eventos" component={EventosScreen} />
          <Stack.Screen name="PantallaPrincipal" component={MainLayout} />

      </Stack.Navigator>
    </View>
  );
}
