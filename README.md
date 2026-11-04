# Segretario

La memoria condivisa di Ema per tutte le sue chat Claude: app Claude, Claude Code, task schedulati.
Un connettore MCP piccolo (Python, FastMCP, Streamable HTTP) in un container sulla VM di Postino, dietro
il Caddy di Postino, su `https://postino.emazamboni.com/segretario/<segreto>/mcp`.

Postino resta il client email: questo servizio non legge né manda email o messaggi. Qui ci sono solo
file di testo e lo stato delle sessioni. Il codice è pubblico; i dati (memoria, segreto) vivono solo nel
volume Docker della VM e non entrano mai in questo repo.

## Cosa contiene (volume `segretario_data`, cartella `/data/memoria`, versionata con git)

| File | Cosa |
|---|---|
| `regole.md` | le regole di comportamento di Ema, una per riga. Entrano **solo** con la sua approvazione |
| `persone.md` | chi è chi (relazione, dove, cosa fa). Niente dati sensibili. Parte vuoto: si riempie con `nota_proponi` |
| `progetti.json`, `progetti.md` | i progetti: nome, alias, tipo, stato, dove siamo, prossimo passo, materiali (link). `progetti.md` è generato |
| `progetti/<progetto>/*.md` | i documenti salvati di ogni progetto (script, scalette, note), versionati |
| `diario/AAAA-MM-GG.md` | una riga per ogni cosa decisa o fatta, da qualunque chat |
| `sessioni.json` | dove è arrivata ogni sessione Claude, cosa aspetta da Ema |
| `proposte.json`, `regole_in_coda.md` | regole e note proposte da Claude, in attesa di Ema |
| `richieste.json`, `richieste.md` | le richieste di Ema per migliorare il Segretario, con l'esito |

Le istruzioni che il connettore manda a Claude a ogni collegamento contengono la data e l'ora di
oggi (Europe/Rome), tutte le regole e il numero di proposte, richieste e sessioni che aspettano Ema.
Così ogni chat parte già con le regole, senza tool call e senza dipendere dalla memoria di claude.ai.

## Tool

| Tool | Fa |
|---|---|
| `memoria_leggi(nome, giorno, ultimi_giorni)` | legge regole, persone, progetti, diario (oggi, ieri, un giorno, ultimi N), coda o richieste |
| `memoria_cerca(testo)` | cerca una parola in tutta la memoria, ritorna file e riga |
| `diario_scrivi(testo, origine, progetto)` | aggiunge una riga al diario di oggi, con il progetto a cui si riferisce |
| `regola_proponi(testo, motivo)` | propone una regola nuova (in coda, non attiva) |
| `nota_proponi(file, testo, motivo)` | propone una riga per persone (in coda) |
| `proposte_lista()` | le proposte in attesa |
| `proposta_decidi(id, approva)` | applica la decisione di Ema: scrive nel file o scarta. Solo su sua richiesta esplicita |
| `sessione_segna(nome, dove_sono, prossimo_passo, domanda_per_ema, stato, progetto)` | dove è arrivata una sessione (in corso, aspetta Ema, finita) |
| `sessioni_lista(solo_aperte)` | tutte le sessioni, prima quelle che aspettano Ema |
| `sessione_chiudi(nome)` | segna una sessione come finita |
| `progetto_segna(nome, dove_sono, prossimo_passo, stato, tipo, descrizione, alias)` | crea o aggiorna un progetto (video, app, lavoro, vita); gli alias servono a ritrovarlo con qualunque nome |
| `progetto_leggi(nome)` | tutto il contesto di un progetto trovato per nome o alias: stato, materiali, documenti, righe del diario, sessioni |
| `progetti_lista(solo_aperti)` | i progetti, prima quelli che aspettano Ema |
| `materiale_aggiungi(progetto, titolo, link, nota)` | un link (Google Doc, Drive, file, pagina, repo) attaccato al progetto |
| `documento_salva(progetto, nome, testo)` | salva il testo di un documento (es. lo script a questo punto); ogni salvataggio è una versione git |
| `documento_leggi(progetto, nome, versioni_indietro)` | rilegge un documento salvato, anche una versione precedente |
| `richiesta_scrivi(testo, contesto)` | Ema chiede un cambiamento al Segretario: lo costruisce la sessione Claude Code "BUILDING SEGRETARIO" |
| `richiesta_chiudi(id, esito, stato)` | la sessione che ha costruito segna cosa è cambiato (fatta, scartata, rimandata) |
| `stato()` | numeri e ultimo commit, serve ai test e al cruscotto |

Nessun tool cancella o riscrive. Ogni scrittura è un commit git nella cartella `memoria`.

## Come gira sulla VM

- `docker-compose.yml` di questo repo: un servizio, `segretario`, agganciato alla rete del Caddy di Postino
  (`postino_default`), nessuna porta pubblicata, filesystem in sola lettura, `cap_drop ALL`, utente 1000,
  healthcheck su `/health`.
- Nel repo Various, `postino/Caddyfile` ha `handle_path /segretario/*` verso `segretario:8766`.
- Prima installazione: la fa `keep-mcp/ops/run.sh` di Various (ops v4) clonando questo repo in `~/segretario`
  e lanciando `scripts/install.sh`, che trova la rete di Caddy, scrive `.env`, avvia il container e installa
  il cron. Si può rilanciare a mano: `bash ~/segretario/scripts/install.sh`.
- Aggiornamenti: push su `main` di questo repo; `scripts/auto-update.sh` (cron ogni 10 minuti) ricostruisce
  il container entro 10-20 minuti. Indipendente dagli aggiornamenti di Postino.
- Il segreto viene generato al primo avvio e salvato in `/data/secret`. L'URL completo del connettore:

      cd ~/segretario && sudo docker compose exec segretario cat /data/connector-url

  Va incollato una volta su claude.ai > Impostazioni > Connettori > Aggiungi connettore personalizzato,
  nome "Segretario", nessun accesso (il segreto è nell'URL). Da quel momento vale su telefono, PC,
  Claude Code (`/mcp` nella sessione) e task schedulati.
- Rotazione del segreto: `docker compose exec segretario rm /data/secret`, `docker compose restart`,
  nuovo URL, connettore da registrare di nuovo.
- Backup: la memoria è un repo git nel volume. Con `MEMORIA_GIT_REMOTE` in `.env` (URL con deploy key o token)
  ogni commit viene anche spinto su un remoto privato. Finché non è impostato, il volume è l'unica copia:
  `docker run --rm -v segretario_segretario_data:/data -v ~/segretario-backup:/out alpine tar czf /out/memoria.tgz /data/memoria`.

## Variabili (`.env`, tutte opzionali)

`CADDY_NETWORK` (postino_default), `SEGRETARIO_PUBLIC_HOST` (postino.emazamboni.com), `MEMORIA_GIT_REMOTE`.
Nel container: `SEGRETARIO_PUBLIC_PREFIX` (/segretario), `SEGRETARIO_EXTRA_HOSTS` (per i test),
`SEGRETARIO_SECRET` (per imporre un segreto), `SEGRETARIO_TZ` (Europe/Rome), `PORT` (8766), `BIND`.

## Prova in locale

    python -m venv venv && venv/bin/pip install -r requirements.txt
    python tests/smoke.py

Avvia il server su una cartella temporanea e prova ogni tool con il client MCP ufficiale.

## Cosa non fa ancora

Non manda messaggi a Ema (Telegram, fase successiva) e non legge Keep, email o calendario: quelli
restano nei loro connettori. Note di progetto: `Desktop\Claude Things\26_11_03 Segretario`.
