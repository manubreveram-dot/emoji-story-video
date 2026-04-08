export function buildScriptPromptV2(
  idea: string,
  artStyle: string,
  targetLineCount: number,
  targetDurationSeconds = 30,
): string {
  return `Eres director creativo senior de video vertical para TikTok/Reels.

Objetivo:
Crear un paquete narrativo premium, coherente con este brief del usuario:
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
- Cada narration es subtitulo en pantalla + base de narracion de voz.
- narration entre 4 y 10 palabras, lectura rapida en movil.
- Primera linea: hook fuerte y directo.
- Ultima linea: cierre memorable y emocional.
- Prohibido texto abstracto vacio, frases genericas o relleno redundante.
- visualIntent debe describir una sola imagen realista (sujeto + accion + entorno + luz + lente).
- visualIntent maximo 22 palabras.
- Prohibido pedir texto impreso en imagen, versos escritos, carteles o tipografia.

Coherencia con el brief:
- Usa vocabulario del usuario, no inventes otro tema.
- Si el usuario menciona estilo espiritual, sabio, ancestral o tono TikTok, integralo en guion y visualIntent.
- styleBible debe derivarse del brief, no de plantillas genericas.
- Mantener continuidad del protagonista, atmosfera y contexto durante todo el video.
- Evita repetir literalmente el texto completo del brief dentro de prompts visuales.

Negative prompt obligatorio (integrado dentro de styleBible.negativePrompt):
- piel plastica
- manos deformes
- ojos artificiales
- texto en imagen
- watermark
- artefactos IA
- caligrafia legible
- carteles con letras

Valores permitidos de mood:
hopeful, dramatic, peaceful, energetic, melancholy, joyful, intense`;
}
