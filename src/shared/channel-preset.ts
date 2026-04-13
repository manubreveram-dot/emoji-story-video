export const CHANNEL_NAME = "Micro Historias Distopicas con IA";

export const DEFAULT_DISTOPIAN_STYLE = [
  "fotografia cinematografica distopica",
  "blanco y negro de alto contraste",
  "sombras duras",
  "mucho espacio negativo",
  "un solo color acento rojo o azul",
  "rostros parcialmente ocultos",
  "planos cerrados",
  "POV humano o POV IA",
  "tension psicologica minimalista",
].join(", ");

export const DEFAULT_DISTOPIAN_IDEA = [
  "Canal de YouTube de micro historias distopicas con IA.",
  "Quiero una historia de 30 a 40 segundos sobre tecnologia que observa y decide.",
  "Debe sentirse oscura, minimalista, cinematografica e inquietante.",
  "Estructura: hook, setup, escalada y twist final incomodo.",
  "Visual: blanco y negro, alto contraste, un acento rojo o azul, espacio negativo y glitches sutiles.",
].join(" ");

export const DISTOPIAN_SERIES_PRESETS = [
  {
    id: "ia-decidio",
    label: "La IA ya decidio",
    brief: [
      "Serie 'La IA ya decidio'.",
      "Tecnologia que optimiza hasta reemplazar al humano.",
      "Quiero una micro historia de terror psicologico con final tipo twist.",
      "Visual en blanco y negro, sombras duras, rojo o azul como unico acento y sensacion de vigilancia.",
    ].join(" "),
  },
  {
    id: "errores-sistema",
    label: "Errores del sistema",
    brief: [
      "Serie 'Errores del sistema'.",
      "La realidad tiene fallas y el protagonista es el unico que lo nota.",
      "Necesito una historia breve con repeticion, delay o archivo imposible.",
      "Mantener tono minimalista, inquietante y cinematografico.",
    ].join(" "),
  },
  {
    id: "terminos-condiciones",
    label: "Terminos y condiciones",
    brief: [
      "Serie 'Terminos y condiciones'.",
      "Aceptamos permisos sin entender el costo.",
      "Quiero una historia sobre una app o dispositivo que toma control real.",
      "Debe cerrar con una revelacion incomoda y elegante, no gore.",
    ].join(" "),
  },
];

export const DISTOPIAN_VISUAL_PRESETS: Array<{ label: string; value: string }> = [
  {
    label: "Blanco y negro brutal",
    value:
      "blanco y negro predominante, contraste extremo, sombras duras, espacio negativo y un acento rojo o azul minimo",
  },
  {
    label: "POV de vigilancia",
    value:
      "POV humano o POV IA, encuadre cerrado, tracking sutil, atmosfera de observacion y control invisible",
  },
  {
    label: "Pantalla y farol",
    value:
      "iluminacion de fuente unica, pantalla o farol, rostro parcialmente oculto, tension silenciosa y textura fisica real",
  },
  {
    label: "Glitch elegante",
    value:
      "micro glitches, flicker de luz, overlays de UI, sensores, alertas y lectura visual inmediata sin verse kitsch",
  },
];
