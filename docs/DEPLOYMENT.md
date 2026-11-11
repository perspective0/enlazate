# Despliegue en Ubuntu VPS

1. Instalar Nginx, PHP 8.3+, extensiones `pdo_mysql`, `mbstring`, `fileinfo`, `gd` y MySQL/MariaDB.
2. Publicar el frontend compilado (`frontend/dist`) en el dominio público.
3. Configurar `api.enlazate.com.do` hacia `backend/public` mediante PHP-FPM.
4. Ejecutar `composer install --no-dev --optimize-autoloader` en `backend`.
5. Crear `.env` fuera de Git con credenciales de base de datos y dominios reales.
6. Ejecutar las migraciones SQL en orden.
7. Crear el primer administrador usando `backend/bin/hash-password.php`.
8. Configurar HTTPS con Let's Encrypt y activar cookies Secure.
9. Otorgar al proceso PHP escritura únicamente en `storage/uploads` y `storage/rate`.
10. No exponer `backend/src`, `backend/vendor`, migraciones ni archivos privados.

El frontend debe usar `VITE_API_URL=https://api.enlazate.com.do`. Cambiar `FRONTEND_ORIGIN` y `APP_ENV=production` en el entorno de la API.

En Railway, mantener `backend` como directorio raíz del servicio PHP. `backend/composer.json` declara `ext-pdo_mysql` para que Railpack instale el controlador MySQL requerido por PDO.
