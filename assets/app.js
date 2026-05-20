import { createRealtimeClient } from "./realtime.js";

const PROFILE_KEY = "drink-tactics-profile-v3";
const DEFAULT_HAND_LIMIT = 5;
const DEFAULT_INITIAL_HAND = 3;
const DEFAULT_MAX_DRINKS = 5;
const COUNTDOWN_SECONDS = 5;
const HEX_CHOICE_INTERVAL = 3;

const TIER_META = {
  silver: { label: "银色", short: "银", className: "tier-silver", order: 1 },
  gold: { label: "金色", short: "金", className: "tier-gold", order: 2 },
  prismatic: { label: "彩色", short: "彩", className: "tier-prismatic", order: 3 },
};

const CARD_DEFINITIONS = [
  { key: "unyielding-will", tier: "silver", name: "不屈意志", count: 3, type: "盾", timing: "插播阶段", effect: "本轮内，你免疫任何人的劝酒或指定。", mode: "defense", tags: ["defense"] },
  { key: "grab-bag", tier: "silver", name: "百宝袋", count: 3, type: "即时", timing: "插播阶段", effect: "全场除你之外，所有人各摸 1 张新牌。", mode: "special", special: "everyoneElseDraw", tags: ["instant"] },
  { key: "cybernetic-implant", tier: "silver", name: "源计划植入", count: 3, type: "被动", timing: "持续", effect: "每次你喝酒自动减半，最少半杯。", mode: "passive", tags: ["passive"] },
  { key: "pandoras-bench", tier: "silver", name: "潘朵拉的备战席", count: 3, type: "功能", timing: "你的回合", effect: "指定任意玩家，随机把他手里 1 张牌与牌堆中 1 张牌交换。", mode: "special", special: "pandoraSwap", needsTarget: true, tags: ["action"] },
  { key: "dd-block", tier: "silver", name: "DD街区", count: 3, type: "理财", timing: "回合开始", effect: "放弃普通摸牌，从牌堆顶翻 2 张，选 1 张留下。", mode: "action", special: "ddBlock", tags: ["action"] },
  { key: "open-fort", tier: "silver", name: "开摆", count: 2, type: "摆烂", timing: "插播阶段", effect: "离桌 5 分钟免喝，回来后自罚 1 杯。", mode: "discard", tags: ["instant"] },
  { key: "stand-united", tier: "silver", name: "并肩作战", count: 3, type: "被动", timing: "持续", effect: "当你被指定喝酒时，你左右两边的邻居必须陪你喝半杯。", mode: "passive", tags: ["passive"] },
  { key: "second-wind", tier: "silver", name: "复苏之风", count: 3, type: "防御", timing: "插播阶段", effect: "本次少喝半杯；若你已连续喝了 2 次或以上，额外摸 1 张牌。", mode: "defense", tags: ["defense"] },
  { key: "first-aid-kit", tier: "silver", name: "急救用具", count: 2, type: "救援", timing: "插播阶段", effect: "取消任意玩家本次半杯惩罚；如果救的是别人，你摸 1 张牌。", mode: "special", special: "firstAid", needsTarget: true, tags: ["instant"] },
  { key: "salvage-bin", tier: "silver", name: "打捞桶", count: 3, type: "回收", timing: "你的回合", effect: "从弃牌堆随机回收 1 张银色或金色海克斯；弃牌堆为空则改为摸 1 张。", mode: "special", special: "salvage", tags: ["action"] },
  { key: "interest", tier: "gold", name: "利滚利", count: 3, type: "存蓄", timing: "插播阶段", effect: "把当前要喝的酒存起来。下一轮指定任意 1 人，让他双倍喝掉你存的酒。", mode: "special", special: "interest", tags: ["instant"] },
  { key: "two-star-pair", tier: "gold", name: "二星成双", count: 3, type: "攻击", timing: "插播阶段", effect: "指定 1 名玩家。接下来 2 轮里，他只要喝酒，分量必须翻倍。", mode: "special", special: "twoStarPair", needsTarget: true, tags: ["instant"] },
  { key: "thieves-gloves", tier: "gold", name: "窃贼手套", count: 3, type: "偷窃", timing: "插播阶段", effect: "随机抽走指定玩家手里的 2 张牌。", mode: "special", special: "stealTwo", needsTarget: true, tags: ["instant"] },
  { key: "metabolic-accelerator", tier: "gold", name: "代谢增速器", count: 2, type: "被动", timing: "持续", effect: "无条件跳过接下来的 3 次喝酒惩罚。", mode: "passive", tags: ["passive"] },
  { key: "component-grab-bag", tier: "gold", name: "组件百宝袋", count: 3, type: "爆发", timing: "你的回合", effect: "立刻从牌堆连续抽 3 张牌；下轮你必须连喝 2 杯作为代价。", mode: "special", special: "drawThree", tags: ["action"] },
  { key: "demon-contract", tier: "gold", name: "恶魔契约", count: 2, type: "被动", timing: "持续", effect: "自己先干 1 杯。接下来 3 轮内，每轮限 1 次，随意指定任何人喝 1 杯。", mode: "passive", tags: ["passive"] },
  { key: "last-stand", tier: "gold", name: "背水一战", count: 2, type: "被动", timing: "持续", effect: "全场所有人替你喝 1 杯，本局你彻底安全，不再被指定。", mode: "passive", tags: ["passive"] },
  { key: "speculator-weapon", tier: "gold", name: "投机者武器", count: 3, type: "对决", timing: "你的回合", effect: "与指定玩家摇骰子。你赢了他喝 1 杯；你输了你喝 2 杯。", mode: "special", special: "diceDuel", needsTarget: true, tags: ["action"] },
  { key: "mercenary-heart", tier: "gold", name: "赏金猎人之心", count: 3, type: "爆发", timing: "插播阶段", effect: "如果你已连续喝了 3 盘，打出此牌收菜：全场除你之外每人干 1 杯。", mode: "special", special: "mercenaryHeart", tags: ["instant"] },
  { key: "pharmacist", tier: "gold", name: "药剂师", count: 2, type: "被动", timing: "持续", effect: "当你把别人灌下 1 杯酒时，可免除自己下一次喝酒惩罚。", mode: "passive", tags: ["passive"] },
  { key: "level-up", tier: "prismatic", name: "升级！", count: 2, type: "压制", timing: "持续", effect: "接下来 3 轮内，你说话就是规矩，谁插嘴或反驳直接喝半杯。", mode: "passive", tags: ["passive"] },
  { key: "golden-ticket", tier: "prismatic", name: "黄金门票", count: 2, type: "被动", timing: "持续", effect: "你使用任何攻击或防御类卡牌时，有 50% 几率不消耗。", mode: "passive", tags: ["passive"] },
  { key: "demon-lord", tier: "prismatic", name: "恶魔领主", count: 2, type: "降维", timing: "你的回合", effect: "指定 1 人。接下来 5 轮里，只要你喝酒，他必须陪同喝一模一样的分量。", mode: "special", special: "demonLord", needsTarget: true, tags: ["action"] },
  { key: "prismatic-grab-bag", tier: "prismatic", name: "棱彩百宝袋", count: 2, type: "天神", timing: "你的回合", effect: "从剩余牌堆里挑选 3 张金色海克斯加入手牌。", mode: "special", special: "takeThreeGold", tags: ["action"] },
  { key: "divine-refresh", tier: "prismatic", name: "神圣刷新", count: 2, type: "洗牌", timing: "插播阶段", effect: "全场所有人手牌混在一起重新洗牌并重新平分。", mode: "special", special: "refreshHands", tags: ["instant"] },
  { key: "cursed-crown", tier: "prismatic", name: "诅咒冠冕", count: 2, type: "被动", timing: "持续", effect: "你受到的所有喝酒惩罚永远翻倍；但你每次喝酒都可以拉 1 人陪你喝同等分量。", mode: "passive", tags: ["passive"] },
  { key: "radiant-armory", tier: "prismatic", name: "光明武器库", count: 2, type: "规矩", timing: "摸到亮出", effect: "现场临时胡编 1 条酒桌新规矩，违反者直接喝 1 杯，持续到游戏结束。", mode: "rule", tags: ["action"] },
  { key: "magic-heist", tier: "silver", name: "魔盗团的致敬", count: 3, type: "搞怪", timing: "插播阶段", effect: "锁定一名玩家，必须双手摸耳朵喝完本轮惩罚，放手加注半杯。", mode: "discard", tags: ["instant"] },
  { key: "project-silence", tier: "silver", name: "源计划：静默", count: 3, type: "控制", timing: "插播阶段", effect: "全场进入静默状态，接下来前三个说话的人每人自罚一小口。", mode: "discard", tags: ["instant"] },
  { key: "lead-singer", tier: "silver", name: "主唱闪亮登场", count: 3, type: "社死", timing: "插播阶段", effect: "强制本轮输家必须用歌剧美声或动漫腔高喊'谢主隆恩'后才能喝酒。", mode: "discard", tags: ["instant"] },
  { key: "golden-left-foot", tier: "silver", name: "黄金左脚", count: 3, type: "物理", timing: "插播阶段", effect: "受罚者必须用脚趾夹住杯子递给左边的人喂酒（或自己用脚夹着喝）。", mode: "discard", tags: ["instant"] },
  { key: "pandoras-cup", tier: "gold", name: "潘朵拉的酒杯", count: 3, type: "重铸", timing: "插播阶段", effect: "被指定喝酒时打出。将惩罚物重铸为桌上任意其他液体（白酒、野格、芥末可乐等）。", mode: "discard", tags: ["instant"] },
  { key: "mind-reading", tier: "gold", name: "赛博读心术", count: 3, type: "博弈", timing: "插播阶段", effect: "指定一人，双方盲猜 1-5 数字。猜中同数他替你喝双倍；否则你喝三倍。", mode: "special", special: "mindReading", needsTarget: true, tags: ["instant"] },
  { key: "ultimate-grab-bag", tier: "prismatic", name: "终极百宝袋", count: 2, type: "动乱", timing: "插播阶段", effect: "除你外所有人 3 秒内起立举手喊'我是内鬼'。最后反应者自罚一整杯并随机交出 2 张手牌。", mode: "special", special: "ultimateGrabBag", tags: ["instant"] },
];

const EVENT_TEMPLATES = [
  { type: "single", text: "{target}，立刻自罚半杯。", basePenalty: 0.5, targetMode: "random" },
  { type: "single", text: "{actor} 指定一人喝一杯。", basePenalty: 1, targetMode: "choose" },
  { type: "group", text: "全场每人喝半杯。", basePenalty: 0.5, targetMode: "all" },
  { type: "single", text: "{actor} 左手边的玩家喝 1 杯。", basePenalty: 1, targetMode: "left" },
  { type: "single", text: "{actor} 右手边的玩家喝 1 杯。", basePenalty: 1, targetMode: "right" },
  { type: "single", text: "全场手机电量最低的人喝 1 杯。（线下判定）", basePenalty: 1, targetMode: "random" },
  { type: "duel", text: "{actor} 与随机一人赛博摇骰子，输的人喝 1 杯。", basePenalty: 1, targetMode: "random" },
  { type: "single", text: "{actor} 指定一人喝 2 杯。", basePenalty: 2, targetMode: "choose" },
  { type: "group", text: "除 {actor} 外，每人喝半杯。", basePenalty: 0.5, targetMode: "allExceptActor" },
  { type: "single", text: "上一轮喝酒最多的人喝 1 杯。", basePenalty: 1, targetMode: "mostDrinks" },
];

const HEX_CHOICES_POOL = [
  { key: "hex-double-penalty", name: "双倍奉还", effect: "你指定的目标喝酒量翻倍", apply: (p) => { p.hexDoublePenalty = true; } },
  { key: "hex-shield", name: "铁壁防御", effect: "每局自动免疫 1 次惩罚", apply: (p) => { p.hexShieldCharges = 1; } },
  { key: "hex-lifesteal", name: "生命窃取", effect: "你指定别人喝酒时，自己回血半杯", apply: (p) => { p.hexLifesteal = true; } },
  { key: "hex-cursed", name: "诅咒冠冕", effect: "你喝酒翻倍，但每次可拉 1 人陪喝", apply: (p) => { p.hexCursed = true; } },
  { key: "hex-lucky", name: "幸运星", effect: "每回合摸牌时额外多摸 1 张", apply: (p) => { p.hexLucky = true; } },
  { key: "hex-vengeance", name: "复仇之魂", effect: "别人指定你喝酒时，反弹半杯给对方", apply: (p) => { p.hexVengeance = true; } },
  { key: "hex-blood-contract", name: "血色合同", effect: "面临喝酒惩罚时，公开微信聊天第一条可免喝，否则惩罚翻倍", apply: (p) => { p.hexBloodContract = true; } },
  { key: "hex-lucky-star", name: "天选福星", effect: "连续喝 3 次后，下轮输家喝的酒可指定别人代喝，并获得 1 张随机金卡", apply: (p) => { p.hexLuckyStar = true; } },
  { key: "hex-demon-pays", name: "恶魔买单", effect: "本局所有喝酒惩罚免喝，但每次免喝需公开一个丢脸秘密或发羞耻朋友圈", apply: (p) => { p.hexDemonPays = true; } },
  { key: "hex-bounty-foresight", name: "赏金猎人的远见", effect: "化身酒桌老赖，可拒绝喝酒。累计拒绝 4 次后爆仓：当场干掉一整瓶或买单", apply: (p) => { p.hexBountyForesight = true; p.bountyRefusals = 0; } },
  { key: "hex-stand-united-pain", name: "并肩作战：痛定思痛", effect: "与左右邻居结成生死羁绊，任意一人被罚，另外两人无条件陪同喝相同分量", apply: (p) => { p.hexStandUnitedPain = true; } },
];

const els = {
  stageLobby: document.querySelector("#stage-lobby"),
  stageLobbyRoom: document.querySelector("#stage-lobby-room"),
  stageGameplay: document.querySelector("#stage-gameplay"),
  stageLibrary: document.querySelector("#stage-library"),
  connectionStatus: document.querySelector("#connectionStatus"),
  serviceWarning: document.querySelector("#serviceWarning"),
  menuChoices: document.querySelector("#menuChoices"),
  menuCreateBtn: document.querySelector("#menuCreateBtn"),
  menuJoinBtn: document.querySelector("#menuJoinBtn"),
  homeFormPanel: document.querySelector("#homeFormPanel"),
  homeModeTitle: document.querySelector("#homeModeTitle"),
  backMenuBtn: document.querySelector("#backMenuBtn"),
  createFields: document.querySelector("#createFields"),
  joinFields: document.querySelector("#joinFields"),
  nicknameInput: document.querySelector("#nicknameInput"),
  createPasswordInput: document.querySelector("#createPasswordInput"),
  joinCodeInput: document.querySelector("#joinCodeInput"),
  joinPasswordInput: document.querySelector("#joinPasswordInput"),
  createRoomBtn: document.querySelector("#createRoomBtn"),
  joinRoomBtn: document.querySelector("#joinRoomBtn"),
  lobbyRoomTitle: document.querySelector("#lobbyRoomTitle"),
  lobbyRoomCode: document.querySelector("#lobbyRoomCode"),
  copyRoomBtn: document.querySelector("#copyRoomBtn"),
  leaveRoomBtn: document.querySelector("#leaveRoomBtn"),
  lobbyPlayers: document.querySelector("#lobbyPlayers"),
  roomNameInput: document.querySelector("#roomNameInput"),
  roomPasswordInput: document.querySelector("#roomPasswordInput"),
  clearPasswordInput: document.querySelector("#clearPasswordInput"),
  initialHandInput: document.querySelector("#initialHandInput"),
  handLimitInput: document.querySelector("#handLimitInput"),
  maxDrinksInput: document.querySelector("#maxDrinksInput"),
  saveSettingsBtn: document.querySelector("#saveSettingsBtn"),
  startRoomGameBtn: document.querySelector("#startRoomGameBtn"),
  roundStat: document.querySelector("#roundStat"),
  deckStat: document.querySelector("#deckStat"),
  discardStat: document.querySelector("#discardStat"),
  playerList: document.querySelector("#playerList"),
  turnPermissionHint: document.querySelector("#turnPermissionHint"),
  backLobbyBtn: document.querySelector("#backLobbyBtn"),
  currentPlayerName: document.querySelector("#currentPlayerName"),
  targetSelect: document.querySelector("#targetSelect"),
  handTitle: document.querySelector("#handTitle"),
  handLimitLabel: document.querySelector("#handLimitLabel"),
  handCards: document.querySelector("#handCards"),
  activeList: document.querySelector("#activeList"),
  logDrawer: document.querySelector("#logDrawer"),
  logList: document.querySelector("#logList"),
  clearLogBtn: document.querySelector("#clearLogBtn"),
  closeLogBtn: document.querySelector("#closeLogBtn"),
  toggleLogBtn: document.querySelector("#toggleLogBtn"),
  drawBtn: document.querySelector("#drawBtn"),
  drinkDrawBtn: document.querySelector("#drinkDrawBtn"),
  nextTurnBtn: document.querySelector("#nextTurnBtn"),
  ddBtn: document.querySelector("#ddBtn"),
  shuffleDiscardBtn: document.querySelector("#shuffleDiscardBtn"),
  toggleLibraryBtn: document.querySelector("#toggleLibraryBtn"),
  eventBtn: document.querySelector("#eventBtn"),
  closeLibraryBtn: document.querySelector("#closeLibraryBtn"),
  libraryGrid: document.querySelector("#libraryGrid"),
  toast: document.querySelector("#toast"),
  countdownOverlay: document.querySelector("#countdownOverlay"),
  countdownTimer: document.querySelector("#countdownTimer"),
  countdownEventText: document.querySelector("#countdownEventText"),
  resolutionOverlay: document.querySelector("#resolutionOverlay"),
  resolutionText: document.querySelector("#resolutionText"),
  hexChoiceOverlay: document.querySelector("#hexChoiceOverlay"),
  hexChoiceCards: document.querySelector("#hexChoiceCards"),
};

let realtime = { configured: false, reason: "正在连接 Firebase..." };
let libraryFilter = "all";
let libraryVisible = false;
let homeMode = "menu";
let state = createEmptyState();
let session = {
  roomCode: "",
  room: null,
  clientId: "",
  playerName: "",
  isHost: false,
  unsubscribe: null,
  busy: false,
};
let countdownInterval = null;

const profile = loadProfile();
session.clientId = profile.clientId;
session.playerName = profile.name;
els.nicknameInput.value = profile.name;

bindEvents();
render();
initRealtime();

setTimeout(() => {
  if (window.VanillaTilt) {
    VanillaTilt.init(document.querySelectorAll(".ar-card"), { max: 18, speed: 400, glare: true, "max-glare": 0.3, gyroscope: true });
  }
}, 500);

async function initRealtime() {
  try {
    console.log("[app.js] Initializing realtime client...");
    realtime = await createRealtimeClient();
    console.log("[app.js] Realtime client created, configured:", realtime.configured, "uid:", realtime.uid);
    if (realtime.configured) {
      console.log("[app.js] Using local clientId:", session.clientId);
      const savedRoomCode = sessionStorage.getItem("drink-tactics-room");
      if (savedRoomCode) {
        console.log("[app.js] Restoring room from sessionStorage:", savedRoomCode);
        session.roomCode = savedRoomCode;
        enterRoom(savedRoomCode);
      }
    } else {
      console.warn("[app.js] Realtime client not configured");
    }
  } catch (error) {
    console.error("[app.js] Failed to init realtime:", error);
    realtime = { configured: false, reason: `初始化失败：${error.message}` };
    showToast(`联机服务初始化失败: ${error.message}`);
  }
  render();
}

function createEmptyState() {
  return {
    started: false,
    phase: "normal",
    settings: { initialHand: DEFAULT_INITIAL_HAND, handLimit: DEFAULT_HAND_LIMIT, maxDrinks: DEFAULT_MAX_DRINKS },
    players: [],
    deck: [],
    discard: [],
    round: 1,
    currentIndex: 0,
    selectedTargetId: "",
    rules: [],
    log: [],
    currentEvent: null,
    countdownEndsAt: 0,
    countdownCards: [],
    hexChoices: [],
    hexPendingPlayers: [],
    hexChoiceRound: 0,
    actionTaken: false,
  };
}

function defaultRoomSettings(hostName) {
  return {
    roomName: `${hostName}的喝酒之弈`,
    hasPassword: false,
    passwordHash: "",
    initialHand: DEFAULT_INITIAL_HAND,
    handLimit: DEFAULT_HAND_LIMIT,
    maxDrinks: DEFAULT_MAX_DRINKS,
  };
}

function buildDeck() {
  return shuffle(
    CARD_DEFINITIONS.flatMap((def) =>
      Array.from({ length: def.count }, (_, i) => ({ ...def, uid: `${def.key}-${i + 1}-${cryptoRandomId()}` })),
    ),
  );
}

function buildGameState(room) {
  const settings = normalizeSettings(room.settings);
  const deck = buildDeck();
  const players = roomPlayers(room)
    .filter((p) => p.online !== false)
    .map((p) => createGamePlayer(p.name, p.id, p.seat, settings.maxDrinks));

  const game = {
    started: true,
    phase: "normal",
    settings: { initialHand: settings.initialHand, handLimit: settings.handLimit, maxDrinks: settings.maxDrinks },
    players,
    deck,
    discard: [],
    round: 1,
    currentIndex: 0,
    selectedTargetId: players[1]?.id || players[0]?.id || "",
    rules: [],
    log: [],
    currentEvent: null,
    countdownEndsAt: 0,
    countdownCards: [],
    hexChoices: [],
    hexPendingPlayers: [],
    hexChoiceRound: 0,
    actionTaken: false,
  };

  for (let r = 0; r < settings.initialHand; r += 1) {
    players.forEach((p) => {
      const card = game.deck.pop();
      if (card) p.hand.push(card);
    });
  }

  game.log.unshift({ id: `log-${cryptoRandomId()}`, time: shortTime(), message: `游戏开始！${players.length} 名玩家入座，每人发 ${settings.initialHand} 张手牌。初始血条：${settings.maxDrinks} 杯。` });
  return game;
}

function createGamePlayer(name, id, seat, maxDrinks) {
  return {
    id, name, seat,
    hand: [], active: [],
    remainingDrinks: maxDrinks,
    maxDrinks,
    drinkCount: 0,
    consecutiveDrinks: 0,
    isOut: false,
    storedDrink: 0,
    doubleRoundsLeft: 0,
    skipCount: 0,
    demonContractRoundsLeft: 0,
    demonContractUsesLeft: 0,
    demonLordTargetId: "",
    demonLordRoundsLeft: 0,
    lastStandUsed: false,
    hexDoublePenalty: false,
    hexShieldCharges: 0,
    hexLifesteal: false,
    hexCursed: false,
    hexLucky: false,
    hexVengeance: false,
    hexBloodContract: false,
    hexLuckyStar: false,
    hexDemonPays: false,
    hexBountyForesight: false,
    bountyRefusals: 0,
    hexStandUnitedPain: false,
  };
}

function normalizeSettings(s = {}) {
  return {
    roomName: s.roomName || "喝酒之弈房间",
    hasPassword: Boolean(s.hasPassword),
    passwordHash: s.passwordHash || "",
    initialHand: clamp(Number(s.initialHand) || DEFAULT_INITIAL_HAND, 1, 5),
    handLimit: clamp(Number(s.handLimit) || DEFAULT_HAND_LIMIT, 3, 8),
    maxDrinks: clamp(Number(s.maxDrinks) || DEFAULT_MAX_DRINKS, 1, 10),
  };
}

function normalizeState() {
  state.deck = Array.isArray(state.deck) ? state.deck : [];
  state.discard = Array.isArray(state.discard) ? state.discard : [];
  state.players = Array.isArray(state.players) ? state.players : [];
  state.log = Array.isArray(state.log) ? state.log : [];
  state.rules = Array.isArray(state.rules) ? state.rules : [];
  state.countdownCards = Array.isArray(state.countdownCards) ? state.countdownCards : [];
  state.hexChoices = Array.isArray(state.hexChoices) ? state.hexChoices : [];
  state.hexPendingPlayers = Array.isArray(state.hexPendingPlayers) ? state.hexPendingPlayers : [];
  state.currentEvent = state.currentEvent || null;
  state.phase = state.phase || "normal";
  state.round = state.round || 1;
  state.currentIndex = state.currentIndex ?? 0;
  state.selectedTargetId = state.selectedTargetId || "";
  state.actionTaken = state.actionTaken || false;
  state.started = state.started || false;
  state.settings = state.settings || {};
}

function normalizeStatePlayers() {
  if (!state.players) return;
  state.players.forEach((p) => {
    p.hexDoublePenalty = p.hexDoublePenalty || false;
    p.hexShieldCharges = p.hexShieldCharges || 0;
    p.hexLifesteal = p.hexLifesteal || false;
    p.hexCursed = p.hexCursed || false;
    p.hexLucky = p.hexLucky || false;
    p.hexVengeance = p.hexVengeance || false;
    p.hexBloodContract = p.hexBloodContract || false;
    p.hexLuckyStar = p.hexLuckyStar || false;
    p.hexDemonPays = p.hexDemonPays || false;
    p.hexBountyForesight = p.hexBountyForesight || false;
    p.bountyRefusals = p.bountyRefusals || 0;
    p.hexStandUnitedPain = p.hexStandUnitedPain || false;
    p.storedDrink = p.storedDrink || 0;
    p.doubleRoundsLeft = p.doubleRoundsLeft || 0;
    p.skipCount = p.skipCount || 0;
    p.demonContractRoundsLeft = p.demonContractRoundsLeft || 0;
    p.demonContractUsesLeft = p.demonContractUsesLeft || 0;
    p.demonLordTargetId = p.demonLordTargetId || "";
    p.demonLordRoundsLeft = p.demonLordRoundsLeft || 0;
    p.lastStandUsed = p.lastStandUsed || false;
    p.remainingDrinks = p.remainingDrinks ?? (p.maxDrinks || DEFAULT_MAX_DRINKS);
    p.maxDrinks = p.maxDrinks || DEFAULT_MAX_DRINKS;
    p.drinkCount = p.drinkCount || 0;
    p.consecutiveDrinks = p.consecutiveDrinks || 0;
    p.isOut = p.isOut || false;
    p.hand = p.hand || [];
    p.active = p.active || [];
  });
}

function loadProfile() {
  try {
    const sessionSaved = JSON.parse(sessionStorage.getItem("drink-tactics-session") || "{}");
    const localSaved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const clientId = sessionSaved.clientId || `guest-${cryptoRandomId()}`;
    const name = localSaved.name || sessionSaved.name || `弈手${Math.floor(100 + Math.random() * 900)}`;
    sessionStorage.setItem("drink-tactics-session", JSON.stringify({ clientId, name }));
    return { clientId, name };
  } catch {
    const clientId = `guest-${cryptoRandomId()}`;
    const name = `弈手${Math.floor(100 + Math.random() * 900)}`;
    sessionStorage.setItem("drink-tactics-session", JSON.stringify({ clientId, name }));
    return { clientId, name };
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: session.playerName }));
  sessionStorage.setItem("drink-tactics-session", JSON.stringify({ clientId: session.clientId, name: session.playerName }));
}

function getNickname() {
  const name = els.nicknameInput.value.trim().slice(0, 10);
  if (!name) { showToast("先给自己起个昵称。"); return ""; }
  session.playerName = name;
  saveProfile();
  return name;
}

async function createRoomFlow() {
  console.log("[app.js] createRoomFlow called");
  if (!ensureRealtime()) return;
  const name = getNickname();
  if (!name) return;
  console.log("[app.js] Starting room creation with name:", name);
  setBusy(true);
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = generateRoomCode();
      const settings = defaultRoomSettings(name);
      const password = els.createPasswordInput.value.trim();
      if (password) { settings.hasPassword = true; settings.passwordHash = await hashRoomPassword(code, password); }
      const player = createRoomPlayer(name, 0);
      const room = { code, hostId: session.clientId, hostName: name, phase: "lobby", settings, players: { [session.clientId]: player }, game: null, createdAt: Date.now(), updatedAt: Date.now() };
      try { await realtime.createRoom(room); await enterRoom(code); showToast(`房间 ${code} 创建成功。`); return; }
      catch (error) { if (!error.message.includes("房号已存在") || attempt === 5) throw error; }
    }
  } catch (error) { showToast(error.message); }
  finally { setBusy(false); }
}

async function joinRoomFlow() {
  if (!ensureRealtime()) return;
  const name = getNickname();
  if (!name) return;
  const code = normalizeRoomCode(els.joinCodeInput.value);
  if (code.length !== 6) { showToast("请输入 6 位房号。"); return; }
  setBusy(true);
  try {
    const room = await realtime.getRoom(code);
    if (!room) { showToast("没有找到这个房间。"); return; }
    const settings = normalizeSettings(room.settings);
    if (settings.hasPassword) {
      const inputHash = await hashRoomPassword(code, els.joinPasswordInput.value.trim());
      if (inputHash !== settings.passwordHash) { showToast("房间密码不对。"); return; }
    }
    const existing = room.players?.[session.clientId];
    const seat = existing?.seat ?? roomPlayers(room).length;
    await realtime.joinRoom(code, createRoomPlayer(name, seat));
    await enterRoom(code);
    showToast(`已加入房间 ${code}。`);
  } catch (error) { showToast(error.message); }
  finally { setBusy(false); }
}

async function enterRoom(code) {
  if (session.unsubscribe) { session.unsubscribe(); session.unsubscribe = null; }
  session.roomCode = code;
  sessionStorage.setItem("drink-tactics-room", code);
  session.unsubscribe = realtime.subscribeRoom(code, (room) => {
    if (!room) { showToast("房间已不存在。"); resetSessionToHome(); return; }
    session.room = room;
    session.isHost = room.hostId === session.clientId;
    state = room.game || createEmptyState();
    normalizeState();
    normalizeStatePlayers();
    render();
  });
  await realtime.setPlayerOnline(code, session.clientId, true);
}

async function leaveRoom() {
  if (session.roomCode && realtime.configured) { try { await realtime.setPlayerOnline(session.roomCode, session.clientId, false); } catch {} }
  sessionStorage.removeItem("drink-tactics-room");
  resetSessionToHome();
}

function resetSessionToHome() {
  if (session.unsubscribe) { session.unsubscribe(); session.unsubscribe = null; }
  session.roomCode = "";
  session.room = null;
  session.isHost = false;
  state = createEmptyState();
  sessionStorage.removeItem("drink-tactics-room");
  homeMode = "menu";
  render();
}

async function saveRoomSettings() {
  if (!ensureHost()) return;
  try {
    const room = session.room;
    const previous = normalizeSettings(room.settings);
    const next = { ...previous, roomName: els.roomNameInput.value.trim().slice(0, 14) || previous.roomName, initialHand: clamp(Number(els.initialHandInput.value) || previous.initialHand, 1, 5), handLimit: clamp(Number(els.handLimitInput.value) || previous.handLimit, 3, 8), maxDrinks: clamp(Number(els.maxDrinksInput.value) || previous.maxDrinks, 1, 10) };
    const password = els.roomPasswordInput.value.trim();
    if (els.clearPasswordInput.checked) { next.hasPassword = false; next.passwordHash = ""; }
    else if (password) { next.hasPassword = true; next.passwordHash = await hashRoomPassword(room.code, password); }
    await realtime.updateRoom(room.code, { settings: next });
    els.roomPasswordInput.value = "";
    els.clearPasswordInput.checked = false;
    showToast("房间设置已保存。");
  } catch (error) { showToast(`保存失败：${error.message}`); }
}

async function startRoomGame() {
  if (!ensureHost()) return;
  try {
    const players = roomPlayers(session.room).filter((p) => p.online !== false);
    if (players.length < 2) { showToast("至少 2 名在线玩家才能开局。"); return; }
    const game = buildGameState(session.room);
    await realtime.updateRoom(session.room.code, { phase: "playing", game });
  } catch (error) { showToast(`开局失败：${error.message}`); }
}

async function returnToLobby() {
  if (!session.isHost) { showToast("只有房主可以把牌局带回大厅。"); return; }
  if (!window.confirm("确定回到大厅并清空当前牌局吗？")) return;
  try { await realtime.updateRoom(session.room.code, { phase: "lobby", game: null }); }
  catch (error) { showToast(`返回大厅失败：${error.message}`); }
}

function currentPlayer() { return state.players[state.currentIndex]; }
function viewerPlayer() { return state.players.find((p) => p.id === session.clientId) || currentPlayer(); }
function targetPlayer() { return state.players.find((p) => p.id === state.selectedTargetId) || null; }
function getPlayerById(id) { return state.players.find((p) => p.id === id); }
function handLimit() { return clamp(Number(state.settings?.handLimit) || DEFAULT_HAND_LIMIT, 3, 8); }
function isCurrentActor() { if (!session.roomCode) return true; return currentPlayer()?.id === session.clientId; }
function ensureActor() { if (isCurrentActor()) return true; const p = currentPlayer(); showToast(p ? `现在轮到 ${p.name}。` : "还没有开始游戏。"); return false; }
function isInCountdown() { return state.phase === "countdown"; }
function canActInCountdown() { return isInCountdown() && state.countdownEndsAt > Date.now(); }

function drawCard(player = currentPlayer(), count = 1, options = {}) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (!state.deck.length) { if (!reshuffleDiscardIntoDeck(false)) break; }
    if (!options.ignoreLimit && player.hand.length >= handLimit()) { showToast(`${player.name} 手牌已达上限。`); break; }
    const card = state.deck.pop();
    if (!card) break;
    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

function drawForCurrent(reason = "摸牌") {
  if (!ensureActor()) return;
  if (state.actionTaken) { showToast("本回合已行动过，请等待下一位。"); return; }
  const player = currentPlayer();
  const extra = player.hexLucky ? 1 : 0;
  const drawn = drawCard(player, 1 + extra);
  if (drawn.length) { addLog(`${player.name}${reason}，获得「${drawn[0].name}」${extra ? " + 幸运星额外1张" : ""}。`); }
  state.actionTaken = true;
  showToast("本回合行动结束，点击「下一位」继续。");
  commitGame();
}

function triggerEvent() {
  if (!ensureActor()) return;
  const actor = currentPlayer();
  const available = EVENT_TEMPLATES.filter((e) => {
    if (e.targetMode === "choose") return true;
    if (e.targetMode === "all" || e.targetMode === "allExceptActor") return state.players.length >= 2;
    return state.players.length >= 2;
  });
  if (!available.length) { showToast("没有可用事件。"); return; }
  const template = available[randomIndex(available)];
  let event = { ...template, actorId: actor.id, targetId: "", resolved: false };

  if (template.targetMode === "random") {
    const candidates = state.players.filter((p) => p.id !== actor.id && !p.isOut);
    if (candidates.length) { event.targetId = candidates[randomIndex(candidates)].id; }
    else { event.targetId = actor.id; }
  } else if (template.targetMode === "left") {
    event.targetId = state.players[(state.currentIndex + 1) % state.players.length]?.id || actor.id;
  } else if (template.targetMode === "right") {
    event.targetId = state.players[(state.currentIndex - 1 + state.players.length) % state.players.length]?.id || actor.id;
  } else if (template.targetMode === "mostDrinks") {
    const sorted = [...state.players].sort((a, b) => b.drinkCount - a.drinkCount);
    event.targetId = sorted[0]?.id || actor.id;
  }

  const text = event.text.replace("{actor}", actor.name).replace("{target}", getPlayerById(event.targetId)?.name || "???");
  event.displayText = text;

  if (template.targetMode === "choose") {
    state.currentEvent = event;
    state.phase = "eventChoose";
    addLog(`事件：${text}（请 ${actor.name} 选择目标）`);
    commitGame();
    return;
  }

  startCountdown(event);
}

function confirmEventTarget() {
  if (!ensureActor()) return;
  if (!state.currentEvent) return;
  if (!state.selectedTargetId) { showToast("请先选择目标玩家。"); return; }
  state.currentEvent.targetId = state.selectedTargetId;
  const actor = currentPlayer();
  state.currentEvent.displayText = state.currentEvent.text.replace("{actor}", actor.name).replace("{target}", getPlayerById(state.selectedTargetId)?.name || "???");
  addLog(`${actor.name} 选择了目标：${getPlayerById(state.selectedTargetId)?.name}`);
  startCountdown(state.currentEvent);
}

function startCountdown(event) {
  state.currentEvent = event;
  state.phase = "countdown";
  state.countdownEndsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
  state.countdownCards = [];
  addLog(`⚡ 事件触发：${event.displayText} — ${COUNTDOWN_SECONDS}秒插播倒计时！`);
  commitGame();
  if (els.countdownOverlay) els.countdownOverlay.classList.remove("hidden");
  startCountdownTimer();
}

function startCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((state.countdownEndsAt - Date.now()) / 1000));
    if (els.countdownTimer) els.countdownTimer.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      resolveCountdown();
    }
  }, 200);
}

function resolveCountdown() {
  if (els.countdownOverlay) els.countdownOverlay.classList.add("hidden");
  state.phase = "resolution";
  const event = state.currentEvent;
  if (!event) { state.phase = "normal"; commitGame(); return; }

  const resolutionLog = [];
  const penalties = [];

  if (event.type === "duel") {
    const actor = getPlayerById(event.actorId);
    const target = getPlayerById(event.targetId);
    const actorRoll = Math.floor(Math.random() * 6) + 1;
    const targetRoll = Math.floor(Math.random() * 6) + 1;
    resolutionLog.push(`🎲 ${actor.name} 掷出 ${actorRoll}，${target.name} 掷出 ${targetRoll}`);
    if (actorRoll >= targetRoll) {
      resolutionLog.push(`${actor.name} 赢了！${target.name} 喝 ${event.basePenalty} 杯。`);
      penalties.push({ playerId: target.id, amount: event.basePenalty, reason: "摇骰子输了" });
    } else {
      resolutionLog.push(`${target.name} 赢了！${actor.name} 喝 ${event.basePenalty} 杯。`);
      penalties.push({ playerId: actor.id, amount: event.basePenalty, reason: "摇骰子输了" });
    }
  } else if (event.targetMode === "all" || event.targetMode === "allExceptActor") {
    state.players.forEach((p) => {
      if (event.targetMode === "allExceptActor" && p.id === event.actorId) return;
      if (p.isOut) return;
      penalties.push({ playerId: p.id, amount: event.basePenalty, reason: event.displayText });
    });
  } else {
    const target = getPlayerById(event.targetId);
    if (target && !target.isOut) {
      penalties.push({ playerId: target.id, amount: event.basePenalty, reason: event.displayText });
    }
  }

  const finalPenalties = applyPenaltyPipeline(penalties, resolutionLog);
  applyFinalPenalties(finalPenalties, resolutionLog);

  const resolutionText = resolutionLog.join("\n");
  state.currentEvent = { ...event, resolutionLog, finalPenalties };
  state.phase = "normal";

  addLog(`⚖️ 宣判：\n${resolutionText}`);

  checkHexChoiceTrigger();
  commitGame();
  showResolution(resolutionText);
}

function getNeighbors(player) {
  const idx = state.players.indexOf(player);
  if (idx < 0) return [];
  const left = state.players[(idx + 1) % state.players.length];
  const right = state.players[(idx - 1 + state.players.length) % state.players.length];
  return [left, right].filter((p) => p.id !== player.id);
}

function applyPenaltyPipeline(penalties, log) {
  const final = [];
  for (const penalty of penalties) {
    let amount = penalty.amount;
    let targetId = penalty.playerId;
    const target = getPlayerById(targetId);
    if (!target || target.isOut) continue;

    let immune = false;
    let skipUsed = false;
    let stored = false;
    let companionId = null;

    if (target.hexShieldCharges > 0) {
      target.hexShieldCharges -= 1;
      immune = true;
      log.push(`🛡️ ${target.name} 触发铁壁防御，免疫本次惩罚！`);
    }

    if (target.active.some((c) => c.key === "unyielding-will")) {
      immune = true;
      log.push(`🛡️ ${target.name} 打出「不屈意志」，免疫本次惩罚！`);
    }

    if (target.lastStandUsed === false && target.active.some((c) => c.key === "last-stand")) {
      target.lastStandUsed = true;
      log.push(`⚔️ ${target.name} 触发「背水一战」！全场所有人替他喝 1 杯，他本局不再被指定。`);
      state.players.forEach((p) => {
        if (p.id !== target.id && !p.isOut) {
          final.push({ playerId: p.id, amount: 1, reason: "背水一战替喝" });
        }
      });
      continue;
    }

    if (!immune) {
      if (target.hexDemonPays) {
        immune = true;
        log.push(`😈 ${target.name} 触发「恶魔买单」免喝！请公开一个丢脸秘密或发羞耻朋友圈。`);
      }

      if (target.hexBloodContract) {
        const reveal = window.confirm(`${target.name} 触发「血色合同」！是否公开微信聊天第一条来免喝？`);
        if (reveal) {
          immune = true;
          log.push(`📜 ${target.name} 选择公开聊天记录，免喝！`);
        } else {
          amount *= 2;
          log.push(`📜 ${target.name} 拒绝公开，惩罚翻倍 → ${amount} 杯`);
        }
      }

      if (target.hexBountyForesight) {
        const refuse = window.confirm(`${target.name} 触发「赏金猎人的远见」！是否拒绝本次喝酒？（累计拒绝 4 次将爆仓）`);
        if (refuse) {
          target.bountyRefusals = (target.bountyRefusals || 0) + 1;
          immune = true;
          log.push(`🎒 ${target.name} 拒绝喝酒！累计拒绝 ${target.bountyRefusals}/4 次。`);
          if (target.bountyRefusals >= 4) {
            target.remainingDrinks = 0;
            target.isOut = true;
            log.push(`💥 ${target.name} 爆仓！酒量耗尽，当场出局并需买单！`);
          }
        }
      }

      if (target.skipCount > 0) {
        target.skipCount -= 1;
        skipUsed = true;
        log.push(`💨 ${target.name} 的「代谢增速器」生效，跳过本次惩罚！`);
        continue;
      }

      if (target.active.some((c) => c.key === "cybernetic-implant")) {
        amount = Math.max(0.5, amount / 2);
        log.push(`🦾 ${target.name} 的「源计划植入」生效，喝酒减半 → ${amount} 杯`);
      }

      if (target.doubleRoundsLeft > 0) {
        amount *= 2;
        log.push(`⭐ ${target.name} 的「二星成双」生效，喝酒翻倍 → ${amount} 杯`);
      }

      if (target.hexDoublePenalty) {
        amount *= 2;
        log.push(`💥 ${target.name} 的「双倍奉还」海克斯生效 → ${amount} 杯`);
      }

      if (target.hexCursed) {
        amount *= 2;
        const neighbors = getNeighbors(target);
        if (neighbors.length) {
          companionId = neighbors[0].id;
          log.push(`👑 ${target.name} 的「诅咒冠冕」生效，喝酒翻倍 → ${amount} 杯，拉 ${getPlayerById(companionId).name} 陪喝！`);
        } else {
          log.push(`👑 ${target.name} 的「诅咒冠冕」生效，喝酒翻倍 → ${amount} 杯`);
        }
      }

      if (target.active.some((c) => c.key === "stand-united") || target.hexStandUnitedPain) {
        const neighbors = getNeighbors(target);
        const reason = target.hexStandUnitedPain ? "「痛定思痛」" : "「并肩作战」";
        for (const n of neighbors) {
          if (!n.isOut) {
            final.push({ playerId: n.id, amount: amount, reason: `${reason}陪 ${target.name} 喝` });
            log.push(`🤝 ${n.name} 因 ${reason} 陪喝 ${amount} 杯`);
          }
        }
      }

      if (target.demonLordRoundsLeft > 0 && target.demonLordTargetId) {
        const lordTarget = getPlayerById(target.demonLordTargetId);
        if (lordTarget && !lordTarget.isOut) {
          final.push({ playerId: lordTarget.id, amount: amount, reason: `「恶魔领主」陪 ${target.name} 喝` });
          log.push(`😈 ${lordTarget.name} 因「恶魔领主」陪喝 ${amount} 杯`);
        }
      }

      for (const card of state.countdownCards) {
        if (card.special === "interest" && card.playerId === target.id) {
          stored = true;
          target.storedDrink += amount;
          log.push(`💰 ${target.name} 使用「利滚利」，存下 ${amount} 杯酒！`);
        }
      }

      if (!stored) {
        final.push({ playerId: target.id, amount, reason: penalty.reason });
        if (companionId) {
          final.push({ playerId: companionId, amount, reason: `陪 ${target.name} 喝` });
        }
      }
    }
  }
  return final;
}

function applyFinalPenalties(penalties, log) {
  for (const p of penalties) {
    const player = getPlayerById(p.playerId);
    if (!player || player.isOut) continue;
    player.remainingDrinks = Math.max(0, player.remainingDrinks - p.amount);
    player.drinkCount += 1;
    player.consecutiveDrinks += 1;
    log.push(`🍺 ${player.name} 喝 ${p.amount} 杯（剩余 ${player.remainingDrinks}/${player.maxDrinks}）`);

    if (player.remainingDrinks <= 0) {
      player.isOut = true;
      log.push(`💀 ${player.name} 酒量耗尽，出局！`);
    }

    for (const other of state.players) {
      if (other.id !== player.id && !other.isOut && other.active.some((c) => c.key === "pharmacist")) {
        other.skipCount += 1;
        log.push(`💊 ${other.name} 的「药剂师」触发，获得 1 次免喝`);
      }
      if (other.id !== player.id && !other.isOut && other.hexLifesteal) {
        other.remainingDrinks = Math.min(other.maxDrinks, other.remainingDrinks + 0.5);
        log.push(`🧛 ${other.name} 的「生命窃取」回血半杯`);
      }
    }

    if (player.hexLuckyStar && player.consecutiveDrinks >= 3) {
      const goldCards = CARD_DEFINITIONS.filter((c) => c.tier === "gold");
      if (goldCards.length && player.hand.length < handLimit()) {
        const picked = goldCards[randomIndex(goldCards)];
        player.hand.push({ ...picked, uid: `${picked.key}-${cryptoRandomId()}` });
        log.push(`🍀 ${player.name} 触发「天选福星」！获得随机金色手牌「${picked.name}」，下轮可指定代喝！`);
      }
      player.consecutiveDrinks = 0;
    }
  }
}

function useCardInCountdown(cardUid) {
  if (!canActInCountdown()) return;
  const viewer = viewerPlayer();
  const cardIndex = viewer.hand.findIndex((c) => c.uid === cardUid);
  if (cardIndex < 0) return;

  const [card] = viewer.hand.splice(cardIndex, 1);

  if (card.needsTarget && !state.selectedTargetId) {
    viewer.hand.splice(cardIndex, 0, card);
    showToast("先选择目标玩家。");
    render();
    return;
  }

  card.playerId = viewer.id;
  state.countdownCards.push(card);

  if (card.mode === "defense") {
    viewer.active.push(card);
    addLog(`${viewer.name} 在插播阶段打出「${card.name}」`);
  } else if (card.mode === "special") {
    resolveSpecialCard(viewer, card);
    state.discard.push(card);
  } else {
    state.discard.push(card);
    addLog(`${viewer.name} 在插播阶段打出「${card.name}」`);
  }

  if (viewer.active.some((c) => c.key === "golden-ticket") && (card.tags?.includes("defense") || card.tags?.includes("instant")) && Math.random() < 0.5) {
    viewer.hand.push(card);
    state.discard = state.discard.filter((c) => c.uid !== card.uid);
    addLog(`✨ ${viewer.name} 的「黄金门票」触发，「${card.name}」未消耗！`);
  }

  commitGame();
}

function useCard(cardUid) {
  if (!ensureActor()) return;
  if (state.actionTaken) { showToast("本回合已行动过，请等待下一位。"); return; }
  if (isInCountdown()) { useCardInCountdown(cardUid); return; }
  const player = currentPlayer();
  const cardIndex = player.hand.findIndex((c) => c.uid === cardUid);
  if (cardIndex < 0) return;

  const [card] = player.hand.splice(cardIndex, 1);

  if (card.needsTarget && !targetPlayer()) {
    player.hand.splice(cardIndex, 0, card);
    showToast("先选择一名目标玩家。");
    render();
    return;
  }

  if (card.mode === "passive") {
    player.active.push(card);
    if (card.key === "metabolic-accelerator") player.skipCount = 3;
    if (card.key === "demon-contract") { player.demonContractRoundsLeft = 3; player.demonContractUsesLeft = 3; player.remainingDrinks = Math.max(0, player.remainingDrinks - 1); addLog(`${player.name} 自干 1 杯激活「恶魔契约」`); }
    addLog(`${player.name} 激活「${card.name}」`);
  } else if (card.mode === "rule") {
    createTableRule(player, card);
  } else if (card.mode === "special") {
    resolveSpecialCard(player, card);
    state.discard.push(card);
  } else if (card.mode === "action") {
    if (card.special === "ddBlock") { activateDD(); player.hand.splice(cardIndex, 0, card); return; }
    state.discard.push(card);
    addLog(`${player.name} 打出「${card.name}」`);
  } else {
    state.discard.push(card);
    addLog(`${player.name} 打出「${card.name}」`);
  }

  state.actionTaken = true;
  showToast("本回合行动结束，点击「下一位」继续。");

  if (player.active.some((c) => c.key === "golden-ticket") && (card.tags?.includes("defense") || card.tags?.includes("instant")) && Math.random() < 0.5) {
    player.hand.push(card);
    state.discard = state.discard.filter((c) => c.uid !== card.uid);
    addLog(`✨ ${player.name} 的「黄金门票」触发，「${card.name}」未消耗！`);
  }

  commitGame();
}

function createTableRule(player, card) {
  const rule = window.prompt("写下这条酒桌新规矩：", "说话不能带你字");
  if (rule && rule.trim()) {
    const text = rule.trim().slice(0, 48);
    state.rules.unshift({ id: `rule-${cryptoRandomId()}`, owner: player.name, text, cardName: card.name });
    player.active.push(card);
    addLog(`${player.name} 亮出「${card.name}」，新增规则：${text}`);
  } else {
    state.discard.push(card);
    addLog(`${player.name} 打出「${card.name}」，但没有设定新规则。`);
  }
}

function resolveSpecialCard(player, card) {
  const target = targetPlayer();

  if (card.special === "everyoneElseDraw") {
    const names = [];
    state.players.forEach((other) => { if (other.id === player.id) return; const drawn = drawCard(other, 1); if (drawn.length) names.push(other.name); });
    addLog(`${player.name} 打出「${card.name}」，${names.join("、") || "无人"}各摸 1 张。`);
    return;
  }

  if (card.special === "pandoraSwap") {
    if (!target || !target.hand.length || !state.deck.length) { addLog(`${player.name} 打出「${card.name}」，但目标没有手牌或牌堆已空。`); return; }
    const tci = randomIndex(target.hand);
    const dci = randomIndex(state.deck);
    const old = target.hand[tci];
    const nw = state.deck[dci];
    target.hand[tci] = nw;
    state.deck[dci] = old;
    addLog(`${player.name} 对 ${target.name} 使用「${card.name}」，随机交换 1 张牌。`);
    return;
  }

  if (card.special === "stealTwo") {
    if (!target || !target.hand.length) { addLog(`${player.name} 使用「${card.name}」，但目标没有手牌。`); return; }
    const stolen = [];
    while (target.hand.length && stolen.length < 2 && player.hand.length < handLimit()) { const [s] = target.hand.splice(randomIndex(target.hand), 1); player.hand.push(s); stolen.push(s.name); }
    addLog(`${player.name} 对 ${target.name} 使用「${card.name}」，偷走 ${stolen.length} 张牌。`);
    return;
  }

  if (card.special === "drawThree") {
    const drawn = drawCard(player, 3);
    addLog(`${player.name} 打出「${card.name}」，连抽 ${drawn.length} 张。`);
    return;
  }

  if (card.special === "salvage") {
    const candidates = state.discard.filter((d) => d.tier !== "prismatic");
    if (!candidates.length) { const drawn = drawCard(player, 1); addLog(`${player.name} 使用「${card.name}」，弃牌堆无可用牌，改为摸 ${drawn.length} 张。`); return; }
    const picked = candidates[randomIndex(candidates)];
    state.discard = state.discard.filter((d) => d.uid !== picked.uid);
    if (player.hand.length < handLimit()) { player.hand.push(picked); addLog(`${player.name} 使用「${card.name}」，回收「${picked.name}」。`); }
    else { state.discard.push(picked); addLog(`${player.name} 使用「${card.name}」，手牌已满，回收失败。`); }
    return;
  }

  if (card.special === "takeThreeGold") {
    const gained = [];
    for (let i = state.deck.length - 1; i >= 0 && gained.length < 3; i -= 1) { if (state.deck[i].tier === "gold" && player.hand.length < handLimit()) { const [g] = state.deck.splice(i, 1); player.hand.push(g); gained.push(g.name); } }
    addLog(`${player.name} 打出「${card.name}」，获得 ${gained.length} 张金色海克斯。`);
    return;
  }

  if (card.special === "refreshHands") {
    const all = shuffle(state.players.flatMap((p) => p.hand.splice(0)));
    let c = 0;
    while (all.length) { state.players[c % state.players.length].hand.push(all.pop()); c += 1; }
    addLog(`${player.name} 打出「${card.name}」，全场手牌重洗平分。`);
    return;
  }

  if (card.special === "firstAid") {
    if (target) { target.consecutiveDrinks = 0; addLog(`${player.name} 对 ${target.name} 使用「急救用具」，取消本次惩罚。`); if (target.id !== player.id) { drawCard(player, 1); addLog(`${player.name} 救了别人，摸 1 张牌。`); } }
    return;
  }

  if (card.special === "interest") {
    addLog(`${player.name} 使用「利滚利」，存下当前酒量。`);
    return;
  }

  if (card.special === "twoStarPair") {
    if (target) { target.doubleRoundsLeft = 2; addLog(`${player.name} 对 ${target.name} 使用「二星成双」，接下来 2 轮喝酒翻倍。`); }
    return;
  }

  if (card.special === "mercenaryHeart") {
    if (player.consecutiveDrinks >= 3) {
      state.players.forEach((p) => { if (p.id !== player.id && !p.isOut) { p.remainingDrinks = Math.max(0, p.remainingDrinks - 1); p.drinkCount += 1; } });
      addLog(`${player.name} 打出「赏金猎人之心」！全场除他之外每人干 1 杯！`);
      player.consecutiveDrinks = 0;
    } else {
      addLog(`${player.name} 打出「赏金猎人之心」，但连续喝酒次数不足 3，效果未触发。`);
    }
    return;
  }

  if (card.special === "diceDuel") {
    if (!target) return;
    const a = Math.floor(Math.random() * 6) + 1;
    const t = Math.floor(Math.random() * 6) + 1;
    if (a >= t) { target.remainingDrinks = Math.max(0, target.remainingDrinks - 1); target.drinkCount += 1; addLog(`🎲 ${player.name}(${a}) vs ${target.name}(${t})，${player.name} 赢！${target.name} 喝 1 杯。`); }
    else { player.remainingDrinks = Math.max(0, player.remainingDrinks - 2); player.drinkCount += 1; addLog(`🎲 ${player.name}(${a}) vs ${target.name}(${t})，${target.name} 赢！${player.name} 喝 2 杯。`); }
    if (player.remainingDrinks <= 0) { player.isOut = true; addLog(`💀 ${player.name} 出局！`); }
    if (target.remainingDrinks <= 0) { target.isOut = true; addLog(`💀 ${target.name} 出局！`); }
    return;
  }

  if (card.special === "demonLord") {
    if (target) { player.demonLordTargetId = target.id; player.demonLordRoundsLeft = 5; addLog(`${player.name} 对 ${target.name} 使用「恶魔领主」，接下来 5 轮陪喝。`); }
    return;
  }

  if (card.special === "mindReading") {
    if (!target) return;
    const pGuess = window.prompt(`${player.name} 盲猜一个 1-5 的数字：`, "3");
    const tGuess = window.prompt(`${target.name} 盲猜一个 1-5 的数字：`, "3");
    if (pGuess === tGuess && pGuess) {
      target.remainingDrinks = Math.max(0, target.remainingDrinks - 2);
      target.drinkCount += 1;
      addLog(`🧠 赛博读心术成功！${player.name} 和 ${target.name} 都猜了 ${pGuess}。${target.name} 替你喝双倍！`);
    } else {
      player.remainingDrinks = Math.max(0, player.remainingDrinks - 3);
      player.drinkCount += 1;
      addLog(`🧠 赛博读心术失败！${player.name}(${pGuess}) vs ${target.name}(${tGuess})。${player.name} 含泪喝三倍！`);
    }
    if (player.remainingDrinks <= 0) { player.isOut = true; addLog(`💀 ${player.name} 出局！`); }
    if (target.remainingDrinks <= 0) { target.isOut = true; addLog(`💀 ${target.name} 出局！`); }
    return;
  }

  if (card.special === "ultimateGrabBag") {
    addLog(`🎭 ${player.name} 打出「终极百宝袋」！除他外所有人 3 秒内起立举手喊“我是内鬼”！`);
    const candidates = state.players.filter((p) => p.id !== player.id && !p.isOut);
    if (candidates.length) {
      const loser = candidates[randomIndex(candidates)];
      loser.remainingDrinks = Math.max(0, loser.remainingDrinks - 1);
      loser.drinkCount += 1;
      addLog(`😱 ${loser.name} 反应最慢！自罚一整杯，并随机交出 2 张手牌。`);
      while (loser.hand.length > 0 && state.players.some((p) => p.hand.length < handLimit())) {
        const [c] = loser.hand.splice(randomIndex(loser.hand), 1);
        const receiver = state.players.filter((p) => p.id !== loser.id && p.hand.length < handLimit())[randomIndex(state.players.filter((p) => p.id !== loser.id && p.hand.length < handLimit()))];
        if (receiver) receiver.hand.push(c);
      }
    }
    return;
  }
}

function checkHexChoiceTrigger() {
  if (state.round > 1 && state.round % HEX_CHOICE_INTERVAL === 0 && state.hexChoiceRound < state.round) {
    state.hexChoiceRound = state.round;
    const shuffled = shuffle([...HEX_CHOICES_POOL]);
    state.hexChoices = shuffled.slice(0, 3).map((h, i) => ({ ...h, choiceId: `hex-${cryptoRandomId()}-${i}` }));
    state.hexPendingPlayers = state.players.map(p => p.id);
    state.phase = "hexChoice";
    addLog(`🔮 海克斯强化轮！所有玩家请选择一个被动效果。`);
    commitGame();
    showHexChoice();
  }
}

function selectHexChoice(choiceId) {
  const viewer = viewerPlayer();
  if (!state.hexPendingPlayers.includes(viewer.id)) {
    showToast("你已经选择过了，等待其他玩家。");
    return;
  }
  const choice = state.hexChoices.find((c) => c.choiceId === choiceId);
  if (!choice) return;
  const def = HEX_CHOICES_POOL.find((h) => h.key === choice.key);
  if (!def) return;
  def.apply(viewer);
  addLog(`${viewer.name} 选择了海克斯「${choice.name}」：${choice.effect}`);
  state.hexPendingPlayers = state.hexPendingPlayers.filter(id => id !== viewer.id);
  if (state.hexPendingPlayers.length === 0) {
    state.hexChoices = [];
    state.phase = "normal";
  }
  commitGame();
  showHexChoice(); 
  showToast(`获得海克斯：${choice.name}`);
}

function showHexChoice() {
  if (!els.hexChoiceOverlay || !els.hexChoiceCards) return;
  const viewer = viewerPlayer();
  const hasChosen = !state.hexPendingPlayers.includes(viewer.id);
  const remaining = state.hexPendingPlayers.length;
  
  if (hasChosen) {
    els.hexChoiceCards.innerHTML = `<div class="text-center p-4"><p class="text-slate-400 mb-2">你已选择完毕</p><p class="text-xs text-cyan-400 animate-pulse">等待其他 ${remaining} 位玩家选择...</p></div>`;
  } else {
    els.hexChoiceCards.innerHTML = state.hexChoices.map((c) => `<button class="hex-choice-card" data-hex-choice="${c.choiceId}"><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.effect)}</p></button>`).join("");
  }
  els.hexChoiceOverlay.classList.remove("hidden");
}

function hideHexChoice() { if (els.hexChoiceOverlay) els.hexChoiceOverlay.classList.add("hidden"); }

function showResolution(text) {
  if (els.resolutionOverlay) { els.resolutionText.textContent = text; els.resolutionOverlay.classList.remove("hidden"); setTimeout(() => { els.resolutionOverlay.classList.add("hidden"); }, 6000); }
}

function nextTurn() {
  if (!ensureActor()) return;
  if (isInCountdown()) { showToast("插播倒计时进行中，请等待结算。"); return; }
  if (!state.actionTaken) { showToast("请先摸牌或打出一张牌。"); return; }

  const prev = currentPlayer();
  if (prev.doubleRoundsLeft > 0) prev.doubleRoundsLeft -= 1;
  if (prev.demonContractRoundsLeft > 0) prev.demonContractRoundsLeft -= 1;
  if (prev.demonLordRoundsLeft > 0) prev.demonLordRoundsLeft -= 1;

  let nextIdx = (state.currentIndex + 1) % state.players.length;
  let loops = 0;
  while (state.players[nextIdx]?.isOut && loops < state.players.length) { nextIdx = (nextIdx + 1) % state.players.length; loops += 1; }

  state.currentIndex = nextIdx;
  if (state.currentIndex === 0) state.round += 1;

  const current = currentPlayer();
  state.selectedTargetId = state.players.find((p) => p.id !== current.id)?.id || current.id;
  state.actionTaken = false;

  const extra = current.hexLucky ? 1 : 0;
  const drawn = drawCard(current, 1 + extra);
  if (drawn.length) {
    addLog(`轮到 ${current.name} 行动，自动摸牌获得「${drawn[0].name}」${extra ? " + 幸运星额外1张" : ""}。`);
  } else {
    addLog(`轮到 ${current.name} 行动，但牌堆已空。`);
  }

  checkHexChoiceTrigger();
  commitGame();
}

function activateDD() {
  if (!ensureActor()) return;
  const player = currentPlayer();
  const hasDD = player.active.some((c) => c.key === "dd-block") || player.hand.some((c) => c.key === "dd-block");
  if (!hasDD) { showToast("当前玩家没有 DD街区。"); return; }
  if (player.hand.length >= handLimit()) { showToast(`${player.name} 手牌已达上限。`); return; }
  const revealed = [];
  while (state.deck.length && revealed.length < 2) { revealed.push(state.deck.pop()); }
  if (!revealed.length) { showToast("牌堆已空。"); return; }
  const options = revealed.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const choice = window.prompt(`DD街区翻出：\n${options}\n输入 1 或 2 选择留下`, "1");
  const pickedIndex = Number(choice) === 2 && revealed[1] ? 1 : 0;
  const picked = revealed.splice(pickedIndex, 1)[0];
  player.hand.push(picked);
  state.discard.push(...revealed);
  addLog(`${player.name} 触发 DD街区，留下「${picked.name}」。`);
  commitGame();
}

function reshuffleDiscardIntoDeck(announce = true) {
  if (!state.discard.length) return false;
  state.deck = shuffle([...state.deck, ...state.discard]);
  state.discard = [];
  if (announce) addLog("弃牌堆洗回牌堆。");
  return true;
}

function removeActiveCard(playerId, cardUid) {
  const player = getPlayerById(playerId);
  if (!player) return;
  if (session.roomCode && player.id !== session.clientId && !session.isHost) { showToast("只能结束自己的持续效果。"); return; }
  const idx = player.active.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return;
  const [card] = player.active.splice(idx, 1);
  state.discard.push(card);
  addLog(`${player.name} 结束「${card.name}」。`);
  commitGame();
}

function markDrink(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return;
  player.remainingDrinks = Math.max(0, player.remainingDrinks - 1);
  player.drinkCount += 1;
  player.consecutiveDrinks += 1;
  addLog(`${player.name} 记录喝酒 1 次（剩余 ${player.remainingDrinks}/${player.maxDrinks}）。`);
  if (player.remainingDrinks <= 0) { player.isOut = true; addLog(`💀 ${player.name} 出局！`); }
  commitGame();
}

async function commitGame() {
  render();
  if (!session.roomCode || !realtime.configured || !session.room) return;
  try { await realtime.updateRoom(session.room.code, { game: state }); }
  catch (error) { showToast(`同步失败：${error.message}`); }
}

function addLog(message) {
  state.log.unshift({ id: `log-${cryptoRandomId()}`, message, time: shortTime() });
  state.log = state.log.slice(0, 80);
}

function render() {
  renderHome();
  renderLobby();
  renderGame();
  renderLibrary();
}

function renderHome() {
  const inRoom = Boolean(session.roomCode);
  const roomLoaded = Boolean(session.room);
  els.stageLobby.classList.toggle("hidden", inRoom && roomLoaded);
  els.stageLobbyRoom.classList.toggle("hidden", !inRoom || !roomLoaded || session.room.phase === "playing");
  els.stageGameplay.classList.toggle("hidden", !inRoom || session.room?.phase !== "playing" || !state.started);
  els.stageLibrary.classList.add("hidden");

  if (realtime.configured) {
    els.connectionStatus.innerHTML = `<span class="w-1 h-1 rounded-full bg-emerald-400"></span> 联机服务已连接`;
    els.connectionStatus.classList.add("text-emerald-400");
  } else {
    els.connectionStatus.innerHTML = `<span class="w-1 h-1 rounded-full bg-slate-500"></span> 离线模式`;
    els.connectionStatus.classList.remove("text-emerald-400");
  }
  if (els.createRoomBtn) els.createRoomBtn.disabled = !realtime.configured || session.busy;
  if (els.joinRoomBtn) els.joinRoomBtn.disabled = !realtime.configured || session.busy;
  els.menuCreateBtn.disabled = session.busy;
  els.menuJoinBtn.disabled = session.busy;

  els.menuChoices.classList.toggle("hidden", homeMode !== "menu");
  els.homeFormPanel.classList.toggle("hidden", homeMode === "menu");
  els.createFields.classList.toggle("hidden", homeMode !== "create");
  els.joinFields.classList.toggle("hidden", homeMode !== "join");

  if (homeMode === "create") { els.homeModeTitle.textContent = "创建房间"; }
  else if (homeMode === "join") { els.homeModeTitle.textContent = "加入房间"; }
}

function renderLobby() {
  const room = session.room;
  if (!room || room.phase === "playing") return;
  const settings = normalizeSettings(room.settings);
  const players = roomPlayers(room);

  els.lobbyRoomTitle.textContent = settings.roomName;
  els.lobbyRoomCode.textContent = room.code;

  els.lobbyPlayers.innerHTML = players.map((p) => `<div class="lobby-player ${p.online === false ? "offline" : ""}"><span class="seat-avatar">${escapeHtml(p.name.slice(0, 1))}</span><strong class="text-xs font-bold text-slate-200">${escapeHtml(p.name)}${p.id === session.clientId ? "（我）" : ""}</strong><span class="text-[8px] text-slate-500">${p.id === room.hostId ? "房主" : `座位 ${p.seat + 1}`} · ${p.online === false ? "离线" : "在线"}</span></div>`).join("");

  els.roomNameInput.value = settings.roomName;
  els.initialHandInput.value = settings.initialHand;
  els.handLimitInput.value = settings.handLimit;
  els.maxDrinksInput.value = settings.maxDrinks;
  els.roomPasswordInput.value = "";
  els.roomPasswordInput.placeholder = settings.hasPassword ? "已设置，留空保持" : "留空表示无密码";
  els.clearPasswordInput.checked = false;

  const disabled = !session.isHost;
  [els.roomNameInput, els.roomPasswordInput, els.clearPasswordInput, els.initialHandInput, els.handLimitInput, els.maxDrinksInput].forEach((i) => { i.disabled = disabled; });
  els.saveSettingsBtn.disabled = disabled;
  els.startRoomGameBtn.disabled = disabled || players.filter((p) => p.online !== false).length < 2;
  els.startRoomGameBtn.textContent = session.isHost ? "开始游戏" : "等待房主开始";
}

function renderGame() {
  if (!session.room || session.room.phase !== "playing" || !state.started || !state.players.length) return;
  const player = currentPlayer();
  const viewer = viewerPlayer();
  const canAct = isCurrentActor();
  const hasActed = state.actionTaken;
  const inCountdown = isInCountdown();
  const isEventChoose = state.phase === "eventChoose";

  if (els.roundStat) els.roundStat.textContent = `R${state.round}`;
  if (els.deckStat) els.deckStat.textContent = String(state.deck.length);
  if (els.discardStat) els.discardStat.textContent = String(state.discard.length);

  if (els.turnPermissionHint) els.turnPermissionHint.textContent = inCountdown ? `⚡ 插播 ${Math.max(0, Math.ceil((state.countdownEndsAt - Date.now()) / 1000))}s` : (canAct ? "轮到你行动" : `等待 ${player.name}`);

  if (els.currentPlayerName) els.currentPlayerName.textContent = player.name;
  if (els.handTitle) els.handTitle.textContent = canAct ? `${viewer.name} 的手牌${hasActed ? "（已行动）" : ""}` : `你的手牌（等待 ${player.name}）`;
  if (els.handLimitLabel) els.handLimitLabel.textContent = `上限 ${handLimit()}`;

  [els.targetSelect, els.ddBtn, els.shuffleDiscardBtn].forEach((c) => { c.disabled = !canAct || inCountdown || isEventChoose || hasActed; });
  if (els.eventBtn) els.eventBtn.disabled = !canAct || inCountdown || isEventChoose || hasActed;
  if (els.drinkDrawBtn) els.drinkDrawBtn.disabled = !canAct || inCountdown;
  if (els.drawBtn) els.drawBtn.disabled = true;
  if (els.nextTurnBtn) els.nextTurnBtn.disabled = !canAct || !hasActed || inCountdown;

  renderPlayers();
  renderTargetSelect();
  renderHand(canAct && !inCountdown ? player : viewer, canAct || inCountdown);
  renderActive();
  renderLog();
}

function renderPlayers() {
  els.playerList.innerHTML = state.players.map((p, i) => {
    const isCurrent = i === state.currentIndex;
    const hpPercent = Math.round((p.remainingDrinks / p.maxDrinks) * 100);
    const hpColor = hpPercent > 60 ? "#22c55e" : hpPercent > 30 ? "#f59e0b" : "#ef4444";
    return `<div class="player-card ${isCurrent ? "current" : ""} ${p.isOut ? "eliminated" : ""}">
      <button class="player-main" data-switch-player="${i}" type="button" ${session.isHost ? "" : "disabled"}>
        <span class="seat-avatar">${escapeHtml(p.name.slice(0, 1))}</span>
        <span class="seat-copy">
          <strong>${escapeHtml(p.name)}${p.id === session.clientId ? "（我）" : ""}</strong>
          <span>${p.isOut ? "已出局" : isCurrent ? "行动中" : `第 ${i + 1} 位`}</span>
        </span>
      </button>
      <div class="health-bar"><div class="health-fill" style="width:${hpPercent}%;background:${hpColor}"></div></div>
      <div class="player-metrics">
        <span>❤️ ${p.remainingDrinks}/${p.maxDrinks}</span>
        <span>${p.hand.length} 手牌</span>
      </div>
    </div>`;
  }).join("");
}

function renderTargetSelect() {
  const current = currentPlayer();
  els.targetSelect.innerHTML = state.players.filter((p) => p.id !== current.id && !p.isOut).map((p) => `<option value="${p.id}" ${p.id === state.selectedTargetId ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
}

function renderHand(player, actionable) {
  if (!player || !player.hand.length) { els.handCards.innerHTML = `<div class="empty-state">手牌空了。${isInCountdown() ? "插播阶段无法摸牌。" : "等轮到自己后摸牌。"}</div>`; return; }
  const sorted = [...player.hand].sort(compareCards);
  els.handCards.innerHTML = sorted.map((card) => renderCard(card, { actionable })).join("");
}

function renderCard(card, options = {}) {
  const meta = TIER_META[card.tier];
  const actionLabel = card.mode === "passive" ? "激活" : card.mode === "rule" ? "立规矩" : card.mode === "defense" ? "防御" : "打出";
  const action = options.actionable ? `<button class="card-action" data-use-card="${card.uid}" type="button">${actionLabel}</button>` : "";
  return `<div class="hex-card ${meta.className}"><div class="card-topline"><span class="tier-mark">${meta.short}</span><span>${escapeHtml(card.type)}</span></div><h3>${escapeHtml(card.name)}</h3><p class="timing">${escapeHtml(card.timing)}</p><p class="effect">${escapeHtml(card.effect)}</p>${action}</div>`;
}

function renderActive() {
  const viewer = viewerPlayer();
  const activeCards = viewer.active.map((card) => ({ player: viewer, card }));
  if (!activeCards.length) { els.activeList.innerHTML = `<div class="empty-state">还没有持续效果。</div>`; return; }
  els.activeList.innerHTML = activeCards.map(({ player, card }) => `<div class="active-chip ${TIER_META[card.tier].className}"><strong>${escapeHtml(card.name)}</strong><span>${escapeHtml(player.name)} · ${escapeHtml(card.type)}</span></div>`).join("");
}

function renderLog() {
  if (!state.log.length) { els.logList.innerHTML = `<div class="empty-state">日志会记录关键操作。</div>`; return; }
  els.logList.innerHTML = state.log.map((item) => `<div class="log-item"><time>${escapeHtml(item.time)}</time><span>${escapeHtml(item.message)}</span></div>`).join("");
}

function renderLibrary() {
  const cards = CARD_DEFINITIONS.filter((c) => libraryFilter === "all" || c.tier === libraryFilter).sort(compareDefinitions);
  els.libraryGrid.innerHTML = cards.map((card) => { const meta = TIER_META[card.tier]; return `<div class="library-card ${meta.className}"><div class="library-card-head"><span>${meta.label}</span><b>×${card.count}</b></div><h3>${escapeHtml(card.name)}</h3><p>${escapeHtml(card.type)} · ${escapeHtml(card.timing)}</p><span>${escapeHtml(card.effect)}</span></div>`; }).join("");
}

function bindEvents() {
  els.menuCreateBtn.addEventListener("click", () => { homeMode = "create"; renderHome(); });
  els.menuJoinBtn.addEventListener("click", () => { homeMode = "join"; renderHome(); });
  els.backMenuBtn.addEventListener("click", () => { homeMode = "menu"; renderHome(); });
  els.nicknameInput.addEventListener("input", () => { session.playerName = els.nicknameInput.value.trim().slice(0, 10); saveProfile(); });
  els.createRoomBtn.addEventListener("click", createRoomFlow);
  els.joinRoomBtn.addEventListener("click", joinRoomFlow);
  els.joinCodeInput.addEventListener("input", () => { els.joinCodeInput.value = normalizeRoomCode(els.joinCodeInput.value); });
  els.copyRoomBtn.addEventListener("click", async () => { if (!session.room?.code) return; await navigator.clipboard?.writeText(session.room.code); showToast(`房号 ${session.room.code} 已复制。`); });
  els.leaveRoomBtn.addEventListener("click", leaveRoom);
  els.backLobbyBtn.addEventListener("click", returnToLobby);
  els.saveSettingsBtn.addEventListener("click", saveRoomSettings);
  els.startRoomGameBtn.addEventListener("click", startRoomGame);

  els.targetSelect.addEventListener("change", (e) => { if (state.phase === "eventChoose") { state.selectedTargetId = e.target.value; commitGame(); } else if (!ensureActor()) { render(); return; } else { state.selectedTargetId = e.target.value; commitGame(); } });

  els.drawBtn.addEventListener("click", () => drawForCurrent("摸牌"));
  els.drinkDrawBtn.addEventListener("click", () => {
    if (!ensureActor()) return;
    const p = currentPlayer();
    if (p.isOut) { showToast("已出局，无法操作。"); return; }
    p.remainingDrinks = Math.max(0, p.remainingDrinks - 1);
    p.drinkCount += 1;
    p.consecutiveDrinks += 1;
    if (p.remainingDrinks <= 0) { p.isOut = true; addLog(`💀 ${p.name} 酒量耗尽，出局！`); }
    const drawn = drawCard(p, 1);
    if (drawn.length) { addLog(`${p.name} 喝完补牌，摸到「${drawn[0].name}」`); }
    showToast(`${p.name} 喝 1 杯，补 1 张牌（剩余 ${p.remainingDrinks}/${p.maxDrinks}）`);
    commitGame();
  });
  els.nextTurnBtn.addEventListener("click", nextTurn);
  els.ddBtn.addEventListener("click", activateDD);
  els.shuffleDiscardBtn.addEventListener("click", () => { if (!ensureActor()) return; if (!reshuffleDiscardIntoDeck()) showToast("弃牌堆为空。"); commitGame(); });
  els.clearLogBtn.addEventListener("click", () => { if (!session.isHost && !isCurrentActor()) { showToast("只有房主或当前玩家可以清空日志。"); return; } state.log = []; commitGame(); });

  if (els.eventBtn) els.eventBtn.addEventListener("click", triggerEvent);
  if (els.confirmEventBtn) els.confirmEventBtn.addEventListener("click", confirmEventTarget);

  els.toggleLibraryBtn.addEventListener("click", () => { els.stageLibrary.classList.remove("hidden"); });
  if (els.toggleLogBtn) els.toggleLogBtn.addEventListener("click", () => { els.logDrawer.classList.toggle("translate-y-full"); });
  if (els.closeLogBtn) els.closeLogBtn.addEventListener("click", () => { els.logDrawer.classList.add("translate-y-full"); });
  if (els.closeLibraryBtn) els.closeLibraryBtn.addEventListener("click", () => { els.stageLibrary.classList.add("hidden"); });

  els.handCards.addEventListener("click", (e) => { const uid = e.target.closest("[data-use-card]")?.dataset.useCard; if (uid) useCard(uid); });
  els.activeList.addEventListener("click", (e) => { const payload = e.target.closest("[data-remove-active]")?.dataset.removeActive; if (!payload) return; const [pid, uid] = payload.split(":"); removeActiveCard(pid, uid); });
  els.playerList.addEventListener("click", (e) => {
    const si = e.target.closest("[data-switch-player]")?.dataset.switchPlayer;
    if (si !== undefined && session.isHost) { state.currentIndex = Number(si); state.selectedTargetId = state.players.find((p) => p.id !== currentPlayer().id)?.id || currentPlayer().id; commitGame(); return; }
    const did = e.target.closest("[data-drink-player]")?.dataset.drinkPlayer;
    if (did) markDrink(did);
  });

  document.querySelectorAll(".filter-tab").forEach((btn) => { btn.addEventListener("click", () => { libraryFilter = btn.dataset.filter; document.querySelectorAll(".filter-tab").forEach((i) => i.classList.toggle("active", i === btn)); renderLibrary(); }); });
}

function createRoomPlayer(name, seat) { return { id: session.clientId, name, seat, online: true, joinedAt: Date.now(), lastSeen: Date.now() }; }
function roomPlayers(room) { return Object.values(room?.players || {}).sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0) || (a.joinedAt ?? 0) - (b.joinedAt ?? 0)); }
function ensureRealtime() {
  console.log("[app.js] ensureRealtime called, configured:", realtime.configured, "reason:", realtime.reason);
  if (realtime.configured) return true;
  showToast(realtime.reason || "联机服务未配置，请检查控制台日志。");
  return false;
}
function ensureHost() { if (session.isHost) return true; showToast("只有房主可以操作。"); return false; }
function setBusy(b) { session.busy = b; render(); }
function generateRoomCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function normalizeRoomCode(v) { return String(v).replace(/\D/g, "").slice(0, 6); }
async function hashRoomPassword(code, pw) { if (!pw) return ""; const input = `${code}:${pw}`; if (window.crypto?.subtle) { const bytes = new TextEncoder().encode(input); const hash = await window.crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join(""); } return btoa(unescape(encodeURIComponent(input))); }
function cryptoRandomId() { if (window.crypto?.getRandomValues) { const v = new Uint32Array(2); window.crypto.getRandomValues(v); return Array.from(v, (x) => x.toString(36)).join(""); } return Math.random().toString(36).slice(2); }
function shuffle(items) { const c = [...items]; for (let i = c.length - 1; i > 0; i -= 1) { const t = Math.floor(Math.random() * (i + 1)); [c[i], c[t]] = [c[t], c[i]]; } return c; }
function randomIndex(items) { return Math.floor(Math.random() * items.length); }
function compareCards(a, b) { return TIER_META[a.tier].order - TIER_META[b.tier].order || a.name.localeCompare(b.name, "zh-CN"); }
function compareDefinitions(a, b) { return TIER_META[a.tier].order - TIER_META[b.tier].order || a.name.localeCompare(b.name, "zh-CN"); }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function shortTime() { return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); }
function showToast(msg) { els.toast.textContent = msg; els.toast.classList.add("show"); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => { els.toast.classList.remove("show"); }, 2200); }
function escapeHtml(v) { return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

els.hexChoiceCards?.addEventListener("click", (e) => { const btn = e.target.closest("[data-hex-choice]"); if (btn) selectHexChoice(btn.dataset.hexChoice); });
