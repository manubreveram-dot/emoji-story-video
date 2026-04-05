# Lessons Learned

## 2026-04-05

- No depender de un solo modelo de imagen preview en produccion.
- Tratar errores de cuota/permisos como fallas de proveedor y aplicar fallback.
- Para Railway, evitar URLs fijas (`localhost`) y usar `PORT` del entorno.
- Mantener healthcheck (`/health`) para detectar despliegues rotos temprano.
