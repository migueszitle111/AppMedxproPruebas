import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

function Pago(): React.JSX.Element {
  const navigation = useNavigation();

  const [nombreTitular, setNombreTitular] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [caducidad, setCaducidad] = useState('');
  const [cvv, setCvv] = useState('');
  const [estado, setEstado] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [tipoTarjeta, setTipoTarjeta] = useState<string | null>(null);

  useEffect(() => {
    detectTipoTarjeta(numeroTarjeta);
  }, [numeroTarjeta]);

  const detectTipoTarjeta = (numero: string) => {
    const numeroSinEspacios = numero.replace(/\s+/g, '');
    if (numeroSinEspacios.length < 4) {
      setTipoTarjeta(null);
      return;
    }

    const mastercardPattern = /^(5[1-5]|2[2-7])/;
    const visaPattern = /^4/;
    const amexPattern = /^3[47]/;

    if (mastercardPattern.test(numeroSinEspacios)) {
      setTipoTarjeta('Mastercard');
    } else if (visaPattern.test(numeroSinEspacios)) {
      setTipoTarjeta('Visa');
    } else if (amexPattern.test(numeroSinEspacios)) {
      setTipoTarjeta('Amex');
    } else {
      setTipoTarjeta(null);
    }
  };

  const simularPago = () => {
    if (
      !nombreTitular ||
      !numeroTarjeta ||
      !caducidad ||
      !cvv ||
      !estado ||
      !ciudad ||
      !direccion ||
      !codigoPostal
    ) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos.');
      return;
    }

    setProcesando(true);

    setTimeout(() => {
      setProcesando(false);
      Alert.alert('Pago confirmado', 'Gracias por tu compra (modo prueba)');
      navigation.goBack();
    }, 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pantalla de Pago</Text>

      {procesando ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#C44900" />
          <Text style={styles.processingText}>Procesando pago...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Nombre del titular de la tarjeta</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={nombreTitular}
            onChangeText={setNombreTitular}
          />

          <Text style={styles.label}>Número de tarjeta</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, { paddingRight: 45 }]}
              placeholder={tipoTarjeta === 'Amex' ? "XXXX XXXXXX XXXXX" : "XXXX XXXX XXXX XXXX"}
              keyboardType="number-pad"
              value={numeroTarjeta}
              maxLength={tipoTarjeta === 'Amex' ? 17 : 19}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '');

                let formatted = '';

                if (tipoTarjeta === 'Amex') {
                  const part1 = cleaned.substring(0, 4);
                  const part2 = cleaned.substring(4, 10);
                  const part3 = cleaned.substring(10, 15);
                  formatted = [part1, part2, part3].filter(Boolean).join(' ');
                } else {
                  const parts = cleaned.match(/.{1,4}/g);
                  formatted = parts?.join(' ') || '';
                }

                setNumeroTarjeta(formatted);
              }}
            />
            {tipoTarjeta && (
              <Image
                source={
                  tipoTarjeta === 'Mastercard'
                    ? require('../../assets/Logo/Mastercard.png')
                    : tipoTarjeta === 'Visa'
                    ? require('../../assets/Logo/Visa.png')
                    : require('../../assets/Logo/Amex.png')
                }
                style={styles.cardLogoInside}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fecha de caducidad</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="MM/AAAA"
                keyboardType="number-pad"
                maxLength={7}
                value={caducidad}
                onChangeText={(text) => {
                  let formatted = text.replace(/[^\d]/g, '');
                  if (formatted.length >= 2) {
                    const mes = parseInt(formatted.substring(0, 2), 10);
                    if (mes < 1 || mes > 12) return;
                  }
                  if (formatted.length >= 3) {
                    formatted = `${formatted.substring(0, 2)}/${formatted.substring(2, 6)}`;
                  }
                  setCaducidad(formatted);
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="CVV"
                keyboardType="number-pad"
                value={cvv}
                maxLength={tipoTarjeta === 'Amex' ? 4 : 3}
                onChangeText={(text) => {
                  const formatted = text.replace(/[^\d]/g, '');
                  setCvv(formatted);
                }}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.separatorLine} />
            <Text style={styles.sectionLabel}>Dirección de facturación</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.label}>Estado</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={estado}
              onValueChange={(itemValue) => setEstado(itemValue)}
            >
              <Picker.Item label="Seleccione un estado" value="" />
              {[
                'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
                'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
                'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
                'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
                'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
                'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
                'Zacatecas'
              ].map((estado) => (
                <Picker.Item key={estado} label={estado} value={estado} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            value={ciudad}
            onChangeText={setCiudad}
          />

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                value={direccion}
                onChangeText={setDireccion}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>Código Postal</Text>
            <TextInput
               style={styles.input}
               placeholder="C.P."
               keyboardType="number-pad"
               value={codigoPostal}
               onChangeText={(text) => {
            const soloNumeros = text.replace(/[^\d]/g, ''); // ← solo números
               setCodigoPostal(soloNumeros);
            }}
             maxLength={5}
            />
          </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={simularPago}>
            <Text style={styles.buttonText}>Simular pago</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

export default Pago;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#111',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  input: {
    backgroundColor: '#BABABA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  cardLogoInside: {
    position: 'absolute',
    right: 18,
    width: 50,
    height: 30,
    top: '50%',
    transform: [{ translateY: -21 }],
  },
  pickerContainer: {
    backgroundColor: '#BABABA',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#C44900',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
    fontSize: 16,
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallInput: {
    marginRight: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'LuxoraGrotesk-Bold',
    marginHorizontal: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
  },
});
