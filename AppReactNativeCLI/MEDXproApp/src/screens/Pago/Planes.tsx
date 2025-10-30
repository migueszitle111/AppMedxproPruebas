import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types'; // Ajusta la ruta si es distinta

function Planes(): React.JSX.Element {
  const [planSeleccionado, setPlanSeleccionado] = useState<'mensual' | 'anual' | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const ahorroPorcentaje = 0.0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Elige tu plan</Text>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={[
            styles.planCard,
            planSeleccionado === 'mensual' && styles.selectedCard,
          ]}
          onPress={() => setPlanSeleccionado('mensual')}
        >
          <Text style={styles.planTitle}>Plan Mensual</Text>
          <Text style={styles.planPrice}>$0 MXN / mes</Text>
          <Text style={styles.planDescription}>Acceso completo durante 30 días.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planCard,
            planSeleccionado === 'anual' && styles.selectedCard,
          ]}
          onPress={() => setPlanSeleccionado('anual')}
        >
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>¡Ahorra {ahorroPorcentaje}%!</Text>
          </View>
          <Text style={styles.planTitle}>Plan Anual</Text>
          <Text style={styles.planPrice}>$1,500 MXN / año</Text>
          <Text style={styles.planDescription}>Ahorra más con acceso por 12 meses.</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          !planSeleccionado && { backgroundColor: '#555' },
        ]}
        disabled={!planSeleccionado}
        onPress={() => navigation.navigate('Pago')}
      >
        <Text style={styles.buttonText}>Continuar al pago</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Al continuar, aceptas nuestros{' '}
          <Text style={styles.linkText}>Términos y condiciones</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

export default Planes;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#111',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  cardsContainer: {
    gap: 25,
  },
  planCard: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#C44900',
    backgroundColor: '#2a1a11',
    shadowColor: '#C44900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  planTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    color: '#ccc',
    fontFamily: 'LuxoraGrotesk-Light',
  },
  planDescription: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  offerBadge: {
    position: 'absolute',
    top: -1,
    right: -18,
    backgroundColor: '#C44900',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    transform: [{ rotate: '15deg' }],
    zIndex: 10,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  button: {
    backgroundColor: '#C44900',
    padding: 15,
    borderRadius: 8,
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'LuxoraGrotesk-Light',
  },
  linkText: {
    color: '#C44900',
    textDecorationLine: 'underline',
  },
});
