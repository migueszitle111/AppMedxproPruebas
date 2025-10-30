import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
//import ReporteScreen from '../screens/ReporteScreen';
import Neurografia from '../screens/Menus/Tecnicas/Neurografia';
import Potenciales from '../screens/Menus/Tecnicas/Potenciales';
import Miografia from '../screens/Menus/Tecnicas/Miografia';
import MainLayout from '../screens/MainLayout';
import { RootStackParamList } from '../navigation/types';
//Rutas de los Reportes
//import MenuReportes from '../screens/web_to_reactnative/MenuBotones';
//import Neuronopatia from '../screens/Menus/Reportes/Neuronopatia';
import Radiculopatia from '../screens/Menus/Reportes/Radiculopatia';
import Plexopatia from '../screens/Menus/Reportes/Plexopatia';
import Neuropatia from '../screens/Menus/Reportes/Neuropatia';
import Polineuropatia from '../screens/Menus/Reportes/Polineuropatia';
import UnionNeuroMuscular from '../screens/Menus/Reportes/UnionNeuroMuscular';
import Miopatia from '../screens/Menus/Reportes/Miopatia';

import Visual from '../screens/Menus/Reportes/Visual';
import Auditiva from '../screens/Menus/Reportes/Auditiva';
import Somatosensorial from '../screens/Menus/Reportes/Somatosensorial';
import MotoraCorticoespinal from '../screens/Menus/Reportes/MotoraCorticoespinal';

import Perfil from '../screens/Perfil/PantallaPerfil';
import Pago from '../screens/Pago/Pago';
import Planes from '../screens/Pago/Planes';
import EducacionScreen from '../screens/EducacionScreen';
//import EventosScreen from '../screens/EventosScreen';
import Shop from '../screens/Shop/Shop';
import MenuReporte from '../screens/Menus/MenuReporte';
import HomeScreen from '../screens/HomeScreen2';

//import VideosScreen from '../screens/VideosScreen';
import PodcastScreen from '../screens/PodcastScreen';
import NoticiasScreen from '../screens/NoticiasScreen';
import MenuTecnicas from '../screens/Menus/MenuTecnicas';
import Neuronopatia from '../screens/Menus/Reportes/Neuronopatia';
import Configuracion from '../screens/Configuracion/Configuracion';

import Perlas from '../screens/Perlas/Perlas';
import Videos from '../screens/Videos/Videos';

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavMenuReporte(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PantallaPrincipal" component={MainLayout} />
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Neuronopatia" component={Neuronopatia} />
      <Stack.Screen name="Radiculopatia" component={Radiculopatia} />
      <Stack.Screen name="Plexopatia" component={Plexopatia} />
      <Stack.Screen name="Neuropatia" component={Neuropatia} />
      <Stack.Screen name="Polineuropatia" component={Polineuropatia} />
      <Stack.Screen name="UnionNeuroMuscular" component={UnionNeuroMuscular} />
      <Stack.Screen name="Miopatia" component={Miopatia} />

      <Stack.Screen name="Visual" component={Visual} />
      <Stack.Screen name="Auditiva" component={Auditiva} />
      <Stack.Screen name="Somatosensorial" component={Somatosensorial} />
      <Stack.Screen name="MotoraCorticoespinal" component={MotoraCorticoespinal} />

      <Stack.Screen name="Neurografia" component={Neurografia} />
      <Stack.Screen name="Miografia" component={Miografia} />
      <Stack.Screen name="PotencialesProvocados" component={Potenciales} />
      <Stack.Screen name="PruebasEspeciales" component={Neurografia} />
      <Stack.Screen name="Valores" component={Neurografia} />
      <Stack.Screen name="Protocolo" component={Neurografia} />

      <Stack.Screen name="Perfil" component={Perfil} />
      <Stack.Screen name="Pago" component={Pago} />
      <Stack.Screen name="Planes" component={Planes} />

      {/*Rutas del menu oculto*/}
      <Stack.Screen name="Educacion" component={EducacionScreen} />
      <Stack.Screen name="ReporteMenu" component={MenuReporte} />
      <Stack.Screen name="Shop" component={Shop} />
      <Stack.Screen name="Técnicas" component={MenuTecnicas} />
      <Stack.Screen name="Videos" component={Videos} />
      <Stack.Screen name="Podcast" component={PodcastScreen} />
      <Stack.Screen name="Noticias" component={NoticiasScreen} />
      <Stack.Screen name="Configuracion" component={Configuracion} />

      <Stack.Screen name="Perlas" component={Perlas} />
    </Stack.Navigator>
  );
}

export default NavMenuReporte;
