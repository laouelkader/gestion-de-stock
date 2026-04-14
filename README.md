# Gestion de stock

Application web de **gestion d’inventaire** : produits, catégories, fournisseurs, mouvements de stock (entrées / sorties / ajustements), tableau de bord, rapports de ventes (graphiques + export PDF) et export CSV.  
**Backend** [FastAPI](https://fastapi.tiangolo.com/) + **MySQL** (ou SQLite en local) · **Frontend** [React](https://react.dev/) + [Vite](https://vitejs.dev/) · **Déploiement** prêt pour [Docker](https://www.docker.com/).

![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Structure du dépôt](#structure-du-dépôt)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Développement local (sans Docker)](#développement-local-sans-docker)
- [Configuration](#configuration)
- [API](#api)
- [Publier sur GitHub](#publier-sur-github)
- [Guide Docker détaillé (débutant)](#guide-docker-détaillé-débutant)

---

## Fonctionnalités

| Domaine | Détail |
|---------|--------|
| **Produits** | SKU, quantité, seuil d’alerte, prix unitaire, catégorie, fournisseur ; recherche ; filtre stock bas ; export **CSV** |
| **Catégories** | CRUD |
| **Fournisseurs** | Coordonnées, liaison aux produits |
| **Mouvements** | Entrée, sortie, ajustement ; historique |
| **Tableau de bord** | Totaux, alertes stock bas, valeur stock estimée, activité 7 jours |
| **Rapports ventes** | Basés sur les **sorties** de stock ; courbes (Recharts) ; export **PDF** |
| **API** | OpenAPI / Swagger sur `/docs` |

---

## Architecture

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   nginx     │────▶│  FastAPI    │
│  (navigateur)│     │  (frontend) │ /api│  (backend)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   MySQL     │
                                        │  (données)  │
                                        └─────────────┘
```

En **Docker**, le navigateur appelle surtout **`http://localhost:3000`** : nginx sert le build React et **proxifie** `/api`, `/health`, `/docs` vers le conteneur backend.

---

## Structure du dépôt

```text
.
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py          # Application, CORS, routes
│   │   ├── config.py        # Paramètres (DATABASE_URL, CORS…)
│   │   ├── database.py      # SQLAlchemy + pool MySQL
│   │   ├── models/          # ORM (produit, catégorie, fournisseur, mouvement)
│   │   ├── routers/         # Endpoints REST
│   │   ├── schemas/         # Pydantic
│   │   └── services/        # Logique métier (ex. rapports ventes)
│   ├── main.py              # Point d’entrée Uvicorn
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # SPA React + TypeScript
│   ├── src/
│   │   ├── pages/           # Écrans (produits, rapports…)
│   │   ├── api/             # Client HTTP
│   │   └── components/
│   ├── Dockerfile
│   └── nginx.conf           # Proxy vers l’API en prod Docker
├── docs/
│   └── GUIDE_DOCKER.md      # Guide pas à pas (très pédagogique)
├── docker-compose.yml       # mysql + backend + frontend
├── env.docker.example       # Exemple de variables d’environnement
├── package.json             # Scripts npm (dev / docker à la racine)
└── README.md                # Ce fichier
```

---

## Démarrage rapide (Docker)

**Prérequis** : [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et **démarré**.

```bash
git clone https://github.com/VOTRE_USER/VOTRE_REPO.git
cd VOTRE_REPO
docker compose up --build
```

Puis ouvre **http://localhost:3000** (interface) ou **http://localhost:8000/docs** (API).

- **Premier lancement** : téléchargement des images + build → peut prendre plusieurs minutes.  
- **Données MySQL** : volume Docker `mysql_data` (persistant tant que tu ne le supprimes pas).

Pour un guide **très détaillé** (mots de passe par défaut, erreurs fréquentes, schémas) : **[docs/GUIDE_DOCKER.md](docs/GUIDE_DOCKER.md)**.

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows :
.\.venv\Scripts\activate
pip install -r requirements.txt
# SQLite par défaut ; pour MySQL, crée backend/.env avec DATABASE_URL (voir section Configuration)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le **proxy Vite** envoie `/api` vers `http://127.0.0.1:8000` (voir `vite.config.ts`).  
Depuis la racine du monorepo, **`npm run dev`** (après `npm install` à la racine) peut lancer API + Vite en parallèle si tu utilises `concurrently` (voir `package.json`).

---

## Configuration

| Variable | Où | Description |
|----------|-----|-------------|
| `DATABASE_URL` | `backend/.env` ou Docker | Ex. `mysql+pymysql://user:pass@host:3306/db?charset=utf8mb4` ou `sqlite:///./stock.db` |
| `CORS_ORIGINS` | idem | Liste d’**origines séparées par des virgules** (sans JSON). Ex. `http://localhost:5173,http://localhost:3000` |
| `MYSQL_*`, ports | `.env` à la racine (optionnel) | Surcharge des valeurs du `docker-compose.yml` — voir **`env.docker.example`** |

Ne commite **jamais** de fichiers `.env` contenant de vrais secrets (déjà ignorés par `.gitignore`).

---

## API

- **Base** : préfixe `/api` pour les ressources (ex. `/api/products`, `/api/movements`).  
- **Documentation interactive** : `GET /docs` (Swagger UI) et `GET /redoc`.  
- **Santé** : `GET /health`.

En production derrière nginx (Docker), la même origine sert le front et le proxy `/api`.

---

## Publier sur GitHub

1. Crée un dépôt **vide** (sans README) sur [github.com/new](https://github.com/new), en **Public**.  
2. En local, à la racine du projet :

```bash
git remote add origin https://github.com/VOTRE_USER/NOM_DU_REPO.git
git branch -M main
git push -u origin main
```

Authentification HTTPS : utiliser un [**Personal Access Token**](https://github.com/settings/tokens) (scope `repo`) ou **GitHub Desktop**.

Avec [**GitHub CLI**](https://cli.github.com/) : `gh auth login` puis par exemple  
`gh repo create gestion-stock --public --source=. --remote=origin --push`.

---

## Guide Docker détaillé (débutant)

Tout le pas à pas « comme pour un débutant » (les trois boîtes, les ports, le dépannage) est dans :

**[docs/GUIDE_DOCKER.md](docs/GUIDE_DOCKER.md)**

---

## Licence

Ce dépôt est fourni à titre d’exemple / projet personnel : précise une licence (ex. **MIT**) si tu veux une réutilisation claire par d’autres développeurs.

---

## Auteur

Projet personnel — gestion de stock avec stack moderne (FastAPI, React, MySQL, Docker).
