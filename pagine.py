"""Il sistema di design del Segretario e le sue pagine (hub, Impostazioni, Claude Dashboard, codice).

Un solo linguaggio per tutto quello che il Segretario mostra: superficie grigio caldo "da tastiera VAIO", inchiostro
grafite, un accento indaco, pulsanti che sembrano tasti (rialzati, si abbassano quando li premi), icone vere delle app
di Ema. Niente risorse esterne: la CSP permette solo CSS inline e immagini data:, quindi tutto sta qui dentro.
Le pagine funzionano sia all'indirizzo segreto sia dietro hub.emazamboni.com (link relativi tra le pagine).
"""

from __future__ import annotations

import html

from icone import APP_ICONS

TOKENS_CSS = """
:root{color-scheme:light dark;
 --bg:#ECEBE6;--surface:#F8F7F3;--surface-2:#FFFFFF;--edge:#CFCEC6;--line:#DDDCD5;
 --ink:#16161A;--muted:#6B6B72;--accent:#4B4EDB;--accent-ink:#FFFFFF;--accent-soft:#E3E3FA;
 --ok:#2E9E5B;--warn:#D9822B;--bad:#D14343;--shadow:0 1px 0 rgba(255,255,255,.7) inset,0 3px 0 var(--edge);
 --radius:16px;--radius-s:10px}
@media(prefers-color-scheme:dark){:root{
 --bg:#141416;--surface:#1E1E22;--surface-2:#26262B;--edge:#0C0C0E;--line:#2E2E34;
 --ink:#F1F0EC;--muted:#9A9AA2;--accent:#8D8FFF;--accent-ink:#101218;--accent-soft:#2A2B4A;
 --shadow:0 1px 0 rgba(255,255,255,.06) inset,0 3px 0 var(--edge)}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;padding:0 16px 48px}
main{max-width:720px;margin:0 auto}
a{color:var(--accent)}
h1{font-size:26px;line-height:1.15;letter-spacing:-.02em;font-weight:800;margin:0 0 4px}
h2{font-size:13px;font-weight:600;color:var(--muted);margin:26px 0 10px;letter-spacing:.01em}
p{margin:0 0 10px}
.sub{color:var(--muted);margin:0 0 12px}
.muted{color:var(--muted)}
/* barra in alto: marchio + pagine */
.top{display:flex;align-items:center;gap:12px;padding:14px 0 10px;position:sticky;top:0;background:var(--bg);z-index:2}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:800;letter-spacing:-.01em}
.brand .mark{width:30px;height:30px;border-radius:9px;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-size:15px;font-weight:900}
.nav{margin-left:auto;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.nav::-webkit-scrollbar{display:none}
.nav a{white-space:nowrap;text-decoration:none;color:var(--muted);font-size:14px;font-weight:600;padding:7px 11px;border-radius:999px}
.nav a[aria-current]{background:var(--ink);color:var(--bg)}
/* superfici */
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.card+.card{margin-top:12px}
/* tasti: i pulsanti grandi della hub */
.keys{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.key{position:relative;display:flex;flex-direction:column;gap:10px;min-height:118px;padding:14px;border-radius:var(--radius);
 background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);text-decoration:none;color:var(--ink);
 transition:transform .12s ease,box-shadow .12s ease}
.key:hover{transform:translateY(-1px)}
.key:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 0 0 var(--edge)}
.key:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.key .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--surface-2);border:1px solid var(--line);overflow:hidden}
.key .ic svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.key .ic svg.brand{fill:currentColor;stroke:none}
.key .ic img,.key .ic svg.app{width:40px;height:40px;border-radius:10px}
.key .n{font-weight:700;font-size:15px;line-height:1.2;margin-top:auto}
.key .d{color:var(--muted);font-size:12.5px;line-height:1.3}
.key.wa .ic{color:#25D366}.key.tg .ic{color:#26A5E4}.key.ig .ic{color:#E1306C}.key.acc .ic{color:var(--accent)}
/* un solo momento di movimento: i tasti salgono al loro posto all'apertura */
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.keys .key{animation:rise .38s cubic-bezier(.2,.7,.2,1) both}
.keys .key:nth-child(2){animation-delay:.04s}.keys .key:nth-child(3){animation-delay:.08s}.keys .key:nth-child(4){animation-delay:.12s}
.keys .key:nth-child(5){animation-delay:.16s}.keys .key:nth-child(6){animation-delay:.2s}.keys .key:nth-child(n+7){animation-delay:.24s}
@media(prefers-reduced-motion:reduce){.keys .key{animation:none}.key{transition:none}}
/* stato: righe e spie */
.rows{display:flex;flex-direction:column}
.row{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
.row:first-child{border-top:0}
.row .ic{width:36px;height:36px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);display:grid;place-items:center;flex:none}
.row .ic svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.row .ic svg.brand{fill:currentColor;stroke:none}
.row .t{flex:1;min-width:0}
.row .t b{display:block;font-weight:650}
.row .t span{display:block;color:var(--muted);font-size:13.5px}
.pill{font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.pill.on{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 50%,transparent)}
.pill.off{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 50%,transparent)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--muted);margin-right:8px;vertical-align:middle}
.dot.on{background:var(--ok);box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 45%,transparent);animation:breathe 2.4s ease-out infinite}
.dot.wait{background:var(--warn)}.dot.off{background:var(--bad)}
@keyframes breathe{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 45%,transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
@media(prefers-reduced-motion:reduce){.dot.on{animation:none}}
/* moduli */
input[type=text],input[type=password],textarea{width:100%;font:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:var(--radius-s);background:var(--surface-2);color:var(--ink)}
input:focus-visible,textarea:focus-visible{outline:3px solid var(--accent-soft);border-color:var(--accent)}
textarea{min-height:96px;resize:vertical}
.btn{font:inherit;font-weight:650;padding:11px 16px;border-radius:12px;border:1px solid var(--accent);background:var(--accent);color:var(--accent-ink);cursor:pointer;box-shadow:0 2px 0 color-mix(in srgb,var(--accent) 60%,black)}
.btn:active{transform:translateY(2px);box-shadow:none}
.btn.quiet{background:transparent;color:var(--ink);border-color:var(--line);box-shadow:0 2px 0 var(--edge)}
.btn.danger{background:var(--bad);border-color:var(--bad);color:#fff;box-shadow:0 2px 0 color-mix(in srgb,var(--bad) 60%,black)}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.msg{padding:12px 14px;border-radius:var(--radius-s);margin:0 0 12px;font-weight:600}
.msg.ok{background:color-mix(in srgb,var(--ok) 14%,var(--surface));color:var(--ok)}
.msg.err{background:color-mix(in srgb,var(--bad) 12%,var(--surface));color:var(--bad)}
/* impostazioni: righe apribili */
details.set{border-top:1px solid var(--line)}
details.set:first-of-type{border-top:0}
details.set summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:13px 0}
details.set summary::-webkit-details-marker{display:none}
details.set summary .ic{width:36px;height:36px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);display:grid;place-items:center;flex:none;color:var(--accent)}
details.set summary .ic svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
details.set summary .ic svg.brand{fill:currentColor;stroke:none}
details.set summary .t{flex:1;min-width:0}
details.set summary .t b{font-weight:650}
details.set summary .chev{margin-left:auto;color:var(--muted);transition:transform .15s}
details.set[open] summary .chev{transform:rotate(90deg)}
details.set .body{padding:0 0 16px 48px}
details.set .body .hint{color:var(--muted);font-size:13.5px;margin:0 0 10px}
.code{display:inline-block;font:800 24px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:5px;padding:10px 14px;border-radius:12px;background:var(--surface-2);border:1px dashed var(--edge)}
.otp{max-width:420px;margin:48px auto 0}
.otp input{font:700 28px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:8px;text-align:center}
/* dashboard dei progetti */
.proj{border-left:6px solid var(--ok)}
.proj.wait{border-left-color:var(--warn)}.proj.pause{border-left-color:var(--muted)}.proj.done{border-left-color:var(--line)}
.proj .name{font-weight:750;font-size:17px;margin-bottom:4px}
.proj .meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;color:var(--muted);font-size:13px;margin-bottom:8px}
.proj .sess{border-top:1px solid var(--line);padding:8px 0 0;margin-top:8px;font-size:14px}
.proj .q{margin-top:6px;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--warn) 14%,var(--surface));font-weight:600}
.bar{height:4px;border-radius:2px;background:var(--line);overflow:hidden;margin:6px 0 10px}
.bar i{display:block;height:100%;width:40%;background:var(--accent);animation:slide 1.6s ease-in-out infinite}
@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}
@media(prefers-reduced-motion:reduce){.bar i{animation:none;width:100%}}
pre{white-space:pre-wrap;word-break:break-word;font-size:12px;color:var(--muted);background:var(--surface-2);padding:10px;border-radius:10px}
details.diag summary{cursor:pointer;color:var(--muted);font-size:14px}
"""

# Simboli (Lucide, tracciati; Simple Icons per i marchi)
ICON = {
    "settings": '<svg viewBox="0 0 24 24"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>',
    "dashboard": '<svg viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
    "chat": '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    "link": '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    "mail": '<svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    "key": '<svg viewBox="0 0 24 24"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>',
    "sunrise": '<svg viewBox="0 0 24 24"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>',
    "qr": '<svg viewBox="0 0 24 24"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>',
    "home": '<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    "cart": '<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    "calendar": '<svg viewBox="0 0 24 24"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    "external": '<svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    "globe": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    "gamepad": '<svg viewBox="0 0 24 24"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>',
    "mic": '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
    "database": '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
    "shield": '<svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    "sticky": '<svg viewBox="0 0 24 24"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>',
    "whatsapp": '<svg class="brand" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    "telegram": '<svg class="brand" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    "instagram": '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
}

# Pagine del Segretario (link relativi: valgono all'indirizzo segreto e dietro hub.emazamboni.com)
PAGINE = [("hub", "Hub"), ("manager", "Impostazioni"), ("cruscotto", "Dashboard"), ("whatsapp", "WhatsApp")]


def esc(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def shell(title: str, body: str, current: str = "", refresh: int = 0) -> str:
    cur = ' aria-current="page"'
    nav = "".join(f'<a href="{href}"{cur if href == current else ""}>{esc(label)}</a>' for href, label in PAGINE)
    return ("<!doctype html><html lang=\"it\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<meta name=\"robots\" content=\"noindex\"><meta name=\"referrer\" content=\"no-referrer\">"
            + (f'<meta http-equiv="refresh" content="{refresh}">' if refresh else "")
            + f"<title>{esc(title)}</title><style>{TOKENS_CSS}</style></head><body><main>"
            f'<div class="top"><a class="brand" href="hub"><span class="mark">S</span>Segretario</a><nav class="nav">{nav}</nav></div>'
            + body + "</main></body></html>")


def app_icon(name: str) -> str:
    """L'icona vera di un'app di Ema, o un simbolo."""
    if name in APP_ICONS:
        svg = APP_ICONS[name]
        return svg.replace("<svg", '<svg class="app"', 1) if svg.startswith("<svg") else svg
    return ICON.get(name, ICON["globe"])


def key(nome: str, href: str, nota: str, icona: str, cls: str = "") -> str:
    ext = href.startswith("https://")
    target = ' target="_blank" rel="noopener noreferrer"' if ext else ""
    return (f'<a class="key {cls}" href="{esc(href)}"{target}><span class="ic">{app_icon(icona)}</span>'
            f'<span class="n">{esc(nome)}</span><span class="d">{esc(nota)}</span></a>')


def hub(gruppi: list[tuple[str, list[tuple[str, str, str, str, str]]]], stato: dict, codice: str) -> str:
    """gruppi: (titolo, [(nome, href, nota, icona, classe)])."""
    parts = ["<h1>Hub</h1><p class=\"sub\">Tutto in un posto. Pagina privata.</p>"]
    for titolo, items in gruppi:
        parts.append(f"<h2>{esc(titolo)}</h2><div class=\"keys\">" + "".join(key(*it) for it in items) + "</div>")
    parts.append("<h2>Regole e pulsanti</h2><div class=\"card\"><p>Quando il Segretario propone una regola, scrivi "
                 "<b>/approva</b> al bot Telegram: ti manda un codice di 6 cifre che vale 10 minuti. Dallo a Claude in chat, "
                 "\"approva, codice ...\". Lo stesso codice serve per aggiungere un tasto a questa pagina.</p></div>")
    parts.append(EMERGENZA)
    return shell("Hub · Segretario", "".join(parts), current="hub")


def impostazioni(sezioni: list[tuple[str, str, list[dict]]], stato_righe: list[tuple[str, str]], msg_ok: str, msg_err: str,
                 sicurezza: dict | None = None) -> str:
    """sezioni: (titolo, icona, [riga]) con riga = {key, label, hint, kind, is_set, shown, placeholder}."""
    parts = ["<h1>Impostazioni</h1><p class=\"sub\">Le chiavi e gli interruttori del Segretario. I valori non escono mai da qui.</p>"]
    if msg_ok:
        parts.append(f'<div class="msg ok">{esc(msg_ok)}</div>')
    if msg_err:
        parts.append(f'<div class="msg err">{esc(msg_err)}</div>')
    for titolo, icona, righe in sezioni:
        parts.append(f"<h2>{esc(titolo)}</h2><div class=\"card\">")
        for r in righe:
            pill = f'<span class="pill {"on" if r["is_set"] else "off"}">{"impostata" if r["is_set"] else "da impostare"}</span>'
            if r["kind"] == "textarea":
                field = f'<textarea name="valore" placeholder="{esc(r["placeholder"])}">{r["shown"]}</textarea>'
            else:
                field = f'<input type="{r["kind"]}" name="valore" value="{r["shown"]}" placeholder="{esc(r["placeholder"])}" autocomplete="off">'
            parts.append(
                f'<details class="set"><summary><span class="ic">{ICON.get(r.get("icona") or icona, ICON["key"])}</span><div class="t"><b>{esc(r["label"])}</b></div>{pill}<span class="chev">›</span></summary>'
                f'<div class="body"><p class="hint">{esc(r["hint"])}</p><form method="post"><input type="hidden" name="chiave" value="{r["key"]}">{field}'
                f'<div class="actions"><button class="btn" type="submit" name="azione" value="salva">Salva</button>'
                + (f'<button class="btn quiet" type="submit" name="azione" value="cancella">Togli</button>' if r["is_set"] else "")
                + "</div></form></div></details>")
        parts.append("</div>")
    if stato_righe:
        parts.append("<h2>Adesso</h2><div class=\"card\"><div class=\"rows\">" + "".join(
            f'<div class="row"><div class="t"><b>{esc(a)}</b></div><span class="pill">{esc(b)}</span></div>' for a, b in stato_righe) + "</div></div>")
    if sicurezza is not None:
        app = sicurezza.get("app") or []
        elenco = "".join(f"<li>{esc(a['app'])} <span class=\"muted\">dal {esc(a['dal'])}</span></li>" for a in app) or "<li class=\"muted\">nessuna</li>"
        parts.append(
            "<h2>Sicurezza</h2><div class=\"card\">"
            f"<p><b>Stato:</b> {esc(sicurezza.get('blocco', ''))}</p>"
            f"<p><b>Browser fidati:</b> {int(sicurezza.get('browser', 0))}. <b>App di Claude collegate:</b></p><ul>{elenco}</ul>"
            + (f"<p><b>Backup cifrato:</b> l'ultimo è del {esc(sicurezza['backup'])}. <a href=\"backup\">Scarica</a> "
               "(si apre solo con la tua chiave privata).</p>" if sicurezza.get("backup") else
               "<p><b>Backup cifrato:</b> il primo arriva pochi minuti dopo l'avvio, poi ogni notte.</p>")
            + (f"<p><b>Indirizzo del connettore</b> (da incollare in claude.ai > Settings > Connectors > Add custom connector, "
               f"solo se te lo chiede Claude):</p><p><input readonly value=\"{esc(sicurezza['connettore'])}\" "
               "style=\"width:100%\" aria-label=\"Indirizzo del connettore\"></p>" if sicurezza.get("connettore") else "")
            + ("<details class=\"set\"><summary><div class=\"t\"><b>Ultimi tentativi di collegamento</b></div><span class=\"chev\">›</span></summary><div class=\"body\"><ul>"
               + "".join(f"<li>{esc(t.get('quando', ''))} · {esc(t.get('esito', '?'))} · {esc(t.get('nome', ''))} · {esc(', '.join(t.get('redirect') or []))}"
                         + (f" · <span class=\"muted\">{esc(t.get('motivo', ''))}</span>" if t.get('motivo') else "") + "</li>"
                         for t in sicurezza.get("tentativi") or [])
               + "</ul></div></details>" if sicurezza.get("tentativi") else "")
            + "<form method=\"post\"><div class=\"actions\">"
            "<button class=\"btn quiet\" type=\"submit\" name=\"azione\" value=\"scollega_app\">Scollega tutte le app di Claude</button>"
            "<button class=\"btn quiet\" type=\"submit\" name=\"azione\" value=\"scollega_browser\">Scollega tutti i browser</button>"
            "</div></form></div>" + EMERGENZA)
    return shell("Impostazioni · Segretario", "".join(parts), current="manager")


EMERGENZA = ("<h2>Emergenza</h2><div class=\"card\"><details><summary class=\"btn danger\">Spegni tutto</summary>"
             "<p style=\"margin-top:12px\">Chiude subito Segretario, WhatsApp, Keep, Postino e link manager per tutti, Claude "
             "compreso. I dati restano. Si riapre solo scrivendo <b>/riaccendi</b> al bot Telegram. Anche da telefono, "
             "senza questa pagina: <b>/spegni</b> al bot.</p>"
             "<form method=\"post\"><button class=\"btn danger\" type=\"submit\" name=\"azione\" value=\"spegni\">Sì, spegni tutto adesso</button></form>"
             "</details></div>")


def chiuso(msg: str) -> str:
    """Pagina senza menu: Segretario spento, Telegram mancante, richiesta rifiutata."""
    body = f"<div class=\"otp\"><div class=\"card\"><h1>Chiuso</h1><p class=\"sub\">{esc(msg)}</p></div></div>"
    return ("<!doctype html><html lang=\"it\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            f"<meta name=\"robots\" content=\"noindex\"><title>Segretario</title><style>{TOKENS_CSS}</style></head><body><main>{body}</main></body></html>")


def accesso(app: str, msg: str, rid: str) -> str:
    """La pagina che claude.ai apre per collegarsi: senza il codice dal Telegram di Ema non entra nessuno."""
    err = f'<div class="msg err">{esc(msg)}</div>' if msg else ""
    if not rid:
        return chiuso(msg or "Richiesta non valida.")
    body = (f"<div class=\"otp\"><div class=\"card\"><h1>Collegare {esc(app)}?</h1>"
            "<p class=\"sub\">Chiede di entrare nel tuo Segretario: memoria, WhatsApp, Keep, Instagram. Se l'hai chiesto tu, "
            "scrivi <b>/codice</b> al bot Telegram e copia qui le 6 cifre. Se non sei stato tu, premi Rifiuta.</p>" + err
            + f'<form method="post"><input type="hidden" name="r" value="{esc(rid)}">'
            '<input type="text" name="codice" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" placeholder="······" aria-label="codice" autofocus>'
            '<div class="actions"><button class="btn" type="submit" name="azione" value="consenti">Collega</button>'
            '<button class="btn quiet" type="submit" name="azione" value="rifiuta" formnovalidate>Rifiuta</button></div></form></div></div>')
    return ("<!doctype html><html lang=\"it\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            f"<meta name=\"robots\" content=\"noindex\"><title>Collegare il Segretario</title><style>{TOKENS_CSS}</style></head><body><main>{body}</main></body></html>")


def codice(msg: str = "") -> str:
    """La porta. La pagina non manda mai niente: il codice lo chiede Ema su Telegram con /codice."""
    err = f'<div class="msg err">{esc(msg)}</div>' if msg else ""
    body = ('<div class="otp"><div class="card"><h1>Pagina privata</h1>'
            '<p class="sub">Apri Telegram, scrivi <b>/codice</b> al bot del Segretario e copia qui le 6 cifre. '
            'Questo browser poi resta fidato.</p>'
            + err
            + '<form method="post"><input type="text" name="codice" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" placeholder="······" aria-label="codice" autofocus>'
            '<div class="actions"><button class="btn" type="submit" name="azione" value="verifica">Entra</button></div></form></div></div>')
    return shell("Codice · Segretario", body)


def dashboard(d: dict, tutti: bool, codice_: str) -> str:
    titolo = "Tutti i progetti" if tutti else "Claude Dashboard"
    switch = "<a href='cruscotto'>solo i progetti Claude</a>" if tutti else "<a href='cruscotto?tutti=1'>tutti i progetti</a>"
    parts = [f"<h1>{esc(titolo)}</h1><p class=\"sub\">{esc(d['adesso'])} · si aggiorna da solo · {d['proposte_in_attesa']} proposte, {d['richieste_aperte']} richieste aperte · {switch}</p>"]
    if not d["progetti"]:
        parts.append("<div class=\"card\"><p>Nessun progetto Claude ancora: una sessione lo registra con sessione_segna o progetto_segna(tipo=\"codice\").</p></div>")
    for c in d["progetti"]:
        cls = "wait" if c["aspetta"] else {"in pausa": "pause", "finito": "done"}.get(c["stato"], "")
        parts.append(f"<div class='card proj {cls}'><div class='name'>{esc(c['nome'])}</div>")
        tag = "<span class='pill off'>ASPETTA TE</span>" if c["aspetta"] else f"<span class='pill'>{esc(c['stato'])}</span>"
        tipo = f"<span class='pill'>{esc(c['tipo'])}</span>" if c["tipo"] else ""
        parts.append(f"<div class='meta'>{tag}{tipo}<span>{esc(c['da'])}</span></div>")
        if c["stato"] == "in corso" and any(s["stato"] == "in corso" for s in c["sessioni"]):
            parts.append("<div class='bar'><i></i></div>")
        if c["dove_sono"]:
            parts.append(f"<p>{esc(c['dove_sono'])}</p>")
        if c["prossimo_passo"]:
            parts.append(f"<p><b>Prossimo:</b> {esc(c['prossimo_passo'])}</p>")
        for s in c["sessioni"]:
            parts.append(f"<div class='sess'><b>{esc(s['nome'])}</b> <span class='muted'>· {esc(s['stato'])} · {esc(s['da'])}</span><br>{esc(s['dove_sono'])}")
            if s.get("domanda_per_ema"):
                parts.append(f"<div class='q'>{esc(s['domanda_per_ema'])}</div>")
            parts.append("</div>")
        if c.get("materiali_html"):
            parts.append(f"<p class='meta'>{c['materiali_html']}</p>")
        parts.append("</div>")
    if d["sessioni_senza_progetto"]:
        parts.append("<h2>Sessioni senza progetto</h2>")
        for s in d["sessioni_senza_progetto"]:
            cls = "wait" if s["stato"] == "aspetta Ema" else ""
            parts.append(f"<div class='card proj {cls}'><div class='name'>{esc(s['nome'])}</div><div class='meta'><span class='pill'>{esc(s['stato'])}</span><span>{esc(s['da'])}</span></div><p>{esc(s['dove_sono'])}</p>")
            if s.get("domanda_per_ema"):
                parts.append(f"<div class='q'>{esc(s['domanda_per_ema'])}</div>")
            parts.append("</div>")
    parts.append(f"<p class=\"muted\" style=\"margin-top:16px\">Codice di approvazione: <b>{esc(codice_)}</b></p>")
    return shell("Claude Dashboard · Segretario", "".join(parts), current="cruscotto", refresh=60)
