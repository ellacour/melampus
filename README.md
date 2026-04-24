# Mélampus — Suivi sanitaire animal connecté

Monorepo Django + React + React Native pour le suivi des vaccinations et soins récurrents des animaux.

| App | Stack | Port |
|-----|-------|------|
| Backend | Django 5 + DRF + Celery + PostgreSQL + Redis | 8000 |
| Web | React 18 + Vite + TypeScript + Tailwind | 5173 |
| Mobile | Expo 52 + React Native 0.76 | — |

## Prérequis

- Node.js >= 20, npm >= 10
- Python >= 3.12
- Docker & Docker Compose

## Démarrage local

```bash
# 1. Installer les dépendances
git clone https://github.com/ellacour/melampus.git && cd melampus
npm install

# 2. Configurer le backend
cp apps/backend/.env.example apps/backend/.env

# 3. Lancer la stack (PostgreSQL, Redis, Django, Celery)
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# 4. Lancer le frontend web
cd apps/web && npm run dev

# Ou tout lancer d'un coup depuis la racine
npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Admin | http://localhost:8000/admin/ |
| Web | http://localhost:5173 |

## Commandes utiles

```bash
npm run build        # Build toutes les apps
npm run test         # Tests
npm run type-check   # Vérification TypeScript
npm run lint         # Lint
```

```bash
# Tests backend
cd apps/backend
pytest tests/unit/
pytest tests/integration/
```

## Documentation complète

[Google Docs — Architecture, modèles, API, décisions techniques](https://docs.google.com/document/d/1ml3OnKTOzgXLMGfKxl7r8JgnWLlCiKkvzK6cNFf4HXM)
