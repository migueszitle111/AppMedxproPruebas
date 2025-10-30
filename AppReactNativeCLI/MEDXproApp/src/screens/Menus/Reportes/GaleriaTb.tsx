// GaleriaEmergente.tsx (reemplazo sin Modal)
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import type { ImageSourcePropType } from 'react-native';


const imagenesDemo = [
  { id: 'CRITERIOS DE LAMBERT PARA DESMIELINIZACIÓN', uri: require('../../../assets/Tablas/LAMBERT_DESMIELINIZACION.png') },
  { id: 'CRITERIOS CIDP AANEM', uri: require('../../../assets/Tablas/CRITERIOS_CIDP_AANEM.png') },
  { id: 'CRITERIOS DE LAMBERT ESCLEROSIS LATERAL AMIOTRÓFICA', uri: require('../../../assets/Tablas/LAMBERT_ESCLEROSIS_LT.png')},
  { id: 'CRITERIOS DE AWAJI 2008 (DOMINIO)', uri: require('../../../assets/Tablas/CRITERIOS _AWAJI_2008_1.png') },
  { id: 'CRITERIOS DE AWAJI 2008 (CATEGORÍA)', uri: require('../../../assets/Tablas/CRITERIOS _AWAJI_2008_2.png') },
  { id: 'COMPARACIÓN EL ESCORIAL / AWAJI 2008', uri: require('../../../assets/Tablas/COMPARACION_ESCORIAL.png')},
  { id: 'CRITERIOS POLINEUROPATÍA DESMIELINIZANTE/AXONAL', uri: require('../../../assets/Tablas/POLINEUROPATIA_DESMIELINIZANTE.png')},
  { id: 'PATRONES DE DISTRIBUCIÓN EN POLINEUROPATÍA', uri: require('../../../assets/Tablas/DISTRIBUCION_POLI.png') },
  { id: 'CUANTIFICACIÓN DE POLINEUROPATÍAS', uri: require('../../../assets/Tablas/CUANTIFICACION_POLI.png') },
  { id: 'HALLAZGOS ELECTROFISIOLÓGICOS EN RADICULOPATÍA', uri: require('../../../assets/Tablas/ELECTROFISIOLOGICOS_RADI.png') },
  { id: 'HALLAZGOS ELECTROFISIÓLOGICOS EVOLUTIVOS EN RADICULOPATÍA', uri: require('../../../assets/Tablas/EVOLUTIVOS_RADI.png') },
  { id: 'HALLAZGOS NEUROGRÁFICOS EN MIOPATÍAS', uri: require('../../../assets/Tablas/NEUROGRAFICO_MIO.png') },
  { id: 'HALLAZGOS MIOGRÁFICOS EN MIOPATÍAS', uri: require('../../../assets/Tablas/MIOGRAFICOS_MIO.png') },
  { id: 'HALLAZGOS DIFERENCIALES POR TIPOS DE MIOPATÍAS', uri: require('../../../assets/Tablas/TIPOS_MIOPATIAS.png') },
  { id: 'COMPARACIÓN MIOPATÍA/RADICULOPATÍA/UNIÓN NEUROMUSCULAR', uri: require('../../../assets/Tablas/COMPARACION.png') },
  { id: 'SEVERIDAD EN MIOPATÍA', uri: require('../../../assets/Tablas/SEVERIDAD_MIO.png') },
  { id: 'GRAVEDAD POR DECREMENTO ELECTROFISIOLÓGICO EN MIASTENIA GRAVIS', uri: require('../../../assets/Tablas/DECREMENTO_ELEC.png') },
  { id: 'GRAVEDAD POR SFEMG ELECTROFISIOLÓGICO EN MIASTENIA GRAVIS', uri: require('../../../assets/Tablas/SFEMG_ELEC.png') },
  { id: 'COORRELACIÓN DE PRUEBAS ELECTROFISIOLOGICAS/DATOS CLÍNICOS EN MIASTENIA GRAVIS', uri: require('../../../assets/Tablas/PRUEBAS_ELEC.png') },
  { id: 'CLASIFICACIÓN DE GRAVEDAD EN POTENCIALES EVOCADOS SOMATOSENSORIALES Y MOTORES', uri: require('../../../assets/Tablas/POTENCIALES_EVO.png') },
  { id: 'CLASIFICACIÓN DE GRAVEDAD EN POTENCIALES EVOCADOS VISUALES', uri: require('../../../assets/Tablas/POTENCIALES_VISUALES.png') },
  { id: 'CLASIFICACIÓN DE GRAVEDAD EN POTENCIALES EVOCADOS AUDITIVOS', uri: require('../../../assets/Tablas/POTENCIALES_AUD.png') },
  { id: 'PRONÓSTICO ASOCIADO A POTENCIALES EVOCADOS', uri: require('../../../assets/Tablas/PRONOSTICO_ASOCIADO.png') },
  { id: 'SEVERIDAD POTENCIALES EVOCADOS MULTIMODALES', uri: require('../../../assets/Tablas/EVO_MULTIMODALES.png') },
  { id: 'INTERPRETACIÓN POTENCIALES EVOCADOS SOMATOSENSORIALES MS', uri: require('../../../assets/Tablas/SOMATOSENSORIALES_MS.png') },
  { id: 'INTERPRETACIÓN POTENCIALES EVOCADOS SOMATOSENSORIALES MI', uri: require('../../../assets/Tablas/SOMATOS_MI.png') },
  { id: 'MIOPATÍAS DISTALES', uri: require('../../../assets/Tablas/MIOPATIAS_DISTAL.png') },
  { id: 'SÍNDROMES DE LESIÓN COMBINADA A PARES CRANEALES', uri: require('../../../assets/Tablas/PARES_CRANEALES.png') },
  { id: 'PRONÓSTICO EN NERVIO FACIAL DE ACUERDO CON EL DÉFICIT AXONAL', uri: require('../../../assets/Tablas/DEFICIT_AXONAL.png') },
  { id: 'EVOLUCION EN NERVIO FACIAL DE ACUERDO CON EL DÉFICIT AXONAL', uri: require('../../../assets/Tablas/DEFICIT_AXONAL2.png') },
  { id: 'COORRELACIÓN DE TIEMPO DE EVOLUCIÓN EN PLEXOPATÍAS', uri: require('../../../assets/Tablas/EVOLUCION_PLEXO.png') },
  { id: 'PATRONES ELECTROFISIOLÓGICOS EN NEUROPATÍA', uri: require('../../../assets/Tablas/PATRONES_NEURO.png') },
  { id: 'CRITERIOS ELECTROFISIOLÓGICOS DE DESMIELINIZACIÓN', uri: require('../../../assets/Tablas/ELECTROFISIOLOGICOS_DES.png') },
  { id: 'CRITERIOS DIAGNÓSTICOS ELECTROFISIOLÓGICOS PARA AIDP', uri: require('../../../assets/Tablas/CRITERIOS_AIDP.png') },
  { id: 'DIFERENCIAS ELECTROFISIOLÓGICAS EN POLINEUROPATÍAS', uri: require('../../../assets/Tablas/DIFERENCIAS_POLI.png') },
  { id: 'AANEM CRITERIOS PARA NEUROPATÍAS POR ATRAPAMIENTO', uri: require('../../../assets/Tablas/ATRAPAMIENTO.png') },
  { id: 'CLASIFICACIÓN DE SEDDON Y SUNDERLAND', uri: require('../../../assets/Tablas/Tabla38.png') },
  { id: 'POLINEUROPATÍAS DESMIELINIZANTES', uri: require('../../../assets/Tablas/Tabla39.png') },
  { id: 'SÍNDROME DEL TÚNEL DEL CARPO – PADUA', uri: require('../../../assets/Tablas/Tabla40.png') },
  { id: 'SÍNDROME DEL TÚNEL DEL CARPO – CANTERBURY', uri: require('../../../assets/Tablas/Tabla41.png') },
  { id: 'SÍNDROME DEL TÚNEL DEL CARPO – HIRANI', uri: require('../../../assets/Tablas/Tabla42.png') },
  { id: 'CRITERIOS DE LAMBERT PARA DESMIELINIZACIÓN', uri: require('../../../assets/Tablas/Tabla43.png') },
  { id: 'CRITERIOS CIDP AANEM', uri: require('../../../assets/Tablas/Tabla44.png') },
];
interface GaleriaEmergenteProps {
  visible: boolean;
  onImagenSeleccionada: (src: string | ImageSourcePropType) => void;
  onClose: () => void;
}

const GaleriaEmergente: React.FC<GaleriaEmergenteProps> = ({ visible, onImagenSeleccionada, onClose }) => {
  const [searchText, setSearchText] = useState('');
  if (!visible) return null; // 🔴 clave: nada si no está visible

  const imagenesFiltradas = imagenesDemo.filter(imagen =>
    imagen.id.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.overlayRoot} pointerEvents="auto">
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Contenedor de la galería */}
      <View style={styles.sheet}>
        <Text style={styles.titulo}>Selecciona una imagen:</Text>

        <TextInput
          style={styles.buscador}
          placeholder="Buscar imagen..."
          placeholderTextColor="#bbb"
          value={searchText}
          onChangeText={setSearchText}
        />

        <ScrollView style={styles.listaImagenes} keyboardShouldPersistTaps="handled">
          {imagenesFiltradas.map((imagen, i) => (
            <TouchableOpacity
              key={`${imagen.id}-${i}`}
              onPress={() => onImagenSeleccionada(imagen.uri)}
              style={styles.itemLista}
            >
              <Text style={styles.textoLista}>{imagen.id}</Text>
            </TouchableOpacity>
          ))}
          {imagenesFiltradas.length === 0 && (
            <Text style={styles.textoNoResultados}>No se encontraron resultados.</Text>
          )}
        </ScrollView>

        <TouchableOpacity onPress={onClose} style={styles.botonCerrar}>
          <Text style={styles.textoBoton}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    // 🔥 Overlay absoluto a pantalla completa, por encima de TODO
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    width: '95%',
    height: '90%',
    backgroundColor: '#2e2e2e',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    // Sombra (iOS) / Elevación (Android) para estar siempre visible
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 20 },
    }),
  },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: 'white' },
  buscador: {
    width: '95%', backgroundColor: '#444', color: 'white',
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, marginBottom: 10,
  },
  listaImagenes: { flexGrow: 1, width: '95%' },
  itemLista: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#444' },
  textoLista: { color: 'white', fontSize: 16 },
  botonCerrar: {
    marginTop: 15, padding: 10, backgroundColor: '#ff4500',
    borderRadius: 5, width: '50%', alignItems: 'center',
  },
  textoBoton: { color: 'white', fontWeight: 'bold' },
  textoNoResultados: { color: 'white', fontStyle: 'italic', marginTop: 10 },
});

export default GaleriaEmergente;