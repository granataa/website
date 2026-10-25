# alessandrogranata.it

Sito personale statico di Alessandro Granata (IU8DKG).

- `public/` — i file pubblicati:
  - `index.html` (italiano) e `en/index.html` (inglese): stessi contenuti, collegati con `hreflang`
  - `site.css` e `site.js`: stile e animazioni condivisi dalle due pagine
  - `robots.txt` e `sitemap.xml` per i motori di ricerca
  - i font in `fonts/`
- `wrangler.jsonc` — configurazione di Cloudflare Workers (static assets)

## Pubblicazione

- **Da GitHub:** collega il repository in Cloudflare (*Workers & Pages → Create → Import a repository*); ogni push su `main` pubblica il sito.
- **Da terminale:** `npx wrangler deploy` dalla cartella del progetto.

Nessun passo di build, nessun cookie, nessuna richiesta a servizi esterni.
I font sono distribuiti con licenza SIL Open Font License 1.1 (vedi `public/fonts/`).


## Lingue e indicizzazione

- Ogni lingua ha il suo URL: `/` per l'italiano, `/en/` per l'inglese. Lo switch IT/EN è fatto di link normali, senza redirect automatici, così i crawler vedono entrambe le versioni.
- Se modifichi un testo, aggiorna entrambe le pagine; layout e animazioni stanno in `site.css`/`site.js` e valgono per tutte e due.
- Nella `<head>` di ogni pagina ci sono `canonical`, gli `hreflang` reciproci e un blocco JSON-LD (`ProfilePage` + `Person`): se aggiungi un profilo esterno (es. QRZ.com), mettilo in `sameAs` in entrambe le pagine.
- Quando aggiungi una pagina, aggiungila anche a `sitemap.xml`.
