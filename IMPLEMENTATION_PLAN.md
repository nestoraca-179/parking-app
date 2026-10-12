# Plan de Implementación — Sistema de Parqueadero con Microservicios

**Materia:** LPR07304 Lenguajes de Programación — UJAP
**Proyecto:** Proyecto Final (25 %, individual)
**Fecha límite:** 14/10/2026 11:59 PM (cada día de retraso: -3 pts)
**Autor del plan:** revisión técnica como dev senior (diseño de sistemas, Docker, sistemas distribuidos, full stack)

---

## 0. Resumen ejecutivo

Se construye un **Sistema de Parqueadero Inteligente** con 4 microservicios (cada uno en un lenguaje distinto), 2 motores de base de datos, un frontend React y un API Gateway Nginx. Todo se levanta con `docker compose up --build`.

| Servicio | Lenguaje / framework | Responsabilidad | Base de datos |
|---|---|---|---|
| `auth-service` | Node.js + Express | Usuarios, roles, login, emisión de JWT | MongoDB (`auth_db`) |
| `parking-service` | Python + FastAPI | Espacios, entradas, salidas, tarifas | PostgreSQL (`parking_db`) |
| `billing-service` | Java + Spring Boot | Facturación y reportes | PostgreSQL (`billing_db`) |
| `realtime-service` | Go + Gin | WebSockets, estado en vivo del mapa, historial de eventos | MongoDB (`realtime_db`) |
| `gateway` | Nginx | Punto de entrada único, enrutamiento, rate limit | — |
| `frontend` | React + Vite + Tailwind | Interfaz en español | — |

**Reparto de bases de datos:** 2 servicios usan SQL (parking, billing) y 2 usan NoSQL (auth, realtime). Esto cumple exactamente la consigna (2 y 2) y supera el mínimo del documento (≥2 SQL, ≥1 NoSQL).

**Alcance realista:** quedan 2 días. El plan está ordenado por prioridad: primero lo que da puntos y evita penalizaciones, al final lo estético. La sección 14 define qué recortar si el tiempo aprieta.

---

## 1. Análisis punto por punto del documento

### 1.1 Requisitos técnicos

| # | Requisito del documento | Cómo se cumple | Cómo se verifica |
|---|---|---|---|
| 2.1 | Mínimo 4 microservicios, un lenguaje cada uno (Python/FastAPI, Node, Java/Spring, Go) | 4 servicios, uno por lenguaje, cada uno con función diferenciada | `docker compose ps` muestra los 4 `healthy` |
| 2.1 | Cada uno en su propio contenedor | Un Dockerfile por servicio | `docker compose ps` |
| 2.1 | API REST con ≥3 endpoints | Cada servicio expone entre 6 y 12 endpoints (sección 8) | Pruebas `curl` de la sección 13 |
| 2.2 | SQL en ≥2 servicios | `parking-service` y `billing-service` con PostgreSQL | Tablas visibles con `psql` |
| 2.2 | NoSQL en ≥1 servicio | `auth-service` y `realtime-service` con MongoDB | Colecciones visibles con `mongosh` |
| 2.2 | Cada microservicio gestiona su propia base | 4 bases lógicas separadas, cada una con usuario propio que solo accede a la suya | Intentar conectar `parking_user` a `billing_db` debe fallar |
| 2.3 | Dockerfile por servicio | 5 Dockerfiles (4 backends + frontend) y 1 del gateway | Revisión del árbol |
| 2.3 | `docker compose up --build` levanta todo | Un `docker-compose.yml` con healthchecks y `depends_on: service_healthy` | Prueba desde clon limpio (sección 13) |
| 2.3 | Comunicación por red interna | Red `parking-net`; solo el gateway publica puerto | `docker compose config` |
| 2.3 | Volúmenes persistentes en bases de datos | `postgres_data` y `mongo_data` | `docker compose down` + `up` conserva los datos |
| 2.4 | Frontend consumiendo ≥3 endpoints de distintos servicios | Consume los 4 servicios | Navegar la app con la pestaña Network abierta |
| 2.5 | Comunicación HTTP entre servicios | 4 vínculos internos (sección 9) | Flujo entrada → salida → factura funciona de punta a punta |
| 2.5 | API Gateway (bonus) | Nginx obligatorio en este plan | `curl` a todo por `http://localhost:8080` |
| 3 | Estructura de entrega | Se respetan los nombres `servicio-python`, `servicio-node`, `servicio-java`, `servicio-go`, `frontend`, `nginx` | Revisión del árbol |
| 4 | README con 6 elementos | Plantilla en la sección 15 | Lista de verificación |

### 1.2 Criterios de evaluación (20 pts + 2 de bonus)

| Criterio | Pts | Qué lo asegura |
|---|---|---|
| 4 microservicios funcionales | 6 | Cada endpoint responde y valida; pruebas por fase |
| Docker + compose | 4 | Prueba obligatoria en clon limpio, con y sin `.env` |
| SQL integrado | 3 | PostgreSQL con 2 bases y datos reales persistidos |
| NoSQL integrado | 2 | MongoDB con 2 bases y datos reales persistidos |
| Frontend funcional | 2 | Login, mapa, operación, facturas, reportes |
| Comunicación entre servicios | 2 | 4 vínculos reales, todos con JWT de servicio |
| README | 1 | Plantilla con diagrama y capturas |
| **Bonus gateway** | +2 | Nginx como única puerta de entrada |

### 1.3 Penalizaciones y cómo se evitan

| Penalización | Riesgo concreto | Mitigación |
|---|---|---|
| No levanta con compose: **-8** | `.env` ignorado por git y ausente en el clon del profesor; orden de arranque; CRLF en scripts | Valores por defecto en el compose (`${VAR:-default}`), healthchecks, `.gitattributes` con `eol=lf`, prueba en clon limpio |
| Servicio sin Dockerfile: -2 c/u | Olvidar uno | Checklist de la sección 13 |
| Código de IA sin comprensión: **calificación 01** | Sustentación oral | Sección 16: cada decisión está argumentada y hay preguntas probables con respuesta. **Debes poder explicar cada archivo** |
| Entrega tardía: -3 pts por día | Dejar la entrega para el último minuto | Cierre objetivo el 14/10 a las 12:00 (medio día de colchón) |

### 1.4 Restricciones adicionales pedidas por ti

- Todo el código (variables, funciones, clases, constantes, nombres de archivos de código, rutas de API, tablas y columnas) **en inglés**.
- El contenido visible del frontend y el README **en español**.
- **Ningún comentario de ningún tipo** en el código. Esto incluye Dockerfiles, YAML, `nginx.conf`, scripts `.sh`, `pom.xml`, CSS y HTML. En Python tampoco hay docstrings (cuentan como comentarios). El shebang `#!/bin/bash` no es un comentario.
- Claves de usuario **hasheadas con bcrypt** (no reversibles), API protegida con **JWT**.

> **Nota sobre "encriptadas":** las contraseñas deben guardarse con *hash*, no con cifrado reversible. Cifrar permite recuperar la clave original, hashear no. Un hash con sal (bcrypt) es el estándar aceptado y es lo que se debe sustentar. Para el cumplimiento de la consigna lo presentamos como "contraseñas almacenadas de forma segura con bcrypt".

---

## 2. Arquitectura

```
                        Navegador (React, SPA)
                                 |
                          http://localhost:8080
                                 |
                      +----------v-----------+
                      |   gateway (Nginx)    |   único puerto publicado
                      +----------+-----------+
      /api/auth/*  /api/parking/*  /api/billing/*  /api/realtime/*  /ws/*   /
          |              |               |                |           |     |
   +------v-----+ +------v------+ +------v------+ +-------v-------+   |  +--v-------+
   | auth       | | parking     | | billing     | | realtime      |<--+  | frontend |
   | Express    | | FastAPI     | | Spring Boot | | Go + Gin      |      | (estático)|
   | :3000      | | :8000       | | :8080       | | :8081         |      +----------+
   +------+-----+ +--+-----+--+-+ +--+-------+--+ +-------+-------+
          |          |     |  |      |       |            |
          |          |     |  +------+-------+------------+---- HTTP interno con JWT de servicio
          |          |     |         |       |            |
   +------v-----+  +-v-----v---------v-+     |      +-----v------+
   | MongoDB    |  |   PostgreSQL      |     |      |  MongoDB   |
   | auth_db    |  | parking_db        |     |      | realtime_db|
   +------------+  | billing_db        |     |      +------------+
                   +-------------------+
        (un contenedor MongoDB y un contenedor PostgreSQL, con 2 bases cada uno)

Vínculos internos (red parking-net):
  parking-service  --> billing-service   crea la factura al registrar una salida
  parking-service  --> realtime-service  notifica cada cambio de espacio
  realtime-service --> parking-service   sincroniza el estado al arrancar y cada 30 s
  billing-service  --> auth-service      consulta el nombre del operador para la factura
```

**Qué se expone al host:** únicamente `gateway:80` mapeado a `8080` (configurable). Ninguna base de datos ni backend publica puertos. Esto reduce la superficie de ataque y obliga a que todo pase por el gateway.

---

## 3. Decisiones técnicas argumentadas

| # | Decisión | Elección | Por qué | Alternativas descartadas |
|---|---|---|---|---|
| D1 | Dónde viven las rutas | Cada servicio responde con el prefijo completo (`/api/auth/...`, `/api/parking/...`) y Nginx **no reescribe rutas** | Cero reescritura = menos bugs y la ruta es idéntica en el navegador, en el gateway y en el servicio. Facilita depurar y los screenshots | `rewrite` con `strip prefix`: introduce errores sutiles con redirects y Swagger |
| D2 | Mismo origen para front y API | El navegador solo habla con `localhost:8080` | Elimina CORS por completo (una fuente clásica de fallos y de código extra) | Habilitar CORS en 4 servicios: más código, más superficie de error |
| D3 | JWT | Express emite un JWT HS256 con secreto compartido (`JWT_SECRET`, mínimo 32 caracteres) y los otros 3 servicios lo validan localmente | Sin llamadas de red por cada request, es sencillo de sustentar y de implementar en 4 lenguajes | RS256: más correcto en producción (clave pública/privada) pero agrega gestión de llaves sin sumar puntos en 2 días. Se menciona como mejora futura |
| D4 | Autenticación servicio-a-servicio | **JWT de servicio** de vida corta (60 s, `role: SERVICE`), firmado con el mismo secreto. Las rutas `/internal/**` solo aceptan `SERVICE` y Nginx las bloquea con 404 | La consigna pide *todas las comunicaciones protegidas con JWT*. Un solo mecanismo para usuarios y servicios es más fácil de explicar que una API key aparte | API key interna: segundo mecanismo que justificar. Reenviar el JWT del usuario: acopla a expiración y rol del usuario, y no sirve en tareas de fondo (resync) |
| D5 | Validación del JWT | Cada servicio valida el token; el gateway **no** valida | Defensa en profundidad: si alguien alcanza un servicio dentro de la red, igual necesita token válido | `auth_request` en Nginx: acopla el gateway al servicio de auth y lo vuelve punto único de fallo |
| D6 | Hash de contraseñas | `bcryptjs` (JS puro), costo 10 | `bcrypt` nativo requiere compilar con node-gyp en Alpine y es la causa más común de builds rotos. `bcryptjs` es suficiente y estable | Argon2: mejor en teoría, pero dependencia nativa; scrypt: menos convencional para el profesor |
| D7 | Almacenamiento del token en el front | `localStorage` + interceptor de Axios | Simple y suficiente para el alcance. React escapa el HTML por defecto, lo que reduce el riesgo de XSS | Cookie `HttpOnly`: más segura pero exige manejar CSRF y cookies a través del gateway. Se documenta como limitación conocida |
| D8 | Esquema de BD en Postgres | `Base.metadata.create_all` (SQLAlchemy) y `ddl-auto: update` (JPA) al arrancar, con reintentos | Para un proyecto de 2 días es lo más robusto y ahorra herramientas de migración | Alembic/Flyway: lo correcto en producción, innecesario aquí. Se argumenta en la defensa |
| D9 | Topología de BD | 1 contenedor PostgreSQL con 2 bases y 1 contenedor MongoDB con 2 bases, cada base con **usuario propio y sin acceso a la otra** | Cumple "cada servicio gestiona su base" con menos RAM (importante junto a la JVM). El aislamiento real lo da el usuario por base | 4 contenedores de BD: más pesados sin beneficio académico |
| D10 | Variables de entorno | `.env` fuera de git (como pide la diapositiva) + `.env.example` versionado + **valores por defecto en el compose** | Si el `.env` no existe en el clon del profesor, el sistema debe levantar igual (evita -8 pts). Los secretos por defecto son solo de demo y así se documenta | Versionar `.env`: contradice la diapositiva. Exigir `.env`: riesgo alto de no levantar |
| D11 | Puerto del host | `8080` por defecto (`GATEWAY_PORT`) | El 80 suele estar ocupado por IIS/Apache/otro Docker en máquinas Windows | Puerto 80 fijo |
| D12 | Imágenes base | `node:22-alpine`, `python:3.12-slim`, `eclipse-temurin:21-jre-alpine`, `alpine:3.20`, `nginx:1.27-alpine` | Builds multi-etapa para Java, Go y front: imágenes pequeñas. Se ejecuta como usuario no root | Una sola etapa con JDK/Go completos: imágenes de ~1 GB |
| D13 | Versión de Spring Boot | Línea estable 3.5.x con Java 21 | Con 2 días de plazo no conviene saltar a una mayor nueva con cambios de paquetes. Java 21 es LTS | Boot 4.x: riesgo innecesario |
| D14 | FastAPI síncrono | Endpoints `def` con SQLAlchemy síncrono + `psycopg2-binary` + `httpx.Client` | Menos errores que mezclar `async` con ORM. FastAPI ejecuta los `def` en un pool de hilos, así que no bloquea | `asyncpg` + `AsyncSession`: más código y más puntos de falla |
| D15 | Consistencia en la salida | Se llama a billing **antes** de cerrar el ticket. Si billing falla, el ticket sigue `OPEN` y se responde 502. Billing es idempotente por `ticket_id` único | Evita tickets cerrados sin factura. Reintentar la salida es seguro | Cerrar primero y facturar después: puede dejar cobros perdidos |
| D16 | Notificación a tiempo real | Best-effort: si Go falla, la entrada/salida **no** se revierte; Go se re-sincroniza cada 30 s y al arrancar | El mapa en vivo no es crítico para el negocio; el dato real vive en Postgres | Transacción distribuida: complejidad desproporcionada |
| D17 | Autenticación del WebSocket | Handshake abierto + **primer mensaje** `{"type":"auth","token":"..."}` con plazo de 5 s | Los navegadores no pueden enviar `Authorization` en WebSocket. Pasar el token en la URL lo deja en logs de Nginx | Token en query string: queda registrado en logs |
| D18 | Mapa en Leaflet | `L.CRS.Simple` con rectángulos por espacio (sin tiles) | Funciona sin internet, es determinista y permite colorear espacios por estado. Los tiles de OpenStreetMap fallarían sin conexión durante la defensa | Mapa geográfico real: innecesario y dependiente de red |
| D19 | Lenguaje del front | JavaScript (JSX) | Ahorra tiempo de tipado en un plazo corto. TypeScript sería preferible en un proyecto largo | TypeScript: fricción adicional sin puntos extra |
| D20 | Idioma del front | Textos en `src/i18n/es.js` (claves en inglés, valores en español). La API devuelve **códigos de error en inglés** y el front los traduce | Cumple "código en inglés, contenido en español" sin mezclar | Textos en español dentro de los componentes |
| D21 | Nombres de carpetas | Se mantienen los de la diapositiva (`servicio-python`, etc.) | El profesor revisa contra esa estructura; los nombres de servicio dentro del compose sí van en inglés | Renombrar carpetas: arriesga la revisión estructural |
| D22 | Zona horaria | Todo se guarda en UTC (`timestamptz`) y el front formatea a hora local | Evita errores de cálculo de tarifa por zona horaria | Guardar hora local |

---

## 4. Estructura del repositorio

```
parking-system/
├── .env.example
├── .gitignore
├── .gitattributes
├── docker-compose.yml
├── README.md
├── docs/
│   └── screenshots/
├── infra/
│   ├── postgres/init.sh
│   └── mongo/init.sh
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── proxy_params.conf
├── servicio-node/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── index.js
│   └── src/
│       ├── config/env.js
│       ├── db/connection.js
│       ├── models/User.js
│       ├── middleware/{authenticate.js, authorize.js, validate.js, errorHandler.js}
│       ├── routes/{authRoutes.js, userRoutes.js, internalRoutes.js}
│       ├── services/{tokenService.js, userService.js, seedService.js}
│       └── validators/{authSchemas.js, userSchemas.js}
├── servicio-python/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── main.py
│   └── app/
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── security.py
│       ├── clients.py
│       ├── seed.py
│       ├── routers/{spaces.py, rates.py, tickets.py, internal.py}
│       └── services/{fee_calculator.py, parking_service.py}
├── servicio-java/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/main/
│       ├── resources/application.yml
│       └── java/com/parking/billing/
│           ├── BillingApplication.java
│           ├── config/{SecurityConfig.java, JwtConfig.java, ServiceRoleFilter.java, HttpClientConfig.java}
│           ├── controller/{InvoiceController.java, ReportController.java, InternalInvoiceController.java}
│           ├── domain/Invoice.java
│           ├── dto/...
│           ├── repository/InvoiceRepository.java
│           ├── service/{InvoiceService.java, ReportService.java, UserDirectoryClient.java, ServiceTokenService.java}
│           └── exception/{ApiExceptionHandler.java, ...}
├── servicio-go/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   └── internal/
│       ├── config/config.go
│       ├── auth/{jwt.go, middleware.go, servicetoken.go}
│       ├── store/{mongo.go, events.go, snapshots.go}
│       ├── hub/{hub.go, client.go, state.go}
│       ├── parkingclient/client.go
│       └── handlers/{health.go, spaces.go, events.go, occupancy.go, internal.go, websocket.go}
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── .dockerignore
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── i18n/es.js
        ├── api/{http.js, authApi.js, parkingApi.js, billingApi.js, realtimeApi.js}
        ├── context/AuthContext.jsx
        ├── hooks/{useSpacesSocket.js, useAsync.js}
        ├── routes/{ProtectedRoute.jsx, RoleRoute.jsx}
        ├── components/{Layout, Sidebar, Topbar, Card, Button, Table, Modal, Badge, ParkingMap, KpiCard, ...}
        ├── pages/{LoginPage, DashboardPage, OperationPage, TicketsPage, InvoicesPage, ReportsPage, SpacesPage, RatesPage, UsersPage}.jsx
        └── utils/{format.js, constants.js}
```

### 4.1 Archivos de repositorio

`.gitignore`
```
.env
node_modules/
dist/
target/
__pycache__/
*.pyc
.idea/
.vscode/
*.log
```

`.gitattributes`
```
*.sh text eol=lf
Dockerfile text eol=lf
*.conf text eol=lf
*.yml text eol=lf
```

> **Por qué `.gitattributes`:** en Windows, Git puede convertir los saltos de línea a CRLF. Un `init.sh` con CRLF falla dentro del contenedor Linux con el error `bad interpreter`, y eso rompe el arranque de las bases de datos (-8 pts). Forzar LF lo previene.

`.env.example`
```
GATEWAY_PORT=8080

JWT_SECRET=change-this-secret-with-at-least-32-characters
JWT_EXPIRES_IN_SECONDS=28800

ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!
ADMIN_FULL_NAME=System Administrator

POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=postgres_admin_demo
PARKING_DB_PASSWORD=parking_demo
BILLING_DB_PASSWORD=billing_demo

MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=mongo_root_demo
AUTH_DB_PASSWORD=auth_demo
REALTIME_DB_PASSWORD=realtime_demo

TAX_RATE=0.16
SEED_DEMO_DATA=true
```

---

## 5. Convenciones de código

1. **Idioma:** inglés para todo identificador, nombre de archivo de código, ruta de API, tabla, columna, colección, clave JSON y mensaje de error de API.
2. **Sin comentarios:** el código debe explicarse solo con buenos nombres. Funciones cortas, una responsabilidad por función.
3. **Formato de error uniforme** en los 4 servicios:
   ```json
   { "error": "PLATE_ALREADY_PARKED", "message": "The vehicle already has an open ticket" }
   ```
   El front traduce `error` a español con `es.js`.
4. **Códigos HTTP:** 200/201 éxito, 400 validación, 401 sin token o token inválido, 403 rol insuficiente, 404 no encontrado, 409 conflicto, 502 fallo de servicio dependiente.
5. **Fechas:** ISO-8601 en UTC (`2026-10-12T15:04:05Z`).
6. **Dinero:** `Decimal` en Python, `BigDecimal` en Java, `numeric(10,2)` en Postgres. Nunca `float`. En JSON se serializa como string con 2 decimales.
7. **Healthcheck:** cada servicio expone `GET /health` (sin autenticación, sin prefijo `/api`, no proxeado por Nginx).
8. **Rutas internas:** bajo `/internal/...`, solo rol `SERVICE`, bloqueadas por Nginx.
9. **Logs:** a stdout, una línea por request relevante. Nunca se registran contraseñas ni tokens.

---

## 6. Seguridad

### 6.1 JWT de usuario (emitido por `auth-service`)

| Claim | Valor |
|---|---|
| `sub` | id del usuario (ObjectId de Mongo en string) |
| `username` | nombre de usuario |
| `role` | `ADMIN` o `OPERATOR` |
| `iss` | `auth-service` |
| `iat`, `exp` | emisión y expiración (8 h por defecto) |

Algoritmo HS256. Los 4 servicios leen **el mismo `JWT_SECRET` como cadena UTF-8** (no lo decodifiques en base64 en un servicio y en otro no: es el error de integración más común).

### 6.2 JWT de servicio

| Claim | Valor |
|---|---|
| `sub` | nombre del servicio emisor (`parking-service`, etc.) |
| `role` | `SERVICE` |
| `iss` | nombre del servicio emisor |
| `exp` | 60 segundos después de `iat` |

Cada servicio emisor tiene un helper de unas 10 líneas que firma este token y lo envía como `Authorization: Bearer ...` en cada llamada interna. La identidad del operador viaja en el cuerpo de la petición.

### 6.3 Matriz de permisos

| Acción | ADMIN | OPERATOR |
|---|:-:|:-:|
| Login, ver perfil propio | ✔ | ✔ |
| CRUD de usuarios | ✔ | ✘ |
| Ver espacios y tarifas | ✔ | ✔ |
| Crear/editar/eliminar espacios, editar tarifas | ✔ | ✘ |
| Registrar entradas y salidas, ver tickets, cotizar | ✔ | ✔ |
| Ver facturas | ✔ | ✔ |
| Ver reportes | ✔ | ✘ |
| Mapa en tiempo real, historial de eventos, ocupación | ✔ | ✔ |
| Rutas `/internal/**` | solo `SERVICE` | solo `SERVICE` |

### 6.4 Contraseñas

- `bcryptjs` con costo 10. Se guarda únicamente `passwordHash`.
- Validación: mínimo 8 caracteres, al menos una letra y un número.
- Mensaje de login genérico (`INVALID_CREDENTIALS`) tanto si falla el usuario como la clave, para no revelar qué usuarios existen.
- Usuario administrador inicial creado desde variables de entorno solo si la colección está vacía.
- Registro de usuarios restringido a ADMIN: es un sistema operado por personal, no de autoregistro.

### 6.5 Gateway

- Rate limit en `/api/auth/login`: 5 req/s por IP con `burst=10`.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`; `server_tokens off`.
- Cuerpo máximo de 1 MB.
- Rutas `/internal/` devuelven 404.

---

## 7. Modelo de datos

### 7.1 PostgreSQL — `parking_db` (usuario `parking_user`)

**`parking_spaces`**

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | serial | PK |
| `code` | varchar(10) | unique, not null (ej. `A-01`) |
| `zone` | char(1) | not null |
| `row_index` | int | not null |
| `col_index` | int | not null |
| `vehicle_type` | varchar(15) | `CAR` / `MOTORCYCLE` / `TRUCK` |
| `status` | varchar(15) | `FREE` / `OCCUPIED` / `MAINTENANCE`, default `FREE` |

**`rates`**

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | serial | PK |
| `vehicle_type` | varchar(15) | unique |
| `first_hour` | numeric(10,2) | not null |
| `extra_hour` | numeric(10,2) | not null |
| `daily_cap` | numeric(10,2) | not null |
| `grace_minutes` | int | not null |

**`tickets`**

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | uuid | PK |
| `plate` | varchar(10) | not null |
| `vehicle_type` | varchar(15) | not null |
| `space_id` | int | FK → `parking_spaces.id` |
| `entry_at` | timestamptz | not null |
| `exit_at` | timestamptz | null hasta la salida |
| `total_minutes` | int | null hasta la salida |
| `fee` | numeric(10,2) | null hasta la salida |
| `status` | varchar(10) | `OPEN` / `CLOSED` |
| `operator_id` | varchar(24) | not null |
| `invoice_number` | varchar(30) | null hasta la salida |

Índices únicos parciales (protegen contra condiciones de carrera):
- una sola fila `OPEN` por `plate`;
- una sola fila `OPEN` por `space_id`.

### 7.2 PostgreSQL — `billing_db` (usuario `billing_user`)

**`invoices`**

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | bigserial | PK |
| `number` | varchar(30) | unique (`INV-00000001`) |
| `ticket_id` | uuid | **unique** (garantiza idempotencia) |
| `plate` | varchar(10) | not null |
| `vehicle_type` | varchar(15) | not null |
| `entry_at`, `exit_at` | timestamptz | not null |
| `total_minutes` | int | not null |
| `subtotal`, `tax`, `total` | numeric(10,2) | not null |
| `operator_id` | varchar(24) | not null |
| `operator_name` | varchar(100) | not null (`UNKNOWN` si auth no responde) |
| `created_at` | timestamptz | not null |

### 7.3 MongoDB — `auth_db` (usuario `auth_user`)

Colección **`users`**
```json
{
  "_id": "ObjectId",
  "username": "admin",
  "passwordHash": "$2a$10$...",
  "fullName": "System Administrator",
  "role": "ADMIN",
  "active": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
Índice único sobre `username`.

### 7.4 MongoDB — `realtime_db` (usuario `realtime_user`)

Colección **`space_events`**
```json
{
  "type": "ENTRY",
  "spaceId": 5,
  "spaceCode": "A-05",
  "status": "OCCUPIED",
  "plate": "ABC123",
  "vehicleType": "CAR",
  "occurredAt": "ISODate"
}
```
Índice descendente sobre `occurredAt`.

Colección **`occupancy_snapshots`**
```json
{ "capturedAt": "ISODate", "total": 32, "occupied": 11, "free": 20, "maintenance": 1 }
```
Se inserta un documento por minuto. Alimenta el gráfico de ocupación del front.

---

## 8. Especificación de cada servicio

### 8.1 `servicio-node` — auth-service (Express, puerto 3000)

**Dependencias:** `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`.

**Endpoints**

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Valida credenciales y devuelve `{ token, user }` |
| GET | `/api/auth/me` | autenticado | Perfil del token actual |
| POST | `/api/auth/users` | ADMIN | Crea usuario |
| GET | `/api/auth/users` | ADMIN | Lista usuarios |
| GET | `/api/auth/users/:id` | ADMIN | Detalle |
| PUT | `/api/auth/users/:id` | ADMIN | Actualiza nombre, rol, estado o clave |
| DELETE | `/api/auth/users/:id` | ADMIN | Desactiva (`active=false`), no borra |
| GET | `/internal/users/:id` | SERVICE | `{ id, username, fullName }` para facturación |
| GET | `/health` | público | Estado |

**Reglas**
- Un usuario con `active=false` no puede iniciar sesión.
- Un ADMIN no puede desactivarse a sí mismo ni quitarse su propio rol (evita quedarse sin administradores).
- `passwordHash` nunca sale en una respuesta.
- Arranque: conectar a Mongo con reintentos (hasta 30 intentos cada 2 s), crear índice único, sembrar el admin si no hay usuarios, luego escuchar.

**Por qué Express con módulos separados:** rutas delgadas, lógica en `services/`, validación con `zod` en un middleware reutilizable. Es el patrón que cualquier profesor reconoce y se explica en un minuto.

### 8.2 `servicio-python` — parking-service (FastAPI, puerto 8000)

**Dependencias:** `fastapi`, `uvicorn[standard]`, `sqlalchemy>=2`, `psycopg2-binary`, `pydantic`, `pyjwt`, `httpx`.

**Endpoints**

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/parking/spaces` | autenticado | Lista de espacios (filtros `status`, `vehicleType`) |
| POST | `/api/parking/spaces` | ADMIN | Crea espacio |
| PUT | `/api/parking/spaces/{id}` | ADMIN | Edita código, tipo o estado (`MAINTENANCE`) |
| DELETE | `/api/parking/spaces/{id}` | ADMIN | Elimina si no tiene ticket abierto |
| GET | `/api/parking/rates` | autenticado | Tarifas por tipo de vehículo |
| PUT | `/api/parking/rates/{vehicleType}` | ADMIN | Actualiza tarifa |
| POST | `/api/parking/entries` | autenticado | Registra entrada; asigna espacio |
| GET | `/api/parking/tickets` | autenticado | Lista (filtros `status`, `plate`) |
| GET | `/api/parking/tickets/{id}` | autenticado | Detalle |
| GET | `/api/parking/tickets/{id}/quote` | autenticado | Cotiza el monto al momento actual, sin cerrar |
| POST | `/api/parking/exits` | autenticado | Registra salida, factura y libera espacio |
| GET | `/internal/parking/spaces` | SERVICE | Estado completo para resync de Go |
| GET | `/health` | público | Estado |

Documentación Swagger en `/api/parking/docs` (con `docs_url` y `openapi_url` configurados con ese prefijo para que funcione detrás del gateway sin `root_path`). Útil para las capturas del README.

**Cálculo de tarifa** (`services/fee_calculator.py`):

```python
from decimal import Decimal, ROUND_HALF_UP
from math import ceil


def calculate_fee(total_minutes, rate):
    if total_minutes <= rate.grace_minutes:
        return Decimal("0.00")
    full_days, remaining_minutes = divmod(total_minutes, 1440)
    remaining_fee = Decimal("0.00")
    if remaining_minutes > 0:
        billed_hours = ceil(remaining_minutes / 60)
        remaining_fee = rate.first_hour + (billed_hours - 1) * rate.extra_hour
    fee = full_days * rate.daily_cap + min(remaining_fee, rate.daily_cap)
    return fee.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
```

Reglas: `total_minutes = ceil(segundos / 60)`; hora iniciada se cobra completa; tope diario por cada bloque de 24 h; tolerancia gratuita inicial.

Ejemplos con `CAR` (primera hora 2.00, hora extra 1.50, tope diario 12.00, tolerancia 10 min):

| Estadía | Resultado |
|---|---|
| 8 min | 0.00 |
| 45 min | 2.00 |
| 130 min (3 h iniciadas) | 5.00 |
| 600 min (10 h) | 12.00 (aplica tope) |
| 1500 min (25 h) | 14.00 (12.00 + 2.00) |

Estos 5 casos se usan como verificación manual del cálculo.

**Flujo de entrada (`POST /api/parking/entries`)**
1. Validar `plate` (mayúsculas, regex `^[A-Z0-9-]{4,10}$`) y `vehicleType`.
2. Rechazar con 409 `PLATE_ALREADY_PARKED` si la placa ya tiene ticket `OPEN`.
3. Si viene `spaceId`, verificar que exista, esté `FREE` y sea compatible con el tipo; si no viene, tomar el primer `FREE` compatible con `SELECT ... FOR UPDATE SKIP LOCKED`.
4. Sin espacio disponible: 409 `NO_SPACE_AVAILABLE`.
5. En una transacción: crear ticket, marcar espacio `OCCUPIED`.
6. Fuera de la transacción: notificar a `realtime-service` (best-effort, timeout 3 s).
7. Responder 201 con el ticket.

**Flujo de salida (`POST /api/parking/exits`, cuerpo `{ ticketId }` o `{ plate }`)**
1. Localizar el ticket `OPEN` (404 `TICKET_NOT_FOUND`).
2. Calcular `total_minutes` y `fee`.
3. Llamar a `billing-service` (`POST /internal/billing/invoices`, timeout 5 s). Si falla → 502 `BILLING_UNAVAILABLE` y **no se cierra** nada.
4. En una transacción: ticket `CLOSED` con `exit_at`, `total_minutes`, `fee`, `invoice_number`; espacio `FREE`.
5. Notificar a `realtime-service` (best-effort).
6. Responder 200 con ticket y factura.

**Datos de demostración** (`SEED_DEMO_DATA=true` y tablas vacías): 32 espacios en 4 filas × 8 columnas; filas A y B `CAR` (16), fila C `MOTORCYCLE` (8), fila D `TRUCK` (8); tarifas por defecto para los 3 tipos.

### 8.3 `servicio-java` — billing-service (Spring Boot, puerto 8080)

**Dependencias (pom.xml):** `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, `postgresql`, `springdoc-openapi-starter-webmvc-ui` (opcional, para Swagger).

**Endpoints**

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/billing/invoices` | ADMIN, OPERATOR | Lista paginada (`page`, `size`, filtros `plate`, `from`, `to`) |
| GET | `/api/billing/invoices/{id}` | ADMIN, OPERATOR | Detalle |
| GET | `/api/billing/reports/summary` | ADMIN | Totales del día y del mes |
| GET | `/api/billing/reports/daily` | ADMIN | Ingresos por día en un rango |
| GET | `/api/billing/reports/by-vehicle-type` | ADMIN | Ingresos y conteo por tipo de vehículo |
| GET | `/api/billing/reports/by-operator` | ADMIN | Ingresos y conteo por operador |
| POST | `/internal/billing/invoices` | SERVICE | Crea la factura (idempotente) |
| GET | `/health` | público | Estado |

**Seguridad (decisión de implementación):** `oauth2-resource-server` con un `JwtDecoder` construido con `NimbusJwtDecoder.withSecretKey(...)` usando HMAC-SHA256 y la cadena `JWT_SECRET` en UTF-8. Un conversor de autoridades mapea el claim `role` a `ROLE_<role>`. Es mucho menos código y menos propenso a errores que escribir un filtro JWT propio. `management.endpoints.web.base-path=/` y `path-mapping.health=health` exponen `GET /health`. Sesión `STATELESS`, CSRF deshabilitado (API sin cookies).

**Reglas de facturación**
- `subtotal` llega desde `parking-service` (única fuente de verdad de la tarifa); billing no recalcula tarifas.
- `tax = subtotal × TAX_RATE` redondeado `HALF_UP` a 2 decimales; `total = subtotal + tax`.
- Si el `ticket_id` ya tiene factura, responde 200 con la existente (idempotencia).
- `number` se genera como `INV-` + id con 8 dígitos, dentro de la misma transacción.
- Para `operator_name` llama a `GET /internal/users/{id}` de `auth-service`; si falla, guarda `UNKNOWN` y continúa (la factura no depende de ese dato cosmético).
- `ddl-auto: update`, con reintentos de conexión (HikariCP `initialization-fail-timeout` negativo o `connectionTimeout` razonable más el `depends_on` del compose).

### 8.4 `servicio-go` — realtime-service (Gin, puerto 8081)

**Dependencias:** `github.com/gin-gonic/gin`, `github.com/gorilla/websocket`, `github.com/golang-jwt/jwt/v5`, `go.mongodb.org/mongo-driver` (v2).

**Endpoints**

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/ws/spaces` | autenticado por mensaje inicial | WebSocket del mapa |
| GET | `/api/realtime/spaces` | autenticado | Estado actual de los espacios (desde memoria) |
| GET | `/api/realtime/occupancy` | autenticado | Ocupación actual y serie histórica (`?minutes=60`) |
| GET | `/api/realtime/events` | autenticado | Últimos eventos (`?limit=50`) |
| POST | `/internal/realtime/events` | SERVICE | Recibe un cambio de espacio |
| GET | `/health` | público | Estado |

**Protocolo WebSocket** (JSON)

| Dirección | Mensaje |
|---|---|
| Cliente → servidor (primero, máx. 5 s) | `{ "type": "auth", "token": "<jwt>" }` |
| Servidor → cliente tras autenticar | `{ "type": "snapshot", "data": [ ...espacios ] }` |
| Servidor → cliente en cada cambio | `{ "type": "space_update", "data": { "spaceId", "spaceCode", "status", "plate", "vehicleType", "occurredAt" } }` |
| Servidor → cliente en cada cambio | `{ "type": "occupancy", "data": { "total", "occupied", "free", "maintenance" } }` |
| Servidor → cliente si falla auth | cierre con código `4401` |

**Diseño del hub:** una goroutine propietaria del mapa de clientes y del estado de espacios; los demás componentes le envían por canales (`register`, `unregister`, `broadcast`). Evita carreras sin candados dispersos. Ping cada 30 s para mantener viva la conexión detrás de Nginx.

**Ciclo de vida:**
1. Al arrancar: conectar a Mongo (con reintentos) y cargar el estado desde `GET /internal/parking/spaces` de parking (con reintentos, no bloquea el health).
2. Cada 30 s: volver a sincronizar el estado completo (auto-reparación si se perdió una notificación).
3. Cada 60 s: insertar un `occupancy_snapshot`.
4. Cada evento interno: actualizar memoria, persistir en `space_events`, difundir a los clientes.

### 8.5 Dockerfiles

**`servicio-node/Dockerfile`**
```
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
CMD ["node", "index.js"]
```

**`servicio-python/Dockerfile`**
```
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --create-home appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`servicio-java/Dockerfile`**
```
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

**`servicio-go/Dockerfile`**
```
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server .

FROM alpine:3.20
RUN adduser -D app
USER app
COPY --from=build /out/server /server
EXPOSE 8081
CMD ["/server"]
```
> Usa en `go.mod` y en el `FROM` la misma versión de Go que tengas instalada localmente.

**`frontend/Dockerfile`**
```
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**`frontend/nginx.conf`**
```
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

**`nginx/Dockerfile`**
```
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params.conf /etc/nginx/proxy_params.conf
EXPOSE 80
```

Cada servicio incluye `.dockerignore` (`node_modules`, `target`, `dist`, `__pycache__`, `.git`) para builds rápidos y sin basura.

---

## 9. Comunicación interna entre los 4 backends

| # | Origen → Destino | Endpoint | Cuándo | Si falla |
|---|---|---|---|---|
| 1 | parking → billing | `POST /internal/billing/invoices` | Al registrar una salida | 502 al usuario; ticket sigue abierto |
| 2 | parking → realtime | `POST /internal/realtime/events` | Tras cada entrada, salida o cambio de estado de espacio | Se registra el error y se continúa |
| 3 | realtime → parking | `GET /internal/parking/spaces` | Al arrancar y cada 30 s | Reintenta en el siguiente ciclo |
| 4 | billing → auth | `GET /internal/users/{id}` | Al crear una factura | `operator_name = UNKNOWN` |

Cada servicio aparece en al menos un vínculo, así que la comunicación cubre a los 4 backends (el documento exige mínimo 2 servicios).

**Secuencia de salida (flujo completo)**
```
Front -> Gateway -> parking : POST /api/parking/exits (JWT usuario)
parking : calcula minutos y tarifa
parking -> billing : POST /internal/billing/invoices (JWT servicio)
billing -> auth    : GET /internal/users/{operatorId} (JWT servicio)
billing : guarda factura en billing_db, responde número
parking : cierra ticket, libera espacio en parking_db
parking -> realtime : POST /internal/realtime/events (JWT servicio)
realtime : actualiza estado, guarda evento, difunde por WebSocket
Front : recibe space_update y repinta el mapa en verde
```

**Timeouts y reintentos:** `httpx.Client(timeout=...)` (3 s realtime, 5 s billing); `RestClient` con timeouts en Spring; `http.Client{Timeout: ...}` en Go. Sin reintentos automáticos en llamadas síncronas del usuario (el usuario reintenta); el resync de Go es el mecanismo de reparación.

---

## 10. Nginx (API Gateway)

**`nginx/proxy_params.conf`**
```
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**`nginx/nginx.conf`**
```
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    server_tokens off;
    client_max_body_size 1m;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    limit_req_zone $binary_remote_addr zone=login_zone:10m rate=5r/s;

    upstream auth_upstream {
        server auth-service:3000;
        keepalive 16;
    }

    upstream parking_upstream {
        server parking-service:8000;
        keepalive 16;
    }

    upstream billing_upstream {
        server billing-service:8080;
        keepalive 16;
    }

    upstream realtime_upstream {
        server realtime-service:8081;
        keepalive 16;
    }

    upstream frontend_upstream {
        server frontend:80;
    }

    server {
        listen 80;

        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header Referrer-Policy no-referrer always;

        location /internal/ {
            return 404;
        }

        location = /gateway-health {
            access_log off;
            default_type text/plain;
            return 200 "ok";
        }

        location = /api/auth/login {
            limit_req zone=login_zone burst=10 nodelay;
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://auth_upstream;
        }

        location /api/auth/ {
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://auth_upstream;
        }

        location /api/parking/ {
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://parking_upstream;
        }

        location /api/billing/ {
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://billing_upstream;
        }

        location /api/realtime/ {
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://realtime_upstream;
        }

        location /ws/ {
            proxy_pass http://realtime_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_read_timeout 3600s;
        }

        location / {
            include /etc/nginx/proxy_params.conf;
            proxy_pass http://frontend_upstream;
        }
    }
}
```

**Notas de diseño**
- `proxy_pass` sin URI conserva la ruta original (decisión D1).
- Los `upstream` se resuelven al arrancar Nginx: por eso el gateway depende de que los demás servicios estén `healthy` en el compose. Sin esa dependencia, Nginx falla con `host not found in upstream`.
- `keepalive` más `Connection ""` reutiliza conexiones hacia los backends.
- El bloque `/ws/` usa sus propias cabeceras porque necesita `Upgrade`.

---

## 11. Docker Compose

Orden de arranque garantizado por healthchecks: bases de datos → backends → frontend → gateway.

**`docker-compose.yml`**
```yaml
name: parking-system

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_ADMIN_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD:-postgres_admin_demo}
      PARKING_DB_PASSWORD: ${PARKING_DB_PASSWORD:-parking_demo}
      BILLING_DB_PASSWORD: ${BILLING_DB_PASSWORD:-billing_demo}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sh:/docker-entrypoint-initdb.d/init.sh:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 12
    networks:
      - parking-net

  mongo:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-root}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-mongo_root_demo}
      AUTH_DB_PASSWORD: ${AUTH_DB_PASSWORD:-auth_demo}
      REALTIME_DB_PASSWORD: ${REALTIME_DB_PASSWORD:-realtime_demo}
    volumes:
      - mongo_data:/data/db
      - ./infra/mongo/init.sh:/docker-entrypoint-initdb.d/init.sh:ro
    healthcheck:
      test: ["CMD-SHELL", "mongosh --quiet --eval \"db.adminCommand('ping').ok\" | grep -q 1"]
      interval: 5s
      timeout: 10s
      retries: 12
    networks:
      - parking-net

  auth-service:
    build: ./servicio-node
    environment:
      PORT: 3000
      MONGO_URI: mongodb://auth_user:${AUTH_DB_PASSWORD:-auth_demo}@mongo:27017/auth_db?authSource=auth_db
      JWT_SECRET: ${JWT_SECRET:-change-this-secret-with-at-least-32-characters}
      JWT_EXPIRES_IN_SECONDS: ${JWT_EXPIRES_IN_SECONDS:-28800}
      ADMIN_USERNAME: ${ADMIN_USERNAME:-admin}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-Admin123!}
      ADMIN_FULL_NAME: ${ADMIN_FULL_NAME:-System Administrator}
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 10s
    networks:
      - parking-net

  parking-service:
    build: ./servicio-python
    environment:
      DATABASE_URL: postgresql+psycopg2://parking_user:${PARKING_DB_PASSWORD:-parking_demo}@postgres:5432/parking_db
      JWT_SECRET: ${JWT_SECRET:-change-this-secret-with-at-least-32-characters}
      BILLING_URL: http://billing-service:8080
      REALTIME_URL: http://realtime-service:8081
      SEED_DEMO_DATA: ${SEED_DEMO_DATA:-true}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 15s
    networks:
      - parking-net

  billing-service:
    build: ./servicio-java
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/billing_db
      SPRING_DATASOURCE_USERNAME: billing_user
      SPRING_DATASOURCE_PASSWORD: ${BILLING_DB_PASSWORD:-billing_demo}
      JWT_SECRET: ${JWT_SECRET:-change-this-secret-with-at-least-32-characters}
      AUTH_URL: http://auth-service:3000
      TAX_RATE: ${TAX_RATE:-0.16}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 45s
    networks:
      - parking-net

  realtime-service:
    build: ./servicio-go
    environment:
      PORT: 8081
      MONGO_URI: mongodb://realtime_user:${REALTIME_DB_PASSWORD:-realtime_demo}@mongo:27017/realtime_db?authSource=realtime_db
      JWT_SECRET: ${JWT_SECRET:-change-this-secret-with-at-least-32-characters}
      PARKING_URL: http://parking-service:8000
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8081/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s
    networks:
      - parking-net

  frontend:
    build: ./frontend
    networks:
      - parking-net

  gateway:
    build: ./nginx
    ports:
      - "${GATEWAY_PORT:-8080}:80"
    depends_on:
      auth-service:
        condition: service_healthy
      parking-service:
        condition: service_healthy
      billing-service:
        condition: service_healthy
      realtime-service:
        condition: service_healthy
      frontend:
        condition: service_started
    networks:
      - parking-net

volumes:
  postgres_data:
  mongo_data:

networks:
  parking-net:
    driver: bridge
```

> **Sin dependencias circulares:** parking y billing se llaman entre sí en tiempo de ejecución, pero ninguno declara `depends_on` del otro. Si lo hicieran, compose no arrancaría.

**`infra/postgres/init.sh`**
```sh
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE USER parking_user WITH PASSWORD '${PARKING_DB_PASSWORD}';
CREATE DATABASE parking_db OWNER parking_user;
CREATE USER billing_user WITH PASSWORD '${BILLING_DB_PASSWORD}';
CREATE DATABASE billing_db OWNER billing_user;
REVOKE CONNECT ON DATABASE parking_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE billing_db FROM PUBLIC;
GRANT CONNECT ON DATABASE parking_db TO parking_user;
GRANT CONNECT ON DATABASE billing_db TO billing_user;
EOSQL
```

**`infra/mongo/init.sh`**
```sh
#!/bin/bash
set -e

mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin <<EOF
db.getSiblingDB('auth_db').createUser({user: 'auth_user', pwd: '${AUTH_DB_PASSWORD}', roles: [{role: 'readWrite', db: 'auth_db'}]});
db.getSiblingDB('realtime_db').createUser({user: 'realtime_user', pwd: '${REALTIME_DB_PASSWORD}', roles: [{role: 'readWrite', db: 'realtime_db'}]});
EOF
```

> **Importante:** los scripts de `docker-entrypoint-initdb.d` solo se ejecutan cuando el volumen está vacío. Si cambias contraseñas o usuarios, ejecuta `docker compose down -v` para reiniciar los volúmenes.

---

## 12. Frontend (React + Vite + Tailwind + Axios + Leaflet + Chart.js)

### 12.1 Dependencias

`react`, `react-dom`, `react-router-dom`, `axios`, `leaflet`, `react-leaflet`, `chart.js`, `react-chartjs-2`, `tailwindcss` con `@tailwindcss/vite` (Tailwind v4, plugin de Vite: sin PostCSS ni archivo de configuración). Fija versiones con `package-lock.json` (`npm ci` en el Dockerfile).

### 12.2 Páginas y rutas

| Ruta | Página (texto visible en español) | Rol | Contenido |
|---|---|---|---|
| `/login` | Iniciar sesión | público | Formulario, mensajes de error traducidos |
| `/` | Inicio | todos | KPIs (ocupados, libres, ingresos del día), **mapa Leaflet en vivo**, últimos eventos |
| `/operation` | Operación | todos | Registrar entrada (placa, tipo, espacio opcional), registrar salida con cotización previa y confirmación |
| `/tickets` | Tickets | todos | Tabla con filtros por estado y placa |
| `/invoices` | Facturas | todos | Tabla paginada y detalle |
| `/reports` | Reportes | ADMIN | Ingresos diarios (barras), por tipo de vehículo (dona), ocupación en el tiempo (línea) |
| `/spaces` | Espacios | ADMIN | Alta, edición, mantenimiento, eliminación |
| `/rates` | Tarifas | ADMIN | Edición por tipo de vehículo |
| `/users` | Usuarios | ADMIN | Alta, edición, activar/desactivar |

Las rutas del router están en inglés; los títulos y textos viven en `es.js`. Si prefieres URLs en español, es solo una constante, pero se mantiene en inglés para ser coherente con la regla del código.

### 12.3 Capa de API

- `api/http.js`: instancia única de Axios con `baseURL: '/api'`; interceptor de petición que agrega `Authorization: Bearer <token>`; interceptor de respuesta que ante 401 limpia sesión y redirige a `/login`.
- Un módulo por servicio (`authApi`, `parkingApi`, `billingApi`, `realtimeApi`) con funciones pequeñas (`listSpaces`, `createEntry`, `createExit`, `getQuote`, `listInvoices`, `getDailyReport`, `getOccupancy`, etc.).
- Con esto el front consume endpoints de **los 4 servicios**, superando el mínimo de 3.

### 12.4 Tiempo real

`hooks/useSpacesSocket.js`:
1. Abre `ws(s)://<host>/ws/spaces`.
2. En `onopen` envía el mensaje `auth` con el token.
3. Mantiene en estado el arreglo de espacios; aplica `snapshot` y `space_update`.
4. Reconexión con backoff exponencial (1 s, 2 s, 4 s… máx. 15 s).
5. Expone `connectionStatus` para mostrar "Conectado / Reconectando…" en la barra superior.

### 12.5 Mapa (Leaflet)

- `MapContainer` con `crs={L.CRS.Simple}`, sin `TileLayer`, `zoomControl` activo y límites ajustados a la cuadrícula.
- Cada espacio es un `Rectangle` en `[[row, col], [row+0.9, col+0.9]]` (el separador visual lo da el 0.9).
- Colores: verde `FREE`, rojo `OCCUPIED`, gris `MAINTENANCE`. Tooltip con código, tipo y placa.
- Clic sobre un espacio libre lleva a `/operation` con el espacio preseleccionado.
- Leyenda con textos en español.

### 12.6 Lineamientos de diseño (minimalista y moderno)

- Layout con barra lateral fija y barra superior; contenido en tarjetas con `rounded-xl`, borde fino y sombra leve.
- Paleta: grises neutros (`slate`), un solo color de acento (`indigo`) y verde/rojo/ámbar solo para estados.
- Tipografía del sistema (`font-sans`), tamaños consistentes (`text-sm` para tablas y formularios).
- Componentes reutilizables (`Card`, `Button`, `Table`, `Modal`, `Badge`, `KpiCard`) para no repetir clases Tailwind.
- Estados vacíos, de carga y de error en cada vista. Confirmación antes de salidas y eliminaciones.
- Responsive básico: la barra lateral se colapsa en pantallas pequeñas.
- El documento aclara que **no se evalúa el diseño visual**; el tiempo invertido aquí debe ser mínimo una vez que todo funcione.

### 12.7 Control de acceso en el front

`ProtectedRoute` (exige sesión) y `RoleRoute` (exige `ADMIN`). El menú oculta lo no permitido, pero **la seguridad real está en el backend**: el front solo mejora la experiencia.

---

## 13. Plan de ejecución por fases (con verificación)

Tiempos estimados para ~18 horas efectivas. Cada fase termina con un commit y su verificación. No pases a la siguiente fase sin cumplir "Hecho cuando".

### Fase 0 — Esqueleto e infraestructura (≈1,5 h)

**Tareas**
1. Crear el repositorio, `.gitignore`, `.gitattributes`, `.env.example`.
2. Crear `infra/postgres/init.sh` y `infra/mongo/init.sh`.
3. Crear `docker-compose.yml` solo con `postgres`, `mongo` y `gateway` (con una configuración mínima de Nginx que devuelve `ok` en `/gateway-health`).

**Hecho cuando**
- `docker compose up -d --build` deja `postgres` y `mongo` en `healthy`.
- `docker compose exec postgres psql -U postgres -c "\l"` lista `parking_db` y `billing_db`.
- `docker compose exec mongo mongosh -u root -p mongo_root_demo --authenticationDatabase admin --eval "db.getSiblingDB('auth_db').getUsers()"` muestra `auth_user`.
- `curl http://localhost:8080/gateway-health` responde `ok`.

### Fase 1 — `auth-service` (≈2 h)

**Tareas:** modelo `User`, `bcryptjs`, login, `me`, CRUD de usuarios, rutas internas, siembra del admin, middlewares `authenticate`/`authorize`, `errorHandler`, Dockerfile, `.dockerignore`. Agregarlo al compose y al gateway.

**Hecho cuando**
```bash
TOKEN=$(curl -s http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r .token)
curl -s http://localhost:8080/api/auth/me -H "Authorization: Bearer $TOKEN"
```
- Login correcto devuelve token; clave errónea devuelve 401 `INVALID_CREDENTIALS`.
- `/api/auth/users` sin token → 401; con token de OPERATOR → 403; con ADMIN → 200.
- En Mongo, `passwordHash` empieza con `$2a$` o `$2b$` y nunca se ve la clave en claro:
  `docker compose exec mongo mongosh -u root -p mongo_root_demo --authenticationDatabase admin --eval "db.getSiblingDB('auth_db').users.find({}, {username:1, passwordHash:1})"`
- `curl -i http://localhost:8080/internal/users/x` → 404 (bloqueado por Nginx).

### Fase 2 — `parking-service` (≈3 h)

**Tareas:** modelos y `create_all` con reintentos, semilla, seguridad JWT (dependencias `get_current_user`, `require_roles`, `require_service`), routers de espacios, tarifas, tickets, entradas, salidas, cotización, `fee_calculator`, cliente de servicios con JWT de servicio, Dockerfile.

**Hecho cuando**
- `GET /api/parking/spaces` devuelve 32 espacios con token válido; 401 sin token.
- `POST /api/parking/entries` crea ticket y marca el espacio `OCCUPIED`; repetir la placa → 409.
- `GET /api/parking/tickets/{id}/quote` devuelve un monto coherente.
- Prueba unitaria manual de los 5 casos de la sección 8.2 en un `python -c` o `pytest` rápido.
- `psql` muestra datos en `parking_db` y no puede leerse `billing_db` con `parking_user`.
- La salida devuelve 502 hasta que exista billing (esperado en esta fase).

### Fase 3 — `billing-service` (≈2 h)

**Tareas:** entidad `Invoice`, repositorio con consultas de reportes, seguridad con resource server y conversor de roles, endpoints públicos e internos, cliente a `auth-service` con JWT de servicio, `/health`, Swagger opcional, Dockerfile multi-etapa.

**Hecho cuando**
- `docker compose up --build` compila Java sin errores y queda `healthy` en menos de 60 s.
- Flujo completo: entrada → salida → la respuesta incluye `invoice_number`; `GET /api/billing/invoices` muestra la factura con `operator_name` correcto.
- Repetir `POST /internal/billing/invoices` con el mismo `ticket_id` no crea otra factura.
- Con token de OPERATOR, `/api/billing/reports/summary` → 403; con ADMIN → 200.
- Detener `auth-service` y facturar: la factura se crea con `UNKNOWN`.

### Fase 4 — `realtime-service` (≈2 h)

**Tareas:** configuración, JWT, hub con canales, WebSocket con autenticación por primer mensaje, endpoint interno, persistencia en Mongo, resync con parking, snapshots de ocupación, Dockerfile.

**Hecho cuando**
- Con `websocat` o la consola del navegador: conectar a `ws://localhost:8080/ws/spaces`, enviar `auth` válido → llega `snapshot`. Sin `auth` en 5 s → cierre `4401`. Token inválido → cierre `4401`.
- Registrar una entrada vía API → el cliente WebSocket recibe `space_update` y `occupancy` en menos de 1 s.
- `GET /api/realtime/events` lista los eventos; `occupancy_snapshots` crece cada minuto.
- Reiniciar solo `realtime-service` y verificar que el estado se recupera desde parking.

### Fase 5 — Frontend (≈4 h)

Orden recomendado (cada paso es utilizable por sí solo):
1. Vite + Tailwind + router + `es.js` + layout base.
2. Login, `AuthContext`, interceptores, rutas protegidas.
3. Operación (entrada y salida con cotización) — **es el flujo central de la defensa**.
4. Inicio con mapa Leaflet y WebSocket.
5. Tickets y Facturas.
6. Reportes con Chart.js.
7. Espacios, Tarifas y Usuarios (ADMIN).

**Hecho cuando**
- Login, logout y expiración de sesión funcionan; un OPERATOR no ve ni accede a las páginas de ADMIN (probar escribiendo la URL).
- Registrar una entrada pinta el espacio en rojo en el mapa **sin recargar**, también en una segunda pestaña.
- Registrar una salida muestra monto y número de factura, y el espacio vuelve a verde.
- Todos los textos visibles están en español, incluidos los errores de la API.
- La pestaña Network muestra llamadas a `/api/auth`, `/api/parking`, `/api/billing` y `/api/realtime`.

### Fase 6 — Integración y endurecimiento del gateway (≈1,5 h)

**Tareas:** `nginx.conf` completo (sección 10), `depends_on` final, ajuste de tiempos de healthcheck, prueba de rate limit.

**Hecho cuando**
- Todo el sistema responde **solo** por `http://localhost:8080`; ningún otro puerto del host está publicado (`docker compose ps`).
- 20 intentos de login rápidos reciben 503/429 tras superar el `burst`.
- `docker compose down` y luego `up` conserva usuarios, tickets y facturas (volúmenes).

### Fase 7 — README, capturas y QA final (≈2 h)

**Tareas:** README (sección 15), capturas, ejecución de la checklist final, subida a GitHub y entrega en Moodle.

**Hecho cuando:** la checklist de la sección 14 está completa con todas las casillas marcadas.

### Calendario sugerido

| Día | Fases |
|---|---|
| Lunes 12/10 (hoy) | 0, 1 y 2 |
| Martes 13/10 | 3, 4 y 5 |
| Miércoles 14/10 (mañana) | 6 y 7; entrega **antes de las 12:00** |

---

## 14. Checklist final de verificación (QA)

### 14.1 Prueba de arranque en frío (la más importante: protege los 8 puntos)

```bash
git clone <URL_DEL_REPOSITORIO> /tmp/parking-check
cd /tmp/parking-check
docker compose up --build
```
- Debe funcionar **sin crear `.env`** y también con `cp .env.example .env`.
- Probar además `docker compose down -v && docker compose up --build` para validar el arranque desde volúmenes vacíos.
- Todos los servicios deben quedar `healthy` en menos de ~3 minutos.
- Ejecutar con Docker Desktop con al menos 4 GB de RAM asignados (la JVM, Mongo y Postgres juntos lo requieren).

### 14.2 Cumplimiento por criterio

**Microservicios (6 pts)**
- [ ] `auth-service` responde sus 9 endpoints.
- [ ] `parking-service` responde sus 13 endpoints.
- [ ] `billing-service` responde sus 8 endpoints.
- [ ] `realtime-service` responde sus 6 endpoints, incluido el WebSocket.
- [ ] Cada uno en su propio contenedor, con su lenguaje.

**Docker (4 pts)**
- [ ] Dockerfile en cada servicio, el front y el gateway.
- [ ] `docker compose up --build` levanta todo con un solo comando.
- [ ] Red interna `parking-net`; solo el gateway publica puerto.
- [ ] Volúmenes `postgres_data` y `mongo_data` presentes.

**SQL (3 pts)**
- [ ] `parking_db` con `parking_spaces`, `rates`, `tickets` y datos reales.
- [ ] `billing_db` con `invoices` y datos reales.

**NoSQL (2 pts)**
- [ ] `auth_db.users` con contraseñas hasheadas.
- [ ] `realtime_db.space_events` y `occupancy_snapshots` con datos.

**Frontend (2 pts)**
- [ ] Consume endpoints de los 4 servicios.
- [ ] Login con JWT funcionando.

**Comunicación (2 pts)**
- [ ] Los 4 vínculos internos verificados (sección 9).
- [ ] Detener un servicio dependiente produce el comportamiento esperado (502 o degradación).

**README (1 pt)**
- [ ] Todos los elementos de la sección 15 incluidos.

**Bonus (+2)**
- [ ] Nginx como única entrada y rutas `/internal/` bloqueadas.

### 14.3 Restricciones tuyas

- [ ] **Sin comentarios:** revisar con
  ```bash
  grep -rnE --include='*.js' --include='*.jsx' --include='*.java' --include='*.go' \
    --include='*.py' --include='*.css' --include='*.html' --include='*.yml' \
    --include='*.conf' --include='*.sh' --include='*.properties' --include='Dockerfile' \
    --exclude-dir=node_modules --exclude-dir=target --exclude-dir=dist --exclude-dir=.git \
    '(^|[[:space:]])(//|#[^!]|/\*|\*/|<!--)' .
  ```
  Los falsos positivos esperables son colores CSS (`#fff`) y URLs `http://`; revisa el resto a mano. Busca también docstrings de Python (`"""`) y Javadoc (`/**`).
- [ ] **Todo en inglés:** buscar acentos y signos del español en el código (excluyendo `frontend/src/i18n/es.js` y el README):
  ```bash
  grep -rnP '[áéíóúñÁÉÍÓÚÑ¿¡]' --exclude-dir=node_modules --exclude-dir=target \
    --exclude-dir=dist --exclude-dir=.git --exclude=es.js --exclude=README.md --exclude=PLAN_IMPLEMENTACION.md .
  ```
- [ ] Todo el contenido visible del front y el README en español.
- [ ] Contraseñas hasheadas en Mongo (nunca en claro).
- [ ] Toda ruta `/api/**` responde 401 sin token.

### 14.4 Prueba de punta a punta (script manual)

```bash
BASE=http://localhost:8080
TOKEN=$(curl -s $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r .token)
AUTH="Authorization: Bearer $TOKEN"

curl -s $BASE/api/parking/spaces -H "$AUTH" | jq 'length'

TICKET=$(curl -s $BASE/api/parking/entries -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"plate":"ABC123","vehicleType":"CAR"}' | jq -r .id)

curl -s $BASE/api/parking/tickets/$TICKET/quote -H "$AUTH"

curl -s $BASE/api/parking/exits -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"ticketId\":\"$TICKET\"}"

curl -s "$BASE/api/billing/invoices?page=0&size=5" -H "$AUTH"
curl -s $BASE/api/billing/reports/summary -H "$AUTH"
curl -s "$BASE/api/realtime/events?limit=5" -H "$AUTH"
curl -s -o /dev/null -w '%{http_code}\n' $BASE/api/parking/spaces
curl -s -o /dev/null -w '%{http_code}\n' $BASE/internal/users/x
```
Resultado esperado: 32, ticket creado, cotización, salida con `invoiceNumber`, factura listada, resumen, 2 eventos, `401`, `404`.

---

## 15. README.md (en español) — plantilla

Secciones obligatorias según el documento (§4):

1. **Nombre del estudiante y descripción del sistema** (una explicación breve del problema y la solución).
2. **Diagrama de arquitectura** (el ASCII de la sección 2 de este plan).
3. **Explicación de cada microservicio:** lenguaje, propósito, endpoints principales (tabla por servicio).
4. **Modelo de datos:** tablas SQL y colecciones NoSQL (sección 7).
5. **Instrucciones para ejecutar:**
   ```bash
   git clone <URL>
   cd parking-system
   cp .env.example .env
   docker compose up --build
   ```
   Acceso: `http://localhost:8080` · Usuario inicial: `admin` / `Admin123!`.
6. **Capturas de pantalla** (carpeta `docs/screenshots/`):
   - Login.
   - Inicio con el mapa en vivo (idealmente dos capturas: antes y después de una entrada).
   - Operación con cotización de salida.
   - Facturas y Reportes.
   - Swagger de `parking-service` (`/api/parking/docs`) funcionando.
   - Swagger de `billing-service` (`/api/billing/docs`) o respuesta `curl` del servicio.
   - `docker compose ps` con todos los servicios `healthy`.

Secciones adicionales recomendadas (suman claridad sin costo): flujo entrada→salida→factura, seguridad (JWT, bcrypt, roles), decisiones técnicas resumidas y limitaciones conocidas.

---

## 16. Defensa oral: preguntas probables

Dado que la penalización por "código sin comprensión demostrable" es calificación 01, prepara estas respuestas con tus propias palabras.

| Pregunta | Idea central de la respuesta |
|---|---|
| ¿Por qué microservicios y no un monolito? | Separación de responsabilidades, despliegue y escalado independiente, tecnologías heterogéneas; costo: complejidad operativa y consistencia distribuida |
| ¿Por qué cada servicio tiene su base? | Evita acoplamiento por esquema; un servicio puede cambiar su modelo sin romper a otros |
| ¿Por qué Mongo para auth y realtime? | Usuarios como documentos simples con índice único; eventos de alto volumen y sin relaciones fuertes |
| ¿Por qué Postgres para parking y billing? | Transacciones ACID, integridad referencial y dinero con `numeric` |
| ¿Cómo viaja el JWT y quién lo valida? | Express lo firma; todos lo validan con el mismo secreto; el gateway solo enruta |
| ¿Por qué hash y no cifrado? | El hash no es reversible; bcrypt añade sal y costo configurable |
| ¿Qué pasa si billing se cae durante una salida? | La salida falla con 502 y el ticket queda abierto; al volver billing, se reintenta sin duplicar por idempotencia |
| ¿Qué pasa si realtime se cae? | El negocio sigue; Go se resincroniza al volver |
| ¿Por qué Nginx? | Puerto único, sin CORS, rate limit, ocultar servicios y bloquear `/internal` |
| ¿Cómo calculas la tarifa? | Fórmula de la sección 8.2 con tolerancia, hora iniciada, tope diario; mostrar un ejemplo |
| ¿Cómo evitas que dos autos tomen el mismo espacio? | `FOR UPDATE SKIP LOCKED` y el índice único parcial sobre tickets abiertos |
| ¿Qué mejorarías? | RS256 con llaves, migraciones con Alembic/Flyway, cookies `HttpOnly`, broker de mensajes (RabbitMQ/Kafka) en lugar de HTTP síncrono, tests automatizados, observabilidad |

---

## 17. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Secreto JWT interpretado distinto entre lenguajes | Media | Alto | Usar siempre la cadena UTF-8; mínimo 32 caracteres; probar con un token emitido por Node validado en los otros 3 desde la Fase 2 |
| CRLF en `init.sh` (Windows) | Alta | Alto | `.gitattributes` con `eol=lf`; verificar en el clon limpio |
| Build de Maven lento o con fallos de red | Media | Medio | Capa `dependency:go-offline` separada; compilar pronto (Fase 3 el primer día disponible) |
| Poca RAM en Docker Desktop | Media | Medio | Asignar ≥4 GB; `MaxRAMPercentage=75` en la JVM |
| Nginx arranca antes que los backends | Media | Alto | `depends_on: service_healthy` en el gateway |
| Puerto 8080 ocupado | Media | Bajo | `GATEWAY_PORT` configurable; documentarlo |
| Init de BD no se re-ejecuta al cambiar claves | Media | Bajo | `docker compose down -v`, documentado |
| Spring tarda en estar `healthy` | Media | Medio | `start_period: 45s` y `retries: 12` |
| Errores de zona horaria en la tarifa | Baja | Medio | Todo en UTC con `timestamptz` |
| WebSocket cortado por proxy | Media | Medio | Cabeceras `Upgrade`, `proxy_read_timeout 3600s`, ping cada 30 s |
| Tiempo insuficiente | Alta | Alto | Línea de corte de la sección 18 |

---

## 18. Línea de corte (si el tiempo no alcanza)

Se recorta **de abajo hacia arriba**; lo de arriba nunca se sacrifica.

1. **Intocable:** 4 servicios con Dockerfile, compose que levanta limpio, JWT, SQL y NoSQL, comunicación interna, Nginx, login en el front, README con capturas.
2. **Alta prioridad:** flujo entrada → salida → factura en el front; mapa en vivo.
3. **Recortable 1:** página de Reportes con Chart.js (dejar solo el resumen numérico).
4. **Recortable 2:** CRUD de Usuarios, Tarifas y Espacios en el front (se mantienen en la API y se demuestran por Swagger o `curl`).
5. **Recortable 3:** Swagger en Spring, snapshots de ocupación y gráfico de línea, paginación avanzada de facturas.

---

## 19. Mejoras futuras (se mencionan en la defensa, no se implementan)

- RS256 con llaves asimétricas y rotación.
- Migraciones versionadas (Alembic y Flyway).
- Mensajería asíncrona con broker para desacoplar parking de billing y realtime.
- Pruebas automatizadas (pytest, JUnit, `go test`, Vitest) y pipeline de CI.
- Observabilidad: logs estructurados, métricas Prometheus, trazas.
- Cookies `HttpOnly` con protección CSRF y refresh tokens.
- HTTPS con certificados en el gateway.
