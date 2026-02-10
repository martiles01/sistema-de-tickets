# Sistema de Tickets - Helpdesk Security Agent

Sistema de gestión de tickets con framework de seguridad integrado y persistencia de datos PostgreSQL.

## 🚀 Características

- **Framework de Seguridad Completo**
  - Autenticación JWT
  - Control de acceso basado en roles (RBAC)
  - Encriptación de datos sensibles (AES-256-GCM)
  - Motor de detección de amenazas
  - Registro de auditoría completo

- **Gestión de Tickets**
  - Creación, actualización y seguimiento de tickets
  - Sistema de prioridades y categorías
  - Interacciones y comentarios
  - Asignación de técnicos

- **Persistencia con Prisma ORM**
  - Base de datos PostgreSQL
  - Migraciones automáticas
  - Tipos seguros con TypeScript

## 📋 Requisitos

- Node.js v18+
- PostgreSQL 12+
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/martiles01/sistema-de-tickets.git
cd sistema-de-tickets
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/database"
JWT_SECRET="tu-clave-secreta-jwt"
ENCRYPTION_KEY="tu-clave-encriptacion-32-caracteres"
PORT=3000
```

4. Ejecutar migraciones de Prisma:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Compilar el proyecto:
```bash
npm run build
```

## 🚀 Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
sistema-de-tickets/
├── src/
│   ├── core/
│   │   ├── security/
│   │   │   ├── auth/          # Autenticación JWT
│   │   │   ├── access/        # Control de acceso RBAC
│   │   │   ├── vault/         # Encriptación de datos
│   │   │   ├── escalation/    # Detección de amenazas
│   │   │   └── audit/         # Registro de auditoría
│   │   └── database/          # Cliente Prisma
│   ├── services/
│   │   ├── TicketService.ts   # Lógica de negocio de tickets
│   │   └── AuditorService.ts  # Auditoría de calidad
│   ├── middleware/
│   │   └── security.middleware.ts
│   ├── models/
│   └── index.ts
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── public/                    # Archivos estáticos
└── package.json
```

## 🔐 Seguridad

Este sistema implementa múltiples capas de seguridad:

1. **Autenticación**: Tokens JWT con expiración
2. **Autorización**: Permisos granulares por rol
3. **Encriptación**: Datos sensibles encriptados en reposo
4. **Auditoría**: Registro completo de todas las acciones
5. **Detección de Amenazas**: Análisis automático de contenido

## 🗄️ Base de Datos

El sistema utiliza PostgreSQL con Prisma ORM. Los modelos principales son:

- **User**: Usuarios del sistema
- **Ticket**: Tickets de soporte
- **TicketInteraction**: Interacciones en tickets
- **AuditLog**: Registro de auditoría

## 📝 API Endpoints

- `GET /health` - Estado del servidor
- `GET /api` - Información de la API

## 🛠️ Tecnologías

- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT
- **Encriptación**: crypto (AES-256-GCM)
- **Hashing**: bcrypt

## ⚠️ Notas Importantes

- Asegúrate de configurar `DATABASE_URL` con credenciales válidas
- Nunca subas el archivo `.env` al repositorio
- Cambia las claves secretas en producción
- Ejecuta `npx prisma generate` después de cada cambio en el schema

## 📄 Licencia

ISC

## 👤 Autor

martiles01
