// src/screens/Perlas/publicaciones.ts
export interface Publicacion {
    id: string;
    titulo: string;
    descripcion: string;
    descripcionLarga?: string; // 👈 opcional
    img?: any;
    link?: string; // opcional
  }

  export const publicaciones: Publicacion[] = [
    {
      id: '1',
      titulo: 'Neuromuscular Disease Center - Washington University',
      descripcion: 'Un recurso imprescindible en el diagnóstico y la enseñanza de enfermedades neuromusculares.',
      descripcionLarga: `Entre la gran cantidad de recursos digitales disponibles para el médico especialista, pocos tienen la claridad y la organización del Neuromuscular Disease Center de la Washington University in St. Louis. Esta página, de acceso libre, se ha convertido en una referencia constante para quienes trabajan en el diagnóstico, la docencia y la investigación en el campo neuromuscular.
      
Lo primero que destaca es su estructura temática sencilla y directa: el sitio organiza la información por grupos de enfermedades —miopatías, neuropatías, trastornos de la unión neuromuscular y patologías del sistema nervioso central— lo que facilita la consulta rápida en el día a día clínico. Cada sección incluye descripciones clínicas, correlaciones genéticas, hallazgos de laboratorio y, en muchos casos, imágenes ilustrativas de biopsias, resonancias y preparados histológicos.

Para el especialista, este recurso se convierte en un atlas dinámico de patologías neuromusculares. Resulta especialmente útil en la interpretación de pruebas complementarias, ya que incluye apartados sobre anticuerpos diagnósticos, hallazgos electrofisiológicos y estudios de biopsia, todo presentado en un formato accesible y didáctico. Además, la sección “New/Revised” ofrece actualizaciones periódicas con nuevos genes y entidades clínicas recientemente descritas, lo que permite mantenerse al día en un campo que avanza con rapidez.
      `,
      img: require('../../assets/perlas/perla1.png'),
      link: 'https://neuromuscular.wustl.edu/',
    },
    {
      id: '2',
      titulo: 'MSK Freak - Formación en Ecografía Musculoesquelética en Español',
      descripcion: 'Una plataforma recomendada para médicos y profesionales de la salud que buscan perfeccionar sus habilidades diagnósticas.',
      descripcionLarga: `En el campo musculoesquelético, la ecografía se ha convertido en una herramienta fundamental para el diagnóstico dinámico, la planificación de tratamientos y la realización de intervenciones mínimamente invasivas. Sin embargo, no siempre es fácil encontrar cursos de calidad en español que combinen rigor académico, claridad didáctica y aplicabilidad clínica. Aquí es donde MSK Freak se destaca.
      
Esta plataforma ofrece cursos de ecografía musculoesquelética diseñados específicamente para profesionales de la salud, con contenidos que van desde lo básico hasta niveles avanzados.

Por supuesto, es importante considerar algunos aspectos: el costo de los cursos puede ser un factor a evaluar según tu presupuesto, y conviene verificar el reconocimiento oficial de las certificaciones en tu país o institución. Una alternativa es la visualización totalmente gratis de los videos en el canal inigoiri Ecografía musculoesquelética - YouTube.
      `,
      img: require('../../assets/perlas/perla2.png'),
      //link: 'https://www.youtube.com/channel/UC1K3xi7Tcy8BMCyeAlcouTw',
      link: 'https://www.mskfreak.com/pages/espa%C3%B1ol',
    },
  ];
