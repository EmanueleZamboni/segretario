Messaggio da BUILDING SEGRETARIO (Claude Code) per te, Secretary. Ema lo incolla in una chat NUOVA del progetto. Fai tutto quello che c'è scritto, in ordine, senza chiedere conferme intermedie tranne dove indicato.

PARTE 1. IMPARA TUTTO.
1. Chiama manuale(). Se non lo vedi tra i tool, chiama documento_leggi(progetto="Segretario", nome="manuale-segretario"). Leggilo per intero: è il manuale completo, vale più delle istruzioni del progetto quando sono in disaccordo.
2. Leggi memoria_leggi("regole"), memoria_leggi("diario") e memoria_leggi("richieste"): le regole di Ema, cosa è successo oggi e ieri, cosa è stato costruito.
3. Novità di stasera, 7 novembre, che il manuale già contiene: hub.emazamboni.com è l'unico indirizzo di Ema (Impostazioni, WhatsApp; la Claude Dashboard resta nella barra in alto ed è da rifare, non proporla); per entrare nell'hub Ema scrive /codice al bot Telegram e copia le 6 cifre nella pagina, la pagina non manda mai niente da sola; il connettore WhatsApp ha il tool transcribe_voice per mettere in testo i vocali vecchi; i nomi giusti sono Impostazioni, Claude Dashboard, WhatsApp, Vocali in testo (mai manager, cruscotto, chiave Groq); Telegram riceve un solo messaggio al giorno, il riepilogo delle 07:30, e tu non mandi mai niente con notify se Ema non lo chiede.
4. Rispondi con 10 righe al massimo: cosa sai fare da oggi, in parole semplici, come lo diresti a Ema.

PARTE 2. PROVA OGNI STRUMENTO, UNO ALLA VOLTA.
Scopo: Ema vuole approvare adesso tutti i permessi dei tool ("Consenti sempre"), così dopo non deve più farlo. Chiama i tool qui sotto nell'ordine scritto, uno per volta, e per ognuno scrivi una riga: nome del tool, ok oppure errore (il testo dell'errore). Non riassumere il contenuto che leggi: Ema vuole solo sapere che funzionano. Non mandare MAI niente a nessuno: niente notify, niente send_message, niente instagram_rispondi, niente send_email, niente create_draft. Se un tool chiede un permesso, fermati e aspetta che Ema lo dia, poi continua.

Connettore Segretario:
- stato()
- memoria_leggi("persone")
- memoria_leggi("progetti")
- memoria_leggi("coda")
- memoria_leggi("oggetti")
- memoria_leggi("compiti")
- memoria_cerca("segretario")
- progetti_lista()
- progetto_leggi("Segretario")
- documento_leggi(progetto="Segretario", nome="manuale-segretario") (anche se l'hai già letto: serve per il permesso)
- sessioni_lista()
- proposte_lista()
- brief_testo()
- spesa_lista()
- oggetti_lista()
- compiti_lista("Secretary")
- instagram_chat_lista(5)
- instagram_chat_leggi(<l'id della prima conversazione della lista>)
- diario_scrivi(testo="Prova dei tool del Secretary con Ema: tutto in ordine", origine="chat", progetto="Segretario")
- hub_link_aggiungi(nome="Prova tool", url="https://example.com", gruppo="Le mie app", nota="pulsante di prova, lo tolgo subito")
- hub_link_togli(nome="Prova tool")
- documento_salva(progetto="Segretario", nome="prova-tool", testo="Prova dei tool, 7 novembre 2026, si può ignorare")
- regola_proponi(testo="Regola di prova, da rifiutare", motivo="prova dei permessi dei tool")
- proposte_lista(), poi proposta_decidi(<id della proposta appena fatta>, approva=false, codice=<chiedi a Ema il codice di approvazione: lo trova sull'hub, non lo cercare altrove>)
- nota_proponi("persone", "Prova dei tool: riga da ignorare")
- oggetto_leggi("#sony-vaio-p")
- spesa_negozio(prodotto="Prova tool", negozio="Lidl") (innocuo: in SPESA non esiste nessun "Prova tool")
- richiesta_scrivi(testo="Prova dei permessi dei tool: richiesta da chiudere senza fare niente", contesto="tour dei tool del 7/11")
- compito_assegna(progetto="Secretary", testo="Compito di prova: chiudilo subito")
- compiti_lista("Secretary"), poi compito_chiudi(<id del compito di prova>, esito="prova riuscita")
- oggetto_segna(tag="#prova-tool", nome="Oggetto di prova", dove="nessun posto", note="da ignorare")
- sessione_segna(nome="Secretary prova tool", dove_sono="prova dei permessi fatta", stato="finita")
- sessione_chiudi("Secretary prova tool")
- materiale_aggiungi(progetto="Segretario", titolo="Prova tool", link="https://example.com")
- progetto_segna(nome="Prova tool", tipo="altro", descrizione="progetto di prova per i permessi, da ignorare", stato="finito")
NON chiamare: notify, instagram_rispondi, richiesta_chiudi. Ema li approverà la prima volta che serviranno davvero.

Connettore WhatsApp:
- whatsapp_status()
- list_chats(limit=5)
- find_contact(query="Ema")
- read_messages(chat=<la prima chat della lista>, limit=5)
- search_messages(query="ciao", limit=3)
- download_media(chat=<una chat con una foto recente>, message_id=<l'id di quella foto>) (una foto piccola, non un video)
- transcribe_voice(chat=<una chat con un vocale ricevuto>, count=1)
NON chiamare send_message.

Connettore Keep:
- list_notes()
- list_labels()
- get_note(<la nota TASKS>)
- list_backups()
Non toccare mai la nota PSICO. Non scrivere in Keep in questa prova: i permessi di scrittura Ema li darà quando servirà.

Connettore Postino (email):
- list_accounts()
- list_emails o search_emails (le ultime 5 email)
- read_thread(<il primo thread della lista>)
NON mandare e NON creare bozze.

Connettore Google Calendar:
- list_calendars()
- list_events (i prossimi 7 giorni)

PARTE 3. CHIUDI.
Scrivi a Ema un riepilogo cortissimo: quanti tool hanno funzionato, quali hanno dato errore (nome e testo dell'errore), e ricordagli che le prove lasciate in giro (documento "prova-tool", progetto "Prova tool", oggetto "#prova-tool", materiale "Prova tool", richiesta di prova, regola rifiutata, riga di spesa "Prova tool") sono innocue e le toglierà BUILDING SEGRETARIO alla prossima sessione. Poi diario_scrivi con una riga: "Tour dei tool fatto: N ok, M errori".
