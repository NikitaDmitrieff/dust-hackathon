# 🎤 Nikita Voice Assistant Integration

Cette intégration vous permet de créer des formulaires en utilisant la reconnaissance vocale avec OpenAI Realtime API.

## 🎯 Comment ça fonctionne

1. **Interaction vocale** : L'utilisateur clique sur "Talk to Assistant" dans l'interface React
2. **Interface vocale** : Une nouvelle fenêtre s'ouvre avec l'interface de conversation vocale
3. **Conversation** : L'utilisateur parle avec l'assistant OpenAI pour définir son formulaire
4. **Analyse** : Le transcript est analysé par ChatGPT-4o pour extraire l'intention
5. **Génération** : Un JSON de formulaire est généré à partir de l'analyse
6. **Intégration** : Le formulaire est automatiquement créé dans l'interface React

## 🚀 Configuration et démarrage

### 1. Configuration de l'environnement

```bash
cd src/Nikita/backend
python setup_and_start.py
```

Le script vérifiera automatiquement :
- Les dépendances Python
- Le fichier `.env` avec votre clé OpenAI
- Le démarrage du serveur

### 2. Configuration manuelle (alternative)

Si vous préférez configurer manuellement :

```bash
# Créer le fichier .env
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "PORT=3001" >> .env

# Installer les dépendances
pip install fastapi uvicorn aiohttp aiofiles python-dotenv websockets

# Démarrer le serveur
python server.py
```

### 3. Vérification

Le serveur doit être accessible sur :
- WebSocket: `ws://localhost:3001/ws`
- API: `http://localhost:3001/api/`
- Health check: `http://localhost:3001/health`

## 📋 Utilisation

### Dans l'interface React :

1. Cliquez sur **"Talk to Assistant"** dans le FormBuilder
2. Une nouvelle fenêtre s'ouvre avec l'interface vocale
3. Cliquez sur **"Connect"** dans la fenêtre vocale
4. Parlez avec l'assistant pour décrire votre formulaire :
   - "Je veux créer un formulaire de satisfaction client"
   - "Il me faut des questions sur la qualité du service"
   - "Ajoute une question pour l'email du client"
5. Cliquez sur **"Disconnect"** quand vous avez fini
6. Fermez la fenêtre vocale
7. Le formulaire sera automatiquement généré dans l'interface React

### Types de questions générées :

L'assistant peut créer différents types de questions :
- **text** : Champs texte simple
- **textarea** : Champs texte multi-lignes
- **email** : Champs email avec validation
- **radio** : Boutons radio (choix unique)
- **checkbox** : Cases à cocher
- **select** : Listes déroulantes
- **number** : Champs numériques
- **date/time** : Sélecteurs de date/heure
- **url/tel** : URLs et numéros de téléphone

## 🛠️ Architecture technique

```
React App (Frontend)
    ↓
assistantService.ts 
    ↓ (ouvre nouvelle fenêtre)
example.html (Interface vocale)
    ↓ (WebSocket)
server.py (Backend Python)
    ↓ (OpenAI Realtime API)
conversation_logger.py
    ↓ (ChatGPT-4o analyse)
form_generator.py
    ↓ (API /generate-form)
assistantService.ts (mise à jour formulaire)
```

## 📁 Structure des fichiers

```
src/Nikita/
├── README.md                    # Ce fichier
├── assistantService.ts          # Service React intégré
├── backend/
│   ├── setup_and_start.py      # Script de configuration et démarrage
│   ├── server.py               # Serveur FastAPI principal
│   ├── api_routes.py           # Routes API
│   ├── form_generator.py       # Génération de formulaires
│   ├── websocket_handler.py    # Gestion WebSocket
│   ├── conversation_logger.py  # Enregistrement des conversations
│   ├── chatgpt_parser.py      # Analyse par ChatGPT-4o
│   ├── prompts.py             # Prompts pour l'IA
│   ├── discussions/           # Transcripts sauvegardés
│   └── analysis/             # Analyses des conversations
└── frontend/
    ├── example.html          # Interface vocale
    ├── openai-realtime-sdk.js # SDK OpenAI
    └── package.json          # Dépendances frontend
```

## 🔧 Dépannage

### Erreur "Could not open voice assistant window"
- Vérifiez que les popups sont autorisés dans votre navigateur
- Essayez de relancer l'application React

### Erreur "OPENAI_API_KEY not found"
- Vérifiez que votre clé OpenAI est configurée dans `.env`
- Redémarrez le serveur Python après modification

### Erreur "No conversation analysis found"
- Assurez-vous d'avoir eu une conversation dans l'interface vocale
- Vérifiez que des fichiers sont créés dans `backend/analysis/`

### Interface vocale ne se connecte pas
- Vérifiez que le serveur Python tourne sur le port 3001
- Vérifiez les logs du serveur pour les erreurs

## 🔄 Workflow de développement

Pour tester l'intégration complète :

1. **Démarrer le backend** : `cd src/Nikita/backend && python setup_and_start.py`
2. **Démarrer l'app React** : `npm run dev` (depuis la racine)
3. **Tester** : Aller dans FormBuilder → "Talk to Assistant"
4. **Déboguer** : Vérifier les logs dans les deux consoles

## 📚 API Endpoints

- `GET /health` - Vérification de santé du serveur
- `POST /api/session` - Créer une session OpenAI
- `GET /api/session/config` - Configuration de session
- `GET /api/generate-form` - Générer un formulaire depuis la dernière conversation
- `WebSocket /ws` - Interface temps réel avec OpenAI

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :
1. Modifier `prompts.py` pour de nouveaux types de prompts
2. Étendre `form_generator.py` pour de nouveaux types de questions
3. Mettre à jour `assistantService.ts` pour l'intégration React
