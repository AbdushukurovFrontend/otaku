# Otaku — AniBla Ecosystem (BETA)

AniBla'ga ulangan anime ijtimoiy tarmog'i va hamjamiyatlar markazi. Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand + lucide-react.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + production build → dist/
npm run preview    # build'ni lokal ko'rish
```

## Tuzilma

| Papka | Vazifasi |
| --- | --- |
| `src/lib/catalog.ts` | Anime katalogi (AniList CDN posterlari), Hub'lar, foydalanuvchilar |
| `src/lib/seed.ts` | O'zbekcha seed: postlar, avtomatik EDT'lar, izohlar daraxti, shikoyatlar, bildirishnomalar |
| `src/lib/store.ts` | Zustand + `localStorage` persist (F5 himoyasi), barcha harakatlar va XP |
| `src/lib/selectors.ts` | Tasma saralash, Aqlli Spoyler Darvozasi (`gateFor`), trend, izoh arxivi |
| `src/lib/router.ts` | Hash-router (`#/h/frieren`, `#/p/:id`, `#/me/drafts`, `#/mod` ...) |
| `src/components/ui/SmartPoster.tsx` | Singan rasmsiz media: mesh-gradient + SVG emblema fallback |
| `src/components/shell` | Header, chap navigatsiya, o'ng ekotizim ustuni, mobil navigatsiya |
| `src/components/feed` | Post kartasi, EDT/Sharh/To'plam/So'rovnoma bloklari, Spoyler Darvozasi, Bento |
| `src/components/modals` | Post Studiyasi, Shikoyat, Auth (SSO), Yangi Hub, Sozlamalar |
| `src/pages` | Tasma, Hub, Post, Jamiyatlar, Profil, Mod Queue |

## Dizayn tizimi (90/10 monoxrom)

- Tokenlar `src/index.css` da: Tungi — `#090A0D` fon, `#111318` yuza, `#161922` ichki yuza; Kunduzgi — `#F5F6F9`, `#FFFFFF`, `#F8FAFC`.
- Rang intizomi: neytral yuzalar + yagona indigo urg'u (ovoz, XP, faol holat) + qizil faqat "Live" nuqtasi uchun; reyting yulduzi amber.
- Tugmalar: `primary` (indigo), `contrast` (slate-900 / oq), qolganlari neytral; meta ma'lumot uchun yagona `MetaChip`.
- Avatarlar: `src/lib/avatars.ts` — AniList CDN anime personaj portretlari; rasm yuklanmasa SVG anime-siluet chiziladi, harfli doira yo'q.

## Katta ekranlar (4K / Ultra-Wide)

- Fon va ambient nur doim butun ekranni egallaydi; kontent qobig'i `max-w-[1600px]`, `3xl` (≥1920px) da `max-w-[1920px]` va markazda.
- Tasma, post tafsiloti, Hub/Profil lentalari `ReadingColumn` (`max-w-4xl`) ichida — matn cho'zilib ketmaydi.
- "Hozirgi" Bento: 2 → 4 (`xl`) → 5 (`2xl`) → 6 (`3xl`) ustun. Hub katalogi `auto-fill` aqlli grid.

## Animatsiya qoidalari (60 FPS)

- Faqat `opacity` va `transform` animatsiya qilinadi: `transition-gpu` utilitasi va `index.css` dagi keyframe'lar.
- `width`, `height`, `margin`, `padding`, `box-shadow`, `filter` animatsiyasi yo'q; progress chiziqlari `translate`/`scaleX` bilan to'ladi.
- Modallar spring (`linear()` easing) bilan `scale-95 → 100`, yopilishda ham animatsiya; sahifa o'tishi 0.28s fade + 8px slide.
- Kartochkalar `backdrop-filter` ishlatmaydi (scroll'da qayta blur qilish GPU'ni yuklaydi); frosted glass faqat header, menyu va modallarda.
- Mavzu almashinuvi View Transitions API orqali crossfade; `prefers-reduced-motion` hurmat qilinadi.

## Marshrutlar

`#/` Tasma · `#/news` · `#/collections` · `#/reviews` · `#/topic/:mavzu` · `#/hubs` · `#/h/:hub[/episodes|reviews|about]` · `#/p/:post` · `#/me[/reviews|bookmarks|drafts|about]` · `#/u/:handle` · `#/mod`

Demo holatini tiklash: profil menyusi → «Demo ma'lumotlarni boshlang'ich holatga qaytarish».
