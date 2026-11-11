<?php
declare(strict_types=1);
$base=$argv[1]??'http://127.0.0.1:8099';
function check(string $url,int $expected):void{$ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HEADER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_TIMEOUT=>5]);curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);if($status!==$expected)throw new RuntimeException("$url devolvió $status; esperado $expected");echo "OK $url $status".PHP_EOL;}
check($base.'/api/health',200);check($base.'/api/admin/analytics',401);check($base.'/api/admin/orders',401);
