import { ANIME_BY_ID, createHubs, createUsers, episodeRange } from './catalog';
import type { Comment, ModLogEntry, Notification, Post, Report, User } from './types';
import { DAY, HOUR, MIN, hashString, mulberry32 } from './utils';

type CNode = [authorId: string, body: string, score: number, minutesAfterPost: number, replies?: CNode[]];

interface PostSeed extends Omit<Post, 'createdAt' | 'commentBase' | 'status' | 'spoiler' | 'nsfw' | 'tags' | 'topic'> {
  ago: number;
  comments: number;
  tags?: string[];
  topic?: Post['topic'];
  spoiler?: boolean;
  nsfw?: boolean;
  status?: Post['status'];
  thread?: CNode[];
}

/* ------------------------------------------------------------------ */
/* EDT — Episode Discussion Threads, auto-generated per AniBla release */
/* ------------------------------------------------------------------ */

const EDT_META: Record<string, { latestAgo: number; comments: number[]; ratings: number[]; nextDay: string }> = {
  frieren: {
    latestAgo: 2 * HOUR,
    comments: [612, 540, 498, 455, 701, 820, 476, 512, 389, 402, 518, 342],
    ratings: [4.6, 4.5, 4.7, 4.6, 4.8, 4.9, 4.5, 4.7, 4.6, 4.8, 4.8, 4.9],
    nextDay: 'kelasi juma',
  },
  solo_leveling: {
    latestAgo: 6 * HOUR,
    comments: [880, 760, 940, 690, 1020, 1105, 980, 455],
    ratings: [4.4, 4.3, 4.6, 4.2, 4.7, 4.8, 4.6, 4.9],
    nextDay: 'kelasi shanba',
  },
  sakamoto_days: {
    latestAgo: 20 * HOUR,
    comments: [310, 260, 240, 290, 330, 214],
    ratings: [4.2, 4.1, 4.3, 4.4, 4.5, 4.6],
    nextDay: 'kelasi dushanba',
  },
  one_piece: {
    latestAgo: 27 * HOUR,
    comments: [520, 480, 610, 700, 655, 890, 744, 388],
    ratings: [4.5, 4.4, 4.6, 4.7, 4.6, 4.9, 4.8, 4.8],
    nextDay: 'kelasi yakshanba',
  },
};

export const EDT_ANIME = Object.keys(EDT_META);

export function edtId(animeId: string, ep: number) {
  return `edt-${animeId}-${ep}`;
}

function buildEdts(now: number): PostSeed[] {
  const out: PostSeed[] = [];
  for (const animeId of EDT_ANIME) {
    const a = ANIME_BY_ID[animeId];
    const meta = EDT_META[animeId];
    const [start, end] = episodeRange(a);
    for (let ep = start; ep <= end; ep++) {
      const i = ep - start;
      const weeksBack = end - ep;
      const title = a.episodeTitles?.[ep] ?? `${ep}-qism`;
      const comments = meta.comments[i] ?? 300;
      const votes = Math.round(comments * 1.2 + 40);
      out.push({
        id: edtId(animeId, ep),
        kind: 'edt',
        hubId: animeId,
        authorId: 'u_bot',
        title: `${a.title} — ${a.season ? `${a.season}, ` : ''}${ep}-qism: «${title}» rasmiy muhokamasi`,
        body:
          `**${a.title} ${ep}-qism — «${title}»** AniBla'da o'zbek tilida chiqdi.\n\n` +
          `> Bu rasmiy Epizod Muhokamasi (EDT). Shu qism voqealarini bemalol muhokama qiling — post ${ep}-qismni hali ko'rmaganlar uchun Spoyler Darvozasi bilan avtomatik himoyalangan.\n\n` +
          `- Dublyaj: AniBla Studio (o'zbek tili)\n- Sifat: 1080p / 720p / 480p\n- Davomiyligi: 24 daqiqa\n\n` +
          `Qismga yulduzcha bilan baho bering va fikringizni yozing. Keyingi qism — ${meta.nextDay}.`,
        animeId,
        episode: ep,
        topic: 'anime',
        tags: [a.id.replace(/_/g, ''), `${ep}qism`, 'edt'],
        ago: meta.latestAgo + weeksBack * 7 * DAY,
        score: Math.round(comments * 2.3 + (weeksBack === 0 ? 70 : 0)),
        comments,
        pinned: weeksBack === 0,
        edt: { episode: ep, episodeTitle: title, rating: meta.ratings[i] ?? 4.5, ratingVotes: votes },
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Handwritten community posts                                         */
/* ------------------------------------------------------------------ */

function buildPosts(): PostSeed[] {
  return [
    // ----------------------------------------------------------- NEWS
    {
      id: 'n1',
      kind: 'news',
      hubId: 'anibla',
      authorId: 'u_anibla',
      title: 'AniBla 3.0 chiqdi: yangi pleyer, 1080p+ sifat va oflayn rejim',
      body:
        "Bugun AniBla ilovasining eng katta yangilanishini taqdim etamiz.\n\n" +
        "- **Yangi pleyer:** introni o'tkazish, keyingi qismga avtomatik o'tish, tezlikni boshqarish\n" +
        "- **1080p+ sifat:** barcha ongoing'lar uchun yuqori bitreyt\n" +
        "- **Oflayn rejim:** qismlarni yuklab oling va internetsiz tomosha qiling\n" +
        "- **Otaku integratsiyasi:** har qism tugashi bilan bir bosishda EDT muhokamasiga o'ting\n\n" +
        "Yangilanish App Store va Google Play'da bosqichma-bosqich tarqatilmoqda.",
      topic: 'industry',
      tags: ['anibla', 'yangilanish', 'ilova'],
      ago: 3 * HOUR,
      score: 612,
      comments: 94,
      news: { source: 'AniBla Jamoasi', official: true },
      thread: [
        ['u_me', "Oflayn rejim nihoyat! Metroda ko'rish uchun eng kerakli funksiya.", 84, 20],
        ['u_timur', "Pleyerdagi «introni o'tkazish» va keyingi qismga avtomatik o'tish ham qo'shildimi?", 41, 35, [
          ['u_anibla', "Ha, ikkalasi ham 3.0 da bor. Sozlamalar → Pleyer bo'limidan yoqishingiz mumkin.", 96, 50],
        ]],
        ['u_nilufar', "Otaku bilan integratsiya — har qismdan keyin to'g'ridan-to'g'ri EDT'ga o'tish juda qulay!", 63, 70],
      ],
    },
    {
      id: 'n2',
      kind: 'news',
      hubId: 'anibla',
      authorId: 'u_anibla',
      title: "Kuzgi mavsum jadvali: AniBla'da har hafta 14 ta ongoing o'zbek tilida",
      body:
        "2026-yil kuzgi mavsumi uchun to'liq jadval tayyor. Har bir qism Yaponiyadagi premyeradan so'ng 24–48 soat ichida o'zbekcha dublyaj bilan chiqadi.\n\n" +
        "**Dushanba:** Sakamoto Days\n**Payshanba:** Jujutsu Kaisen\n**Juma:** Sousou no Frieren\n**Shanba:** Solo Leveling, Dandadan\n**Yakshanba:** One Piece\n\n" +
        "Har bir yangi qism uchun Otaku'da EDT muhokamasi avtomatik ochiladi.",
      animeId: 'frieren',
      topic: 'industry',
      tags: ['jadval', 'ongoing', 'kuz2026'],
      ago: 9 * HOUR,
      score: 488,
      comments: 61,
      news: { source: 'AniBla Jamoasi', official: true },
      thread: [
        ['u_jasur', "Yakshanba — One Piece kuni. Hech narsa o'zgarmaydi :)", 38, 25],
        ['u_lola', 'Dandadan shanba kuni! Hafta oxiri rejasi tayyor.', 22, 60],
      ],
    },
    {
      id: 'n3',
      kind: 'news',
      hubId: 'anibla',
      authorId: 'u_anibla',
      title: "Otaku Beta ochildi: AniBla akkauntingiz bilan 1 bosishda kiring",
      body:
        "Otaku — AniBla ekotizimidagi anime ijtimoiy tarmog'i. Har bir anime uchun avtomatik Hub, har bir qism uchun EDT muhokamasi, ko'rish tarixingiz bilan sinxron Spoyler Darvozasi va Otaku darajalari.\n\n" +
        "Beta davrida qo'shilganlar **Beta Otaku** nishonini oladi.",
      topic: 'industry',
      tags: ['otaku', 'beta'],
      ago: 3 * DAY,
      score: 1340,
      comments: 212,
      pinned: true,
      news: { source: 'AniBla Jamoasi', official: true },
      thread: [
        ['u_sardor', "Nihoyat o'zbek tilidagi o'z anime hamjamiyatimiz! Telegram guruhlaridan ancha qulay.", 210, 30],
        ['u_kamola', "Spoyler Darvozasi — eng zo'r g'oya. Endi hech kim 12-qismni oldindan aytib qo'ymaydi.", 175, 55],
      ],
    },
    {
      id: 'n4',
      kind: 'news',
      hubId: 'chainsaw_man',
      authorId: 'u_anibla',
      title: "Chainsaw Man: Reze arki filmi AniBla katalogiga qo'shildi",
      body: "Ko'pchilik kutgan film endi AniBla'da — o'zbekcha subtitr bilan. Dublyaj versiyasi ustida ish ketmoqda va dekabr oyida chiqishi rejalashtirilgan.",
      animeId: 'chainsaw_man',
      topic: 'anime',
      tags: ['chainsawman', 'film', 'reze'],
      ago: 30 * HOUR,
      score: 356,
      comments: 48,
      news: { source: 'AniBla Jamoasi', official: true },
      thread: [['u_azamat', "Dublyajni kutaman. Denji ovozi kim bo'ladi ekan?", 29, 45]],
    },
    {
      id: 'n5',
      kind: 'news',
      hubId: 'anime',
      authorId: 'u_sardor',
      title: "Anime eksporti ichki bozordan oshib ketdi: bu O'zbekiston uchun nimani anglatadi?",
      body:
        "So'nggi yillarda yapon animatsiya studiyalari daromadining katta qismi xorijiy litsenziyalardan kelmoqda. Bu degani — mintaqaviy platformalar (AniBla kabi) uchun rasmiy litsenziya olish imkoniyati oshmoqda.\n\n" +
        "Mening fikrimcha, keyingi 3 yilda biz o'zbek tilida simulcast'larni ko'ramiz.",
      topic: 'industry',
      tags: ['sanoat', 'tahlil', 'litsenziya'],
      ago: 2 * DAY,
      score: 241,
      comments: 37,
      news: { source: 'Tahlil', official: false },
      thread: [['u_timur', "Simulcast uchun tarjima jamoasi 2 baravar katta bo'lishi kerak. Lekin imkonsiz emas.", 33, 90]],
    },

    // ----------------------------------------------------------- REVIEWS
    {
      id: 'r1',
      kind: 'review',
      hubId: 'vinland_saga',
      authorId: 'u_bekzod',
      title: 'Vinland Saga — urushdan tinchlikka: anime tarixidagi eng yaxshi qahramon evolyutsiyasi',
      body:
        "Vinland Saga'ni «viking jangari» deb boshlaysiz va «inson bo'lish nima?» degan savol bilan tugatasiz.\n\n" +
        "**Syujet:** 1-mavsum — qasos haqida, 2-mavsum — qasosdan keyingi bo'shliq haqida. Torfinnning qul sifatidagi hayoti sekin, lekin har bir qism uning ichki dunyosini qayta quradi.\n\n" +
        "**Personajlar:** Torfinn, Askeladd, Kanut va Einar — har biri o'z haqiqatiga ega. Yovuz qahramon yo'q, faqat sharoit bor.\n\n" +
        "> «Mening dushmanim yo'q.» — bu jumla butun asarning yuragi.\n\n" +
        "**Kamchilik:** 2-mavsumning birinchi yarmi ba'zilar uchun juda sekin tuyulishi mumkin.",
      animeId: 'vinland_saga',
      topic: 'anime',
      tags: ['vinlandsaga', 'sharh', 'drama'],
      ago: 6 * HOUR,
      score: 389,
      comments: 57,
      review: { plot: 9.8, animation: 9.0, music: 9.5, characters: 10, overall: 9.6, recommended: true },
      thread: [
        ['u_sardor', "Torfinnning «menda dushman yo'q» degan sahnasi — eng kuchli xarakter burilishi. 9.6 — adolatli.", 120, 25],
        ['u_azamat', '2-mavsum boshida zerikib qolgandim, lekin oxiriga kelib eng yaxshi mavsum bo\'lib chiqdi.', 76, 60, [
          ['u_bekzod', "Sekin boshlanishi — ataylab, Torfinnning ichki holatini his qildirish uchun.", 54, 85],
        ]],
        ['u_lola', "Shu sharhdan keyin boshlayapman. AniBla'da bormi?", 12, 120, [
          ['u_kamola', "Bor, ikkala mavsum ham o'zbekcha dublyajda.", 20, 135],
        ]],
      ],
    },
    {
      id: 'r2',
      kind: 'review',
      hubId: 'frieren',
      authorId: 'u_kamola',
      title: "Frieren 2-mavsum (1–11 qism): sekin, ammo yurakka tegadigan",
      body:
        "Birinchi mavsum yuqori marra qo'ygan edi — 2-mavsum uni nafaqat ushlab turibdi, balki chuqurlashtirmoqda.\n\n" +
        "**Animatsiya:** Madhouse har bir kadrni kartina kabi chizgan. Ayniqsa 6-qismdagi ko'l sahnasi.\n\n" +
        "**Musiqa:** Evan Call yana sehrli, lekin yangi temalar kamroq.\n\n" +
        "||11-qismdagi Shtark va Fern sahnasi — mavsumning emotsional cho'qqisi.||",
      animeId: 'frieren',
      episode: 11,
      topic: 'anime',
      tags: ['frieren', 'sharh', '2mavsum'],
      ago: 26 * HOUR,
      score: 274,
      comments: 41,
      review: { plot: 9.5, animation: 10, music: 9.0, characters: 9.5, overall: 9.5, recommended: true },
      thread: [['u_umid', "Musiqa haqida qo'shilaman — 1-mavsum temalari ko'p qaytarilgan. Lekin bu ham tematik.", 31, 80]],
    },
    {
      id: 'r3',
      kind: 'review',
      hubId: 'solo_leveling',
      authorId: 'u_me',
      title: "Solo Leveling 2-mavsum: ko'z uchun bayram, syujet uchun — o'rtacha",
      body:
        "A-1 Pictures 2-mavsumda animatsiyani yangi darajaga olib chiqdi — jang sahnalari haftaning eng chiroyli 3 daqiqasi.\n\n" +
        "Lekin manhwa o'quvchisi sifatida aytaman: ichki monologlar va yon personajlar ko'p qisqargan. Jin-Woo ba'zan qahramon emas, «kuch effekti»ga aylanib qoladi.\n\n" +
        "**Xulosa:** dam olish uchun — 10/10, chuqur hikoya izlasangiz — 7/10.",
      animeId: 'solo_leveling',
      topic: 'anime',
      tags: ['sololeveling', 'sharh'],
      ago: 2 * DAY,
      score: 156,
      comments: 33,
      review: { plot: 7.0, animation: 9.5, music: 8.5, characters: 7.0, overall: 8.0, recommended: true },
      thread: [
        ['u_azamat', 'Animatsiya 9.5 — qo\'shilaman. Lekin syujet 7.0 juda qattiq emasmi?', 34, 40, [
          ['u_me', "Manhwa'ga nisbatan ko'p narsa tushirib qoldirilgan, shuning uchun.", 22, 70],
        ]],
        ['u_troll', "Bunday sharhni faqat hech narsa tushunmaydigan odam yozadi. Anime ko'rishni bas qil.", -8, 200],
      ],
    },
    {
      id: 'r4',
      kind: 'review',
      hubId: 'sakamoto_days',
      authorId: 'u_nilufar',
      title: "Sakamoto Days — komediya va jangari mukammal muvozanatda (6 qismdan keyin)",
      body:
        "Sakamoto — eng g'ayrioddiy shonen qahramon: semiz, oilaparvar va... dunyodagi eng xavfli odam.\n\n" +
        "Jang xoreografiyasi kundalik buyumlar bilan qurilgan — har bir sahna ijodiy. Ammo CG ba'zan ko'zga tashlanadi.",
      animeId: 'sakamoto_days',
      topic: 'anime',
      tags: ['sakamotodays', 'sharh', 'komediya'],
      ago: 3 * DAY,
      score: 118,
      comments: 22,
      review: { plot: 7.5, animation: 7.5, music: 8.0, characters: 8.5, overall: 7.8, recommended: true },
      thread: [['u_otabek', "CG haqida to'g'ri — lekin 6-qismdagi jang buni unuttirdi.", 14, 60]],
    },
    {
      id: 'r5',
      kind: 'review',
      hubId: 'dandadan',
      authorId: 'u_azamat',
      title: "Dandadan — 2020-yillarning eng jasur va eng aqldan ozgan animesi",
      body:
        "Science SARU har bir qismda vizual eksperiment qiladi. Arvohlar, o'zga sayyoraliklar, romantika va... ikkita «oltin to'p» qidiruvi.\n\n" +
        "Momo va Okarun o'rtasidagi kimyo — shounen romantikasining yangi standarti.",
      animeId: 'dandadan',
      topic: 'anime',
      tags: ['dandadan', 'sharh'],
      ago: 4 * DAY,
      score: 203,
      comments: 29,
      review: { plot: 8.5, animation: 9.5, music: 9.5, characters: 9.0, overall: 9.0, recommended: true },
      thread: [['u_lola', "Shu animedan boshlaganim uchun omadliman!", 18, 90]],
    },

    // ----------------------------------------------------------- COLLECTIONS
    {
      id: 'c1',
      kind: 'collection',
      hubId: 'anime',
      authorId: 'u_sardor',
      title: "Top 10: Hayotda bir marta ko'rish shart bo'lgan anime",
      body: "17 yillik tomosha tajribamdan saralangan ro'yxat. Janrlar turli, lekin bittasi umumiy: tugatganingizdan keyin bir hafta o'ylab yurasiz.",
      topic: 'anime',
      tags: ['top10', 'tavsiya', 'klassika'],
      ago: 12 * HOUR,
      score: 420,
      comments: 73,
      collection: [
        { animeId: 'fmab', title: 'Fullmetal Alchemist: Brotherhood', note: "Ideal boshlanish, ideal yakun. 64 qismda bitta ham bo'sh qism yo'q." },
        { animeId: 'steins_gate', title: 'Steins;Gate', note: "Birinchi 8 qismga chidang — keyin to'xtay olmaysiz." },
        { animeId: 'vinland_saga', title: 'Vinland Saga', note: 'Qasos haqidagi eng halol hikoya.' },
        { animeId: 'frieren', title: 'Sousou no Frieren', note: "Vaqt, xotira va yo'qotish haqida she'r." },
        { animeId: 'attack_on_titan', title: 'Attack on Titan', note: "Har mavsumda janr o'zgaradi. Final bahsli, lekin unutilmas." },
        { animeId: 'hxh', title: 'Hunter x Hunter', note: 'Chimera Ant arki — shonenning eng yuqori cho\'qqisi.' },
        { animeId: 'monster', title: 'Monster', note: "Anime ko'rinishidagi eng yaxshi psixologik triller." },
        { animeId: 'mob_psycho', title: 'Mob Psycho 100', note: "Kuch emas, mehribonlik haqida. Animatsiyasi — sakuga bayrami." },
        { animeId: 'cowboy_bebop', title: 'Cowboy Bebop', note: "Jazz, koinot va melanxoliya. 1998-yilda yaratilgan, lekin eskirmagan." },
        { animeId: 'made_in_abyss', title: 'Made in Abyss', note: "Ogohlantirish: yoqimli rasm ortida juda og'ir hikoya." },
      ],
      thread: [
        ['u_jasur', "One Piece yo'qligi — jinoyat! Lekin ro'yxat zo'r.", 98, 30, [
          ['u_sardor', "One Piece — «bir marta ko'rish» emas, «butun hayot» :) Shuning uchun qo'shmadim.", 132, 45],
        ]],
        ['u_nilufar', "Monster'ni shu ro'yxat tufayli boshladim. 10 qism ko'rdim — ajoyib!", 54, 90],
        ['u_dilnoza', "Made in Abyss'ni yangi boshlovchilarga tavsiya qilish xavfli emasmi?", 44, 110, [
          ['u_sardor', "To'g'ri, izohda ogohlantirib qo'ydim. Lekin san'at sifatida ro'yxatda bo'lishi shart.", 31, 130],
        ]],
      ],
    },
    {
      id: 'c2',
      kind: 'collection',
      hubId: 'anime',
      authorId: 'u_kamola',
      title: "Yangi boshlovchilar uchun 8 ta anime: «qayerdan boshlay?» savoliga javob",
      body: "Do'stingiz anime ko'rishni boshlamoqchimi? Shu ro'yxatni yuboring — har biri qisqa, tushunarli va AniBla'da o'zbek tilida bor.",
      topic: 'anime',
      tags: ['boshlovchilar', 'tavsiya'],
      ago: 2 * DAY,
      score: 318,
      comments: 44,
      collection: [
        { animeId: 'death_note', title: 'Death Note', note: 'Aql o\'yini. 37 qism, bitta nafasda.' },
        { animeId: 'spy_family', title: 'Spy x Family', note: 'Butun oila bilan ko\'rsa bo\'ladigan komediya.' },
        { animeId: 'demon_slayer', title: 'Demon Slayer', note: "Vizual jihatdan eng chiroyli shonen." },
        { animeId: 'your_name', title: 'Kimi no Na wa.', note: "Bitta film — anime nima ekanini ko'rsatadi." },
        { animeId: 'fmab', title: 'Fullmetal Alchemist: Brotherhood', note: 'Klassika va oltin standart.' },
        { animeId: 'solo_leveling', title: 'Solo Leveling', note: "Tez templi, o'yinlar muxlislari uchun." },
        { animeId: 'frieren', title: 'Sousou no Frieren', note: 'Sekin, lekin unutilmas.' },
        { animeId: 'attack_on_titan', title: 'Attack on Titan', note: '1-mavsumdan keyin ortga yo\'l yo\'q.' },
      ],
      thread: [['u_lola', "Men Spy x Family'dan boshlagan bo'lardim — eng yengil kirish.", 21, 50]],
    },
    {
      id: 'c3',
      kind: 'collection',
      hubId: 'anime',
      authorId: 'u_jasur',
      title: "Eng kuchli 7 ta OST: quloqchinni taqing",
      body: 'Musiqa — animening yarmi. Mana mening shaxsiy reytingim.',
      topic: 'anime',
      tags: ['ost', 'musiqa', 'top7'],
      ago: 4 * DAY,
      score: 196,
      comments: 31,
      collection: [
        { animeId: 'cowboy_bebop', title: 'Cowboy Bebop', note: "«Tank!» — eng yaxshi opening, bahs yo'q." },
        { animeId: 'attack_on_titan', title: 'Attack on Titan', note: 'Sawano + epik xor = goosebumps.' },
        { animeId: 'frieren', title: 'Sousou no Frieren', note: "Evan Call — sokin va sehrli." },
        { animeId: 'vinland_saga', title: 'Vinland Saga', note: 'Shimoliy folk va orkestr.' },
        { animeId: 'your_name', title: 'Kimi no Na wa.', note: 'RADWIMPS — film bilan birga nafas oladi.' },
        { animeId: 'jujutsu_kaisen', title: 'Jujutsu Kaisen', note: "Shibuya arki OST'lari — qorong'u va kuchli." },
        { animeId: 'made_in_abyss', title: 'Made in Abyss', note: 'Kevin Penkin — tubsizlik ovozi.' },
      ],
    },
    {
      id: 'c4',
      kind: 'collection',
      hubId: null,
      authorId: 'u_me',
      title: "Mening 2026-yilgi top 5 ongoing'larim",
      body: "Har hafta kutadigan animelarim. Sizda qanday?",
      topic: 'anime',
      tags: ['ongoing', 'top5', '2026'],
      ago: 5 * DAY,
      score: 98,
      comments: 19,
      collection: [
        { animeId: 'frieren', title: 'Sousou no Frieren', note: 'Haftaning eng kutilgan 24 daqiqasi.' },
        { animeId: 'solo_leveling', title: 'Solo Leveling', note: 'Animatsiya — bayram.' },
        { animeId: 'sakamoto_days', title: 'Sakamoto Days', note: 'Eng kulgili jangari.' },
        { animeId: 'dandadan', title: 'Dandadan', note: 'Har qism — syurpriz.' },
        { animeId: 'jujutsu_kaisen', title: 'Jujutsu Kaisen', note: 'Culling Game boshlanishi kuchli.' },
      ],
      thread: [['u_kamola', 'One Piece qani?! :)', 12, 120]],
    },

    // ----------------------------------------------------------- POLLS
    {
      id: 'pl1',
      kind: 'poll',
      hubId: 'frieren',
      authorId: 'u_kamola',
      title: "Frieren 2-mavsumining hozirgacha eng yaxshi qismi qaysi?",
      body: 'Ovoz bering va izohda sababini yozing!',
      animeId: 'frieren',
      topic: 'anime',
      tags: ['frieren', 'sorovnoma'],
      ago: 8 * HOUR,
      score: 233,
      comments: 58,
      poll: {
        endsAt: 3 * DAY,
        options: [
          { id: 'a', text: "6-qism — «Ming yillik do'stlik»", votes: 412 },
          { id: 'b', text: '10-qism — «Shtarkning qasami»', votes: 288 },
          { id: 'c', text: '11-qism — «Oltin diyor»', votes: 356 },
          { id: 'd', text: '12-qism — «Qadimgi sehr»', votes: 501 },
        ],
      },
      thread: [
        ['u_kamola', '12-qism hali yangi, lekin 6-qism — klassika. Qiyin tanlov.', 33, 40],
        ['u_umid', "10-qism kam baholangan. Shtarkning qasami — mavsum tematikasining kaliti.", 28, 60],
      ],
    },
    {
      id: 'pl2',
      kind: 'poll',
      hubId: 'solo_leveling',
      authorId: 'u_shoxrux',
      title: 'Abadiy savol: Igris yoki Beru — kim kuchliroq soya?',
      body: "Faqat animedagi ko'rinishlarga asoslanib javob bering.",
      animeId: 'solo_leveling',
      topic: 'anime',
      tags: ['sololeveling', 'sorovnoma', 'igris', 'beru'],
      ago: 15 * HOUR,
      score: 187,
      comments: 96,
      poll: {
        endsAt: 2 * DAY,
        options: [
          { id: 'a', text: "Igris — sadoqatli ritsar", votes: 640 },
          { id: 'b', text: 'Beru — chumolilar qiroli', votes: 812 },
          { id: 'c', text: 'Ikkalasi teng', votes: 120 },
        ],
      },
      thread: [['u_azamat', "Beru, lekin Igris — qalbim bilan.", 41, 30]],
    },
    {
      id: 'pl3',
      kind: 'poll',
      hubId: 'anime',
      authorId: 'u_bekzod',
      title: "AniBla'da qaysi formatda ko'proq tomosha qilasiz?",
      body: "Jamiyat statistikasi uchun. Natijalar AniBla jamoasiga ham yuboriladi.",
      topic: 'anime',
      tags: ['sorovnoma', 'dublyaj', 'subtitr'],
      ago: 28 * HOUR,
      score: 142,
      comments: 64,
      poll: {
        endsAt: 5 * DAY,
        options: [
          { id: 'a', text: "O'zbekcha dublyaj", votes: 1204 },
          { id: 'b', text: "Yaponcha ovoz + o'zbekcha subtitr", votes: 488 },
          { id: 'c', text: 'Animega qarab ikkalasi ham', votes: 377 },
        ],
      },
    },

    // ----------------------------------------------------------- POSTS
    {
      id: 'p1',
      kind: 'post',
      hubId: 'frieren',
      authorId: 'u_umid',
      title: 'Nazariya: Frieren aslida Himmelni emas, o\'zini qidiryapti',
      body:
        "12-qismdan keyin bu nazariya menda to'liq shakllandi.\n\n" +
        "**1. Ruhlar makoni — maqsad emas, bahona.** Frieren Himmel bilan gaplashish uchun shimolga ketyapti, deb o'ylaymiz. Lekin har qismda u Himmelni emas, o'zining o'sha paytdagi his-tuyg'ularini eslaydi.\n\n" +
        "**2. Qadimgi sehr — xotira kaliti.** ||12-qismdagi formula Flammening emas, Frieren o'zi yozgan va unutgan sehr ekanligi ochildi.|| Ya'ni u o'z o'tmishini qayta o'qiyapti.\n\n" +
        "**3. Fern — Frieren'ning ko'zgusi.** Fern o'z his-tuyg'ularini darhol ifoda qiladi — Frieren 1000 yil davomida o'rgana olmagan narsa.\n\n" +
        "> Frieren vaqtni his qilmaydi. U faqat yo'qotishni his qiladi.",
      animeId: 'frieren',
      episode: 12,
      spoiler: true,
      topic: 'theory',
      tags: ['frieren', 'nazariya', 'tahlil'],
      ago: 5 * HOUR,
      score: 534,
      comments: 88,
      thread: [
        ['u_kamola', "Juda chuqur tahlil. Ayniqsa «Frieren vaqtni his qilmaydi, faqat yo'qotishni his qiladi» degan fikr.", 142, 30, [
          ['u_umid', 'Rahmat! Keyingi postda Fern bilan bog\'liq ikkinchi qatlamni yozaman.', 61, 50],
        ]],
        ['u_bekzod', "Qiziq, lekin qo'shilmayman. Frieren o'zini emas, Himmel uni nima uchun tanlaganini qidiryapti.", 88, 44, [
          ['u_umid', "Bu ham aslida o'zini qidirish-ku: «Men qanday odam edimki, u meni tanladi?»", 74, 58, [
            ['u_bekzod', 'Hmm... qabul qilaman. Ochko sizga.', 52, 75],
          ]],
        ]],
        ['u_me', "Nazariya Hub'idagi eng yaxshi post bo'lishga nomzod. Saqlab qo'ydim.", 33, 80],
      ],
    },
    {
      id: 'p2',
      kind: 'post',
      hubId: 'solo_leveling',
      authorId: 'u_azamat',
      title: "Jin-Woo'ning soyalar armiyasi: har bir soyaning reytingi (8-qismgacha)",
      body:
        "8-qismdagi «Arise» sahnasidan keyin soyalar armiyasini tartiblab chiqdim.\n\n" +
        "1. **Beru** — tezlik, kuch va... gapirish qobiliyati\n2. **Igris** — sadoqat va qilichbozlik ustasi\n3. **Tusk** — sehr va hududiy hujum\n4. **Iron** — tank va qalqon\n5. **Tank** — kichik, ammo jasur\n\n" +
        "||8-qismda Jin-Woo yangi soya — qirol darajasidagi ritsarni chaqirdi. Reyting butunlay o'zgarishi mumkin!||",
      animeId: 'solo_leveling',
      episode: 8,
      topic: 'anime',
      tags: ['sololeveling', 'reyting', 'soyalar'],
      ago: 2 * HOUR,
      score: 342,
      comments: 68,
      image: ANIME_BY_ID.solo_leveling.banner,
      thread: [
        ['u_shoxrux', 'Igrisni 2-o\'ringa qo\'yganingiz uchun hurmat. Beru ovozi esa — kulgili!', 47, 20],
        ['u_dilnoza', "Tank'ni unutmang! Kichik bo'lsa ham sodiq.", 29, 40, [
          ['u_azamat', 'Tank keyingi reytingda yuqoriroq bo\'ladi, va\'da :)', 18, 55],
        ]],
      ],
    },
    {
      id: 'p3',
      kind: 'post',
      hubId: 'one_piece',
      authorId: 'u_jasur',
      title: "1122-qism: Toei animatsiyasi nihoyat «Wano» darajasiga qaytdi",
      body:
        "Elbaf panoramasi, gigantlar shahri va kamera harakati — bu qism Wano arkining eng yaxshi qismlari bilan bemalol bellasha oladi.\n\n" +
        "Yangi animatsiya rejissyori har bir qismga kino uslubini olib kirmoqda. Aytinglar, sizga ham shunday tuyuldimi?",
      animeId: 'one_piece',
      episode: 1122,
      topic: 'anime',
      tags: ['onepiece', 'elbaf', 'animatsiya'],
      ago: 4 * HOUR,
      score: 298,
      comments: 52,
      image: ANIME_BY_ID.one_piece.banner,
      thread: [['u_timur', 'Fon chizmalari Ghibli darajasida edi. Daraxt-shahar panoramasi — wallpaper.', 37, 40]],
    },
    {
      id: 'p4',
      kind: 'post',
      hubId: 'memlar',
      authorId: 'u_shoxrux',
      title: 'Har juma kechqurun Frieren EDT ochilishini kutayotgan men:',
      body: '',
      animeId: 'frieren',
      topic: 'memes',
      tags: ['mem', 'frieren', 'edt'],
      ago: 7 * HOUR,
      score: 711,
      comments: 46,
      image: ANIME_BY_ID.frieren.cover,
      meme: { top: "AniBla: 12-qism 19:00 da chiqadi", bottom: 'Men 18:59 dan beri F5 bosib turibman' },
      thread: [
        ['u_lola', 'Bu men har juma soat 19:00 da :D', 61, 15],
        ['u_kamola', "Moderator sifatida tasdiqlayman: bu Hub'ning rasmiy holati.", 88, 30],
      ],
    },
    {
      id: 'p5',
      kind: 'post',
      hubId: 'fanart',
      authorId: 'u_madina',
      title: 'Frieren va Fern — raqamli akvarel (12 soatlik ish)',
      body: "6-qismdagi ko'l sahnasidan ilhomlandim. Procreate, 40+ qatlam. Yuqori sifatli versiyasi profilimda. Tanqidlarni kutaman!",
      animeId: 'frieren',
      topic: 'fanart',
      tags: ['fanart', 'frieren', 'akvarel'],
      ago: 10 * HOUR,
      score: 456,
      comments: 39,
      image: ANIME_BY_ID.frieren.banner,
      thread: [
        ['u_aziza', "Ranglar palitrasi juda nozik! Qaysi cho'tkadan foydalandingiz?", 24, 30, [
          ['u_madina', "Asosan «Wet Acrylic» va o'zim yasagan suv effekti cho'tkasi.", 15, 50],
        ]],
      ],
    },
    {
      id: 'p6',
      kind: 'post',
      hubId: 'fanart',
      authorId: 'u_aziza',
      title: 'Makima kosplayi: Toshkent Comic Con 2026 dan kadrlar',
      body: "Kostyumni 3 hafta tikdim, galstuk va ko'ylak — o'zim. Fotograf: do'stim. Keyingi kosplay uchun g'oyalar kutaman!",
      animeId: 'chainsaw_man',
      topic: 'fanart',
      tags: ['cosplay', 'makima', 'comiccon'],
      ago: 22 * HOUR,
      score: 233,
      comments: 27,
      image: ANIME_BY_ID.chainsaw_man.banner,
      thread: [['u_shoxrux', 'Keyingisi — Power! Ovoz beraman.', 19, 60]],
    },
    {
      id: 'p7',
      kind: 'post',
      hubId: 'manga_manhwa',
      authorId: 'u_dilnoza',
      title: "Solo Leveling manhwasi vs anime: 2-mavsumda nimalar tushirib qoldirildi?",
      body:
        "Manhwa'ni 3 marta o'qiganman, shuning uchun farqlarni yozib bordim.\n\n" +
        "- Cha Hae-In bilan kafedagi suhbat 4 sahifadan 30 soniyaga qisqargan\n- Jin-Woo onasi bilan sahna o'zgartirilgan\n- ||Qirol darvozasidagi yuz ochilishi animeda ertaroq ko'rsatildi||\n\n" +
        "Umuman olganda, moslashtirish — 8/10.",
      animeId: 'solo_leveling',
      episode: 8,
      spoiler: true,
      topic: 'manga',
      tags: ['manhwa', 'sololeveling', 'taqqoslash'],
      ago: 14 * HOUR,
      score: 187,
      comments: 34,
    },
    {
      id: 'p8',
      kind: 'post',
      hubId: 'yaponiya',
      authorId: 'u_timur',
      title: 'Tokioda 10 kun: Akihabara, Ghibli muzeyi va anime ziyoratgohlari bo\'yicha qo\'llanma',
      body:
        "O'zbekistondan Yaponiyaga birinchi marta borayotganlar uchun to'liq yo'riqnoma.\n\n" +
        "**Viza:** elektron viza, 5 ish kuni\n**Budjet:** kuniga ~60–80$ (yotoqxona + transport)\n**Majburiy joylar:** Akihabara, Nakano Broadway, Ghibli muzeyi (chiptani 1 oy oldin oling!), Suga ziyoratgohi — «Kimi no Na wa» zinapoyasi.\n\n" +
        "Savollar bo'lsa — izohda yozing.",
      animeId: 'your_name',
      topic: 'anime',
      tags: ['yaponiya', 'sayohat', 'tokio'],
      ago: 30 * HOUR,
      score: 321,
      comments: 58,
      image: ANIME_BY_ID.your_name.banner,
      thread: [['u_nilufar', 'Suga zinapoyasi — orzuim! Rahmat, saqlab qo\'ydim.', 26, 80]],
    },
    {
      id: 'p9',
      kind: 'post',
      hubId: 'sakamoto_days',
      authorId: 'u_otabek',
      title: "6-qism: jang sahnasini kadrma-kadr sekinlashtirib ko'rdim",
      body:
        "Sakamoto do'kon tokchasini qalqon qilib ishlatgan 12 soniyalik sahna — 280 ta kalit kadr. Bu TMS uchun juda katta raqam.\n\n" +
        "Eng yoqqan joy: ||Sakamoto og'irligi bilan pol taxtasini sindirib, raqibni pastga tushirgani||.",
      animeId: 'sakamoto_days',
      episode: 6,
      topic: 'anime',
      tags: ['sakamotodays', 'sakuga', 'animatsiya'],
      ago: 3 * HOUR,
      score: 144,
      comments: 21,
      image: ANIME_BY_ID.sakamoto_days.banner,
    },
    {
      id: 'p10',
      kind: 'post',
      hubId: 'jujutsu_kaisen',
      authorId: 'u_kamola',
      title: 'Culling Game: anime faqat ko\'rganlar uchun 5 ta taxmin',
      body:
        "Manga o'qimaganman, shuning uchun bular faqat animega asoslangan taxminlar:\n\n" +
        "1. Yuta asosiy o'yinchiga aylanadi\n2. Maki — eng kuchli insoniy jangchi bo'ladi\n3. Yangi qoidalar har qismda o'zgaradi\n4. Megumi markazga chiqadi\n5. Kenjaku rejasi faqat oxirida ochiladi",
      animeId: 'jujutsu_kaisen',
      topic: 'theory',
      tags: ['jjk', 'nazariya', 'cullinggame'],
      ago: 20 * HOUR,
      score: 265,
      comments: 47,
      thread: [['u_dilnoza', "Manga o'quvchi sifatida... hech narsa demayman :)", 54, 60]],
    },
    {
      id: 'p11',
      kind: 'post',
      hubId: 'frieren',
      authorId: 'u_me',
      title: "Frieren'dagi sehr tizimi: Zoltraak 80 yilda qanday «oddiy» sehrga aylandi",
      body:
        "Frieren olamidagi eng qiziq g'oya — sehr ham texnologiya kabi rivojlanadi.\n\n" +
        "**Qahramonlar davri:** Zoltraak — jin Qual yaratgan «qotil sehr», hech qanday himoya yo'q.\n**80 yildan keyin:** insonlar uni o'rganib, tahlil qilib, hamma biladigan «oddiy hujum sehri»ga aylantirdi.\n\n" +
        "Bu Frieren uchun muhim: u «vaqt o'tadi» degan haqiqatni sehr misolida ko'radi. Uning bilimi ham eskiradi.",
      animeId: 'frieren',
      topic: 'theory',
      tags: ['frieren', 'sehr', 'tahlil'],
      ago: 24 * HOUR,
      score: 212,
      comments: 26,
      thread: [
        ['u_umid', "Zoltraak misoli juda yaxshi tanlangan. «Evolyutsiya» g'oyasi Frieren'ning asosiy tematikasi.", 47, 60, [
          ['u_me', 'Rahmat, Umid aka! Sizning nazariyalaringizdan ilhomlandim.', 21, 90, [
            ['u_azamat', "Sehr — xuddi texnologiya: bugungi «yangi» ertaga «oddiy». Zo'r taqqoslash!", 19, 1380],
          ]],
        ]],
        ['u_kamola', "Aura epizodi bilan bog'lasangiz, nazariya yanada kuchli bo'lardi.", 26, 300],
      ],
    },
    {
      id: 'p12',
      kind: 'post',
      hubId: 'sakamoto_days',
      authorId: 'u_me',
      title: "Sakamoto Days — 2-mavsumdan kutganlarim",
      body: "1. Slur arki to'liq moslashtirilsin\n2. CG kamaysin\n3. ",
      animeId: 'sakamoto_days',
      topic: 'anime',
      tags: ['sakamotodays'],
      ago: 6 * HOUR,
      score: 0,
      comments: 0,
      status: 'draft',
    },
    {
      id: 'p13',
      kind: 'post',
      hubId: 'dandadan',
      authorId: 'u_lola',
      title: "Dandadan — men ko'rgan birinchi anime. Endi nimani ko'ray?",
      body: "Dandadan'ni 2 haftada tugatdim va butunlay sevib qoldim. Shunga o'xshash g'alati, kulgili va jangari anime tavsiya qiling!",
      animeId: 'dandadan',
      topic: 'anime',
      tags: ['tavsiya', 'dandadan', 'boshlovchi'],
      ago: 2 * DAY,
      score: 89,
      comments: 41,
      thread: [
        ['u_sardor', 'Mob Psycho 100 — xuddi shu energiya, xuddi shunday chiroyli.', 33, 30],
        ['u_azamat', 'Chainsaw Man! Lekin biroz qonliroq.', 21, 55],
      ],
    },
    {
      id: 'p14',
      kind: 'post',
      hubId: 'chainsaw_man',
      authorId: 'u_azamat',
      title: 'Reze filmi: eng qonli 5 sahnaning rejissyorlik tahlili (18+)',
      body: "Film zo'ravonlikni qanday qilib estetikaga aylantirgani haqida. Ogohlantirish: tavsiflarda qon va zo'ravonlik bor.",
      animeId: 'chainsaw_man',
      topic: 'theory',
      tags: ['chainsawman', 'reze', 'tahlil'],
      nsfw: true,
      ago: 26 * HOUR,
      score: 176,
      comments: 23,
      image: ANIME_BY_ID.chainsaw_man.cover,
    },
    {
      id: 'p15',
      kind: 'post',
      hubId: 'anime',
      authorId: 'u_bekzod',
      title: "AniBla'dagi o'zbekcha dublyaj sifati: 2 yil oldin va hozir",
      body:
        "2 yil oldin dublyajni faqat «tushunish uchun» ko'rardim. Hozir esa ba'zi animelarda yaponcha originaldan ham yaxshi ko'raman.\n\n" +
        "**Nima yaxshilandi:** ovoz aktyorlari soni, ovoz rejissurasi, ovoz balansi.\n**Nima yaxshilanishi kerak:** jang sahnalaridagi qichqiriqlar hali ham biroz sun'iy.",
      topic: 'anime',
      tags: ['anibla', 'dublyaj', 'fikr'],
      ago: 2 * DAY,
      score: 389,
      comments: 77,
      thread: [['u_anibla', "Fikr uchun rahmat! Jang sahnalari bo'yicha ovoz rejissurasini kuchaytiryapmiz.", 112, 120]],
    },
    {
      id: 'p16',
      kind: 'post',
      hubId: 'attack_on_titan',
      authorId: 'u_sardor',
      title: 'AoT finali — 2 yildan keyin qayta ko\'rdim. Fikrim o\'zgardi',
      body:
        "Final chiqqanda hamma qatori g'azablangan edim. Bugun, bir nafasda qayta ko'rgach, boshqacha ko'rinyapti: Erenning tanlovi — qahramonlik emas, fojia. Va asar buni oqlamaydi.",
      animeId: 'attack_on_titan',
      topic: 'theory',
      tags: ['aot', 'final', 'tahlil'],
      ago: 3 * DAY,
      score: 277,
      comments: 112,
      image: ANIME_BY_ID.attack_on_titan.banner,
      thread: [['u_umid', "Ha, birinchi ko'rishda biz hukm qilamiz, ikkinchisida — tushunamiz.", 58, 200]],
    },
  ];
}

const EDT_THREADS: Record<string, CNode[]> = {
  'edt-frieren-12': [
    ['u_kamola', "Final sahnasidagi «qadimgi sehr» — Frieren uni 1000 yil davomida yechmagan, chunki yechishni istamagan. Bu qism — butun mavsumning yuragi.", 248, 14, [
      ['u_umid', "Aynan! Formulani o'qiyotganda kamera Himmelning uzugiga o'tadi. ||Demak, sehr Himmel bilan bog'liq xotirani qaytaradi.|| Bu tasodif emas.", 131, 31, [
        ['u_me', "Uzuk detalini ikkinchi marta ko'rganimda payqadim. Madhouse har bir kadrni o'ylab chizgan.", 54, 50, [
          ['u_kamola', "Ha, rejissyor intervyusida ham «har bir kadrda Himmel bor» degan edi.", 22, 72],
        ]],
      ]],
      ['u_lola', "Men buni payqamabman... endi qaytadan ko'raman!", 18, 40],
    ]],
    ['u_azamat', "Shtarkning «qo'rqaman, lekin baribir oldinda turaman» degan gapi — mavsumning eng zo'r replikasi. O'zbekcha dublyajda ham juda kuchli chiqqan.", 196, 22, [
      ['u_nilufar', 'Dublyaj aktyori bu yerda haqiqatan ham o\'zini ko\'rsatdi. AniBla jamoasiga katta rahmat!', 67, 48],
    ]],
    ['u_sardor', "Evan Call musiqasi + Madhouse kompozitingi = san'at asari. 10/10, bahs qilmayman.", 163, 35, [
      ['u_bekzod', "Musiqa ha, lekin o'rtadagi jang sahnasi 8-qismdagidek suyuq emas edi. 9/10 deyman.", 41, 61, [
        ['u_sardor', "Frieren'da jang — asosiy narsa emas. Sukunat va pauza ham animatsiya, Bekzod.", 58, 80],
      ]],
    ]],
    ['u_jasur', "One Piece muxlisi sifatida aytaman: Frieren haftaning eng kutilgan 24 daqiqasi bo'lib qoldi.", 88, 55],
    ['u_otabek', "Fern qalqonni 0.3 soniyada chizgan kadrni sekinlashtirib ko'rdim — 47 ta alohida qatlam. Aqldan ozish.", 74, 90],
    ['u_madina', "Shu qism ilhomida yangi fan-art chizyapman, ertaga Fan-art Hub'ga joylayman!", 39, 110],
  ],
  'edt-solo_leveling-8': [
    ['u_azamat', "«Arise» sahnasi... 8 qism kutganimga arzidi. A-1 Pictures bu safar byudjetni ayamagan.", 310, 10, [
      ['u_otabek', "Soyalar paydo bo'lishidagi zarrachalar effekti — mavsumdagi eng yaxshi kompozit.", 92, 25],
      ['u_shoxrux', "Men: «faqat bitta qism ko'raman». Soat 3 tunda men: «ARISE»", 140, 33],
    ]],
    ['u_dilnoza', "Manhwa o'quvchi sifatida: bu qism manbaga 95% sodiq. Faqat Cha Hae-In bilan dialog qisqartirilgan.", 121, 40, [
      ['u_kamola', 'Qaysi joy qisqargan? Spoylersiz ayta olasizmi?', 18, 66, [
        ['u_dilnoza', "||Kafedagi suhbat — manhwada 4 sahifa, animeda 30 soniya.|| Lekin muhim emas.", 33, 81],
      ]],
    ]],
    ['u_nilufar', "Sawano OST'i shu qismda maksimalga chiqdi. Quloqchin bilan ko'ring!", 77, 58],
    ['u_me', "Igris va Beru bir kadrda — kim kuchliroq degan so'rovnomaga ovoz bering, Hub'da bor!", 45, 95],
  ],
  'edt-sakamoto_days-6': [
    ['u_nilufar', "Sakamoto o'z og'irligini qurol sifatida ishlatgani — eng kulgili va eng zo'r jang!", 88, 20, [
      ['u_otabek', 'Xoreografiya Jackie Chan filmlariga o\'xshaydi — atrofdagi har bir buyum qurol.', 51, 45],
    ]],
    ['u_lola', "Shin va Lu o'rtasidagi kimyo... spin-off kerak!", 34, 60],
    ['u_shoxrux', 'Sakamoto: dam olish kuni. Shuningdek Sakamoto: 40 nafar qotilni do\'kon peshtaxtasi bilan to\'xtatadi.', 66, 70],
  ],
  'edt-one_piece-1122': [
    ['u_jasur', "Elbaf! 25 yillik kutish. Gigantlar shahri dizayni — ajoyib.", 204, 15, [
      ['u_timur', "Fon chizmalari Ghibli darajasida edi. Ayniqsa daraxt-shahar panoramasi.", 77, 40],
      ['u_azamat', '1122 qism va hali ham har hafta kutaman. Bu — One Piece fenomeni.', 58, 52],
    ]],
    ['u_sardor', "Yangi animatsiya rejissyori kelganidan beri sifat keskin oshdi. Wano'dan keyingi eng yaxshi davr.", 96, 66],
    ['u_spam', "BEPUL AniBla Premium 1 yilga!!! Faqat bugun — profilimdagi havolaga kiring va kodni oling!!!", -12, 80],
  ],
  'edt-frieren-11': [
    ['u_kamola', "Oltin diyor sahnasidagi ranglar... Madhouse yana o'zini ko'rsatdi.", 96, 30],
    ['u_umid', "Bu qism 12-qism uchun mukammal tayyorgarlik bo'ldi.", 54, 80],
  ],
};

/* ------------------------------------------------------------------ */
/* Archive comments — deterministic "load more" for big EDT threads    */
/* ------------------------------------------------------------------ */

const ARCHIVE_TEMPLATES = [
  "{anime} bu hafta ham kutganimga arzidi. AniBla jamoasiga rahmat, tarjima juda tez chiqdi!",
  'Musiqa shu qismda alohida darajada edi, ayniqsa final sahnasida.',
  "Kim yana bu qismni 2 marta ko'rdi? Birinchi marta subtitr bilan, keyin dublyaj bilan ko'rdim.",
  "Animatsiya o'rtada biroz tushdi, lekin final hammasini oqladi.",
  'Keyingi qismgacha bir hafta... chidab bo\'lmaydi.',
  "Dublyaj ovozlari personajlarga juda mos tushgan, ayniqsa bosh qahramonga.",
  "Manga o'qiganlar, iltimos spoyler qilmanglar! ||Lekin keyingi qism yanada zo'r bo'ladi||",
  "Shu sahnadagi kadrlarni wallpaper qilib qo'ydim.",
  'Rejissyor kamerani juda chiroyli ishlatgan. Har bir kadr — rasm.',
  "{ep}-qism mavsumning eng yaxshi qismi bo'lishi mumkin.",
  'Kimdir tushuntirib bersin: oxirgi sahnada aslida nima bo\'ldi?',
  "AniBla'da 1080p da ko'rdim — sifat ajoyib.",
  "Do'stlarimga ham tavsiya qildim, endi uchalamiz har hafta birga ko'ramiz.",
  'Shu qismdan keyin bu personajni yaxshi ko\'rib qoldim.',
  "Fon musiqasi qayerda bor? Kimdir bilsa yozsin.",
  "Studiya bu mavsumga katta byudjet ajratgani sezilib turibdi.",
  "Har hafta EDT'ga birinchilardan bo'lib kirish — mening an'anam.",
  "Bu yerda o'zbek otakulari shunchalik ko'pligini bilmagan ekanman. Zo'r jamoa!",
  "Tarjimada bir-ikki joyda so'z o'yini yo'qolgan, lekin umuman olganda a'lo.",
  "Yig'lamayman deb va'da bergandim... yana yig'ladim.",
  'Mana shu sahna uchun butun mavsumni kutgan ekanman.',
  "Reytingim: 9/10. Faqat tempi biroz sekin.",
  "{anime} — hozirgi mavsumning eng yaxshi animesi, bahs qilmayman.",
  "Opening'ni hech qachon o'tkazib yubormayman.",
];

export function generateArchiveComments(post: Post, count: number, userIds: string[], now: number): Comment[] {
  const rand = mulberry32(hashString(post.id));
  const animeTitle = post.animeId ? ANIME_BY_ID[post.animeId]?.title ?? 'Bu anime' : 'Bu anime';
  const out: Comment[] = [];
  const span = Math.max(HOUR, now - post.createdAt);
  for (let i = 0; i < count; i++) {
    const t = ARCHIVE_TEMPLATES[Math.floor(rand() * ARCHIVE_TEMPLATES.length)];
    const author = userIds[Math.floor(rand() * userIds.length)];
    out.push({
      id: `arc:${post.id}:${i}`,
      postId: post.id,
      parentId: null,
      authorId: author,
      body: t.replace('{anime}', animeTitle).replace('{ep}', String(post.episode ?? '')),
      createdAt: post.createdAt + Math.floor(rand() * span * 0.9) + MIN,
      score: Math.floor(Math.pow(rand(), 2.2) * 90) + 1,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Assemble                                                            */
/* ------------------------------------------------------------------ */

export interface SeedData {
  users: User[];
  hubs: ReturnType<typeof createHubs>;
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
  modLog: ModLogEntry[];
}

export function createSeed(now: number): SeedData {
  const users = [
    ...createUsers(now),
    {
      id: 'u_spam', handle: 'premium_bepul', name: 'Premium Bepul', bio: '', level: 1, xp: 0, karma: -40,
      streak: 1, followers: 0, following: 900, palette: ['#64748B', '#94A3B8'] as [string, string], badges: [], joinedAt: now - 2 * DAY,
    },
    {
      id: 'u_troll', handle: 'anon_kritik', name: 'Anon Kritik', bio: '', level: 2, xp: 80, karma: -12,
      streak: 1, followers: 3, following: 12, palette: ['#475569', '#64748B'] as [string, string], badges: [], joinedAt: now - 9 * DAY,
    },
  ];
  const hubs = createHubs(now);
  const seeds = [...buildEdts(now), ...buildPosts()];
  const posts: Post[] = [];
  const comments: Comment[] = [];

  const walk = (postId: string, createdAt: number, nodes: CNode[], parentId: string | null, path: string) => {
    nodes.forEach(([authorId, body, score, minutes, replies], idx) => {
      const id = `${postId}~${path}${idx}`;
      comments.push({ id, postId, parentId, authorId, body, score, createdAt: Math.min(now - MIN, createdAt + minutes * MIN) });
      if (replies) walk(postId, createdAt, replies, id, `${path}${idx}.`);
    });
  };

  for (const s of seeds) {
    const { ago, comments: target, thread, ...rest } = s;
    const createdAt = now - ago;
    const poll = rest.poll ? { ...rest.poll, endsAt: now + rest.poll.endsAt } : undefined;
    const nodes = thread ?? EDT_THREADS[s.id] ?? [];
    const before = comments.length;
    walk(s.id, createdAt, nodes, null, '');
    const actual = comments.length - before;
    posts.push({
      ...rest,
      poll,
      tags: rest.tags ?? [],
      topic: rest.topic ?? 'anime',
      spoiler: rest.spoiler ?? false,
      nsfw: rest.nsfw ?? false,
      status: rest.status ?? 'public',
      createdAt,
      commentBase: Math.max(0, target - actual),
    });
  }

  const notifications: Notification[] = [
    { id: 'nt1', type: 'edt', title: "Frieren 2-mavsum 12-qism AniBla'da chiqdi", body: "«Qadimgi sehr» — rasmiy EDT muhokamasi ochildi. 342 ta izoh.", createdAt: now - 2 * HOUR, read: false, link: `/p/${edtId('frieren', 12)}` },
    { id: 'nt2', type: 'reply', title: '@azamat_otaku izohingizga javob yozdi', body: "«Sehr — xuddi texnologiya: bugungi «yangi» ertaga «oddiy»...»", createdAt: now - 1 * HOUR, read: false, link: '/p/p11' },
    { id: 'nt3', type: 'edt', title: 'Solo Leveling 8-qism EDT ochildi', body: '«Soyalar monarxi» — siz 7-qismgacha ko\'rgansiz, spoyler himoyasi yoqilgan.', createdAt: now - 6 * HOUR, read: false, link: `/p/${edtId('solo_leveling', 8)}` },
    { id: 'nt4', type: 'reply', title: "@azamat_otaku sharhingizni muhokama qilmoqda", body: '«Animatsiya 9.5 — qo\'shilaman. Lekin syujet 7.0 juda qattiq emasmi?»', createdAt: now - 5 * HOUR, read: false, link: '/p/r3' },
    { id: 'nt5', type: 'system', title: 'Olovli Streak: 19 kun!', body: 'Ertaga ham kiring va 20 kunlik marraga yeting (+50 XP).', createdAt: now - 9 * HOUR, read: true, link: '/me' },
    { id: 'nt6', type: 'edt', title: 'Sakamoto Days 6-qism chiqdi', body: '«Slur kelmoqda» — EDT muhokamasiga qo\'shiling.', createdAt: now - 20 * HOUR, read: true, link: `/p/${edtId('sakamoto_days', 6)}` },
    { id: 'nt7', type: 'system', title: 'Yangi nishon: Nazariyachi', body: 'Nazariyangiz 1,000+ karma to\'pladi. Nishon profilingizga qo\'shildi.', createdAt: now - 2 * DAY, read: true, link: '/me' },
    { id: 'nt8', type: 'system', title: "Otaku Beta'ga xush kelibsiz!", body: 'Beta Otaku nishoni berildi. AniBla akkauntingiz muvaffaqiyatli ulandi.', createdAt: now - 20 * DAY, read: true, link: '/p/n3' },
  ];

  const spamComment = comments.find((c) => c.authorId === 'u_spam')!;
  const trollComment = comments.find((c) => c.authorId === 'u_troll')!;

  const reports: Report[] = [
    { id: 'rep1', targetType: 'comment', targetId: spamComment.id, reason: 'spam', details: "Firibgarlik havolasi, bir nechta EDT'da takrorlangan.", reporterId: 'u_jasur', createdAt: now - 40 * MIN, status: 'open' },
    { id: 'rep2', targetType: 'post', targetId: 'p10', reason: 'spoiler', details: "Sarlavha va matnda manga voqealariga ishora bor, spoyler belgisi yo'q.", reporterId: 'u_dilnoza', createdAt: now - 3 * HOUR, status: 'open' },
    { id: 'rep3', targetType: 'comment', targetId: trollComment.id, reason: 'harassment', details: 'Muallifni shaxsan haqorat qilish.', reporterId: 'u_azamat', createdAt: now - 2 * HOUR, status: 'open' },
  ];

  const modLog: ModLogEntry[] = [
    { id: 'ml1', action: 'removed', targetType: 'comment', targetId: 'x1', summary: "Telegram-kanal reklamasi (@memlar)", moderator: 'shoxrux_meme', at: now - 1 * DAY },
    { id: 'ml2', action: 'spoilered', targetType: 'post', targetId: 'x2', summary: 'JJK manga bobi skrinshoti spoyler deb belgilandi (@jujutsu_kaisen)', moderator: 'kamola_senpai', at: now - 2 * DAY },
    { id: 'ml3', action: 'kept', targetType: 'post', targetId: 'x3', summary: "«Dublyaj sifati» posti — shikoyat asossiz deb topildi (@anime)", moderator: 'sardor_sensei', at: now - 3 * DAY },
  ];

  return { users, hubs, posts, comments, notifications, reports, modLog };
}

export const INITIAL_SUBSCRIPTIONS = ['frieren', 'solo_leveling', 'one_piece', 'sakamoto_days', 'yaponiya', 'anibla', 'anime', 'nazariyalar'];
export const INITIAL_PINNED = ['frieren', 'solo_leveling'];
export const INITIAL_WATCH: Record<string, number> = {
  frieren: 11,
  solo_leveling: 7,
  sakamoto_days: 6,
  one_piece: 1122,
};
export const INITIAL_BOOKMARKS = ['c1', 'p1', 'r1'];
