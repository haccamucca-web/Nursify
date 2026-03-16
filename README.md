# Nursify

Nursify è un'app mobile progettata per gli studenti di infermieristica. Permette di caricare PDF universitari e ottenere riassunti clinici dettagliati e accurati, sfruttando l'Intelligenza Artificiale Generativa (Google Gemini).

L'architettura è divisa in due parti:
1. **Frontend**: Applicazione Mobile creata con React Native e Expo.
2. **Backend**: Server leggero Node.js/Express per estrarre il testo dal PDF e comunicare con l'API di Gemini.

---

## 🚀 Come iniziare

### 1. Configurazione del Backend

Il backend gestisce l'elaborazione dei file e le chiamate API, prevenendo sovraccarichi o crash sul dispositivo mobile.

1. Apri un terminale e naviga nella cartella del backend:
   ```bash
   cd backend
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Crea un file `.env` partendo dall'esempio:
   ```bash
   cp .env.example .env
   ```
   **NOTA IMPORTANTE:** Apri il file `.env` appena creato e inserisci la tua API Key di Google Gemini.
4. Avvia il server backend:
   ```bash
   node index.js
   ```
   Il server sarà in ascolto su `http://localhost:3000`.

### 2. Configurazione del Frontend (Mobile App)

Il frontend utilizza Expo Go per permetterti di testare facilmente l'app su dispositivi fisici o emulatori.

1. Apri un **nuovo** terminale e naviga nella cartella dell'app:
   ```bash
   cd nursify-app
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Avvia il server di sviluppo Expo:
   ```bash
   npx expo start
   ```
   *Nota: se stai testando su un dispositivo fisico collegato alla stessa rete del computer, assicurati di usare lo stesso IP locale e che il dispositivo possa raggiungere la porta 3000 (il backend).*
   *Se usi un emulatore Android, nel file `app/index.tsx`, potresti dover cambiare `http://localhost:3000/api/summarize` con `http://10.0.2.2:3000/api/summarize` in quanto `localhost` si riferisce all'emulatore stesso.*

#### 📱 Testare l'app con Expo Go

- **iOS / Android (Dispositivo Fisico):**
  1. Scarica l'app "Expo Go" dall'App Store o Google Play Store.
  2. Apri la fotocamera del tuo telefono (o l'app Expo Go su Android) e scannerizza il QR code apparso nel terminale (o nel browser premendo "w" per l'Expo dev tools se dispo).
- **Simulatore iOS:**
  1. Se hai un Mac con Xcode installato, premi `i` nel terminale di Expo per avviare il simulatore iOS.
- **Emulatore Android:**
  1. Se hai Android Studio installato con un emulatore configurato, premi `a` nel terminale di Expo per avviare l'emulatore Android.

---

## 🛠 Tech Stack

- **Frontend:** React Native, Expo, Expo Router
- **Styling:** StyleSheet Nativo & NativeWind (Tailwind CSS per configurazioni veloci ed espansione futura)
- **Gestione PDF (Mobile):** `expo-document-picker`
- **Backend:** Node.js, Express, `multer` (Upload File in memoria), `pdf-parse` (Estrazione testo da PDF)
- **Intelligenza Artificiale:** `@google/generative-ai` (Gemini 1.5 Flash)

---

## 🎨 Note di Design (UI/UX)
- Il tema utilizza colori rassicuranti e professionali (Teal e Navy Blue).
- Lo schermo "Risultato" include pulsanti (touch target ampi) per facilitare il Copia & Incolla o il salvataggio come file di testo.
- Durante il caricamento del PDF, i feedback dinamici rassicurano l'utente sull'elaborazione in corso.
