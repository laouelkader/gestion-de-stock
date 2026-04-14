# Guide Docker (explication simple)

Ce guide explique **comment lancer le projet avec Docker**, étape par étape, sans supposer que tu connais déjà Docker.

---

## 1. C’est quoi Docker, en deux phrases ?

Imagine **trois boîtes** qui tournent sur ton ordinateur :

1. **MySQL** — la base de données (là où sont stockées les infos : produits, catégories, etc.).
2. **Backend** — le programme Python (FastAPI) qui parle à la base et répond aux demandes de l’appli.
3. **Frontend** — la page web (React) que tu vois dans le navigateur.

Docker sert à **lancer ces trois boîtes ensemble**, avec les bons réglages, sans tout installer à la main sur ta machine.

---

## 2. Ce qu’il te faut avant de commencer

1. **Docker Desktop** installé sur Windows (ou Docker équivalent sur Mac/Linux).
2. **Docker Desktop doit être démarré** (icône dans la barre des tâches, moteur « running »).

Si Docker n’est pas lancé, la commande `docker compose` affichera une erreur du genre *pipe … not found*.

---

## 3. Fichiers Docker utiles

À la **racine du projet** :

| Fichier | Rôle |
|--------|------|
| `docker-compose.yml` | Services **mysql**, **backend**, **frontend** et leurs liens. |
| `backend/Dockerfile` | Image Python + Uvicorn. |
| `frontend/Dockerfile` | Build React + nginx. |
| `frontend/nginx.conf` | Sert le site et **proxy** `/api`, `/health`, `/docs`, etc. vers le backend. |
| `env.docker.example` | Exemple de variables pour un fichier `.env` à la racine. |

---

## 4. Lancer le projet

```bash
cd chemin/vers/le/projet
docker compose up --build
```

- **`up`** = démarre les services.  
- **`--build`** = reconstruit les images si le code a changé.

---

## 5. URLs par défaut

| Usage | URL |
|--------|-----|
| Application web | [http://localhost:3000](http://localhost:3000) |
| API / Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |
| MySQL (DBeaver, etc.) | `localhost:3306`, base `stockdb` |

---

## 6. Arrêter

- **Ctrl + C** dans le terminal, ou `docker compose down`.  
- Les données MySQL restent dans le volume **`mysql_data`** tant que tu ne le supprimes pas.

---

## 7. Comptes MySQL par défaut (développement)

Sans fichier `.env` personnalisé :

- Base : **`stockdb`**
- Utilisateur : **`stock`** / mot de passe : **`stocksecret`**
- Root : **`rootsecret`**

À changer en production. Copie `env.docker.example` vers `.env` pour personnaliser.

---

## 8. Schéma réseau

```text
Navigateur
    |
    v
localhost:3000  --->  nginx (conteneur frontend)
                              |
                              |  /api/...
                              v
                        FastAPI (conteneur backend)
                              |
                              v
                        MySQL (conteneur mysql)
```

Dans Docker, le backend se connecte à **`mysql:3306`**, pas à `localhost`.

---

## 9. Dépannage

| Symptôme | Piste |
|----------|--------|
| Erreur *dockerDesktopLinuxEngine* | Lance **Docker Desktop**. |
| API / 502 | `docker compose ps` puis `docker compose logs backend`. |
| Port occupé | Modifie les ports dans un `.env` (voir `env.docker.example`). |

---

## 10. Commandes utiles

```bash
docker compose up --build -d   # en arrière-plan
docker compose ps
docker compose logs -f backend
docker compose down
```

À la racine : `npm run docker:up` / `npm run docker:down` (après `npm install` une fois).

---

## En une phrase

**Docker Desktop allumé → `docker compose up --build` → navigateur sur `http://localhost:3000`.**
