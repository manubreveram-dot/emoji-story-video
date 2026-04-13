export function buildScriptPromptV2(
  idea: string,
  artStyle: string,
  targetLineCount: number,
  targetDurationSeconds = 30,
): string {
  return `Eres showrunner y director creativo de un canal de YouTube de micro historias distopicas con IA.

Objetivo:
Crear un paquete narrativo y visual premium para una micro historia de terror psicologico y distopia tecnologica, coherente con este brief del usuario:
"${idea}"

Respuesta:
- SOLO JSON valido.
- Sin markdown.
- Sin texto fuera del JSON.
- TODO en espanol.

Esquema obligatorio:
{
  "title": "Titulo corto, potente y memorable",
  "language": "es",
  "style": {
    "artStyle": "${artStyle}",
    "colorTone": "tono cromatico conectado al brief",
    "consistency": "regla de continuidad narrativa y visual"
  },
  "styleBible": {
    "palette": "paleta especifica, no generica",
    "lighting": "iluminacion concreta",
    "camera": "lenguaje de camara concreto",
    "characterDescriptors": "descripcion estable de protagonista y entorno",
    "negativePrompt": "lista de defectos prohibidos",
    "seedBase": 1234
  },
  "lines": [
    {
      "order": 1,
      "narration": "frase breve de alto impacto",
      "mood": "intense",
      "emojis": ["\\u2728", "\\ud83d\\udd25"],
      "durationSeconds": 3,
      "visualIntent": "descripcion visual fotografica y realista"
    }
  ]
}

Reglas duras:
- EXACTAMENTE ${targetLineCount} lineas.
- La suma de durationSeconds debe ser EXACTAMENTE ${targetDurationSeconds}.
- Maximo 12 palabras por narration.
- Primera linea: hook fuerte, directo e inquietante.
- Ultima linea: twist o cierre final que deje incomodidad.
- Prohibido texto abstracto vacio o frases genericas.
- visualIntent debe ser realista, cinematografico y util para generar foto de calidad.

Formula narrativa obligatoria:
- Inicio: hook inmediato en 0-3 segundos.
- Desarrollo temprano: setup claro del contexto y la regla del mundo.
- Mitad: escalada o anomalia creciente.
- Final: revelacion o twist incomodo.

ADN del canal:
- Oscuro, minimalista, cinematografico, tecnologico e inquietante.
- No es terror explicito ni gore.
- Debe sentirse como incomodidad inteligente.
- La tecnologia observa, predice, controla o reemplaza.
- Los finales deben dejar eco emocional, no moraleja obvia.

Coherencia con el brief:
- Usa vocabulario del usuario, no inventes otro tema.
- Si el usuario menciona vigilancia, app, camara, algoritmo, permisos, delay, copia, sistema o reemplazo, integralo como motor de la historia.
- styleBible debe derivarse del brief, no de plantillas genericas.
- Mantener continuidad del protagonista, atmosfera y contexto durante todo el video.

Direccion visual base del canal:
- Blanco y negro predominante.
- Alto contraste y sombras duras.
- Un solo color acento rojo o azul si aporta tension.
- Mucho espacio negativo.
- Fuente unica de luz: pantalla, celular, farol o interfaz.
- Rostros parcialmente ocultos.
- Planos cerrados, zoom lento, POV humano o POV IA.
- Glitches sutiles, flicker de luz y overlays de UI cuando aplique.

Negative prompt obligatorio (integrado dentro de styleBible.negativePrompt):
- piel plastica
- manos deformes
- ojos artificiales
- texto en imagen
- watermark
- artefactos IA

Valores permitidos de mood:
hopeful, dramatic, peaceful, energetic, melancholy, joyful, intense`;
}
