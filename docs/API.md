# API de Fase 3

## Público

- `GET /api/products`: catálogo activo.
- `POST /api/orders`: crea un pedido sin cuenta. Requiere `customer_name`, `phone` e `items` con `product_id` y `quantity`.

## Administrador

Todos requieren sesión y las mutaciones requieren `X-CSRF-Token`.

- `GET|POST /api/admin/products`
- `GET|POST /api/admin/customers`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/{id}` para cambiar el estado.
- `GET|POST /api/admin/qr` y endpoints de la Fase 2.

Los pedidos aceptan `pending`, `manual_transfer` o `cash`; ningún pedido se marca como pagado automáticamente.
