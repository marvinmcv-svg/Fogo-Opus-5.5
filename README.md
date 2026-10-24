# Fogo de Chão · Ventura Mall

Launch website for Fogo de Chão's second restaurant in Santa Cruz de la Sierra (Boulevard, Ventura Mall). It's bilingual (ES/EN), motion-led, and comes with **Sofía**, an AI receptionist who books, changes and cancels tables.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS v4
- **GSAP 3** (ScrollTrigger, SplitText) + **Lenis** smooth scroll
- **Three.js**: custom GLSL fire bed and GPU embers in the hero
- **Claude API** (`@anthropic-ai/sdk`) with tool use for Sofía
- JSON-file reservation store (no database needed to start)

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY and ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Powers Sofía. Without it the chat politely points guests to the booking form. |
| `ADMIN_PASSWORD` | Protects `/admin`, the reservation board for the front desk. |
| `RESERVATIONS_FILE` | Optional path for the JSON store (default `./data/reservations.json`). |

## What's on the page

1. **Preloader**: the gold logo burns in as the first frames load.
2. **Hero**: a WebGL fire bed with an arch window playing the official Ventura film. The headline rises letter by letter. On scroll, the arch opens into a full-bleed, defocused film plate and the manifesto lights up word by word.
3. **Film**: the ad decoded into 107 frames and scrubbed frame by frame with scroll (Apple-style), with captions keyed to the action.
4. **The Ritual**: a pinned horizontal walk through the four beats. The green/red card flips in 3D as you go.
5. **Cuts**: the churrasco menu, with a sticky arch cycling through real grill moments.
6. **Market Table**: a parchment "printed menu" interlude that rises as an arch.
7. **Bar**: a marquee that reacts to scroll velocity.
8. **Gallery**: counter-drifting rows of stills.
9. **Visit**: map, hours, contact.
10. **Reservations**: a live availability form.
11. **Sofía**: a floating receptionist on every screen.

Motion respects `prefers-reduced-motion`.

## Sofía, the AI receptionist

`src/app/api/sofia/route.ts` streams a Claude conversation (server-sent events) with these tools (`src/lib/sofia.ts`):

| Tool | What it does |
| --- | --- |
| `check_availability` | Real slots from the booking engine |
| `create_reservation` | Books only after the guest confirms the read-back |
| `find_reservation` / `modify_reservation` / `cancel_reservation` | Each needs the confirmation code **and** the phone number |
| `join_waitlist` | When the preferred time is full |
| `request_private_event` | Groups of 13 or more, corporate dinners |
| `request_callback` | Anything she can't resolve (unpublished prices, complaints, press…) |

Sofía answers only from `src/content/restaurant.ts`. When a fact isn't there (for example prices, which are `null` today), she says she'll confirm with the team and offers to leave a message. She never invents an answer.

Every booking and lead appears at **`/admin`**, with tap-to-WhatsApp phone numbers and status controls (confirmed / seated / no-show / cancelled).

## ⚠️ Confirm before launch

Everything lives in **`src/content/restaurant.ts`**. Fields marked `CONFIRM` are placeholders:

- [ ] Opening date and time (`openingDate`, currently 31 Oct 2026, 19:00). This drives the countdown and when bookings open.
- [ ] Exact address line inside Ventura Mall
- [ ] Service hours (`HOURS`)
- [ ] Phone, WhatsApp, email (currently `null`; the site shows "Próximamente")
- [ ] Prices for Churrasco and Market Table (currently `null`)
- [ ] Kids policy, dress code, late-arrival hold, online capacity (`BOOKING.onlineCovers`)
- [ ] Cut list, Market Table, desserts, bar

## Media

All footage comes from the official Ventura Mall rodizio film (`media-src/rodizio-ventura.mp4`). `npm run media` (requires ffmpeg) regenerates:

- `public/media/rodizio.{mp4,webm}`: the hero loop
- `public/media/seq/*.webp`: 107 frames for the scroll film
- `public/media/stills/*.webp`: 8 hand-picked stills

To add photography later (interior, Market Table, bar, team), drop it in `public/media/` and reference it from the section components.

## Deploying

Live on Vercel as **fogodechao-bo**. Every push to the repository's default branch redeploys it.

Reservations live in a private **Vercel Blob** store connected to the project, which sets `BLOB_READ_WRITE_TOKEN` automatically. Each write is conditional on the version it read, so two guests booking the last table at the same moment can't both get it. Without that token (local dev, or any Node host) the same data lives in `./data/reservations.json`.

Project environment variables:

| Variable | Set by |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel, when the Blob store is connected |
| `ADMIN_PASSWORD` | you; protects `/admin` |
| `ANTHROPIC_API_KEY` | you; turns Sofía on |
| `NEXT_PUBLIC_SITE_URL` | the public URL, used for share previews |
