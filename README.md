# TaskFlow

**TaskFlow** è una todo list completa realizzata con **Vite** e **JavaScript vanilla**, senza alcun framework frontend.  
L'obiettivo del progetto è offrire un'applicazione web moderna, rapida, accessibile e facile da mantenere, con funzionalità avanzate per organizzare attività, categorie, priorità e scadenze.

Repository: https://github.com/NicolaLanzi/todo-list

## Panoramica

TaskFlow permette di gestire le attività quotidiane in modo semplice ma completo:

- aggiungi attività con priorità, scadenza e categoria;
- modifica un'attività direttamente inline;
- completa o riattiva le attività con una checkbox animata;
- filtra tra tutte, attive e completate;
- cerca attività per titolo o categoria;
- ordina manualmente o per priorità, scadenza, data di creazione e alfabeto;
- riordina le attività con drag & drop o con la tastiera;
- cancella le attività completate o singole attività, con possibilità di annullare;
- segui l'avanzamento con una barra di progresso;
- usa tema chiaro o scuro, con salvataggio della preferenza;
- conserva automaticamente i dati nel browser tramite `localStorage`.

## Funzionalità principali

### Gestione delle attività

- aggiunta rapida tramite campo di input e tasto Invio;
- titolo fino a 160 caratteri;
- priorità: **Alta**, **Media**, **Bassa**;
- scadenza con date picker;
- categoria personalizzata, con suggerimenti basati sulle categorie già usate;
- modifica inline di titolo, priorità, scadenza e categoria;
- eliminazione singola;
- completamento/riattivazione;
- segna tutte come completate o tutte come da fare;
- cancellazione di tutte le attività completate;
- annullamento dell'ultima eliminazione o cancellazione delle completate tramite toast.

### Organizzazione e ricerca

- ricerca istantanea per titolo e categoria;
- filtri: **Tutte**, **Attive**, **Completate**;
- filtri per categoria tramite chip dedicate;
- ordinamento:
  - manuale;
  - più recenti;
  - priorità;
  - scadenza;
  - alfabetico;
- riordino drag & drop;
- riordino da tastiera tramite frecce su/giù sulla maniglia;
- indicazione visiva dello stato della scadenza:
  - **Oggi**;
  - **Domani**;
  - **Ieri**;
  - giorni della settimana per le scadenze vicine;
  - data breve per le scadenze lontane;
  - stato **in ritardo** per le attività scadute non completate.

### Interfaccia e usabilità

- tema chiaro/scuro, con rilevamento della preferenza del sistema;
- salvataggio della preferenza del tema;
- layout responsive per desktop, tablet e smartphone;
- focus visibile per navigazione da tastiera;
- etichette ARIA per controlli e stato;
- skip link per saltare direttamente al campo attività;
- scorciatoie da tastiera:
  - `N`: nuova attività;
  - `/`: ricerca;
  - `Esc`: annulla modifica;
  - frecce su/giù: riordina attività quando la maniglia ha il focus;
- toast per conferme, errori e annullamento;
- indicatore **Salvato in locale** nel footer;
- barra di progresso del completamento;
- stato vuoto con messaggi diversi per lista vuota o filtri senza risultati.

### Accessibilità

TaskFlow è pensato per essere usabile anche da tastiera:

- checkbox nascoste ma accessibili;
- pulsanti con `aria-label`;
- filtri con `aria-pressed`;
- barra di progresso con `role="progressbar"`;
- regioni live per statistiche e toast;
- focus ripristinato dopo aggiornamenti della lista;
- supporto a `prefers-reduced-motion`.

## Stack tecnologico

- **Vite 8**
- **JavaScript ES Modules**
- **HTML5 semantico**
- **CSS3** con variabili, media query e animazioni
- **localStorage** per la persistenza
- **GitHub CLI** per la pubblicazione del repository

Nessun framework frontend è stato utilizzato: l'app è costruita con JavaScript nativo.

## Requisiti per installare il progetto sul PC

Prima di avviare il progetto, assicurati di avere installato:

1. **Node.js** versione recente, consigliata **20.19+** o **22.12+** (Node 24 è supportato).
2. **npm**, incluso nell'installazione di Node.js.
3. Un browser moderno, ad esempio Chrome, Edge o Firefox.
4. Opzionale: **Git**, per clonare il repository.
5. Opzionale: **GitHub CLI**, solo se vuoi pubblicare o gestire il repository su GitHub.

Per verificare l'installazione di Node e npm, apri il terminale e digita:

```bash
node --version
npm --version
```

## Installazione dal repository GitHub

### 1. Clona il repository

```bash
git clone https://github.com/NicolaLanzi/todo-list.git
```

### 2. Entra nella cartella del progetto

```bash
cd todo-list
```

### 3. Installa le dipendenze

```bash
npm install
```

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Vite avvierà il server su:

```text
http://localhost:5173
```

Apri questo indirizzo nel browser.

## Installazione manuale della cartella già scaricata

Se hai già la cartella del progetto sul PC:

```bash
cd "C:\Users\Nicola\Desktop\todo list"
npm install
npm run dev
```

Poi apri:

```text
http://localhost:5173
```

## Script disponibili

### Avvio in sviluppo

```bash
npm run dev
```

Avvia il server Vite con hot reload.

### Build di produzione

```bash
npm run build
```

Genera la cartella `dist` con i file ottimizzati per la pubblicazione.

### Anteprima della build

```bash
npm run preview
```

Avvia un server locale per visualizzare la build di produzione.

## Porta fissa e persistenza locale

TaskFlow usa una **porta fissa (`5173`)** in sviluppo e in preview.  
Questo è importante perché `localStorage` è legato all'origine dell'applicazione, cioè al protocollo, all'host e alla porta. Se la porta cambiasse, il browser userebbe un archivio separato e sembrerebbe che i dati siano spariti.

I dati vengono salvati automaticamente nel browser sotto la chiave:

```text
taskflow.v1
```

Vengono salvati:

- attività;
- categorie;
- priorità;
- scadenze;
- stato completato;
- tema chiaro/scuro;
- ordinamento selezionato;
- impostazioni della vista.

Note importanti:

- i dati sono salvati **nel browser**, non in un file del progetto;
- i dati non vengono condivisi tra browser diversi;
- in modalità privata i dati possono non persistere dopo la chiusura del browser;
- cancellare i dati del sito può eliminare le attività;
- l'indicatore **Salvato in locale** nel footer conferma che il salvataggio è attivo.

## Struttura del progetto

```text
todo-list/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── app.js
    ├── store.js
    ├── utils.js
    ├── icons.js
    └── style.css
```

### Ruolo dei file

- `index.html`: struttura dell'interfaccia, shell dell'app e contenitori dinamici.
- `src/main.js`: punto di ingresso dell'applicazione.
- `src/app.js`: rendering, eventi UI, drag & drop, toast, tema e scorciatoie.
- `src/store.js`: stato applicativo, persistenza su `localStorage`, filtri, ordinamenti e operazioni CRUD.
- `src/utils.js`: utility per date italiane e formattazione delle scadenze.
- `src/icons.js`: icone SVG e metadati delle priorità.
- `src/style.css`: stile completo, temi chiaro/scuro, responsive e accessibilità.
- `public/favicon.svg`: icona dell'app.
- `vite.config.js`: configurazione della porta fissa.

## Architettura dell'applicazione

L'app è divisa in tre parti principali:

1. **Store** (`src/store.js`)  
   Gestisce lo stato delle attività e delle preferenze. Ogni modifica viene salvata su `localStorage` e notifica i componenti iscritti.

2. **UI** (`src/app.js`)  
   Costruisce il DOM, gestisce gli eventi, i filtri, la ricerca, l'ordinamento, il drag & drop e il toast di annullamento.

3. **Stile** (`src/style.css`)  
   Definisce il design system, le animazioni, i temi e il layout responsive.

Il flusso è semplice:

```text
Azione utente -> store -> salvataggio su localStorage -> render UI
```

## Build e pubblicazione

Per generare una versione ottimizzata:

```bash
npm run build
```

I file finali saranno nella cartella:

```text
dist/
```

Per testare la build localmente:

```bash
npm run preview
```

## Risoluzione problemi

### La porta 5173 è già in uso

Se un altro processo usa la porta, Vite non si avvierà.  
Puoi chiudere il processo precedente oppure liberare la porta.

Su Windows PowerShell:

```powershell
$conn = Get-NetTCPConnection -LocalPort 5173 -State Listen
if ($conn) { taskkill /PID $conn.OwningProcess /T /F }
```

Poi riavvia:

```bash
npm run dev
```

### Le attività non compaiono dopo aver riaperto il server

Controlla che:

- stai usando lo stesso browser;
- stai aprendo sempre `http://localhost:5173`;
- non stai usando la modalità privata;
- non hai cancellato i dati del sito;
- il localStorage contiene la chiave `taskflow.v1`.

### Il tema o i dati sembrano cambiati

Il tema e l'ordinamento vengono salvati insieme alle attività. Se usi un browser o una porta diversa, le preferenze possono essere diverse.

## Licenza

Questo progetto è stato creato per scopi didattici e personali.  
Puoi modificarlo e riutilizzarlo liberamente.
