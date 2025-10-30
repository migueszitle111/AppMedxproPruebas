import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function MenuReportes(): React.JSX.Element {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();

  function handleTabClick(tab: string | null): void {
    setSelectedTab(tab);
  }

  function handleMenuClick(): void {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setSelectedTab(null);
    }
  }

  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity onPress={handleMenuClick}>
        <Text style={styles.menuText}>Menu</Text>
      </TouchableOpacity>

      {isMenuOpen && selectedTab === null && (
        <View style={styles.menuOptions}>
          <TouchableOpacity onPress={() => handleTabClick('Sistema Nervioso')}>
            <Text style={styles.optionText}>Sistema Nervioso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabClick('Vias Neurologicas')}>
            <Text style={styles.optionText}>Vias Neurologicas</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedTab === 'Sistema Nervioso' && (
        <View style={styles.subMenu}>
          <TouchableOpacity onPress={() => handleTabClick(null)}>
            <Text style={[styles.optionText, styles.underlineText]}>Reportes anatomicos:</Text>
          </TouchableOpacity>

          {[
            'Dermatomas',
            'Miopatia',
            'Neuronopatia',
            'Neuropatia',
            'Plexopatia',
            'Polineuropatia',
            'Radiculopatia',
            'Radiculopatia_Posteior',
            'Union_Nueromuscular'
          ].map((route) => (
            <TouchableOpacity key={route} onPress={() => navigation.navigate(route as never)}>
              <Text style={styles.optionText}>{route}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedTab === 'Vias Neurologicas' && (
        <View style={styles.subMenu}>
          <TouchableOpacity onPress={() => handleTabClick(null)}>
            <Text style={[styles.optionText, styles.underlineText]}>Vias Neurologicas</Text>
          </TouchableOpacity>

          {[
            'Auditivo',
            'Motores',
            'Somatossensorial_Trigemino',
            'Trigemino_Facial',
            'Visual'
          ].map((route) => (
            <TouchableOpacity key={route} onPress={() => navigation.navigate(route as never)}>
              <Text style={styles.optionText}>{route}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    backgroundColor: '#1c1c1c',
    padding: 10,
    margin: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  menuOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subMenu: {
    flexWrap: 'wrap',
    gap: 10,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
});

export default MenuReportes;
