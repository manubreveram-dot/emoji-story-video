# emoji-story-video

Genera videos cortos desde una idea: script, visuales, narracion, render y descarga web.

## Estado actual

- El flujo `V2` ya corre localmente de punta a punta.
- La UI genera `script -> 4 visuales -> narracion TTS -> render final`.
- Veo sigue siendo opcional y depende de Vertex AI.
- Si falta `GEMINI_API_KEY`, el flujo V2 entra en modo offline para debugging local.

## Flujo objetivo V2

1. `Idea Studio`
2. `Script Lab`
3. `Visual Review`
4. `Render & Download`

### Pipeline objetivo

- `Script Engine V2`: 10 frases con `gemini-2.5-flash-lite`, validadas con una rúbrica y 1 reintento condicional.
- `Act Mapper`: agrupa las 10 frases en 4 actos editables.
- `Style Bible Builder`: fija estilo, paleta, iluminación, cámara, personajes, negativos y semilla base.
- `Image Pack Generator`: crea solo 4 imágenes consistentes con Imagen Fast.
- `Narration TTS`: genera una voz en español con Gemini al momento del render.
- `Veo Hero Clip`: genera 1 clip hero desde la primera imagen con prompt en inglés.
- `Composer`: une narracion, clip Veo opcional, 4 imágenes y las 10 frases en un video final.
- `Asset Pack`: exporta `final.mp4`, `narration.wav`, `hero-veo.mp4`, `images.zip` y `manifest.json`.

## Costos y límites

- El script con IA sí consume tokens y factura uso.
- El flujo V2 está pensado para mantener el video por debajo de `US$0.50` por defecto.
- Si el costo estimado supera el cap, el sistema debe degradar a modo ahorro sin Veo.
- Los prompts de Veo se traducen automáticamente a inglés para mejorar consistencia.

## Variables de entorno

```env
GEMINI_API_KEY=tu_api_key
GEMINI_IMAGE_MODELS=imagen-4.0-fast-generate-001,gemini-2.0-flash-preview-image-generation,gemini-2.5-flash-image
VITE_API_BASE=https://tu-api.example.com
```

Variables usadas por el flujo V2:

```env
COST_CAP_USD_DEFAULT=0.50
VEO_ENABLED_DEFAULT=true
VEO_CLIP_SECONDS=4
ASSET_TTL_MINUTES=60
TTS_ENABLED_DEFAULT=true
TTS_MODEL=gemini-2.5-flash-preview-tts
TTS_LANGUAGE_CODE=es-US
TTS_VOICE_NAME=Kore
GOOGLE_GENAI_USE_VERTEXAI=false
```

Notas:

- `GOOGLE_GENAI_USE_VERTEXAI=false` por defecto. Vertex solo se activa si lo defines explícitamente en `.env`.
- La narracion TTS se genera en el paso `Render & Download`, justo antes del render final.

## Desarrollo local

1. `cp .env.example .env`
2. Completa `GEMINI_API_KEY` si quieres probar la generacion real con IA.
3. `npm install`
4. `npm run dev:api`
5. En otra terminal: `npm run dev:web`
6. Abre la URL local que imprima Vite.

Notas:

- El backend corre en `http://localhost:3001`.
- La UI usa proxy de Vite para `/api`.
- Si `GEMINI_API_KEY` no esta configurada, el flujo V2 ahora entra en modo offline para facilitar debugging local:
  genera un guion base, visuales placeholder y permite probar el render sin consumir APIs.
- Si `GEMINI_API_KEY` esta configurada, el render tambien puede generar un archivo de narracion `WAV`.
- Veo no funcionara con solo API key; para eso necesitas activar Vertex y configurar credenciales de Google Cloud.

## Flujo UI real

1. `Idea Studio`: escribes la idea y generas el script.
2. `Script Lab`: revisas y ajustas frases/actos.
3. `Visual Review`: se generan 4 visuales consistentes y puedes regenerar bloques.
4. `Render & Download`: se genera la narracion TTS, luego el MP4 final y las descargas.

## Railway

Railway corre el backend y sirve la web build.

1. Conectar el repo de GitHub.
2. Definir variables de entorno.
3. Redeploy.
4. Verificar `GET /health`.
5. Abrir la URL publica de Railway.

## Checklist manual en Railway

- `GET /health` responde `{"ok":true}`.
- La web abre desde la URL publica.
- El script se genera sin errores.
- La pantalla de progreso muestra avance real.
- El export final entrega una descarga real.
- La UI final ofrece descarga de video, imagenes, narracion y asset pack.

## Comandos utiles

```bash
npm install
npm run dev:api
npm run dev:web
npm run build:web
npm start
```

## Notas

- `README.md` documenta el contrato objetivo V2; el backend legacy sigue siendo la base actual.
- La siguiente iteracion del desarrollo debe implementar el flujo V2 sin romper el modo actual.
