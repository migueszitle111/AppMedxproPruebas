// src/components/FancyInput.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  Animated,
  TextStyle,
  Keyboard
} from 'react-native';

type ExtraProps = Pick<
  React.ComponentProps<typeof RNTextInput>,
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'returnKeyType'
  | 'blurOnSubmit'
  | 'keyboardType'
  | 'onSubmitEditing'
>;

type Props = {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
} & ExtraProps;

const FancyInput: React.FC<Props> = ({
  label,
  value = '',
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  blurOnSubmit,
  keyboardType,
  onSubmitEditing,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelPosition, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, labelPosition]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      setIsFocused(false);
      if (!value) floatDown();
    });
    return () => sub.remove();
  }, [value]);

  const floatUp = () =>
    Animated.timing(labelPosition, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();

  const floatDown = () =>
    Animated.timing(labelPosition, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();

  const labelStyle = {
    position: 'absolute' as const,
    left: 9,
    top: labelPosition.interpolate({ inputRange: [0, 1], outputRange: [16, -28] }),
    fontSize: labelPosition.interpolate({ inputRange: [0, 1], outputRange: [10, 16] }),
    color: isFocused ? '#ffffffff' : '#9aa0a6',
    fontFamily: 'LuxoraGrotesk-Light',
  } as Animated.WithAnimatedObject<TextStyle>;

  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <RNTextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          floatUp();
        }}
        onBlur={() => {
          setIsFocused(false);
          if (!value) floatDown();
        }}
        placeholder={isFocused ? '' : placeholder}
        placeholderTextColor="#7d7d7d"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
    alignSelf: 'center',
  },
  input: {
    height: 42.5,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    backgroundColor: '#111',
    color: '#fff',
    borderColor: '#3b3b3b',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  inputFocused: {
    borderColor: '#ff4500',
  },
});

export default FancyInput;
