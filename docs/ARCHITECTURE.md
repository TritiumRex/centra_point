# centra_point Architecture

## Overview

centra_point is a **multi-tenant SaaS platform** designed for flexible entity management. The architecture supports:

- **Multi-tenancy** with organization-level isolation
- **Flexible schemas** via the "Thing" concept
- **Role-based access control** (RBAC)
- **JWT authentication**
- **Self-hosted deployment** with Docker
- **Future FastAPI migration** with modular services

## Data Model

```
Organization (Tenant)
├── Users (with roles)
├── Things (Schema definitions)
│   ├── ThingFields (Individual field configs)
│   └── Instances (Data entries)
└── Access Control
    └── UserOrganizationRole (member, viewer, admin, owner)
```

### Key Entities

**Organization**
- Multi-tenant boundary
- Owner + members with roles
- Completely isolated data

**Thing**
- Custom entity type template
- Flexible schema definition (fields, validation)
- Example: "Projects", "Expenses", "Events"

**ThingField**
- Individual field in a Thing's schema
- Types: text, number, date, select, etc.
- Validation rules

**Instance**
- Actual data entry matching a Thing's schema
- JSON storage for flexible data
- Audit trail (creator, timestamps)

**UserOrganizationRole**
- User membership in an organization
- Role: owner, admin, member, viewer
- Access control enforcement

## Backend Architecture

### Layer 1: Django Core (Multi-tenant & Auth)
- User authentication (JWT)
- Organization management
- Role-based access control
- Database migrations

### Layer 2: Service Layer (Pluggable)
- Organization Service
- Thing Schema Service
- Instance CRUD Service
- User Management Service

### Layer 3: API Layer (REST endpoints)
- Organized by resource (organizations, things, instances, users)
- Viewsets for CRUD operations
- Serializers for validation and transformation

### Why This Structure?

**Modularity**: Each service can be extracted and replaced independently.
- Start with Django views
- Later: Swap to FastAPI endpoints without touching frontend
- Scale specific services without rewriting entire backend

**Example Future Migration**:
```
Now:  Django → Organization/Thing/Instance services → REST endpoints
Later: Django (auth only) → FastAPI Thing Service (fast) + Django Instance Service → REST endpoints
```

## Frontend Architecture

### React SPA (Server-agnostic)
- Consumes REST API only
- No backend-specific logic
- Works with Django or FastAPI equally

### Core Components
- **Layout**: Main app shell with sidebar & top nav
- **Pages**: Dashboard, Things, Instances, etc.
- **Hooks**: Authentication, data fetching (useAuth, useFetch)
- **Services**: API client (axios) with JWT handling
- **Store**: State management (Zustand for future expansion)

## API Design

### RESTful Endpoints

```
Authentication:
POST   /api/auth/token/              - Get JWT token
POST   /api/auth/token/refresh/      - Refresh token

Organizations:
GET    /api/organizations/           - List user's orgs
POST   /api/organizations/           - Create organization
GET    /api/organizations/{id}/      - Get org details
PATCH  /api/organizations/{id}/      - Update org

Things:
GET    /api/things/                  - List Things
POST   /api/things/                  - Create Thing
GET    /api/things/{id}/             - Get Thing with schema
PATCH  /api/things/{id}/             - Update Thing schema

Instances:
GET    /api/instances/               - List instances
POST   /api/instances/               - Create instance
PATCH  /api/instances/{id}/          - Update instance
DELETE /api/instances/{id}/          - Delete instance

Users:
GET    /api/users/                   - List org users
GET    /api/users/me/                - Current user info
GET    /api/users/roles/             - User roles in org
```

## Multi-Tenancy Strategy

### Database-Level Isolation
- Single PostgreSQL database
- Tenant filtering on every query
- Organization context required for all operations

### Implementation
```python
# Every query is tenant-filtered
def get_queryset(self):
    user_orgs = self.request.user.organizations.all()
    return Model.objects.filter(organization__in=user_orgs)
```

### Advantages
- Simpler deployment
- Easier backup/restore
- Cost-effective
- Still secure (query-level filtering)

## Security

### Authentication
- JWT tokens (short-lived access, long-lived refresh)
- Password hashing (Django default)
- CSRF protection (Django middleware)

### Authorization
- Organization-level isolation
- Role-based access control (RBAC)
- Query-level filtering (tenant context)

### Data Protection
- HTTPS recommended for production
- Environment variables for secrets
- No sensitive data in logs

## Deployment

### Docker Compose (Development & Self-Hosted)
```
nginx → Backend (Django) → PostgreSQL
     → Frontend (React) → Redis (cache/session)
```

### Services
1. **PostgreSQL** - Data persistence
2. **Redis** - Caching, session management (future)
3. **Backend** - Django REST API
4. **Frontend** - React SPA
5. **nginx** - Reverse proxy, static serving

## Scaling Strategy

### Phase 1 (Current): Monolith
- Django handles all services
- Single deployment
- Works for startups

### Phase 2: Service Extraction
- Extract high-load services to FastAPI
- Keep auth/tenant logic in Django
- Parallel services running

### Phase 3: Microservices (Optional)
- Complete service decoupling
- Independent deployment
- Message queue for async work (Celery + RabbitMQ)

## Development Workflow

### Adding a New Feature

1. **Create Django app** (if new service)
   ```
   mkdir apps/myservice
   python manage.py startapp myservice apps.myservice
   ```

2. **Define models** (`models.py`)
   ```python
   class MyModel(models.Model):
       organization = ForeignKey(Organization)
       # ... fields
   ```

3. **Create serializers** (`serializers.py`)
   ```python
   class MySerializer(serializers.ModelSerializer):
       class Meta:
           model = MyModel
           fields = [...]
   ```

4. **Build viewsets** (`views.py`)
   ```python
   class MyViewSet(viewsets.ModelViewSet):
       queryset = MyModel.objects.all()
       serializer_class = MySerializer
       # ... permissions, filtering
   ```

5. **Register routes** (`urls.py`)
   ```python
   router.register(r'myservice', MyViewSet)
   ```

6. **React frontend** (consume API)
   ```javascript
   const response = await api.get('/api/myservice/')
   ```

## Testing Strategy

### Backend
- Unit tests for models & serializers
- Integration tests for viewsets
- Tenant isolation tests

### Frontend
- Component tests (React Testing Library)
- API mock tests
- E2E tests (Cypress/Playwright)

## Monitoring & Logging

### Recommended Tools
- **Logs**: ELK Stack, DataDog, or Sentry
- **Metrics**: Prometheus + Grafana
- **APM**: New Relic, DataDog

### Sensitive Metrics
- Request latency by endpoint
- Database query performance
- Authentication failures
- Tenant-specific usage

## Future Enhancements

1. **WebSocket support** for real-time updates
2. **GraphQL layer** for flexible queries
3. **Audit logging** for compliance
4. **Advanced RBAC** with permissions matrix
5. **API rate limiting** per tenant
6. **File storage** (S3, GCS integration)
7. **Background jobs** (Celery workers)
8. **Multi-region deployment**
