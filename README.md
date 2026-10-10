# Nanorout — demo Home page

A one-page demo of the Nanorout website. Only the Home page exists. Menu items with no section show "COMING IN THE FULL WEBSITE".

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

Requires Node 20+. Built on Next.js 16 (App Router, TypeScript), CSS Modules + CSS variables, GSAP 3.15 (ScrollTrigger, DrawSVG, SplitText), Lenis, and three.js (hero only, loaded after the page is interactive).

## Where everything lives

| Part | File |
| --- | --- |
| Fonts, metadata, page shell | `src/app/layout.tsx` |
| Design tokens (colour, type, spacing) | `src/app/globals.css` |
| The 7 parts, in order | `src/app/page.tsx` |
| Desktop side panel + route spine | `src/components/layout/Sidebar.tsx` |
| Header, full-screen menu overlay | `src/components/layout/SiteChrome.tsx` |
| Footer + wordmark | `src/components/layout/Footer.tsx` |
| Hero | `src/components/sections/Hero.tsx` |
| NIS list | `src/components/sections/NisList.tsx` |
| Route of a Signal | `src/components/sections/SignalRoute.tsx` |
| Triad vision | `src/components/sections/TriadVision.tsx` |
| Signal Lab | `src/components/sections/SignalLab.tsx` |
| Closing form | `src/components/sections/ClosingCta.tsx` |
| Keyword band | `src/components/ui/Marquee.tsx` |
| 3D chrome neuron (hero) | `src/components/art/ChromeNeuron.tsx` |
| Drawing recipes (section 16) | `src/lib/art.ts`, `src/lib/geometry.ts`, `src/lib/random.ts` |
| Motion helpers (reveals, hovers) | `src/lib/motion.ts` |
| Menu items, notice text, placeholders | `src/lib/nav.ts` |

## Placeholders to replace before launch

| Item | Now | Where |
| --- | --- | --- |
| Contact email | `example@example.com` | `src/lib/nav.ts` (`CONTACT_EMAIL`) |
| LinkedIn link | `#` | `src/lib/nav.ts` (`LINKEDIN_URL`) |
| Privacy Policy, Terms | `#` | `src/components/layout/Footer.tsx` |
| Form sending | not connected (nothing is sent) | `src/components/sections/ClosingCta.tsx` |
| Logo mark | the simple "N" | `src/components/art/Logo.tsx`, `src/app/icon.svg` |
| Site URL for metadata | `NEXT_PUBLIC_SITE_URL` env var | `src/app/layout.tsx`, `robots.ts`, `sitemap.ts` |

## Changes from the handover PDF (agreed during the build)

- **Palette and type follow the brand boards, not the PDF's white/black/red.** Colours: Poster Black `#111111`, Acid Yellow `#D7FF00`, Hot Orange `#FF6A00`, Flash White `#FFFFFF`, Concrete Gray `#5A5A5A` (lines and surfaces only, never text on black). Fonts: Boldonse (display) and Cabin (everything else). Hot Orange takes the place of the PDF's red on the menu button and the overlay.
- **Fixed side panel on desktop** (after thisisfc88.com): logo, section links with dashed rules, the section you are reading highlighted, and a call to action. The route spine (PDF section 7) runs down its right edge. Mobile and tablet keep the header and the full-screen menu.
- **3D hero feature:** a chrome neuron whose axon runs into a glass chip, with acid signal pulses, in three.js. It is lazy-loaded, pauses off-screen, and renders a still frame under reduced motion.
- **More hover animation** across the page: magnetic buttons with a glint, tag cells that fill, neon letters that light up near the cursor, NIS rows that wipe acid, tilting cards, and Triad labels that invert.

## Copy to confirm with the client

- The sentence form reads "I'm a **investor**" and "I'm a **other**" for two of the roles. This is the exact copy from the PDF, left unchanged.
