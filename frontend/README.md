# Frontend Zimbra CRM

Frontend en Angular 19 del CRM de Zimbra.
Usa la misma plantilla y arquitectura del proyecto de referencia (Datta Able) conectada al backend `crm-zimbra-backend`.

## Cómo ejecutarlo

1. Arranca el backend (puerto `8081`, ruta `/zimbra/v1`).
2. En esta carpeta:

```bash
npm install
npm start
```

3. Abre `http://localhost:4200`.

Usuarios de prueba: los de la base `crm_zimbra` (`admin@zimbra.test`, `laura.mendez@zimbra.test`, `cliente1@empresa.test`…). La contraseña de prueba está en `backend/src/main/resources/db/02_usuarios_prueba.sql`.

## Arquitectura (igual al proyecto de referencia)

```
src/app
├── app-config.ts            Router, HttpClient e interceptor
├── app-routing.module.ts    Rutas públicas y privadas, protegidas por rol
├── guards/                  authGuard (sesión), rolGuard (rol), invitadoGuard
├── interceptors/            Guarda el token renovado y cierra la sesión si el backend responde 401
├── models/                  Interfaces Rq/Rs iguales a las del backend
├── services/
│   ├── backend.service.ts   GET/POST/PUT genéricos con el token Bearer
│   └── auth.service.ts      Inicio y cierre de sesión, rol y ruta inicial
├── demo/pages/
│   ├── publico/             Página de Zimbra, login, registro, recuperar contraseña
│   ├── administrador/       Panel, usuarios, metas, clientes, prospectos, seguimientos, reportes, configuración
│   ├── asesor/              Estadísticas, mis prospectos, propuestas
│   ├── comun/               Listos para plan de pago, ficha del prospecto, alertas, ventas
│   └── cliente/             Mi cuenta, Zimbra en mi empresa, planes
└── theme/                   Layout de la plantilla (menú por rol, barra superior, helpers)
```

Cada módulo tiene su carpeta `service/` con las peticiones al backend, como en el proyecto de referencia.

## Apartados

| Apartado | Quién | Qué hace |
|---|---|---|
| Página pública | Todos | Presenta Zimbra, la prueba de 60 días y los planes; botones Iniciar sesión y Crear cuenta |
| Administrador | ADMINISTRADOR | Acceso a todo: crea y ajusta asesores y administradores, crea clientes y los inactiva, asigna prospectos, revisa seguimientos, ventas y reportes, cambia la configuración |
| Asesor | ASESOR | Sus estadísticas y meta, los clientes listos para el plan de pago (por defecto 50 ingresos en 60 días), la ficha completa de cada cliente, seguimientos, propuestas y ventas |
| Cliente | CLIENTE | Su cuenta y prueba gratuita, la guía para llevar Zimbra a su empresa y los planes de licencia |

## Seguridad

- La sesión se inicia con correo y contraseña; el backend devuelve un token JWT.
- Cada menú y cada ruta solo aparecen para su rol (`rolGuard`); el backend también lo valida.
- La sesión se cierra a los 15 minutos de inactividad.
- El cliente nunca ve su puntaje ni su seguimiento.
- Las páginas que visita el cliente y el tiempo en cada una se registran en segundo plano (RF-005).
