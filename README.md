# AsisteTEC Backend

Backend API para el sistema de gestión de asistencias de la Universidad Tecnológica de Querétaro, desarrollado con Deno y Oak.

## Descripción del Proyecto

AsisteTEC es una aplicación web y móvil centralizada que permite a los profesores registrar la asistencia de forma digital en segundos, y que ofrece visibilidad en tiempo real a administradores y alumnos.

## Stack Tecnológico

- **Runtime:** Deno v1.x o superior
- **Framework:** Oak
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL
- **Framework de Pruebas:** Deno.test

## Estructura del Proyecto

```
asisteTEC-backend/
├── src/
│   ├── controllers/          # Controladores de lógica de negocio
│   │   ├── authController.ts
│   │   ├── assistanceController.ts
│   │   ├── justificationsController.ts
│   │   └── adminController.ts
│   ├── routes/               # Definición de rutas
│   │   ├── authRoutes.ts
│   │   ├── assistanceRoutes.ts
│   │   ├── justificationsRoutes.ts
│   │   └── adminRoutes.ts
│   ├── middleware/           # Middleware personalizado
│   │   └── auth.ts
│   ├── utils/                # Funciones utilitarias
│   │   ├── database.ts
│   │   └── jwt.ts
│   ├── config.ts             # Configuración de la aplicación
│   ├── deps.ts               # Dependencias
│   └── main.ts               # Punto de entrada
├── tests/
│   ├── integration/          # Pruebas de integración
│   │   ├── CP001_login.test.ts
│   │   ├── CP002_assistance.test.ts
│   │   └── CP010_unauthorized_access.test.ts
│   ├── unit/                 # Pruebas unitarias
│   ├── testUtils.ts          # Utilidades para pruebas
│   └── deps.ts               # Dependencias de pruebas
├── deno.json                 # Configuración de Deno
└── README.md                 # Este archivo
```

## Requisitos Previos

- Deno v1.x o superior instalado
- PostgreSQL 12 o superior
- Git

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/uteq/asisteTEC-backend.git
cd asisteTEC-backend
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

Editar `.env` con los valores apropiados:

```env
PORT=3000
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asisteTEC
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production
ENVIRONMENT=development
```

3. Crear la base de datos:

```bash
createdb asisteTEC
```

## Uso

### Desarrollo

Para ejecutar el servidor en modo desarrollo con recarga automática:

```bash
deno task dev
```

El servidor estará disponible en `http://localhost:3000`

### Pruebas

Ejecutar todas las pruebas:

```bash
deno task test
```

Ejecutar solo pruebas unitarias:

```bash
deno task test:unit
```

Ejecutar solo pruebas de integración:

```bash
deno task test:integration
```

## Endpoints de la API

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo usuario

### Asistencias

- `POST /api/assistance/record` - Registrar asistencia (requiere rol Profesor)
- `GET /api/assistance/history/:alumnoId` - Obtener historial de asistencia

### Justificaciones

- `PUT /api/justifications/:id/approve` - Aprobar justificación (requiere rol Profesor)
- `GET /api/justifications/pending` - Obtener justificaciones pendientes (requiere rol Profesor)

### Administración

- `GET /api/admin/dashboard` - Obtener dashboard de administrador (requiere rol Administrador)
- `POST /api/users/students` - Crear nuevo alumno (requiere rol Administrador)

### Salud

- `GET /health` - Verificar estado del servidor

## Casos de Prueba Implementados

### CP001: Inicio de sesión de un profesor

**Endpoint:** `POST /api/auth/login`

Valida que:
- Con credenciales correctas, el endpoint responda con status 200 y devuelva un token JWT
- Con credenciales incorrectas, el endpoint responda con status 401
- Después de 5 intentos fallidos, la cuenta se bloquee (status 429)

**Archivo:** `tests/integration/CP001_login.test.ts`

### CP002: Registro de asistencia

**Endpoint:** `POST /api/assistance/record`

Valida que:
- Se registren correctamente asistencias con diferentes estados (Presente, Ausente, Retardo)
- Se actualicen correctamente los registros existentes
- Se calcule correctamente el porcentaje de asistencia
- La API responda con status 201 (Creado)

**Archivo:** `tests/integration/CP002_assistance.test.ts`

### CP010: Acceso no autorizado a panel de administrador

**Endpoint:** `GET /api/admin/dashboard`

Valida que:
- Usuarios con rol Profesor no puedan acceder (status 403)
- Usuarios con rol Alumno no puedan acceder (status 403)
- Usuarios con rol Administrador sí puedan acceder (status 200)
- No se exponga información sensible en respuestas de error
- Se registren intentos de acceso no autorizado

**Archivo:** `tests/integration/CP010_unauthorized_access.test.ts`

## Características de Seguridad

- Autenticación basada en JWT
- Middleware de autorización por roles
- Bloqueo de cuenta después de 5 intentos fallidos
- Contraseñas hasheadas con bcrypt
- Logs de auditoría para todas las acciones importantes
- Validación de entrada en todos los endpoints
- CORS configurado

## Cobertura de Código

El proyecto aspira a una cobertura de código superior al 80%, cubriendo:

- Lógica de autenticación y autorización
- Operaciones CRUD en la base de datos
- Validaciones de datos
- Manejo de errores
- Cálculos de estadísticas

## Mejores Prácticas

- Separación de responsabilidades (Controllers, Routes, Middleware)
- Inyección de dependencias
- Manejo centralizado de errores
- Logging estructurado
- Pruebas atómicas con setup y teardown
- Convenciones de nombres consistentes
- Documentación de código

## Contribución

Para contribuir al proyecto:

1. Crear una rama para la nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
2. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
3. Push a la rama (`git push origin feature/nueva-funcionalidad`)
4. Crear un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.

## Contacto

Para preguntas o soporte, contactar a:
- **Docente:** Brandon Efren Venegas Olvera
- **Institución:** Universidad Tecnológica de Querétaro

## Notas de Desarrollo

### Configuración de Base de Datos de Prueba

Para ejecutar las pruebas, es necesario tener una base de datos de prueba configurada:

```bash
createdb asisteTEC_test
```

Las pruebas crearán y limpiarán automáticamente las tablas necesarias.

### Variables de Entorno para Pruebas

Las pruebas utilizan las siguientes variables de entorno por defecto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asisteTEC_test
DB_USER=postgres
DB_PASSWORD=postgres
```

### Ejecución de Pruebas Específicas

Para ejecutar una prueba específica:

```bash
deno test --allow-all tests/integration/CP001_login.test.ts
```

## Roadmap Futuro

- [ ] Implementar pruebas E2E con Cypress
- [ ] Agregar más casos de prueba (CP003, CP004, CP005, CP006, CP008, CP009)
- [ ] Implementar rate limiting
- [ ] Agregar caché con Redis
- [ ] Implementar notificaciones en tiempo real con WebSockets
- [ ] Agregar generación de reportes en PDF
- [ ] Mejorar documentación de API con OpenAPI/Swagger

