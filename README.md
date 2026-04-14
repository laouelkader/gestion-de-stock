# Projet gestion de stock — guide Docker (très simple)

Ce fichier explique **comment lancer le projet avec Docker**, étape par étape, sans supposer que tu connais déjà Docker.

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

## 3. Où se trouve le « mode d’emploi » Docker du projet ?

À la **racine du dossier projet** (là où il y a `docker-compose.yml`), tu as :

| Fichier | À quoi ça sert |
|--------|----------------|
| `docker-compose.yml` | La **liste des trois services** (mysql, backend, frontend) et comment ils se parlent. |
| `backend/Dockerfile` | La **recette** pour construire l’image du backend (Python + ton code). |
| `frontend/Dockerfile` | La **recette** pour construire le site web (build React + serveur nginx). |
| `frontend/nginx.conf` | Les **règles du serveur web** : il affiche le site et envoie tout ce qui commence par `/api` vers le backend. |
| `env.docker.example` | **Exemple** de variables (mots de passe, ports). Tu peux copier ça en `.env` si tu veux changer les défauts. |

---

## 4. Lancer le projet (la commande magique)

1. Ouvre un terminal (PowerShell ou CMD).
2. Va dans le dossier du projet, par exemple :

   ```text
   cd "C:\Users\...\Desktop\projet docker"
   ```

3. Tape :

   ```bash
   docker compose up --build
   ```

   - **`up`** = démarre les boîtes.  
   - **`--build`** = reconstruit les images si le code a changé (un peu plus long la première fois, c’est normal).

4. Attends que ça affiche des lignes sans erreur rouge. Quand MySQL est « healthy » et que le backend écoute, c’est bon.

---

## 5. Ouvrir l’application dans le navigateur

Par défaut :

- **Site web (recommandé)** : [http://localhost:3000](http://localhost:3000)  
  → C’est le **frontend** derrière nginx. Les appels à l’API passent en **interne** (même adresse, chemins `/api/...`).

- **API seule (Swagger / tests)** : [http://localhost:8000/docs](http://localhost:8000/docs)  
  → C’est le **backend** directement.

- **MySQL depuis ton PC** (client SQL type DBeaver) :  
  - Hôte : `localhost`  
  - Port : **3306** (sauf si tu l’as changé dans `.env`)  
  - Base : `stockdb`  
  - Utilisateur / mot de passe : ceux définis dans `docker-compose` (voir section 7).

---

## 6. Arrêter le projet

Dans le terminal où `docker compose up` tourne : **Ctrl + C**.

Pour arrêter **et** libérer les conteneurs (sans effacer la base MySQL dans le volume) :

```bash
docker compose down
```

Les **données MySQL** sont dans un **volume** Docker (`mysql_data`) : elles restent tant que tu ne supprimes pas ce volume volontairement.

---

## 7. Mots de passe et noms par défaut (important)

Si tu n’as pas créé de fichier `.env`, Docker utilise les valeurs par défaut du `docker-compose.yml`, en gros :

- Base MySQL : **`stockdb`**
- Utilisateur applicatif : **`stock`**
- Mot de passe utilisateur : **`stocksecret`**
- Mot de passe **root** MySQL : **`rootsecret`**

Pour la prod, il faudrait des mots de passe **beaucoup plus forts** et un fichier `.env` **non partagé** sur internet.

Tu peux copier `env.docker.example` vers `.env` à la racine et modifier les lignes, puis relancer `docker compose up --build`.

---

## 8. Comment les trois boîtes se parlent (schéma mental)

```text
Toi (navigateur)
    |
    v
localhost:3000  --->  [ nginx dans le conteneur "frontend" ]
                              |
                              |  /api/...  envoyé vers
                              v
                        [ conteneur "backend" : FastAPI ]
                              |
                              |  requêtes SQL vers
                              v
                        [ conteneur "mysql" ]
```

À l’intérieur de Docker, le backend utilise une adresse du type **`mysql:3306`** (le nom du service dans `docker-compose.yml`), pas `localhost`, parce que pour lui « MySQL » c’est **l’autre conteneur**.

---

## 9. Erreurs fréquentes (tranquille, ça arrive à tout le monde)

| Symptôme | Piste |
|----------|--------|
| Erreur avec *pipe* / *dockerDesktopLinuxEngine* | Docker Desktop **n’est pas lancé**. Ouvre Docker et attends le démarrage complet. |
| Le site affiche une erreur / ne charge pas l’API | Vérifie que les **trois** services sont « Up » (`docker compose ps`). Regarde les logs : `docker compose logs backend`. |
| **502** sur `/api/...` ou le backend qui redémarre en boucle | Souvent le backend qui **plante au démarrage** (voir les logs). Après une mise à jour du code, refais `docker compose up --build`. |
| Port déjà utilisé (3000, 8000 ou 3306) | Un autre programme utilise le port. Change `FRONTEND_PORT`, `BACKEND_PORT` ou `MYSQL_PORT` dans un fichier `.env` à la racine (voir `env.docker.example`). |
| Première fois très longue | Normal : téléchargement des images + `npm ci` + build du frontend. |

---

## 10. Commandes utiles (copier-coller)

```bash
# Démarrer (avec reconstruction des images)
docker compose up --build

# Démarrer en arrière-plan (tu récupères le terminal)
docker compose up --build -d

# Voir l’état des services
docker compose ps

# Voir les logs du backend seulement
docker compose logs -f backend

# Tout arrêter
docker compose down
```

À la racine du projet, tu peux aussi utiliser (si tu as fait `npm install` une fois à la racine) :

```bash
npm run docker:up
npm run docker:down
```

---

## 11. Résumé en une phrase

**Tu lances Docker Desktop, tu vas dans le dossier du projet, tu tapes `docker compose up --build`, tu ouvres `http://localhost:3000`, et le reste (MySQL + API + site) est géré par les trois conteneurs.**

Si un point bloque, note le **message d’erreur exact** et la commande que tu as tapée : c’est ce qui permet de le corriger vite.

---

## 12. Publier le projet sur GitHub (dépôt public)

Le dépôt Git est déjà initialisé sur ta machine (branche `main`, premier commit). Il reste à **créer le dépôt sur GitHub** et à **pousser** le code.

### Étape A — Créer le dépôt sur le site GitHub

1. Va sur [https://github.com/new](https://github.com/new).
2. **Repository name** : par ex. `gestion-stock` (évite les espaces ; le dossier local s’appelle « projet docker » mais le nom GitHub peut être autre).
3. Choisis **Public**.
4. **Ne coche pas** « Add a README » / « Add .gitignore » (tu as déjà du contenu local).
5. Clique sur **Create repository**.

GitHub affichera une page avec des commandes : garde l’URL du dépôt, par ex. `https://github.com/TON_USER/gestion-stock.git`.

### Étape B — Lier le dépôt distant et pousser

Dans un terminal, à la racine du projet (`projet docker`) :

```bash
git remote add origin https://github.com/TON_USER/gestion-stock.git
git push -u origin main
```

Remplace `TON_USER` et le nom du dépôt par les tiens. Si GitHub te demande de t’authentifier, utilise un **Personal Access Token** (paramètres GitHub → Developer settings → Tokens) à la place du mot de passe, ou connecte-toi avec **GitHub Desktop**.

### (Optionnel) GitHub CLI plus tard

Si tu installes [`gh`](https://cli.github.com/) et que tu fais `gh auth login`, tu pourras créer et pousser en une commande du type :  
`gh repo create gestion-stock --public --source=. --remote=origin --push`
#   g e s t i o n - d e - s t o c k  
 