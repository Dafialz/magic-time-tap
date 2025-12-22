// src/components/UpgradesList.tsx
import React from "react";
import { formatNum } from "../utils/format";

/**
 * ✅ Вкладка "Друзі" (реф-система + завдання).
 *
 * Сервер:
 * - registerReferral  (callable)
 * - claimTaskReward   (callable)
 *
 * Дані беремо з users_v1/{uid}:
 * - refCount: number
 * - recentRefs: Array<{ id: string; name?: string; at?: number }>
 * - tasksCompleted: string[]
 *
 * ВАЖЛИВО: rules забороняють клієнту збільшувати balance,
 * тому MGP нараховує ТІЛЬКИ сервер.
 */

/* ========= Backward compatibility ========= */
export type Upgrade = {
  id: string;
  name: string;
  level: number;
  baseCost: number;
  costMult: number;
  clickPowerBonus?: number;
  autoPerSecBonus?: number;
};

/* ================= i18n (localStorage based) ================= */
type Lang = "en" | "zh" | "hi" | "es" | "ar" | "ru" | "fr";
const LS_LANG_KEY = "mt_lang_v1";
const LANGS: Lang[] = ["en", "zh", "hi", "es", "ar", "ru", "fr"];

function getLang(): Lang {
  try {
    const v = (localStorage.getItem(LS_LANG_KEY) || "").trim() as Lang;
    return LANGS.includes(v) ? v : "en";
  } catch {
    return "en";
  }
}

function localeByLang(lang: Lang): string {
  return lang === "ru"
    ? "ru-RU"
    : lang === "fr"
    ? "fr-FR"
    : lang === "es"
    ? "es-ES"
    : lang === "hi"
    ? "hi-IN"
    : lang === "zh"
    ? "zh-CN"
    : lang === "ar"
    ? "ar-SA"
    : "en-US";
}

function fmtIntByLang(n: number, lang: Lang) {
  try {
    return Math.floor(n).toLocaleString(localeByLang(lang));
  } catch {
    return String(Math.floor(n));
  }
}

function fmtDate(ms: number, lang: Lang) {
  try {
    return new Date(ms).toLocaleString(localeByLang(lang));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

type I18n = {
  title: string;

  connectingTitle: string;
  connectingBody: string;

  yourRefLink: string;
  inviteFriends: string;
  copy: string;
  share: string;

  friends: string;
  nextReward: string;
  forNthFriend: (n: number) => string;

  lastReferrals: string;
  empty: string;

  hintPrefix: string;
  hintOpenMiniapp: (bot: string, app: string) => string;

  tasksTitle: string;
  tasksSub: string;
  refresh: string;

  rewardLabel: string;

  toastCopied: string;
  toastOpenOk: string;
  toastCopyFail: string;

  alreadyCompleted: string;
  pressOpenFirst: string;
  verificationRunning: string;
  claimFailed: string;
  rewardGranted: string;

  refApplied: string;

  stageOpen: string;
  stageDone: string;
  stageClaim: string;

  hintStageOpen: string;
  hintStageWaitPrefix: string;
  hintStageWaitTail: string;
  hintStageClaim: string;
  hintStageDone: string;

  tooltipOpen: string;
  tooltipWait: string;
  tooltipClaim: string;
  tooltipDone: string;

  socialLinksStub: string;

  shareText: string;
  shareTextWithArrow: string;
  shareTitle: string;
  guest: string;

  mgpSuffix: string;
};

const I18N: Record<Lang, I18n> = {
  en: {
    title: "Friends",
    connectingTitle: "Connecting...",
    connectingBody: "Please wait while Firebase Auth connects.",
    yourRefLink: "Your referral link",
    inviteFriends: "Invite friends and earn MGP for each one.",
    copy: "Copy",
    share: "Share",
    friends: "Friends",
    nextReward: "Next reward",
    forNthFriend: (n) => `for your #${n} friend`,
    lastReferrals: "Recent referrals",
    empty: "Nothing here yet.",
    hintPrefix: "Tip:",
    hintOpenMiniapp: (bot, app) => `This link opens the mini app @${bot} via /${app} and passes startapp=ref_...`,
    tasksTitle: "Tasks for coins",
    tasksSub: "Press “Open”. After that, verification takes 1 hour and the button becomes “Claim”.",
    refresh: "Refresh",
    rewardLabel: "Reward",
    toastCopied: "Link copied ✅",
    toastOpenOk: "Link opened ✅",
    toastCopyFail: "Couldn’t copy 😕",
    alreadyCompleted: "This task is already completed ✅",
    pressOpenFirst: "Press “Open” first 👆",
    verificationRunning: "Verification still running ⏳",
    claimFailed: "Failed to claim task 😕",
    rewardGranted: "Reward granted ✅",
    refApplied: "Referral applied ✅",
    stageOpen: "Open",
    stageDone: "Completed",
    stageClaim: "Claim",
    hintStageOpen: "First press “Open”.",
    hintStageWaitPrefix: "Verification takes",
    hintStageWaitTail: "Time left:",
    hintStageClaim: "Verification complete ✅ You can press “Claim”.",
    hintStageDone: "Already completed ✅",
    tooltipOpen: "Open link",
    tooltipWait: "You must wait 1 hour",
    tooltipClaim: "Claim reward via server",
    tooltipDone: "Already completed",
    socialLinksStub: "⚠️ Social links are placeholders. Send your real links — I’ll replace them.",
    shareText: "My referral link in Magic Time",
    shareTextWithArrow: "My referral link in Magic Time 👇",
    shareTitle: "Magic Time",
    guest: "Guest",
    mgpSuffix: "MGP",
  },
  zh: {
    title: "好友",
    connectingTitle: "连接中...",
    connectingBody: "请等待 Firebase Auth 连接完成。",
    yourRefLink: "你的邀请链接",
    inviteFriends: "邀请好友，每位好友都可获得 MGP。",
    copy: "复制",
    share: "分享",
    friends: "好友数",
    nextReward: "下一奖励",
    forNthFriend: (n) => `第 ${n} 位好友`,
    lastReferrals: "最近邀请",
    empty: "暂时为空。",
    hintPrefix: "提示：",
    hintOpenMiniapp: (bot, app) => `该链接将通过 /${app} 打开 @${bot} 小程序，并传递 startapp=ref_...`,
    tasksTitle: "任务奖励",
    tasksSub: "点击“打开”。之后验证需要 1 小时，按钮会变成“领取”。",
    refresh: "刷新",
    rewardLabel: "奖励",
    toastCopied: "已复制链接 ✅",
    toastOpenOk: "已打开链接 ✅",
    toastCopyFail: "复制失败 😕",
    alreadyCompleted: "该任务已完成 ✅",
    pressOpenFirst: "请先点击“打开” 👆",
    verificationRunning: "验证进行中 ⏳",
    claimFailed: "领取失败 😕",
    rewardGranted: "奖励已发放 ✅",
    refApplied: "已记录邀请 ✅",
    stageOpen: "打开",
    stageDone: "已完成",
    stageClaim: "领取",
    hintStageOpen: "先点击“打开”。",
    hintStageWaitPrefix: "验证需要",
    hintStageWaitTail: "剩余：",
    hintStageClaim: "验证完成 ✅ 可以点击“领取”。",
    hintStageDone: "已完成 ✅",
    tooltipOpen: "打开链接",
    tooltipWait: "需要等待 1 小时",
    tooltipClaim: "通过服务器领取奖励",
    tooltipDone: "已完成",
    socialLinksStub: "⚠️ 社交链接为占位。发我真实链接，我来替换。",
    shareText: "我在 Magic Time 的邀请链接",
    shareTextWithArrow: "我在 Magic Time 的邀请链接 👇",
    shareTitle: "Magic Time",
    guest: "游客",
    mgpSuffix: "MGP",
  },
  hi: {
    title: "दोस्त",
    connectingTitle: "कनेक्ट हो रहा है...",
    connectingBody: "Firebase Auth कनेक्ट होने तक प्रतीक्षा करें।",
    yourRefLink: "आपका रेफ़रल लिंक",
    inviteFriends: "दोस्तों को आमंत्रित करें और हर दोस्त पर MGP कमाएँ।",
    copy: "कॉपी",
    share: "शेयर",
    friends: "दोस्त",
    nextReward: "अगला इनाम",
    forNthFriend: (n) => `${n}वें दोस्त पर`,
    lastReferrals: "हाल के रेफ़रल",
    empty: "अभी खाली है।",
    hintPrefix: "टिप:",
    hintOpenMiniapp: (bot, app) => `यह लिंक /${app} के जरिए @${bot} मिनीऐप खोलता है और startapp=ref_... भेजता है।`,
    tasksTitle: "कॉइन के लिए कार्य",
    tasksSub: "“Open” दबाएँ। उसके बाद सत्यापन 1 घंटा लेता है और बटन “Claim” बन जाता है।",
    refresh: "रिफ्रेश",
    rewardLabel: "इनाम",
    toastCopied: "लिंक कॉपी हो गया ✅",
    toastOpenOk: "लिंक खुल गया ✅",
    toastCopyFail: "कॉपी नहीं हो पाया 😕",
    alreadyCompleted: "यह टास्क पहले ही पूरा है ✅",
    pressOpenFirst: "पहले “Open” दबाएँ 👆",
    verificationRunning: "सत्यापन चल रहा है ⏳",
    claimFailed: "टास्क क्लेम नहीं हो पाया 😕",
    rewardGranted: "इनाम मिल गया ✅",
    refApplied: "रेफ़रल लागू ✅",
    stageOpen: "Open",
    stageDone: "पूरा",
    stageClaim: "Claim",
    hintStageOpen: "पहले “Open” दबाएँ।",
    hintStageWaitPrefix: "सत्यापन समय",
    hintStageWaitTail: "बाकी:",
    hintStageClaim: "सत्यापन पूरा ✅ अब “Claim” दबा सकते हैं।",
    hintStageDone: "पहले से पूरा ✅",
    tooltipOpen: "लिंक खोलें",
    tooltipWait: "1 घंटा इंतज़ार करें",
    tooltipClaim: "सर्वर से इनाम लें",
    tooltipDone: "पहले से पूरा",
    socialLinksStub: "⚠️ सोशल लिंक अभी placeholder हैं। अपने असली लिंक भेजो — मैं लगा दूँगा।",
    shareText: "Magic Time में मेरा रेफ़रल लिंक",
    shareTextWithArrow: "Magic Time में मेरा रेफ़रल लिंक 👇",
    shareTitle: "Magic Time",
    guest: "गेस्ट",
    mgpSuffix: "MGP",
  },
  es: {
    title: "Amigos",
    connectingTitle: "Conectando...",
    connectingBody: "Espera mientras Firebase Auth se conecta.",
    yourRefLink: "Tu enlace de referidos",
    inviteFriends: "Invita amigos y gana MGP por cada uno.",
    copy: "Copiar",
    share: "Compartir",
    friends: "Amigos",
    nextReward: "Siguiente recompensa",
    forNthFriend: (n) => `por tu amigo #${n}`,
    lastReferrals: "Referidos recientes",
    empty: "Aún está vacío.",
    hintPrefix: "Consejo:",
    hintOpenMiniapp: (bot, app) => `Este enlace abre la mini app @${bot} vía /${app} y pasa startapp=ref_...`,
    tasksTitle: "Tareas por monedas",
    tasksSub: "Pulsa “Abrir”. Luego la verificación tarda 1 hora y el botón será “Reclamar”.",
    refresh: "Actualizar",
    rewardLabel: "Recompensa",
    toastCopied: "Enlace copiado ✅",
    toastOpenOk: "Enlace abierto ✅",
    toastCopyFail: "No se pudo copiar 😕",
    alreadyCompleted: "Esta tarea ya fue completada ✅",
    pressOpenFirst: "Primero pulsa “Abrir” 👆",
    verificationRunning: "La verificación sigue ⏳",
    claimFailed: "No se pudo reclamar 😕",
    rewardGranted: "Recompensa otorgada ✅",
    refApplied: "Referido aplicado ✅",
    stageOpen: "Abrir",
    stageDone: "Completado",
    stageClaim: "Reclamar",
    hintStageOpen: "Primero pulsa “Abrir”.",
    hintStageWaitPrefix: "La verificación tarda",
    hintStageWaitTail: "Falta:",
    hintStageClaim: "Verificación lista ✅ Puedes pulsar “Reclamar”.",
    hintStageDone: "Ya completado ✅",
    tooltipOpen: "Abrir enlace",
    tooltipWait: "Debes esperar 1 hora",
    tooltipClaim: "Reclamar recompensa (servidor)",
    tooltipDone: "Ya completado",
    socialLinksStub: "⚠️ Los enlaces son de prueba. Pásame tus links reales y los cambio.",
    shareText: "Mi enlace de referidos en Magic Time",
    shareTextWithArrow: "Mi enlace de referidos en Magic Time 👇",
    shareTitle: "Magic Time",
    guest: "Invitado",
    mgpSuffix: "MGP",
  },
  ar: {
    title: "الأصدقاء",
    connectingTitle: "جارٍ الاتصال...",
    connectingBody: "انتظر حتى يتم الاتصال بـ Firebase Auth.",
    yourRefLink: "رابط الإحالة الخاص بك",
    inviteFriends: "ادعُ أصدقاءك واربح MGP لكل صديق.",
    copy: "نسخ",
    share: "مشاركة",
    friends: "الأصدقاء",
    nextReward: "المكافأة التالية",
    forNthFriend: (n) => `للصديق رقم ${n}`,
    lastReferrals: "آخر الإحالات",
    empty: "لا يوجد شيء بعد.",
    hintPrefix: "نصيحة:",
    hintOpenMiniapp: (bot, app) => `يفتح هذا الرابط تطبيق @${bot} المصغر عبر /${app} ويمرّر startapp=ref_...`,
    tasksTitle: "مهام مقابل عملات",
    tasksSub: "اضغط “فتح”. بعد ذلك التحقق يستغرق ساعة واحدة وسيصبح الزر “استلام”.",
    refresh: "تحديث",
    rewardLabel: "المكافأة",
    toastCopied: "تم نسخ الرابط ✅",
    toastOpenOk: "تم فتح الرابط ✅",
    toastCopyFail: "تعذر النسخ 😕",
    alreadyCompleted: "هذه المهمة مكتملة بالفعل ✅",
    pressOpenFirst: "اضغط “فتح” أولاً 👆",
    verificationRunning: "التحقق ما زال جاريًا ⏳",
    claimFailed: "تعذر الاستلام 😕",
    rewardGranted: "تمت إضافة المكافأة ✅",
    refApplied: "تم تسجيل الإحالة ✅",
    stageOpen: "فتح",
    stageDone: "مكتمل",
    stageClaim: "استلام",
    hintStageOpen: "اضغط “فتح” أولاً.",
    hintStageWaitPrefix: "التحقق يستغرق",
    hintStageWaitTail: "المتبقي:",
    hintStageClaim: "اكتمل التحقق ✅ يمكنك الضغط على “استلام”.",
    hintStageDone: "تم الاستلام ✅",
    tooltipOpen: "فتح الرابط",
    tooltipWait: "يجب الانتظار ساعة واحدة",
    tooltipClaim: "استلام المكافأة من الخادم",
    tooltipDone: "مكتمل",
    socialLinksStub: "⚠️ روابط السوشيال حالياً تجريبية. أرسل روابطك الحقيقية وسأضعها.",
    shareText: "رابط الإحالة الخاص بي في Magic Time",
    shareTextWithArrow: "رابط الإحالة الخاص بي في Magic Time 👇",
    shareTitle: "Magic Time",
    guest: "ضيف",
    mgpSuffix: "MGP",
  },
  ru: {
    title: "Друзья",
    connectingTitle: "Подключение...",
    connectingBody: "Подождите, пока подключится Firebase Auth.",
    yourRefLink: "Твой реф-линк",
    inviteFriends: "Приглашай друзей и получай MGP за каждого.",
    copy: "Скопировать",
    share: "Поделиться",
    friends: "Друзья",
    nextReward: "Следующая награда",
    forNthFriend: (n) => `за ${n}-го`,
    lastReferrals: "Последние рефералы",
    empty: "Пока пусто.",
    hintPrefix: "Подсказка:",
    hintOpenMiniapp: (bot, app) => `Линк открывает миниапку @${bot} через /${app} и передаёт startapp=ref_...`,
    tasksTitle: "Задания за монеты",
    tasksSub: "Нажми “Открыть”. После этого проверка займет 1 час, и кнопка станет “Получить”.",
    refresh: "Обновить",
    rewardLabel: "Награда",
    toastCopied: "Ссылка скопирована ✅",
    toastOpenOk: "Ссылка открыта ✅",
    toastCopyFail: "Не удалось скопировать 😕",
    alreadyCompleted: "Это задание уже засчитано ✅",
    pressOpenFirst: "Сначала нажми “Открыть” 👆",
    verificationRunning: "Проверка ещё идёт ⏳",
    claimFailed: "Не удалось засчитать задание 😕",
    rewardGranted: "Награда зачислена ✅",
    refApplied: "Реферал засчитан ✅",
    stageOpen: "Открыть",
    stageDone: "Засчитано",
    stageClaim: "Получить",
    hintStageOpen: "Сначала нажми “Открыть”.",
    hintStageWaitPrefix: "Проверка займет",
    hintStageWaitTail: "Осталось:",
    hintStageClaim: "Проверка завершена ✅ Можно нажать “Получить”.",
    hintStageDone: "Уже засчитано ✅",
    tooltipOpen: "Открыть ссылку",
    tooltipWait: "Нужно подождать 1 час",
    tooltipClaim: "Получить награду через сервер",
    tooltipDone: "Уже засчитано",
    socialLinksStub: "⚠️ Ссылки на соцсети сейчас заглушки. Скинь реальные — подставлю.",
    shareText: "Мой реф-линк в Magic Time",
    shareTextWithArrow: "Мой реф-линк в Magic Time 👇",
    shareTitle: "Magic Time",
    guest: "Гость",
    mgpSuffix: "MGP",
  },
  fr: {
    title: "Amis",
    connectingTitle: "Connexion...",
    connectingBody: "Attends que Firebase Auth se connecte.",
    yourRefLink: "Ton lien de parrainage",
    inviteFriends: "Invite des amis et gagne des MGP pour chacun.",
    copy: "Copier",
    share: "Partager",
    friends: "Amis",
    nextReward: "Prochaine récompense",
    forNthFriend: (n) => `pour ton ami n°${n}`,
    lastReferrals: "Parrainages récents",
    empty: "Rien pour l’instant.",
    hintPrefix: "Astuce :",
    hintOpenMiniapp: (bot, app) => `Ce lien ouvre la mini-app @${bot} via /${app} et passe startapp=ref_...`,
    tasksTitle: "Missions pour des pièces",
    tasksSub: "Clique sur “Ouvrir”. Ensuite la vérification dure 1 heure et le bouton devient “Réclamer”.",
    refresh: "Actualiser",
    rewardLabel: "Récompense",
    toastCopied: "Lien copié ✅",
    toastOpenOk: "Lien ouvert ✅",
    toastCopyFail: "Impossible de copier 😕",
    alreadyCompleted: "Cette mission est déjà validée ✅",
    pressOpenFirst: "Clique d’abord sur “Ouvrir” 👆",
    verificationRunning: "Vérification en cours ⏳",
    claimFailed: "Impossible de valider 😕",
    rewardGranted: "Récompense accordée ✅",
    refApplied: "Parrainage enregistré ✅",
    stageOpen: "Ouvrir",
    stageDone: "Validé",
    stageClaim: "Réclamer",
    hintStageOpen: "Clique d’abord sur “Ouvrir”.",
    hintStageWaitPrefix: "La vérification dure",
    hintStageWaitTail: "Restant :",
    hintStageClaim: "Vérification terminée ✅ Tu peux cliquer “Réclamer”.",
    hintStageDone: "Déjà validé ✅",
    tooltipOpen: "Ouvrir le lien",
    tooltipWait: "Attends 1 heure",
    tooltipClaim: "Réclamer la récompense (serveur)",
    tooltipDone: "Déjà validé",
    socialLinksStub: "⚠️ Les liens sont des placeholders. Envoie tes vrais liens — je les remplace.",
    shareText: "Mon lien de parrainage dans Magic Time",
    shareTextWithArrow: "Mon lien de parrainage dans Magic Time 👇",
    shareTitle: "Magic Time",
    guest: "Invité",
    mgpSuffix: "MGP",
  },
};

/* ===== reward plan ===== */

type RewardPlan = {
  levels: number[];
  cap: number;
};

const REWARD_PLAN: RewardPlan = {
  levels: [5_000, 10_000, 20_000, 40_000, 80_000, 160_000, 320_000, 640_000, 1_280_000, 2_560_000, 5_120_000],
  cap: 5_120_000,
};

function rewardForNthFriend(n: number): number {
  if (n <= 0) return 0;
  if (n <= REWARD_PLAN.levels.length) return REWARD_PLAN.levels[n - 1];
  return REWARD_PLAN.cap;
}

function nextRewardForCount(friendsCount: number): { nextN: number; amount: number } {
  const nextN = Math.max(1, Math.floor(friendsCount) + 1);
  return { nextN, amount: rewardForNthFriend(nextN) };
}

/* ===== Task config ===== */

export type TaskKey = "tiktok" | "facebook" | "instagram" | "twitter" | "youtube" | "vk" | "telegram" | "site";

type TaskDef = {
  key: TaskKey;
  title: string;
  reward: number;
  url: string;
};

const TASKS: TaskDef[] = [
  { key: "tiktok", title: "TikTok", reward: 5_000, url: "https://tiktok.com" },
  { key: "facebook", title: "Facebook", reward: 5_000, url: "https://facebook.com" },
  { key: "instagram", title: "Instagram", reward: 5_000, url: "https://instagram.com" },
  { key: "twitter", title: "X (Twitter)", reward: 5_000, url: "https://x.com" },
  { key: "youtube", title: "YouTube", reward: 5_000, url: "https://youtube.com" },
  { key: "vk", title: "VK", reward: 5_000, url: "https://vk.com" },
  { key: "telegram", title: "Telegram", reward: 5_000, url: "https://t.me" },
  { key: "site", title: "MAGT website", reward: 100_000, url: "https://magt.netlify.app/" },
];

/* ===== Types ===== */

export type ReferralLite = {
  id: string;
  name?: string;
  at?: number;
};

type LoadedUserData = {
  refCount: number;
  recentRefs: ReferralLite[];
  completedTasks: TaskKey[];
};

type Props = {
  userId?: string;
  nickname?: string;

  friendsCount?: number;
  recentRefs?: ReferralLite[];
  completedTasks?: TaskKey[];
};

/* ===== Firebase helpers ===== */

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID && e.VITE_FB_AUTH_DOMAIN);
}

async function withFirestore<T>(fn: (db: any, fs: any) => Promise<T>) {
  if (!hasFirebaseEnv()) return null as any;

  const appMod: any = await import("firebase/app");
  const fsMod: any = await import("firebase/firestore");

  const e = env();
  const cfg = {
    apiKey: e.VITE_FB_API_KEY,
    authDomain: e.VITE_FB_AUTH_DOMAIN,
    projectId: e.VITE_FB_PROJECT_ID,
    appId: e.VITE_FB_APP_ID,
  };

  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
  const db = fsMod.getFirestore(app);
  return await fn(db, fsMod);
}

async function withCallable<T>(fn: (app: any, functionsMod: any) => Promise<T>) {
  if (!hasFirebaseEnv()) return null as any;

  const appMod: any = await import("firebase/app");
  const functionsMod: any = await import("firebase/functions");

  const e = env();
  const cfg = {
    apiKey: e.VITE_FB_API_KEY,
    authDomain: e.VITE_FB_AUTH_DOMAIN,
    projectId: e.VITE_FB_PROJECT_ID,
    appId: e.VITE_FB_APP_ID,
  };

  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
  return await fn(app, functionsMod);
}

const FUNCTIONS_REGION = "europe-west1";
const FN_CLAIM_TASK = "claimTaskReward";
const FN_REGISTER_REF = "registerReferral";

/* ===== Telegram start param parsing ===== */

function readStartParam(): string {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    const sp = tg?.initDataUnsafe?.start_param;
    if (typeof sp === "string" && sp.trim()) return sp.trim();
  } catch {}

  try {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("tgWebAppStartParam") || q.get("startapp") || q.get("start_param");
    if (v && v.trim()) return v.trim();
  } catch {}

  return "";
}

function parseReferrerUid(startParam: string): string {
  const s = String(startParam || "").trim();
  const m = s.match(/^ref_(.+)$/i);
  if (!m) return "";
  return (m[1] || "").trim();
}

/* ===== UI helpers ===== */

const BOT_USERNAME = "MagicTimeTapBot"; // ✅ твоє: @MagicTimeTapBot

/**
 * ✅ ВАЖЛИВО:
 * Це short name, який ти задаєш в BotFather у /newapp (крок "choose a short name").
 * Після цього WebApp відкривається як: https://t.me/MagicTimeTapBot/<shortname>
 */
const WEBAPP_SHORT_NAME = "magictime"; // <- ЗМІНИ на свій реальний short name з BotFather

function makeRefLink(botUsername: string, webAppShortName: string, uid: string): string {
  const sp = `ref_${uid}`;
  const b = String(botUsername || "").replace(/^@/, "");
  const app = String(webAppShortName || "").trim();

  // ✅ Правильний формат для відкриття мініапки напряму
  // https://t.me/<bot>/<app>?startapp=<payload>
  if (app) {
    return `https://t.me/${b}/${encodeURIComponent(app)}?startapp=${encodeURIComponent(sp)}`;
  }

  // fallback (якщо app ще не заданий) — відкриє чат, але не WebApp
  return `https://t.me/${b}?startapp=${encodeURIComponent(sp)}`;
}

function normalizeTaskKey(x: any): TaskKey | null {
  const s = String(x ?? "").trim();
  if (s === "tiktok" || s === "facebook" || s === "instagram" || s === "twitter" || s === "youtube" || s === "vk" || s === "telegram" || s === "site")
    return s;
  return null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatEta(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}:${pad2(mm)}:${pad2(ss)}`;
  return `${mm}:${pad2(ss)}`;
}

// 1 година “перевірки”
const VERIFY_MS = 60 * 60 * 1000;

// localStorage key: коли юзер натиснув "Відкрити" для таску
function lsOpenKey(uid: string, task: TaskKey) {
  return `mt_task_open_v1:${uid}:${task}`;
}

function readOpenAt(uid: string, task: TaskKey): number | null {
  try {
    const raw = localStorage.getItem(lsOpenKey(uid, task));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeOpenAt(uid: string, task: TaskKey, ts: number) {
  try {
    localStorage.setItem(lsOpenKey(uid, task), String(ts));
  } catch {}
}

export default function UpgradesList(props: Props & any) {
  const [lang, setLang] = React.useState<Lang>(() => getLang());
  React.useEffect(() => {
    const onLang = (e: any) => {
      const next = String(e?.detail || "").trim() as Lang;
      setLang(LANGS.includes(next) ? next : getLang());
    };
    window.addEventListener("mt_lang", onLang as any);
    return () => window.removeEventListener("mt_lang", onLang as any);
  }, []);
  const t = React.useMemo(() => I18N[lang] ?? I18N.en, [lang]);

  const uid = String(props.userId || "").trim();
  const name = String(props.nickname || t.guest).trim();

  const [loaded, setLoaded] = React.useState<LoadedUserData>({
    refCount: Number.isFinite(props.friendsCount) ? Number(props.friendsCount) : 0,
    recentRefs: Array.isArray(props.recentRefs) ? props.recentRefs : [],
    completedTasks: Array.isArray(props.completedTasks)
      ? (props.completedTasks.map(normalizeTaskKey).filter(Boolean) as TaskKey[])
      : [],
  });

  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [refApplied, setRefApplied] = React.useState(false);

  // тикер для таймерів (щоб “через годину” кнопка ожила сама)
  const [, forceTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => forceTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  function showToast(s: string) {
    setToast(s);
    window.setTimeout(() => setToast(""), 2400);
  }

  const refLink = React.useMemo(() => {
    if (!uid) return "";
    return makeRefLink(BOT_USERNAME, WEBAPP_SHORT_NAME, uid);
  }, [uid]);

  const friendsCount = loaded.refCount || 0;
  const next = nextRewardForCount(friendsCount);
  const completed = React.useMemo(() => new Set<TaskKey>(loaded.completedTasks || []), [loaded.completedTasks]);

  async function reloadFromFirestore() {
    if (!uid) return;
    const res = await withFirestore(async (db, fs) => {
      const ref = fs.doc(db, "users_v1", uid);
      const snap = await fs.getDoc(ref);
      if (!snap.exists()) return null;

      const d: any = snap.data() || {};
      const refCount =
        typeof d.refCount === "number" && Number.isFinite(d.refCount) ? Math.max(0, Math.floor(d.refCount)) : 0;

      const recentRefsRaw: any[] = Array.isArray(d.recentRefs) ? d.recentRefs : [];
      const recentRefs: ReferralLite[] = recentRefsRaw
        .map((x) => ({
          id: String(x?.id ?? "").trim(),
          name: typeof x?.name === "string" ? x.name : "",
          at: typeof x?.at === "number" ? x.at : undefined,
        }))
        .filter((x) => !!x.id)
        .slice(0, 20);

      const tasksRaw: any[] = Array.isArray(d.tasksCompleted) ? d.tasksCompleted : [];
      const completedTasks: TaskKey[] = tasksRaw.map(normalizeTaskKey).filter(Boolean) as TaskKey[];

      return { refCount, recentRefs, completedTasks } as LoadedUserData;
    }).catch(() => null);

    if (res) setLoaded(res);
  }

  async function copyLink() {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      showToast(t.toastCopied);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = refLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast(t.toastCopied);
      } catch {
        showToast(t.toastCopyFail);
      }
    }
  }

  async function shareLink() {
    if (!refLink) return;
    const tg = (window as any)?.Telegram?.WebApp;

    try {
      if (tg?.openTelegramLink) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
          t.shareTextWithArrow
        )}`;
        tg.openTelegramLink(shareUrl);
        return;
      }
    } catch {}

    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: t.shareTitle,
          text: t.shareText,
          url: refLink,
        });
        return;
      }
    } catch {}

    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(t.shareTextWithArrow)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function claimTask(key: TaskKey) {
    if (!uid) return;

    if (completed.has(key)) {
      showToast(t.alreadyCompleted);
      return;
    }

    // безпека: не даємо claim раніше ніж через 1 годину після open
    const openedAt = readOpenAt(uid, key);
    if (!openedAt) {
      showToast(t.pressOpenFirst);
      return;
    }
    const readyAt = openedAt + VERIFY_MS;
    if (Date.now() < readyAt) {
      showToast(t.verificationRunning);
      return;
    }

    setBusy(true);
    const out = await withCallable(async (app, functionsMod) => {
      const fns = functionsMod.getFunctions(app, FUNCTIONS_REGION);
      const callable = functionsMod.httpsCallable(fns, FN_CLAIM_TASK);
      const res = await callable({ task: key });
      return (res?.data ?? null) as any;
    }).catch(() => null);
    setBusy(false);

    if (!out || out.ok !== true) {
      showToast(out?.message || t.claimFailed);
      return;
    }

    showToast(out?.message || t.rewardGranted);
    await reloadFromFirestore();
  }

  function openTask(task: TaskDef) {
    if (!uid) return;
    // запам'ятали момент відкриття
    writeOpenAt(uid, task.key, Date.now());

    // відкриваємо посилання (Telegram WebApp -> openLink краще)
    const tg = (window as any)?.Telegram?.WebApp;
    try {
      if (tg?.openLink) {
        tg.openLink(task.url);
        return;
      }
    } catch {}
    window.open(task.url, "_blank", "noopener,noreferrer");
  }

  // ✅ Авто-реєстрація реферала (1 раз), якщо є start_param = ref_<uid>
  React.useEffect(() => {
    if (!uid) return;
    if (refApplied) return;

    const start = readStartParam();
    const referrerUid = parseReferrerUid(start);
    if (!referrerUid) return;

    setRefApplied(true);

    (async () => {
      const out = await withCallable(async (app, functionsMod) => {
        const fns = functionsMod.getFunctions(app, FUNCTIONS_REGION);
        const callable = functionsMod.httpsCallable(fns, FN_REGISTER_REF);
        const res = await callable({ referrerUid });
        return (res?.data ?? null) as any;
      }).catch(() => null);

      if (out?.ok) {
        showToast(out?.message || t.refApplied);
        await reloadFromFirestore();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, refApplied]);

  // initial load
  React.useEffect(() => {
    if (!uid) return;
    reloadFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return (
    <section className="friends">
      <h2>{t.title}</h2>

      {!uid ? (
        <div className="card">
          <div className="title">{t.connectingTitle}</div>
          <div className="sub" style={{ marginTop: 6 }}>
            {t.connectingBody}
          </div>
        </div>
      ) : null}

      {/* REF LINK CARD */}
      <div className="card">
        <div className="row">
          <div>
            <div className="title">{t.yourRefLink}</div>
            <div className="sub">{t.inviteFriends}</div>
          </div>
          <div className="pill">{name}</div>
        </div>

        <div className="refbox">
          <div className="reflink">{uid ? refLink : "—"}</div>

          <div className="btnrow">
            <button className="btn" onClick={copyLink} disabled={!uid}>
              {t.copy}
            </button>
            <button className="btn primary" onClick={shareLink} disabled={!uid}>
              {t.share}
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="k">{t.friends}</div>
            <div className="v">{friendsCount}</div>
          </div>
          <div className="stat">
            <div className="k">{t.nextReward}</div>
            <div className="v">
              {formatNum(next.amount)} {t.mgpSuffix} <span className="muted">{t.forNthFriend(next.nextN)}</span>
            </div>
          </div>
        </div>

        <details className="acc">
          <summary>{t.lastReferrals}</summary>
          <div className="accBody">
            {(!loaded.recentRefs || loaded.recentRefs.length === 0) && (
              <div className="muted" style={{ padding: "6px 0" }}>
                {t.empty}
              </div>
            )}

            {loaded.recentRefs && loaded.recentRefs.length > 0 ? (
              <div className="refList">
                {loaded.recentRefs.slice(0, 20).map((r) => (
                  <div key={r.id} className="refItem">
                    <div className="refName">{r.name || r.id}</div>
                    <div className="refTs">{r.at ? fmtDate(r.at, lang) : ""}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </details>

        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12, fontWeight: 800 }}>
          {t.hintPrefix} <b>@{BOT_USERNAME}</b> — {t.hintOpenMiniapp(BOT_USERNAME, WEBAPP_SHORT_NAME)}
        </div>
      </div>

      {/* TASKS */}
      <div className="card">
        <div className="row">
          <div>
            <div className="title">{t.tasksTitle}</div>
            <div className="sub">{t.tasksSub}</div>
          </div>
          <button className="btn tiny" onClick={reloadFromFirestore} disabled={!uid || busy}>
            {t.refresh}
          </button>
        </div>

        <div className="tasks">
          {TASKS.map((task) => {
            const done = completed.has(task.key);
            const openedAt = uid ? readOpenAt(uid, task.key) : null;
            const readyAt = openedAt ? openedAt + VERIFY_MS : 0;
            const msLeft = openedAt ? Math.max(0, readyAt - Date.now()) : 0;

            const stage: "open" | "wait" | "claim" | "done" = done ? "done" : !openedAt ? "open" : msLeft > 0 ? "wait" : "claim";

            const btnText =
              stage === "done" ? t.stageDone : stage === "open" ? t.stageOpen : stage === "claim" ? t.stageClaim : t.stageClaim;

            const btnDisabled = !uid || busy || stage === "done" || stage === "wait";

            const onBtnClick = async () => {
              if (!uid) return;
              if (stage === "open") {
                openTask(task);
                showToast(t.toastOpenOk);
                return;
              }
              if (stage === "claim") {
                await claimTask(task.key);
                return;
              }
            };

            const titleText =
              stage === "open"
                ? t.tooltipOpen
                : stage === "wait"
                ? t.tooltipWait
                : stage === "claim"
                ? t.tooltipClaim
                : t.tooltipDone;

            return (
              <div key={task.key} className={`task ${done ? "done" : ""}`}>
                <div className="taskLeft">
                  <div className="taskTitle">{task.title}</div>
                  <div className="taskMeta">
                    {t.rewardLabel}: <b>{formatNum(task.reward)} {t.mgpSuffix}</b>
                  </div>

                  {!done ? (
                    <div className="taskHint">
                      {stage === "open" ? (
                        <>
                          <b>{t.hintStageOpen}</b>
                        </>
                      ) : stage === "wait" ? (
                        <>
                          {t.hintStageWaitPrefix} <b>1 hour</b>. {t.hintStageWaitTail} <b>{formatEta(msLeft)}</b>
                        </>
                      ) : stage === "claim" ? (
                        <>
                          {t.hintStageClaim}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="taskHint">{t.hintStageDone}</div>
                  )}
                </div>

                <div className="taskActions">
                  <button className={`btn primary single ${stage === "open" ? "open" : ""}`} onClick={onBtnClick} disabled={btnDisabled} title={titleText}>
                    {busy && stage !== "done" ? "..." : btnText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, opacity: 0.72, fontSize: 12, fontWeight: 800 }}>{t.socialLinksStub}</div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style>{`
        .friends h2{ margin-bottom:12px; }
        .card{
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px;
          padding:14px;
          margin-bottom:14px;
          box-shadow: inset 0 0 18px rgba(255,255,255,.03);
        }
        .row{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .title{ font-weight:1000; font-size:16px; }
        .sub{ opacity:.75; font-size:13px; margin-top:4px; }
        .pill{
          font-weight:900; font-size:12px;
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.18);
          opacity:.9;
          white-space:nowrap;
        }

        .refbox{ margin-top:12px; }
        .reflink{
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
          font-size:12px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(0,0,0,.25);
          border:1px solid rgba(255,255,255,.08);
          word-break:break-all;
        }
        .btnrow{ display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
        .btn{
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:#fff;
          cursor:pointer;
          font-weight:900;
        }
        .btn.primary{
          border:0;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%);
          color:#042018;
        }
        .btn.tiny{
          padding:8px 10px;
          border-radius:10px;
          font-size:12px;
          opacity:.9;
        }
        .btn:disabled{ opacity:.55; cursor:not-allowed; }

        .stats{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:10px;
          margin-top:12px;
        }
        .stat{
          padding:10px 12px;
          border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);
        }
        .k{ opacity:.75; font-size:12px; font-weight:800; }
        .v{ font-weight:1000; margin-top:4px; }
        .muted{ opacity:.65; font-weight:800; }

        .acc{
          margin-top:12px;
          padding:10px 12px;
          border-radius:14px;
          background:rgba(255,255,255,.03);
          border:1px dashed rgba(255,255,255,.12);
        }
        .acc summary{
          cursor:pointer;
          font-weight:900;
          opacity:.92;
        }
        .accBody{ margin-top:10px; }
        .refList{ display:flex; flex-direction:column; gap:8px; }
        .refItem{
          display:flex; justify-content:space-between; gap:10px;
          padding:8px 10px; border-radius:12px;
          background:rgba(0,0,0,.18);
          border:1px solid rgba(255,255,255,.06);
        }
        .refName{ font-weight:900; }
        .refTs{ opacity:.65; font-size:12px; }

        .tasks{ margin-top:12px; display:flex; flex-direction:column; gap:10px; }
        .task{
          display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
          padding:12px; border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);
        }
        .task.done{ opacity:.78; }
        .taskTitle{ font-weight:1000; }
        .taskMeta{ margin-top:4px; font-size:12px; opacity:.78; font-weight:800; }
        .taskHint{
          margin-top:8px;
          font-size:12px;
          opacity:.78;
          font-weight:800;
        }

        .taskActions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .btn.single{
          min-width: 124px;
          justify-content:center;
        }
        .btn.single.open{
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.12);
          color:#fff;
        }

        .toast{
          position:fixed;
          left:50%;
          transform:translateX(-50%);
          bottom:86px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(0,0,0,.75);
          border:1px solid rgba(255,255,255,.12);
          color:#fff;
          font-weight:900;
          z-index:999;
          max-width:min(92vw, 520px);
          text-align:center;
        }
      `}</style>
    </section>
  );
}
