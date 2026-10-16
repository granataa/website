# alessandrogranata.it

Sito personale statico di Alessandro Granata (IU8DKG).

- `public/` — i file pubblicati: `index.html`, i font in `fonts/`
- `wrangler.jsonc` — configurazione di Cloudflare Workers (static assets)

## Pubblicazione

- **Da GitHub:** collega il repository in Cloudflare (*Workers & Pages → Create → Import a repository*); ogni push su `main` pubblica il sito.
- **Da terminale:** `npx wrangler deploy` dalla cartella del progetto.

Nessun passo di build, nessun cookie, nessuna richiesta a servizi esterni.
I font sono distribuiti con licenza SIL Open Font License 1.1 (vedi `public/fonts/`).

