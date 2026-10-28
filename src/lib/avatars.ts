/**
 * Anime character portraits (AniList CDN) used as profile pictures for
 * demo users and hubs. Every avatar renders an SVG illustration first, so a
 * failed request never shows a broken image or a bare letter circle.
 */
const C = 'https://s4.anilist.co/file/anilistcdn/character/large';

const CHARACTERS = {
  gintoki: `${C}/b672-cP5VPriN67xJ.png`,
  frieren: `${C}/b176754-PCnpqIOkjhFk.png`,
  fern: `${C}/b183965-uGFohBjlFoTp.png`,
  jinwoo: `${C}/b129928-BCEjVaP0AQSw.png`,
  luffy: `${C}/b40-MNypXsxSRb1R.png`,
  zoro: `${C}/b62-S7oAeA9WInjV.png`,
  sakamoto: `${C}/b196522-phOzXgufOs7R.png`,
  shin: `${C}/b196521-bedknWj9u7s2.png`,
  gojo: `${C}/b127691-9zqh1xpIubn7.png`,
  yuji: `${C}/b127212-FVm2tD0erQ5B.png`,
  denji: `${C}/b130102-FO1VHNnEnLlB.png`,
  makima: `${C}/b137080-UHcynYNjb5ZU.png`,
  momo: `${C}/b222594-24Jn7qlI5spH.png`,
  okarun: `${C}/b222593-qBqUvpodooAI.png`,
  thorfinn: `${C}/b10138-zOPrka0ddZOR.png`,
  levi: `${C}/b45627-CR68RyZmddGG.png`,
  anya: `${C}/b138100-4Li0tWRCa5bQ.png`,
  edward: `${C}/b11-TA5Nuk7EDUZG.jpg`,
  spike: `${C}/b1-ChxaldmieFlQ.png`,
  l: `${C}/b71-1W4panC53vfs.png`,
  okabe: `${C}/b35252-DY9TW6pusqeh.png`,
  marin: `${C}/b133676-kV2czE3C8Qls.png`,
  nezuko: `${C}/b127518-NRlq1CQ1v1ro.png`,
  mitsuha: `${C}/b121514-MGI7JRluscpz.png`,
  taki: `${C}/b121516-kuPVJLNsH5uE.png`,
  chika: `${C}/b121103-UGLxT8utLPnq.png`,
  saitama: `${C}/b73935-ON5d0mAcrItd.jpg`,
  guts: `${C}/b422-XTaiTuvRohsV.png`,
  ai: `${C}/b172759-cccVhJ2fQA92.png`,
  violet: `${C}/b90169-4wr1Zehnsac8.png`,
} as const;

export const USER_AVATARS: Record<string, string> = {
  u_me: CHARACTERS.gintoki,
  u_azamat: CHARACTERS.yuji,
  u_nilufar: CHARACTERS.nezuko,
  u_sardor: CHARACTERS.spike,
  u_madina: CHARACTERS.violet,
  u_jasur: CHARACTERS.zoro,
  u_kamola: CHARACTERS.fern,
  u_bekzod: CHARACTERS.edward,
  u_dilnoza: CHARACTERS.ai,
  u_otabek: CHARACTERS.shin,
  u_aziza: CHARACTERS.makima,
  u_shoxrux: CHARACTERS.chika,
  u_umid: CHARACTERS.l,
  u_lola: CHARACTERS.okarun,
  u_timur: CHARACTERS.taki,
};

export const HUB_AVATARS: Record<string, string> = {
  frieren: CHARACTERS.frieren,
  solo_leveling: CHARACTERS.jinwoo,
  one_piece: CHARACTERS.luffy,
  sakamoto_days: CHARACTERS.sakamoto,
  jujutsu_kaisen: CHARACTERS.gojo,
  chainsaw_man: CHARACTERS.denji,
  dandadan: CHARACTERS.momo,
  vinland_saga: CHARACTERS.thorfinn,
  attack_on_titan: CHARACTERS.levi,
  anime: CHARACTERS.anya,
  manga_manhwa: CHARACTERS.guts,
  nazariyalar: CHARACTERS.okabe,
  fanart: CHARACTERS.marin,
  memlar: CHARACTERS.saitama,
  yaponiya: CHARACTERS.mitsuha,
};

/** Accounts that wear the AniBla emblem instead of a character portrait. */
export const ANIBLA_ACCOUNTS = new Set(['u_anibla', 'u_bot', 'anibla']);
