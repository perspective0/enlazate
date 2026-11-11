# Instalación local

1. Crear la base de datos ejecutando las migraciones `001_initial.sql` a `004_production_design.sql` desde phpMyAdmin o MySQL.
2. Copiar `.env.example` a `.env` en la raíz y `frontend/.env.example` a `frontend/.env`.
3. Servir la API: `php -S localhost:8080 -t backend/public`.
4. Instalar y ejecutar el frontend: `cd frontend; npm install; npm run dev`.
5. Crear un hash de contraseña con `php backend/bin/hash-password.php "una-clave-larga"`; insertar el resultado en `admins` usando una conexión local segura.

En producción usar HTTPS, cookies Secure, un usuario de base de datos sin privilegios globales, secretos fuera de Git y backups cifrados.
