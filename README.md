# TaskFlow

Una todo list completa realizzata con **Vite** e **JavaScript vanilla**, senza framework.

## Funzionalità

- ✅ Aggiunta, modifica inline ed eliminazione delle attività
- ✔️ Completamento con checkbox animata e barra di avanzamento
- 🔍 Ricerca istantanea per titolo e categoria
- 🎯 Filtri: tutte, attive, completate
- 🏷️ Categorie personalizzate con filtri dedicati
- 🚩 Priorità (alta, media, bassa)
- 📅 Scadenze con indicazione di oggi, domani e attività in ritardo
- ↕️ Riordino con drag & drop o con le frecce sulla maniglia (accessibile da tastiera)
- 🔀 Ordinamento: manuale, più recenti, priorità, scadenza, alfabetico
- 🌗 Tema chiaro/scuro con preferenza salvata (segue il sistema di default)
- 💾 Persistenza su `localStorage`
- ↩️ Annulla eliminazione e cancellazione delle completate tramite toast
- ⌨️ Scorciatoie: `N` per una nuova attività, `/` per cercare, `Esc` per annullare la modifica
- 📱 Layout responsive e accessibile (focus visibile, etichette ARIA, skip link)
- 🔄 Sincronizzazione tra schede aperte

## Avvio

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato da Vite (di solito `http://localhost:5173`).

## Build di produzione

```bash
npm run build
npm run preview
```

## Salvataggio locale

Le attività, le categorie, le priorità, le scadenze e le preferenze (tema e ordinamento) vengono salvate **automaticamente nel browser** tramite `localStorage`, sotto la chiave `taskflow.v1`. Non serve alcun database: chiudendo il server e riaprendolo, i dati restano disponibili.

Il server usa una **porta fissa (`5173`)** sia in sviluppo sia in preview, perché `localStorage` è legato all'origine: cambiando porta il browser userebbe un archivio separato.

> Nota: i dati sono legati a questo browser e a questo indirizzo. Non vengono salvati nel progetto su disco e non sono condivisi con altri browser. Per non perderli, evita di cancellare i dati del sito o di usare la modalità privata. L'indicatore "Salvato in locale" nel footer conferma che la persistenza è attiva.

## Struttura del progetto

```
index.html          Struttura dell'interfaccia
src/main.js         Entry point
src/app.js          Rendering ed eventi UI
src/store.js        Stato, persistenza, filtri e ordinamenti
src/utils.js        Utility per le date italiane
src/icons.js        Icone SVG e metadati delle priorità
src/style.css       Stile completo con temi chiaro/scuro
public/favicon.svg  Icona dell'app
vite.config.js      Porta fissa per mantenere stabile il localStorage
```

I dati vengono salvati nel browser sotto la chiave `taskflow.v1`.
