# emoji-story-video

Genera videos cortos desde una idea: crea guion, genera imagenes por escena con Gemini/Imagen y luego renderiza preview/video.

## Estado actual del proyecto

- Frontend y API quedan en un solo servicio para produccion.
- El frontend usa rutas relativas (`/api/...`) por defecto.
- En local, Vite hace proxy a `http://localhost:3001` para `/api` y `/generated`.
- El backend lee `PORT` desde entorno (compatible con Railway).
- La generacion de imagenes usa fallback de modelos (`GEMINI_IMAGE_MODELS`).

## Requisitos

- Node.js 20+
- Cuenta en Google AI Studio con billing activo
- `GEMINI_API_KEY`
- Cuenta en GitHub y Railway

## Variables de entorno

Crear `.env`:

```env
GEMINI_API_KEY=tu_api_key
GEMINI_IMAGE_MODELS=imagen-4.0-fast-generate-001,gemini-2.0-flash-preview-image-generation,gemini-2.5-flash-image
```

Opcional para frontend separado:

```env
VITE_API_BASE=https://tu-api.example.com
```

## Ejecutar en local

1. Instalar dependencias

```bash
npm install
```

2. Levantar API

```bash
npm run dev:api
```

3. En otra terminal, levantar web

```bash
npm run dev:web
```

4. Abrir `http://localhost:5173`

## Subir a GitHub (desde cero)

1. Inicializar repo local

```bash
git init
git branch -M main
git add .
git commit -m "feat: prepare emoji-story-video for deploy"
```

2. Crear repo vacio en GitHub (web)

3. Conectar remoto y subir

```bash
git remote add origin https://github.com/TU_USUARIO/emoji-story-video.git
git push -u origin main
```

Si ya tenias repo local, solo usa:

```bash
git add .
git commit -m "feat: deploy updates"
git push
```

## Deploy en Railway

### Opcion A: desde GitHub (recomendada)

1. Railway -> `New Project` -> `Deploy from GitHub repo`
2. Seleccionar este repositorio
3. Railway leerá `railway.json`
4. En `Variables`, agregar:
- `GEMINI_API_KEY`
- `GEMINI_IMAGE_MODELS` (opcional si quieres override)
5. Deploy
6. Verificar:
- `GET /health` devuelve `{ "ok": true }`
- La app carga y puede llamar `/api/script` y `/api/images`

### Opcion B: con CLI (opcional)

```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

## Comandos utiles

- `npm run build:web`: build del frontend para produccion (`dist/web`)
- `npm start`: inicia API + sirve frontend build si existe
- `npm run generate -- "tu idea"`: flujo CLI completo (script + imagenes + render)

## Costos rapidos orientativos

- `Imagen 4 Fast`: aprox `USD 0.02` por imagen
- 10 imagenes: aprox `USD 0.20`

Revisa precios vigentes antes de escalar trafico, porque pueden cambiar por modelo/region.
