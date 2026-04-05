# emoji-story-video

Genera videos cortos desde una idea: script, visuales, render y descarga web.

## Estado actual

- El backend legacy ya funciona en Railway y sirve la web build.
- El flujo actual todavía usa 10 escenas e imágenes secuenciales.
- El botón `Export MP4` de la UI actual aún es un placeholder.
- La siguiente evolución del proyecto es el flujo `V2`: `10 frases -> 4 actos -> 4 visuales consistentes -> 1 clip Veo -> MP4 + descargas`.

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
- `Veo Hero Clip`: genera 1 clip hero desde la primera imagen con prompt en inglés.
- `Composer`: une clip Veo, 4 imágenes y las 10 frases en un video final.
- `Asset Pack`: exporta `final.mp4`, `hero-veo.mp4`, `images.zip` y `manifest.json`.

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

Variables planeadas para el flujo V2:

```env
FEATURE_V2_PIPELINE=true
COST_CAP_USD=0.50
VEO_ENABLED=true
VEO_CLIP_SECONDS=4
ASSET_TTL_MINUTES=60
```

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
- La UI final ofrece descarga de video, imagenes y asset pack.

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
