# 7InTheWild-Backend

REST API and WebSocket server for the 7InTheWild mobile app.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v4
- **Datenbank**: MongoDB via Mongoose v6
- **Echtzeit**: Socket.IO v4
- **Push-Benachrichtigungen**: Expo Server SDK
- **Datei-Uploads**: Multer + Cloudinary
- **Authentifizierung**: bcryptjs, Google OAuth (google-auth-library), JSON Web Tokens

---

## Architektur

Der Server folgt einer klassischen MVC-Struktur:

```
index.js          Einstiegspunkt: Express-Setup, DB-Verbindung, Socket.IO
routes/           URL-Routing (8 Module)
controllers/      Geschäftslogik (6 Module)
models/           Mongoose-Datenbankmodelle
middlewares/      Request-Verarbeitung (Daten-Parser, Validierung)
cloud/            Cloudinary-Konfiguration
```

---

## API-Endpunkte

| Route           | Beschreibung                                                      |
|-----------------|-------------------------------------------------------------------|
| `/user`         | Registrierung, Login, Google OAuth, Profilverwaltung, Push-Token, Premium |
| `/profile`      | Profilbild-Upload, Favoriten, Profilsuche                         |
| `/chat`         | Nachrichten senden, Chat erstellen und suchen                     |
| `/survey`       | Umfragen erstellen, abstimmen, kommentieren, liken                |
| `/daily-survey` | Tägliche Umfragen                                                 |
| `/post`         | Blog-Posts (CRUD, Bild-Upload, Archiv, Filter, Suche)            |
| `/news`         | Neuigkeiten                                                       |
| `/settings`     | Nutzereinstellungen                                               |

---

## Authentifizierung

- **Klassisch**: Email/Passwort mit bcryptjs (12 Salt-Runden)
- **Google OAuth**: Bei erstem Login wird automatisch ein Account angelegt

---

## Echtzeit (Socket.IO)

Clients können Chatrooms betreten und Nachrichten in Echtzeit austauschen:

- `join-chat` – Chatroom betreten
- `send-msg-to-group` – Nachricht senden
- `msg-receive` – Nachricht empfangen

CORS ist auf die zugehörige Expo-App beschränkt.

---

## Datenbankmodelle

- **User**: Email, Benutzername, Passwort (gehasht), Profilbild, Chat-Einstellungen, Dark Mode, Notification-Präferenzen, Push-Token, Standort, Premium-Status
- **Chat**: Nachrichten-Array, Teilnehmer und Teilnehmer-IDs
- **Post**: Titel, Inhalt, Meta, Slug (unique), Tags, Thumbnail, Erstellungsdatum
- **Survey / DailySurvey / Favorit**: weitere Modelle für App-Inhalte

---

## Datei-Uploads

- Multer verarbeitet Multipart-Datei-Uploads (nur Bilder erlaubt)
- Cloudinary speichert Profilbilder und Post-Thumbnails
- Body-Limit: 50 MB

---

## Push-Benachrichtigungen

- Expo Push Notification SDK für mobile Benachrichtigungen
- Push-Token wird pro User gespeichert
- Benachrichtigungen werden in Batches gesendet
- Nutzer können Typen granular steuern: Direct, Kommentare, Blog, Daily Survey

---

## Konfiguration

Folgende Umgebungsvariablen werden benötigt (`.env`):

| Variable          | Beschreibung                    |
|-------------------|---------------------------------|
| `PORT`            | Server-Port (Standard: `5000`)  |
| `CONNECTION_URL`  | MongoDB-Verbindungs-URL         |
| `CLOUD_NAME`      | Cloudinary Cloud Name           |
| `CLOUD_API_KEY`   | Cloudinary API Key              |
| `CLOUD_API_SECRET`| Cloudinary API Secret           |

---

## Start

```bash
npm start
```
