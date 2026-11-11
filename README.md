# ENLÁZATE

Plataforma comercial para productos físicos y experiencias digitales con QR dinámicos.

## Estado

Fases 1–8 implementadas: núcleo QR, catálogo, pedidos, páginas digitales, producción, diseñador, analítica, seguridad y preparación de despliegue.

## Requisitos

- Node.js 20+
- PHP 8.3+ con PDO MySQL
- MySQL 8 o MariaDB 10.6+
- XAMPP es válido para desarrollo local

## Desarrollo

1. Copia `.env.example` a `.env` para la API y `frontend/.env.example` a `frontend/.env`.
2. Ejecuta `database/migrations/001_initial.sql`, `002_commerce.sql`, `003_digital_pages.sql` y `004_production_design.sql` en MySQL/MariaDB.
3. Desde `frontend/`, ejecuta `npm install` y `npm run dev`.
4. Sirve `backend/public` con Apache/Nginx o usa `php -S localhost:8080 -t backend/public`.
5. Configura `VITE_API_URL` apuntando a la API.

El primer administrador se crea mediante un script seguro documentado en `docs/INSTALL.md`; nunca se versionan credenciales.

## Arquitectura

- `frontend/`: React + TypeScript + Vite.
- `backend/`: API PHP modular, PDO, middleware y respuestas JSON.
- `database/`: migraciones versionadas y seeds no sensibles.
- `docs/`: instalación, API, despliegue y backups.

## Decisiones

- La URL QR se centraliza en configuración y usa identificadores aleatorios; no se exponen IDs consecutivos.
- Los destinos se validan como HTTP/HTTPS y se registran en historial.
- El admin es el único rol inicial; los clientes no tienen cuenta.
- La moneda y zona horaria predeterminadas son DOP y America/Santo_Domingo.
- El catálogo público está disponible en `/catalogo`; los pedidos conservan estado de pago pendiente o manual y no simulan cobros.
- La producción usa órdenes externas y presets físicos en milímetros; los proveedores no reciben acceso al panel.

## Rutas principales

- `/`: sitio comercial.
- `/catalogo`: catálogo y carrito público.
- `/p/{slug}`: página digital pública.
- `/admin`: panel administrativo.
- `/admin/qr`: gestión de QR dinámicos.
- `/admin/production`: producción y diseños.
- `/admin/analytics`: analítica.

## Validación

```text
cd frontend && npm run build && npm run typecheck
cd ../backend && php tests/smoke.php http://127.0.0.1:8099
```
