# Comunicación Interna entre Microservicios (`/internal`)

Este documento describe la arquitectura de comunicación interna (Service-to-Service) entre los microservicios del sistema.

## Aspectos de Seguridad y Red

1. **Bloqueo Externo en Nginx**:
   El API Gateway bloquea cualquier petición pública hacia `/internal/` respondiendo `404 Not Found`.
2. **Tokens de Servicio (JWT)**:
   Todas las llamadas M2M se autentican mediante un JWT efímero (~60 s de vigencia) con claim `role: SERVICE`, firmado con la clave compartida `SERVICE_TOKEN_SECRET`.
3. **Resolución DNS Interna**:
   La comunicación ocurre a través de la red privada de Docker mediante los nombres de servicio de Compose.

---

## Matriz de Comunicación entre Servicios

| Servicio Origen (Cliente) | Servicio Destino (Servidor) | Host / URL interna | Método y Ruta | Propósito / Función | Archivo de llamada (Cliente) | Archivo de endpoint (Servidor) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Parking Service**<br>*(Python / FastAPI)* | **Billing Service**<br>*(Java / Spring Boot)* | `http://billing-service:8080` | `POST /internal/billing/invoices` | Genera y registra la factura al liquidar un ticket (idempotente por `ticketId`). | `servicio-python/app/clients.py` | `servicio-java/.../InternalInvoiceController.java` |
| **Parking Service**<br>*(Python / FastAPI)* | **Realtime Service**<br>*(Go / Gin)* | `http://realtime-service:8081` | `POST /internal/realtime/events` | Notifica cambios de estado en un espacio (ocupado / liberado) para emitirlos por WebSocket. | `servicio-python/app/clients.py` | `servicio-go/main.go` + `internal/handlers/events.go` |
| **Billing Service**<br>*(Java / Spring Boot)* | **Auth Service**<br>*(Node.js / Express)* | `http://auth-service:3000` | `GET /internal/users/{id}` | Consulta el nombre completo del operador que cobra la factura para enriquecer el comprobante. | `servicio-java/.../UserDirectoryClient.java` | `servicio-node/src/routes/internalRoutes.js` |
| **Realtime Service**<br>*(Go)* | **Parking Service**<br>*(Python / FastAPI)* | `http://parking-service:8000` | `GET /internal/parking/spaces` | Sincroniza el estado inicial de todos los espacios al iniciar o reconectar el servicio Go. | `servicio-go/internal/parkingclient/client.go` | `servicio-python/app/routers/internal.py` |

---

## Detalle de Endpoints y Esquemas de Protección

| Endpoint Interno | Servicio que lo expone | Mecanismo de validación | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET /internal/users/:id` | `auth-service` | `authenticate` + `authorize('SERVICE')` | Param: `id` (UUID del usuario). Retorna: `{ id, username, fullName }`. |
| `GET /internal/parking/spaces` | `parking-service` | Dependencia `get_service_caller` (`role == SERVICE`) | Retorna lista completa de espacios y estado de ocupación actual. |
| `POST /internal/billing/invoices` | `billing-service` | Spring Security: `.hasRole("SERVICE")` | Body: datos del ticket cerrado, minutos, total y `operatorId`. |
| `POST /internal/realtime/events` | `realtime-service` | Middleware `RequireRole("SERVICE")` | Body: evento de espacio (`space_id`, `state`, `timestamp`). |