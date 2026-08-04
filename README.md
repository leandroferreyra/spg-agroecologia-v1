# SPG Agroecología

> 🎓 **Proyecto de Tesis** — Trabajo final presentado para la **Licenciatura en Sistemas**.
> Este repositorio contiene el frontend del sistema; se complementa con un backend (API REST) no incluido en este repositorio.

## Descripción

**SPG Agroecología** es una aplicación web para la gestión de un **Sistema Participativo de Garantía (SPG)** aplicado a la certificación agroecológica de quintas/productores. Permite administrar productores ("quintas"), planificar y registrar visitas de evaluación, y gestionar los criterios agroecológicos utilizados para certificar las buenas prácticas de producción.

### Funcionalidades principales

- **Autenticación y autorización**: login, registro, recuperación de contraseña, habilitación de usuarios y control de acceso por roles (`ROLE_ADMIN`, `ROLE_USER`).
- **Gestión de usuarios**: alta, baja y administración de cuentas y permisos.
- **Gestión de quintas**: registro y listado de productores/quintas evaluadas.
- **Gestión de visitas**: planificación, registro y seguimiento de visitas de evaluación a las quintas, incluyendo carga de imágenes.
- **Próximas visitas**: panel para visualizar y organizar las visitas pendientes.
- **Criterios de evaluación agroecológica**: administración de principios, estrategias, parámetros y posiciones utilizados durante las visitas.
- **Perfil de usuario**: edición de datos personales y cambio de contraseña.

## Tecnologías

- [Angular](https://angular.dev/) 18
- [TypeScript](https://www.typescriptlang.org/)
- [RxJS](https://rxjs.dev/) + [@ngrx/store](https://ngrx.io/) (manejo de estado)
- [Tailwind CSS](https://tailwindcss.com/) + [Bootstrap](https://getbootstrap.com/) / [ng-bootstrap](https://ng-bootstrap.github.io/)
- [ngx-toastr](https://www.npmjs.com/package/ngx-toastr), [SweetAlert2](https://sweetalert2.github.io/), [ngx-spinner](https://www.npmjs.com/package/ngx-spinner) (feedback de UI)
- [@auth0/angular-jwt](https://github.com/auth0/angular2-jwt) (manejo de JWT)
- [Karma](https://karma-runner.github.io) + [Jasmine](https://jasmine.github.io/) (testing)

## Estructura del proyecto

```
src/app
├── auth/           # Login, registro, recupero de clave, habilitación de usuario
├── core/
│   ├── guards/      # Guards de autenticación y de roles
│   ├── interceptors/# Interceptores HTTP (ej. token JWT)
│   ├── models/      # DTOs (request) y modelos de respuesta (response)
│   ├── pipes/
│   └── services/    # Servicios de acceso a la API (usuarios, quintas, visitas, etc.)
├── layouts/
│   ├── dashboard/   # Layout principal y módulos de configuración (usuarios, quintas,
│   │                #  visitas, próximas visitas, principios, estrategias, posiciones)
│   ├── header/ footer/ sidebar/
├── shared/          # Componentes reutilizables (íconos, etc.)
└── store/           # Estado global (NgRx)
```

## Requisitos previos

- [Node.js](https://nodejs.org/) (recomendado LTS)
- [Angular CLI](https://angular.dev/tools/cli) `^18.2.0`
- Backend/API corriendo (ver `src/environments/environment.prod.ts` para la URL base configurada)

## Instalación

```bash
npm install
```

## Servidor de desarrollo

```bash
npm start
```

Levanta un servidor de desarrollo (`ng serve --open`) y abre automáticamente `http://localhost:4200/`. La aplicación se recarga sola al modificar los archivos fuente.

## Build de producción

```bash
npm run build
```

Los artefactos de build se generan en el directorio `dist/`.

## Tests unitarios

```bash
npm test
```

Ejecuta los tests unitarios con [Karma](https://karma-runner.github.io).

## Configuración de entornos

Las URLs base de la API se configuran en:

- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

## Licencia y contexto académico

Este proyecto fue desarrollado con fines académicos como **tesis de grado para la Licenciatura en Sistemas**. Su uso, distribución o reutilización debe respetar el contexto académico en el que fue creado.
