<?php
declare(strict_types=1);
$password = $argv[1] ?? '';
if (strlen($password) < 12) { fwrite(STDERR, "La contraseña debe tener al menos 12 caracteres.\n"); exit(1); }
echo password_hash($password, PASSWORD_DEFAULT) . PHP_EOL;
