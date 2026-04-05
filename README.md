# centra_point

A **multi-tenant SaaS management platform** for flexible, customizable entity management. Think of it as a generic container for any type of data: projects, expenses, events, tasks, inventory, etc.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              nginx (reverse proxy)                  │
├─────────────────────────────────────────────────────┤
│  React Frontend  │  Django REST API  │  Admin Panel │
├─────────────────────────────────────────────────────┤
│            PostgreSQL + Redis                       │
└─────────────────────────────────────────────────────┘
```

## Key Concepts

### **Organization** (Multi-tenant)
Each customer is an organization with:
- Own database schema isolation (via tenant context)
- Users with role-based access (owner, admin, member, viewer)
- Complete data isolation

### **Thing** (Custom Entity Type)
A flexible schema definition:
- **name**: e.g., "Projects", "Expenses", "Events"
- **schema**: Flexible field definitions (text, number, date, select, etc.)
- **fields**: Individual field configurations with validation

### **Instance** (Data Entry)
An actual data entry matching a Thing's schema:
- Stores JSON data flexible to the Thing's schema
- Audit trail (creator, timestamps)
- Queryable by organization

### **User Roles**
- **Owner**: Full access, billing, team management
- **Admin**: Full data access, user management
- **Member**: Create/edit data, basic access
- **Viewer**: Read-only access

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Or: Python 3.11+, Node.js 18+, PostgreSQL 16, Redis 7

### Option 1: Docker Compose (Recommended)

```bash
# Clone repo
git clone <repo>
cd centra_point

# Setup environment
cp .env.example .env

# Start everything
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser (for Django admin)
docker-compose exec backend python manage.py createsuperuser

# Access
# Frontend: http://localhost:3000
# API: http://localhost:8000/api
# Admin: http://localhost:8000/admin
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
centra_point/
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── organizations/      # Multi-tenant org management
│   │   ├── users/              # User roles and auth
│   │   ├── things/             # Schema definitions
│   │   └── instances/          # Data entries
│   ├── config/                 # Django settings
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Route pages
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API client
│   │   └── store/              # State management
│   ├── package.json
│   └── Dockerfile
├── docs/                       # Documentation
├── docker-compose.yml          # Full stack setup
├── nginx.conf                  # Reverse proxy config
└── .env.example                # Environment template
```

## API Endpoints

### Authentication
- `POST /api/auth/token/` — Get JWT token
- `POST /api/auth/token/refresh/` — Refresh token

### Organizations
- `GET /api/organizations/` — List user's organizations
- `POST /api/organizations/` — Create organization

### Things (Custom Entity Types)
- `GET /api/things/` — List Things in user's organization
- `POST /api/things/` — Create new Thing
- `GET /api/things/{id}/` — Get Thing details
- `PATCH /api/things/{id}/` — Update Thing schema

### Instances (Data Entries)
- `GET /api/instances/` — List instances
- `POST /api/instances/` — Create instance
- `PATCH /api/instances/{id}/` — Update instance

## Modularity for Future FastAPI Migration

The backend is structured for easy service extraction:

1. **Core layer** (Django): User management, tenant isolation, auth
2. **Service layer**: Pluggable endpoints (Thing CRUD, Instance CRUD)
3. **API layer**: REST endpoints (can be Django views OR FastAPI)

To migrate a service to FastAPI later:
- Keep Django for tenant/auth layer
- Swap service endpoints to FastAPI without touching frontend
- Frontend remains agnostic to backend implementation

Example later: `ThingService` can run as FastAPI alongside Django.

## Development

### Running Tests
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### Database Migrations
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

### Adding a New Service
1. Create `apps/<service>/` directory
2. Define models in `models.py`
3. Create serializers in `serializers.py`
4. Create viewsets in `views.py`
5. Register in `apps/<service>/urls.py`
6. Add to `config/settings.py` INSTALLED_APPS

## Deployment

### Self-Hosted (Recommended for SaaS)
```bash
# On your server
docker-compose up -d

# Setup SSL (Let's Encrypt)
# - Use certbot with nginx
# - Update docker-compose with SSL certs
```

### Cloud Deployment
- **AWS**: ECS + RDS + ElastiCache
- **DigitalOcean**: App Platform + Managed PostgreSQL
- **Heroku**: Use Procfile (coming soon)

## Security

- JWT token-based auth
- Role-based access control (RBAC)
- Tenant isolation at database level
- CORS enabled for frontend only
- HTTPS recommended for production

## Contributing

This is a teaching/product foundation. Contributions welcome!

## License

MIT
