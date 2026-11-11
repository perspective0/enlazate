
function pagination_params(array $queryParams): array {
    $page = max(1, (int)($queryParams['page'] ?? 1));
    $perPage = max(1, min(100, (int)($queryParams['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    return [$page, $perPage, $offset];
}

declare(strict_types=1);
$autoload = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
if (is_readable($autoload)) require_once $autoload;
$envFile = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
if (is_readable($envFile)) { foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) { $line=trim($line); if ($line==='' || str_starts_with($line,'#') || !str_contains($line,'=')) continue; [$key,$value]=explode('=',$line,2); $key=trim($key); $value=trim($value," \t\n\r\0\x0B\""); if (getenv($key)===false) putenv($key.'='.$value); } }
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'America/Santo_Domingo');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('Content-Security-Policy: default-src \'self\'; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\'');
$origin = getenv('FRONTEND_ORIGIN') ?: 'http://localhost:5173';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
session_name(getenv('SESSION_NAME') ?: 'enlazate_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => ($_ENV['APP_ENV'] ?? 'local') === 'production',
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();
function db(): PDO { static $pdo; if (!$pdo) { $pdo = new PDO(sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', getenv('DB_HOST') ?: '127.0.0.1', getenv('DB_PORT') ?: '3306', getenv('DB_NAME') ?: 'enlazate'), getenv('DB_USER') ?: 'root', getenv('DB_PASSWORD') ?: '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]); } return $pdo; }
function json_response(mixed $data, int $status=200): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function body(): array { $data=json_decode(file_get_contents('php://input'), true); return is_array($data) ? $data : []; }
function require_admin(): array { if (empty($_SESSION['admin_id'])) json_response(['message'=>'Autenticación requerida'],401); $s=$_SESSION['csrf'] ??= bin2hex(random_bytes(24)); return ['id'=>(int)$_SESSION['admin_id'],'csrf'=>$s]; }
function valid_destination(mixed $value): string { $url=trim((string)$value); if ($url==='' || strlen($url)>2048 || !filter_var($url,FILTER_VALIDATE_URL)) json_response(['message'=>'El destino no es una URL válida'],422); $scheme=strtolower((string)parse_url($url,PHP_URL_SCHEME)); if (!in_array($scheme,['http','https'],true)) json_response(['message'=>'Solo se permiten destinos HTTP o HTTPS'],422); if (preg_match('/[\x00-\x1F\x7F]/',$url) || preg_match('/^(javascript|data|vbscript):/i',$url)) json_response(['message'=>'Destino no permitido'],422); return $url; }
function public_qr_url(string $publicId): string { $base=rtrim(getenv('QR_BASE_URL') ?: ((getenv('APP_URL') ?: 'http://localhost:8080').'/r'),'/'); return $base.'/'.$publicId; }
function new_public_id(PDO $pdo): string { do { $id=strtoupper(substr(bin2hex(random_bytes(8)),0,12)); $q=$pdo->prepare('SELECT 1 FROM qr_codes WHERE public_id=?'); $q->execute([$id]); } while ($q->fetchColumn()); return $id; }
function audit(int $adminId,string $action,string $entity,int $entityId,?array $metadata=null): void { $q=db()->prepare('INSERT INTO audit_logs (admin_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)'); $q->execute([$adminId,$action,$entity,$entityId,$metadata ? json_encode($metadata,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) : null]); }
function qr_type(string $type): string { $allowed=['url','menu','reviews','whatsapp','wifi','maps','contact','nfc']; if (!in_array($type,$allowed,true)) json_response(['message'=>'Tipo de QR inválido'],422); return $type; }
function qr_status(string $status): string { $allowed=['active','paused','expired','archived']; if (!in_array($status,$allowed,true)) json_response(['message'=>'Estado de QR inválido'],422); return $status; }
function user_device(): string { $ua=$_SERVER['HTTP_USER_AGENT'] ?? ''; return preg_match('/Mobile|Android|iPhone/i',$ua) ? 'mobile' : (preg_match('/Tablet|iPad/i',$ua) ? 'tablet' : 'desktop'); }
function storage_path(): string { $path=dirname(__DIR__,2).DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'uploads'; if(!is_dir($path))mkdir($path,0750,true); return $path; }
function rate_limit(string $key,int $max,int $window): void { $dir=dirname(__DIR__,2).DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'rate';if(!is_dir($dir))mkdir($dir,0750,true);$file=$dir.DIRECTORY_SEPARATOR.hash('sha256',$key).'.json';$now=time();$data=is_file($file)?json_decode((string)file_get_contents($file),true):[];if(!is_array($data)||($data['reset']??0)<$now)$data=['count'=>0,'reset'=>$now+$window];$data['count']++;file_put_contents($file,json_encode($data),LOCK_EX);if($data['count']>$max){header('Retry-After: '.max(1,$data['reset']-$now));json_response(['message'=>'Demasiados intentos. Intenta más tarde.'],429);}}

// ---------- Additional utilities for production ----------

// CSRF middleware – validates X‑CSRF‑Token for admin routes
function require_admin_csrf(array $admin): void {
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($provided !== $admin['csrf']) {
        json_response(['message' => t('csrf_invalid')], 419);
    }
}

// Simple i18n helper – loads language files from /backend/src/lang/
function t(string $key, string $lang = 'es'): string {
    static $catalog = [];
    if (!isset($catalog[$lang])) {
        $file = __DIR__ . '/lang/' . $lang . '.php';
        $catalog[$lang] = is_readable($file) ? include $file : [];
    }
    return $catalog[$lang][$key] ?? $key;
}

// Rate‑limit wrapper for public endpoints (allows custom limits)
function public_rate_limit(string $key, int $max = 60, int $window = 60): void {
    rate_limit($key, $max, $window);
}

// Health‑check endpoint – returns basic service status
function health_check(): void {
    json_response([
        'ok' => true,
        'service' => 'enlazate-api',
        'timestamp' => date(DATE_ATOM)
    ], 200);
}
