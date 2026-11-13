/* La barra "chat recenti" sopra claude.ai (13/11/2026, richiesta di Ema: "mi perdo tra troppe chat").
   6 schede con le chat più recenti (claude.ai e Claude Code) e i progetti, dal Segretario; la freccia ne mostra 4 in
   più; "History" le mostra tutte, dalla più recente. Il puntino arancione = aspetta Ema. Tocchi una scheda: cosa è
   stato fatto, il prossimo passo, cosa chiede Claude e il link per aprirla.
   In più dice al Segretario quale chat di claude.ai Ema ha aperto (SOLO titolo e link, mai il contenuto).
   Parla con hub.emazamboni.com attraverso il service worker (background.js), che ha i cookie del codice Telegram. */
(() => {
  if (window.top !== window || document.getElementById("seg-schede")) return;
  const HUB = "https://hub.emazamboni.com";
  const TABS = 6, MORE = 4;
  const st = { items: [], err: "", open: "", more: 0, hidden: false };
  try { st.hidden = localStorage.getItem("seg-schede-nascosta") === "1"; } catch (_) {}

  const chiedi = (msg) => new Promise((ok) => {
    try { chrome.runtime.sendMessage(msg, (r) => ok(r || { errore: chrome.runtime.lastError ? chrome.runtime.lastError.message : "nessuna risposta" })); }
    catch (err) { ok({ errore: String(err && err.message || err) }); }
  });

  const chiave = (x) => x.link || `${x.tipo}:${x.titolo}`;
  const corta = (v, n) => (v.length > n ? v.slice(0, n - 1) + "…" : v);
  const tipo = (x) => (x.tipo === "claude code" ? "Code" : x.tipo === "progetto" ? "Project" : "Chat");
  const qui = () => location.origin + location.pathname;
  function quando(v) {
    if (!v) return "";
    const roma = (d) => d.toLocaleString("sv-SE", { timeZone: "Europe/Rome", hour12: false }).slice(0, 10);
    const oggi = roma(new Date()), ieri = roma(new Date(Date.now() - 864e5));
    if (v.startsWith(oggi)) return v.slice(11, 16);
    if (v.startsWith(ieri)) return "yesterday";
    return `${v.slice(8, 10)}/${v.slice(5, 7)}`;
  }

  const root = document.createElement("div");
  root.id = "seg-schede";
  const el = (tag, cls, testo) => { const n = document.createElement(tag); if (cls) n.className = cls; if (testo != null) n.textContent = testo; return n; };

  function bottone(testo, cls, fn, titolo) {
    const b = el("button", cls, testo);
    b.type = "button";
    if (titolo) b.title = titolo;
    b.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); fn(); disegna(); });
    return b;
  }

  function scheda(x) {
    const b = bottone("", (chiave(x) === st.open ? "sel " : "") + (x.link && x.link === qui() ? "qui" : ""),
      () => { st.open = st.open === chiave(x) ? "" : chiave(x); }, `${tipo(x)}${x.progetto && x.progetto !== x.titolo ? " · " + x.progetto : ""}`);
    if (x.aspetta) b.appendChild(el("span", "punto"));
    b.appendChild(document.createTextNode(corta(x.titolo || "(untitled)", 24)));
    return b;
  }

  function disegna() {
    root.replaceChildren();
    const riga = el("div", "riga");
    const attese = st.items.filter((x) => x.aspetta).length;
    if (st.hidden) {
      const b = bottone("", "quiet", () => { st.hidden = false; try { localStorage.setItem("seg-schede-nascosta", "0"); } catch (_) {} });
      if (attese) b.appendChild(el("span", "punto"));
      b.appendChild(document.createTextNode(`Recent chats${attese ? ` · ${attese} waiting` : ""}`));
      riga.appendChild(b);
      root.appendChild(riga);
      return;
    }
    if (st.err && !st.items.length) {
      const a = el("span", "avviso");
      if (st.err === "login") {
        a.append("Recent chats: open ");
        const l = el("a", "", "hub.emazamboni.com"); l.href = HUB; l.target = "_blank"; l.rel = "noopener";
        a.append(l, " once and type the Telegram code.");
      } else a.textContent = `Recent chats: can't reach the Segretario (${st.err})`;
      riga.append(a, bottone("Hide", "quiet", () => nascondi()));
      root.appendChild(riga);
      return;
    }
    if (!st.items.length) { riga.appendChild(el("span", "avviso", "Recent chats: loading…")); root.appendChild(riga); return; }
    st.items.slice(0, TABS).forEach((x) => riga.appendChild(scheda(x)));
    if (st.more === 1) st.items.slice(TABS, TABS + MORE).forEach((x) => riga.appendChild(scheda(x)));
    if (st.items.length > TABS) riga.appendChild(bottone(st.more === 1 ? "‹" : "›", "freccia", () => { st.more = st.more === 1 ? 0 : 1; }, st.more === 1 ? "Fewer" : "4 more"));
    riga.appendChild(bottone(st.more === 2 ? "Close history" : "History", "quiet", () => { st.more = st.more === 2 ? 0 : 2; }));
    riga.appendChild(bottone("Hide", "quiet", () => nascondi()));
    root.appendChild(riga);

    if (st.more === 2) {
      const s = el("div", "storia");
      st.items.forEach((x) => {
        const b = bottone("", "", () => { st.open = chiave(x); st.more = 0; });
        const dot = el("span", x.aspetta ? "punto" : ""); if (!x.aspetta) dot.style.width = "13px";
        b.append(dot, el("span", "q", quando(x.quando)), el("span", "t", x.titolo || "(untitled)"), el("span", "k", tipo(x) + (x.progetto && x.progetto !== x.titolo ? " · " + x.progetto : "")));
        s.appendChild(b);
      });
      root.appendChild(s);
    }

    const sel = st.items.find((x) => chiave(x) === st.open);
    if (sel) {
      const c = el("div", "scheda");
      const t = el("div", "titolo", sel.titolo || "(untitled)");
      const stato = sel.aspetta ? "waiting for you" : sel.in_corso ? "working now" : sel.stato || "opened";
      t.appendChild(el("span", "meta", `${tipo(sel)}${sel.progetto && sel.progetto !== sel.titolo ? " · " + sel.progetto : ""} · ${stato}${sel.quando ? " · " + quando(sel.quando) : ""}`));
      c.appendChild(t);
      if (sel.dove_sono) c.appendChild(el("p", "", "Last: " + corta(sel.dove_sono, 300)));
      if (sel.prossimo) c.appendChild(el("p", "", "Next: " + corta(sel.prossimo, 300)));
      if (sel.domanda) c.appendChild(el("p", "domanda", "Claude asks you: " + corta(sel.domanda, 240)));
      if (!sel.dove_sono && !sel.prossimo) c.appendChild(el("p", "meta", "This chat hasn't written its progress to the Segretario yet."));
      if (sel.link) {
        const a = el("a", "", sel.tipo === "claude code" ? "Open in the Claude app" : sel.link === qui() ? "You are here" : "Open this chat");
        a.href = sel.link;
        c.appendChild(a);
      }
      root.appendChild(c);
    }
  }

  function nascondi() {
    st.hidden = true; st.open = ""; st.more = 0;
    try { localStorage.setItem("seg-schede-nascosta", "1"); } catch (_) {}
  }

  async function aggiorna() {
    const r = await chiedi({ tipo: "pannelli", url: `${HUB}/chat-recenti.json?quante=40` });
    if (r.dati && Array.isArray(r.dati.chat)) { st.items = r.dati.chat; st.err = ""; }
    else st.err = /401/.test(r.errore || "") ? "login" : (r.errore || "error").slice(0, 80);
    disegna();
  }

  // la chat aperta adesso -> il Segretario (titolo e link), al massimo una volta ogni 5 minuti per chat
  const segnate = new Map();
  async function segnaQui() {
    const m = location.pathname.match(/^\/(chat|project)\/([A-Za-z0-9-]{8,80})$/);
    if (!m) return;
    const titolo = document.title.replace(/\s*[-|–]\s*Claude\s*$/i, "").trim();
    if (!titolo || /^claude$/i.test(titolo) || /^new chat$/i.test(titolo)) return;  // il titolo arriva dopo
    const link = qui();
    const prima = segnate.get(link);
    if (prima && prima.titolo === titolo && Date.now() - prima.t < 300000) return;
    segnate.set(link, { titolo, t: Date.now() });
    const r = await chiedi({ tipo: "chat_aperta", titolo, link });
    if (r && r.ok) aggiorna();
  }

  document.documentElement.appendChild(root);
  disegna();
  aggiorna();
  setInterval(aggiorna, 60000);
  setInterval(segnaQui, 3000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) aggiorna(); });
  document.addEventListener("click", (ev) => { if (!root.contains(ev.target) && (st.open || st.more === 2)) { st.open = ""; if (st.more === 2) st.more = 0; disegna(); } });
})();
