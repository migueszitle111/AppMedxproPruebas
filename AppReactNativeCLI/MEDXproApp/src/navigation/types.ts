import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Inicio: undefined;
  OtraPantalla: undefined;
  PantallaPrincipal: undefined;
  ReporteM: undefined;
  ReporteMenu: undefined;
  Técnicas: undefined;
  Videos: undefined;
  Podcast: undefined;
  Noticias: undefined;
  Perlas: undefined;
  Ultrasonidos: undefined;
  Monitoreo: undefined;
  Eventos: undefined;
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  Navigation: undefined;
  MainLayout: undefined;
  Educacion: undefined;
  NavMenuReporte: undefined;
  Neuronopatia: undefined;
  Radiculopatia: undefined;
  Plexopatia: undefined;
  Neuropatia: undefined;
  Polineuropatia: undefined;
  UnionNeuroMuscular: undefined;
  Miopatia: undefined;
  Visual: undefined;
  Auditiva: undefined;
  Somatosensorial: undefined;
  MotoraCorticoespinal: undefined;
  Neurografia: undefined;
  Miografia: undefined;
  PotencialesProvocados: undefined;
  PruebasEspeciales: undefined;
  Valores: undefined;
  Protocolo: undefined;
  Perfil: undefined;
  Pago: undefined;
  Logout: undefined;
  Planes: undefined;
  AuthLoading: undefined;
  ResetPassword: undefined;
  Gifinicio: undefined;
  PantallaInicio: undefined;
  AuthChoice: undefined;
  PinLogin: undefined;
  HuellaLogin: undefined;
  Configuracion: undefined;
  Shop: undefined;
  EnviarCorreo: undefined;
  Terminos: undefined;
  VerificacionUsuario: undefined;
};

// Tipo de navegación
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// types.ts
export interface Figura {
  id: string;
  tipo: 'circle' | 'square';
  uri: string;
  posicion: {
    x: number;
    y: number;
  };
};

