# HANDOFF — CRM Zimbra

Estado al 13/11/2026. Backend y frontend funcionales y probados. Nada de esta sesión tiene commit.

## 1. Arquitectura y carpetas

```
Sistemas Transaccionales/          ← repo Git raíz (rama master, 1 commit "Commit inicial", sin remoto)
├── .gitignore                     node_modules/, target/, .env, dist/, build/, .claude/
├── .claude/launch.json            preview "frontend-zimbra" (npx ng serve --port 4200, cwd frontend) — ignorado por Git
├── SQL/zimbra.sql                 esquema v5: 11 tablas, triggers, 15 procedimientos sp_*, datos de prueba
├── backend/                       Spring Boot 4.0.4 · Java 21 · Maven · REPO GIT PROPIO (ver Git)
└── frontend/                      Angular 19.0.5 · plantilla Datta Able · npm (node_modules instalado)
```

**Base de datos:** MySQL 8.0.46, `localhost:3306/crm_zimbra`, usuario `root`. La contraseña está en `application-dev.properties`.

**Backend** (`backend/src/main/java/com/uniminuto/zimbra/`):
- **Capas:** `api` (interfaces con rutas y `@RolesPermitidos` / `@Publico`) → `apicontroller` → `service` / `serviceimpl` → `repository`.
- **`repository`:** JPA por tabla, más:
  - `ProcedimientoRepository`: llama `CALL sp_*` con JdbcTemplate.
  - `ConsultaRepository`: listados con joins mapeados con BeanPropertyRowMapper.
  - `ReporteRepository`.
- **Otros paquetes:** `models` (Rq/Rs), `security` (JWT, interceptor, roles), `config`, `exception`, `util`, `entity` (11 originales + `Configuracion`).
- **Ejecución:** puerto `8081`, ruta base `/zimbra/v1`, perfil `dev`.
- **Artefacto:** `crm-zimbra-backend`; la clase principal es `com.uniminuto.zimbra.ZimbraApplication`.
- **Scripts SQL:** `backend/src/main/resources/db/01_configuracion.sql`, `02_usuarios_prueba.sql` y `03_configuracion_clientes.sql`, **ya aplicados**.
- **Documentación de rutas:** `backend/API.md`.

**Frontend** (`frontend/src/app/`):
- **Base:** `app-config.ts` (hash routing, interceptor, locale es-CO) y `app-routing.module.ts` (rutas con `data.roles`).
- **Infraestructura:**
  - `guards/auth.guard.ts`: `authGuard`, `rolGuard`, `invitadoGuard`, `inicioRolGuard`.
  - `interceptors/headers.interceptor.ts`.
  - `services/backend.service.ts` y `services/auth.service.ts`.
  - `models/`.
- **Páginas** en `demo/pages/{publico,administrador,asesor,comun,cliente}/`, cada módulo con su carpeta `service/`.
- **Layout y helpers:** `theme/` (menú por rol en `theme/layout/admin/navigation/navigation.ts`; helpers `mensajes.ts` y `lista-paginada.ts`; componente `paginacion`).
- **Conexión:** API en `src/environments/environment.ts` → `http://localhost:8081/zimbra/v1`.

**Git:**
- **Raíz:** repo en `master`, con un solo commit (`7ffcf88`) y sin remoto.
- **`backend/` es un repo anidado** (tiene `.git` propio, en `master`, último commit `4d6aba3 "Backend de zimbra"`, sin remoto). La raíz lo registra como gitlink, no como submódulo: no hay `.gitmodules`, y `git status` muestra ` m backend`. El backend tiene unos 42 cambios sin commit.
- **`frontend/`** se versiona dentro del repo raíz.

**Plugin de Codex:**
- `codex@openai-codex` v1.0.6 (marketplace `openai/codex-plugin-cc`).
- CLI `codex-cli 0.167.2` en `%APPDATA%\npm\codex`.
- Estado del proyecto en `~/.claude/plugins/data/codex-openai-codex/state/Sistemas-Transaccionales-*/state.json`: `stopReviewGate: false`, con un job "rescue" previo de solo lectura.
- Comandos: `/codex:review` (necesita repo Git con diff), `/codex:adversarial-review`, `/codex:rescue`, `/codex:status`.

## 2. Cambios y decisiones de esta sesión

**Cambios:**
1. Se renombró `clinica` → `zimbra` (paquetes, clases, propiedades, `pom.xml`, contextPath) y el puerto pasó a 8081.
2. **Backend completo:**
   - Seguridad: BCrypt (reemplaza MD5), JWT HS256 (jjwt 0.12.6 + gson) con `sid` que se mantiene al renovar, renovación en el header `X-Token-Renovado`, cierre por inactividad a los 15 min y revocación de la sesión en memoria al hacer logout.
   - Toda escritura de negocio pasa por los `sp_*` (sin `@Transactional`; cada procedimiento maneja su transacción). Los `SIGNAL 45000` se devuelven como 400 con su mensaje.
3. **Tabla `configuracion`** (clave/valor): `PUNTAJE_MINIMO`=50, `DIAS_PRUEBA`=60, `INGRESOS_CALIFICADO`=50, `DIAS_CALIFICADO`=60, `DIAS_INACTIVIDAD`=60. El trigger `trg_clientes_bu` lee `PUNTAJE_MINIMO`.
4. **Endpoints agregados para el frontend:**
   - `/prospecto/calificados`: N ingresos en D días; el asesor solo ve los suyos.
   - `/cliente-admin/*`: listar, crear, inactivar, activar, inactivar en lote.
   - `/asesor/mis-estadisticas`.
   - `/reporte/resumen`.
   - `/configuracion/actualizar`.
5. **Frontend:** clon de la arquitectura de referencia, con:
   - Página pública (landing) con Iniciar sesión y Crear cuenta, más login, registro, recuperar y restablecer contraseña.
   - **Administrador:** panel, usuarios, metas, clientes, calificados, prospectos, seguimientos, ventas, reportes con CSV, configuración y alertas.
   - **Asesor:** panel, calificados, mis prospectos, ficha `/inicio/prospecto/:id`, propuestas con cierre de venta, ventas y alertas.
   - **Cliente:** mi cuenta y prueba, Zimbra en mi empresa, planes.
   - Registro de navegación del cliente (RF-005) y cierre de sesión por inactividad.
6. **Correos HTML** (`EmailServiceImpl`, `@Async`, MimeMessage):
   - Recuperación: token SHA-256 en la base, vigencia de 30 min, un solo uso.
   - Bienvenida al registrar un cliente.
   - Gmail se configura en `backend/correo-local.properties`, que está en `.gitignore` y se importa con `spring.config.import`. Si el correo está apagado, el enlace se escribe en el log.
7. Se quitaron las menciones al curso y a la universidad, la publicidad de Datta Able y los demos sin usar.

**Decisiones del usuario:** BCrypt · usar los procedimientos almacenados · JWT con rol · tabla `configuracion` · calificado = 50 ingresos en 60 días · el asesor ve solo lo asignado · **los clientes nunca se borran**: solo se inactivan si llevan 60 días o más sin entrar y no tienen licencia.

## 3. Errores resueltos y configuración que no se debe tocar

**Errores resueltos:**
- Las entidades estaban en el paquete `com.zimbra.crm.entity`; se movieron a `com.uniminuto.zimbra.entity`.
- La configuración de IntelliJ apuntaba a `com.uniminuto.clinica.*`.
- El puerto 8080 estaba ocupado.
- Los hashes de los usuarios de ejemplo eran de relleno (`$2b$12$PLACE`); se pusieron hashes BCrypt reales (`02_usuarios_prueba.sql`).
- El error 500 mostraba la excepción interna.
- El token renovado sobrevivía al logout.
- La fecha del reporte de visitas salía con desfase de zona horaria.
- El interceptor del frontend no se ejecutaba (faltaba `withInterceptorsFromDi`).
- Íconos de Feather que no existen.
- La página quedaba en blanco al abrirla en una pestaña oculta (`skipInitialTransition`).
- El presupuesto de estilos hacía fallar la compilación de producción.
- Al enlace de recuperación le faltaba `#/`.
- El remitente del correo era inválido para Gmail.

**No tocar:**
- **Base de datos:**
  - Los id de rol 1, 2 y 3 (fijos en los procedimientos y en `security/Roles`).
  - La tabla `configuracion`, los `sp_*` y los triggers.
  - `contrasena_hash` solo admite BCrypt.
  - No usar `DELETE` sobre clientes.
- **Backend:**
  - El paquete `security/`.
  - Las anotaciones de rol en `api/`.
  - `PasswordUtil`.
  - `zimbra.jwt.secret` (mínimo 32 caracteres).
  - `zimbra.cors.origenes` (incluye `:4200`).
  - `zimbra.recuperacion.url-frontend` (con `#/`).
  - `spring.config.import=optional:file:./correo-local.properties`.
  - El puerto y el contextPath.
- **Frontend:**
  - `apiUrlAuth`.
  - `withHashLocation`, `withInterceptorsFromDi` y `withViewTransitions({skipInitialTransition:true})`.
  - El `data.roles` de cada ruta.
  - La clave `token` en localStorage.
  - Los budgets de `angular.json` y `sweetalert2` en `allowedCommonJsDependencies`.
- **Usuarios de prueba:** `admin@zimbra.test`, `laura.mendez@zimbra.test`, `cliente1@empresa.test`. La contraseña está en `02_usuarios_prueba.sql`.

**Conocido:**
- La ejecución de IntelliJ (`ZimbraApplication`) quedó con clases a medio compilar y responde 500 en el login. Hay que hacer **Rebuild Project y volver a ejecutar**.
- Con los datos de ejemplo no hay clientes calificados (el máximo es 5 ingresos). Para demostrarlo, bajar `INGRESOS_CALIFICADO` en Configuración.

## 4. Siguiente paso exacto

1. El usuario completa `backend/correo-local.properties` (Gmail y contraseña de aplicación) y luego, en IntelliJ, hace **Build → Rebuild Project** y **Run `ZimbraApplication`**.
2. Verificación:
   - En el log debe aparecer `Correo habilitado`.
   - `POST /zimbra/v1/auth/login` con un usuario de prueba debe responder 200.
   - Probar "¿Olvidaste tu contraseña?" desde `http://localhost:4200`.
3. Ordenar Git (pedir confirmación antes):
   - Hacer commit en `backend/` (su `.gitignore` ya excluye `correo-local.properties`).
   - Decidir si `backend` pasa a ser un submódulo real o se integra al repo raíz (quitar `backend/.git`). En ese caso, agregar `correo-local.properties` al `.gitignore` raíz.
   - Commit en la raíz.
4. Con el diff ya commiteado, correr `/codex:review`.
