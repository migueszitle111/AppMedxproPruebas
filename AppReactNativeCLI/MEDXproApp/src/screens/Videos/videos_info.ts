// src/screens/Videos/videos_info.ts
export interface VideoItem {
  id: string;
  titulo: string;
  url?: string;
  videoId?: string;
  thumbnail?: any; // opcional, si decides agregar miniaturas
}

export const videos: VideoItem[] = [
  {
    id: '1',
    //titulo: 'Clase 2 - Escalado',
    //url: 'https://next.frame.io/share/5002b1c2-af2f-4876-b67f-3f585fcea975/view/65f6e3b7-1fc4-4383-bc00-6cdbbd2038d9',
    //url: 'https://www.youtube.com/embed/txFeoMnNWvk',
    //thumbnail: { uri: 'https://img.youtube.com/vi/txFeoMnNWvk/hqdefault.jpg' },
    titulo: 'mEDXpro BASES NEUROFISIOLÓGICAS EN ELECTRONEUROGRAFÍA',
    //url: 'https://www.youtube.com/embed/576MfguoyEM',
    videoId: '576MfguoyEM',
    thumbnail: { uri: 'https://img.youtube.com/vi/576MfguoyEM/hqdefault.jpg' },
  },
  {
    id: '2',
    titulo: 'mEDXpro BASES NEUROFISIOLÓGICAS DE LAS RESPUESTAS TARDIAS',
    //url: 'https://www.youtube.com/embed/PZSA_4Q9tmk',
    videoId: 'PZSA_4Q9tmk',
    thumbnail: { uri: 'https://img.youtube.com/vi/PZSA_4Q9tmk/hqdefault.jpg' },
  },
  {
    id: '3',
    titulo: 'mEDXpro GENERALIDADES DE MONITOREO NEUROFISIOLÓGICO INTRAOPERATORIO',
    //url: 'https://www.youtube.com/embed/ZrfuI0HfAew',
    videoId: 'ZrfuI0HfAew',
    thumbnail: { uri: 'https://img.youtube.com/vi/ZrfuI0HfAew/hqdefault.jpg' },
  },
  {
    id: '4',
    titulo: 'mEDXpro GENERALIDADES DE ULTRASONIDO MUSCULOESQUELÉTICO',
    //url: 'https://www.youtube.com/embed/g9HgUA2O_U4',
    videoId: 'g9HgUA2O_U4',
    thumbnail: { uri: 'https://img.youtube.com/vi/g9HgUA2O_U4/hqdefault.jpg' },
  },
  {
    id: '5',
    titulo: 'mEDXpro CARACTERÍSTICAS DE GRAFOELEMENTOS EN ELECTROMIOGRAFÍA',
    //url: 'https://www.youtube.com/embed/qUn4aLOK0DY',
    videoId: 'qUn4aLOK0DY',
    thumbnail: { uri: 'https://img.youtube.com/vi/qUn4aLOK0DY/hqdefault.jpg' },
  },
];
