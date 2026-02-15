
const workspaceData = {
  bedroom: { label: "Used Laptop + Bedroom", rent: 0, quality: 0.9, maxBudget: 140 },
  shared: { label: "Entry PC + Shared House", rent: 6, quality: 0.98, maxBudget: 220 },
  office: { label: "Mid PC + Home Office", rent: 16, quality: 1.06, maxBudget: 420 },
  hq: { label: "Dual Setup + Studio Apartment", rent: 36, quality: 1.15, maxBudget: 900 },
  campus: { label: "High-End Rig + Small House", rent: 78, quality: 1.26, maxBudget: 1800 },
  tower: { label: "Streamer Setup + Townhouse", rent: 120, quality: 1.34, maxBudget: 2600 },
  startuphub: { label: "Workstation + Smart Home", rent: 165, quality: 1.42, maxBudget: 3400 },
  techfloor: { label: "Triple Monitor + Large House", rent: 220, quality: 1.51, maxBudget: 4400 },
  studioPark: { label: "Render Rig + Villa", rent: 290, quality: 1.6, maxBudget: 5600 },
  enterprise: { label: "Enterprise Build + Estate", rent: 380, quality: 1.7, maxBudget: 7000 },
  waterfront: { label: "Creator Lab + Waterfront Home", rent: 495, quality: 1.81, maxBudget: 8600 },
  mocap: { label: "Pro Motion Setup + Luxury Home", rent: 640, quality: 1.94, maxBudget: 10400 },
  rnd: { label: "R&D Hardware + Mansion", rent: 810, quality: 2.08, maxBudget: 12600 },
  global: { label: "Global Studio + Compound", rent: 1025, quality: 2.22, maxBudget: 15200 },
  megaplex: { label: "Megaplex Datacenter + Mega Estate", rent: 1280, quality: 2.38, maxBudget: 18500 }
};
const workspaceOrder = Object.keys(workspaceData);

const gameTypeMultipliers = {
  simulator: { volatility: 1.1, audience: 1.12, shelfLife: 1.07 },
  obby: { volatility: 0.95, audience: 1.0, shelfLife: 0.95 },
  roleplay: { volatility: 1.08, audience: 1.08, shelfLife: 1.1 },
  tycoon: { volatility: 1.03, audience: 1.02, shelfLife: 1.03 },
  shooter: { volatility: 1.2, audience: 1.05, shelfLife: 0.92 },
  horror: { volatility: 1.25, audience: 0.95, shelfLife: 0.88 },
  rpg: { volatility: 1.15, audience: 1.02, shelfLife: 1.12 },
  survival: { volatility: 1.14, audience: 1.0, shelfLife: 1.0 },
  sandbox: { volatility: 1.0, audience: 0.98, shelfLife: 1.08 },
  racing: { volatility: 1.06, audience: 0.93, shelfLife: 0.9 }
};

const staffData = {
  scripter: { label: "Scripter", hireCost: 120, weeklySalary: 30 },
  builder: { label: "Builder", hireCost: 100, weeklySalary: 26 },
  uiux: { label: "UI/UX Designer", hireCost: 90, weeklySalary: 22 },
  vfx: { label: "VFX Artist", hireCost: 85, weeklySalary: 21 },
  qa: { label: "QA Tester", hireCost: 75, weeklySalary: 18 },
  community: { label: "Community Manager", hireCost: 110, weeklySalary: 24 }
};

const achievementDefs = [
  { id: "first_release", name: "First Launch", desc: "Publish your first game.", check: (s) => s.games.length >= 1 },
  { id: "visits_10k", name: "Traffic Surge", desc: "Reach 10,000 total visits.", check: (s) => s.games.reduce((a, g) => a + (g.totalVisits || 0), 0) >= 10000 },
  { id: "players_1k", name: "Community 1K", desc: "Hit 1,000 total active players.", check: (s) => s.players >= 1000 },
  { id: "updates_10", name: "Live Ops Grind", desc: "Ship 10 total updates.", check: (s) => s.games.reduce((a, g) => a + (g.updates || 0), 0) >= 10 },
  { id: "cash_5k", name: "Profit Engine", desc: "Reach R$5,000 cash.", check: (s) => s.cash >= 5000 },
  { id: "studio_tier_7", name: "Major Upgrade", desc: "Reach Streamer Setup + Townhouse tier or above.", check: (s) => ["tower", "startuphub", "techfloor", "studioPark", "enterprise", "waterfront", "mocap", "rnd", "global", "megaplex"].includes(s.workspace) }
];

function createDefaultState(studioName) {
  return {
    week: 1,
    studioName,
    cash: 30,
    creditScore: 650,
    players: 120,
    reputation: 50,
    workspace: "bedroom",
    trend: { genre: "simulator", refreshDay: 14 },
    missions: [],
    missionSeedDay: 1,
    activeContract: null,
    lastActionDay: -999,
    actionCooldownDays: 3,
    buffs: { marketingUntil: 0, updateSuccessUntil: 0 },
    lastCrateDay: -999,
    staff: { scripter: 0, builder: 0, uiux: 0, vfx: 0, qa: 0, community: 0 },
    activeProduction: null,
    games: [],
    loans: [],
    offers: [],
    achievements: {},
    monetizationDeals: [],
    pnl: { revenue: 0, expense: 0 },
    nextLoanId: 1,
    nextGameId: 1,
    nextProductionId: 1,
    nextOfferId: 1
  };
}

let state = createDefaultState("BlockForge Studio");
let activeSlot = null;
let pendingSlotForCreation = null;
let pendingReleaseProduction = null;

const els = {
  saveOverlay: document.getElementById("saveOverlay"),
  adOverlay: document.getElementById("adOverlay"),
  adLead: document.getElementById("adLead"),
  adSpendInput: document.getElementById("adSpendInput"),
  adCashView: document.getElementById("adCashView"),
  adLaunchBtn: document.getElementById("adLaunchBtn"),
  adSkipBtn: document.getElementById("adSkipBtn"),
  creatorOverlay: document.getElementById("creatorOverlay"),
  openCreatorBtn: document.getElementById("openCreatorBtn"),
  closeCreatorBtn: document.getElementById("closeCreatorBtn"),
  disbandOverlay: document.getElementById("disbandOverlay"),
  disbandLead: document.getElementById("disbandLead"),
  sumRuntime: document.getElementById("sumRuntime"),
  sumCash: document.getElementById("sumCash"),
  sumNet: document.getElementById("sumNet"),
  sumGames: document.getElementById("sumGames"),
  sumVisits: document.getElementById("sumVisits"),
  sumPeak: document.getElementById("sumPeak"),
  sumRevenue: document.getElementById("sumRevenue"),
  sumExpense: document.getElementById("sumExpense"),
  sumUpdates: document.getElementById("sumUpdates"),
  disbandContinueBtn: document.getElementById("disbandContinueBtn"),
  slotGrid: document.getElementById("slotGrid"),
  slotCreate: document.getElementById("slotCreate"),
  slotStudioName: document.getElementById("slotStudioName"),
  slotCreateBtn: document.getElementById("slotCreateBtn"),
  studioNameDisplay: document.getElementById("studioNameDisplay"),
  studioNameInput: document.getElementById("studioNameInput"),
  weekVal: document.getElementById("weekVal"),
  cashVal: document.getElementById("cashVal"),
  creditVal: document.getElementById("creditVal"),
  playersVal: document.getElementById("playersVal"),
  repVal: document.getElementById("repVal"),
  debtVal: document.getElementById("debtVal"),
  gamesVal: document.getElementById("gamesVal"),
  visitsVal: document.getElementById("visitsVal"),
  dealsVal: document.getElementById("dealsVal"),
  teamVal: document.getElementById("teamVal"),
  trendGenre: document.getElementById("trendGenre"),
  trendDaysLeft: document.getElementById("trendDaysLeft"),
  missionList: document.getElementById("missionList"),
  contractBox: document.getElementById("contractBox"),
  acceptContractBtn: document.getElementById("acceptContractBtn"),
  actionDevJamBtn: document.getElementById("actionDevJamBtn"),
  actionCommunityBtn: document.getElementById("actionCommunityBtn"),
  actionQaBtn: document.getElementById("actionQaBtn"),
  actionCooldownView: document.getElementById("actionCooldownView"),
  mysteryCrateBtn: document.getElementById("mysteryCrateBtn"),
  totalBudget: document.getElementById("totalBudget"),
  riskView: document.getElementById("riskView"),
  publishEta: document.getElementById("publishEta"),
  aprOffer: document.getElementById("aprOffer"),
  creditLimit: document.getElementById("creditLimit"),
  workspaceTierView: document.getElementById("workspaceTierView"),
  workspaceRentView: document.getElementById("workspaceRentView"),
  nextUpgradeView: document.getElementById("nextUpgradeView"),
  nextUpgradeCostView: document.getElementById("nextUpgradeCostView"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  hireRole: document.getElementById("hireRole"),
  roleCountView: document.getElementById("roleCountView"),
  hireBtn: document.getElementById("hireBtn"),
  fireBtn: document.getElementById("fireBtn"),
  payrollVal: document.getElementById("payrollVal"),
  hireCostVal: document.getElementById("hireCostVal"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  genre: document.getElementById("genre"),
  bScript: document.getElementById("bScript"),
  bArt: document.getElementById("bArt"),
  bSystems: document.getElementById("bSystems"),
  bUi: document.getElementById("bUi"),
  bAds: document.getElementById("bAds"),
  bOps: document.getElementById("bOps"),
  gp1Enabled: document.getElementById("gp1Enabled"),
  gp1Price: document.getElementById("gp1Price"),
  gp2Enabled: document.getElementById("gp2Enabled"),
  gp2Price: document.getElementById("gp2Price"),
  gp3Enabled: document.getElementById("gp3Enabled"),
  gp3Price: document.getElementById("gp3Price"),
  devDays: document.getElementById("devDays"),
  advisedDays: document.getElementById("advisedDays"),
  presetBudgetTotal: document.getElementById("presetBudgetTotal"),
  riskLowBtn: document.getElementById("riskLowBtn"),
  riskMedBtn: document.getElementById("riskMedBtn"),
  riskHighBtn: document.getElementById("riskHighBtn"),
  prodStatus: document.getElementById("prodStatus"),
  prodFill: document.getElementById("prodFill"),
  releaseBtn: document.getElementById("releaseBtn"),
  nextWeekBtn: document.getElementById("nextWeekBtn"),
  disbandBtn: document.getElementById("disbandBtn"),
  loanAmount: document.getElementById("loanAmount"),
  loanTerm: document.getElementById("loanTerm"),
  loanBtn: document.getElementById("loanBtn"),
  loanList: document.getElementById("loanList"),
  gameList: document.getElementById("gameList"),
  leaderboardList: document.getElementById("leaderboardList"),
  achievementList: document.getElementById("achievementList"),
  pnlRevenue: document.getElementById("pnlRevenue"),
  pnlExpense: document.getElementById("pnlExpense"),
  pnlNet: document.getElementById("pnlNet"),
  pnlMargin: document.getElementById("pnlMargin"),
  log: document.getElementById("log")
};

const fmtMoney = (num) => "R$" + Math.round(num).toLocaleString();
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const leaderboardKey = "rbx_dev_leaderboard_v1";

function formatTimeline(weekNumber) {
  const totalDays = Math.max(1, Math.floor(Number(weekNumber) || 1));
  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;
  if (years <= 0 && months <= 0) return `${totalDays} day${totalDays === 1 ? "" : "s"}`;
  return `${years}y ${months}m ${days}d`;
}

function formatDurationYMW(totalDaysInput) {
  const safeDays = Math.max(0, Math.floor(Number(totalDaysInput) || 0));
  const years = Math.floor(safeDays / 365);
  const remAfterYears = safeDays % 365;
  const months = Math.floor(remAfterYears / 30);
  const days = remAfterYears % 30;
  return `${years}y ${months}m ${days}d`;
}

function analyzeGames(gamesInput) {
  const games = Array.isArray(gamesInput) ? gamesInput : [];
  const totalVisits = games.reduce((sum, g) => sum + (Number(g?.totalVisits) || 0), 0);
  const peakPlayers = games.reduce((peak, g) => Math.max(peak, Number(g?.peakPlayers) || 0), 0);
  const totalUpdates = games.reduce((sum, g) => sum + (Number(g?.updates) || 0), 0);
  const totalScore = games.reduce((sum, g) => sum + (Number(g?.score) || 0), 0);
  const deadGames = games.filter((g) => Boolean(g?.dead)).length;
  const activeGames = games.length - deadGames;
  const bestGame = games.reduce((best, g) => {
    const score = Number(g?.score) || 0;
    if (!best || score > best.score) {
      return {
        title: g?.title || "Untitled",
        score,
        peakPlayers: Number(g?.peakPlayers) || 0,
        visits: Number(g?.totalVisits) || 0
      };
    }
    return best;
  }, null);
  const totalPayout = games.reduce((sum, g) => sum + (Number(g?.lifetimePayout) || 0), 0);
  return {
    totalVisits,
    peakPlayers,
    totalUpdates,
    avgScore: games.length ? (totalScore / games.length) : 0,
    deadGames,
    activeGames,
    bestGame,
    totalPayout
  };
}

function buildDisbandSummary() {
  const playedDays = Math.max(0, (Number(state.week) || 1) - 1);
  const gameStats = analyzeGames(state.games);
  const net = (state.pnl?.revenue || 0) - (state.pnl?.expense || 0);
  return {
    studioName: state.studioName || "Studio",
    runtime: formatDurationYMW(playedDays),
    runtimeDays: playedDays,
    cash: state.cash || 0,
    net,
    games: state.games.length,
    visits: gameStats.totalVisits,
    peak: gameStats.peakPlayers,
    revenue: state.pnl?.revenue || 0,
    expense: state.pnl?.expense || 0,
    updates: gameStats.totalUpdates,
    debt: totalDebt(),
    reputation: state.reputation || 0,
    creditScore: state.creditScore || 0,
    teamSize: totalStaff(),
    avgScore: gameStats.avgScore,
    activeGames: gameStats.activeGames,
    deadGames: gameStats.deadGames,
    bestGameTitle: gameStats.bestGame ? gameStats.bestGame.title : "N/A",
    bestGameScore: gameStats.bestGame ? gameStats.bestGame.score : 0,
    bestGamePeak: gameStats.bestGame ? gameStats.bestGame.peakPlayers : 0,
    bestGameVisits: gameStats.bestGame ? gameStats.bestGame.visits : 0,
    totalPayout: gameStats.totalPayout,
    score: Math.round(calculateStudioScore({
      net,
      visits: gameStats.totalVisits,
      peak: gameStats.peakPlayers,
      games: state.games.length,
      runtimeDays: playedDays
    }))
  };
}

function calculateStudioScore(data) {
  const net = Number(data?.net) || 0;
  const visits = Number(data?.visits) || 0;
  const peak = Number(data?.peak) || 0;
  const games = Number(data?.games) || 0;
  const runtimeDays = Number(data?.runtimeDays) || 0;
  const profitScore = net >= 0 ? Math.sqrt(net + 1) * 2.8 : -Math.sqrt(Math.abs(net)) * 2.1;
  const visitScore = Math.sqrt(Math.max(0, visits)) * 1.6;
  const peakScore = Math.sqrt(Math.max(0, peak)) * 1.8;
  const gameScore = games * 22;
  const enduranceScore = Math.sqrt(Math.max(0, runtimeDays)) * 1.4;
  return Math.max(0, profitScore + visitScore + peakScore + gameScore + enduranceScore);
}

function loadLeaderboardRecords() {
  const raw = localStorage.getItem(leaderboardKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getGlobalDataConfig() {
  const cfg = (typeof window !== "undefined" && window.GLOBAL_DATA_CONFIG && typeof window.GLOBAL_DATA_CONFIG === "object")
    ? window.GLOBAL_DATA_CONFIG
    : {};
  return {
    provider: String(cfg.provider || "").toLowerCase(),
    supabaseUrl: String(cfg.supabaseUrl || "").trim(),
    supabaseAnonKey: String(cfg.supabaseAnonKey || "").trim(),
    table: String(cfg.table || "leaderboard_runs").trim()
  };
}

function canUseSupabaseGlobal() {
  const cfg = getGlobalDataConfig();
  return cfg.provider === "supabase" && Boolean(cfg.supabaseUrl) && Boolean(cfg.supabaseAnonKey) && Boolean(cfg.table);
}

async function pushGlobalLeaderboardRecord(record) {
  if (!canUseSupabaseGlobal()) return;
  const cfg = getGlobalDataConfig();
  const url = `${cfg.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${encodeURIComponent(cfg.table)}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseAnonKey,
        "Authorization": `Bearer ${cfg.supabaseAnonKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(record)
    });
  } catch {
    // Ignore network errors and keep local leaderboard working.
  }
}

function saveLeaderboardRecord(summary, source = "retired") {
  const records = loadLeaderboardRecords();
  const entry = {
    studioName: summary.studioName || "Studio",
    score: Number(summary.score) || 0,
    cash: Number(summary.cash) || 0,
    net: Number(summary.net) || 0,
    visits: Number(summary.visits) || 0,
    peak: Number(summary.peak) || 0,
    games: Number(summary.games) || 0,
    activeGames: Number(summary.activeGames) || 0,
    deadGames: Number(summary.deadGames) || 0,
    avgScore: Number(summary.avgScore) || 0,
    updates: Number(summary.updates) || 0,
    totalPayout: Number(summary.totalPayout) || 0,
    debt: Number(summary.debt) || 0,
    reputation: Number(summary.reputation) || 0,
    creditScore: Number(summary.creditScore) || 0,
    teamSize: Number(summary.teamSize) || 0,
    revenue: Number(summary.revenue) || 0,
    expense: Number(summary.expense) || 0,
    bestGameTitle: summary.bestGameTitle || "N/A",
    bestGameScore: Number(summary.bestGameScore) || 0,
    bestGamePeak: Number(summary.bestGamePeak) || 0,
    bestGameVisits: Number(summary.bestGameVisits) || 0,
    runtime: summary.runtime || "0y 0m 0d",
    runtimeDays: Number(summary.runtimeDays) || 0,
    source,
    createdAt: Date.now()
  };
  records.push(entry);
  records.sort((a, b) => (b.score - a.score) || (b.visits - a.visits) || (b.net - a.net));
  localStorage.setItem(leaderboardKey, JSON.stringify(records.slice(0, 100)));
  void pushGlobalLeaderboardRecord(entry);
}

function collectActiveSlotRecords() {
  const out = [];
  for (let i = 1; i <= 3; i += 1) {
    const data = loadSlotData(i);
    if (!data) continue;
    const gameList = Array.isArray(data.games) ? data.games : [];
    const gameStats = analyzeGames(gameList);
    const visits = gameStats.totalVisits;
    const peak = gameStats.peakPlayers;
    const games = gameList.length;
    const revenue = Number(data?.pnl?.revenue) || 0;
    const expense = Number(data?.pnl?.expense) || 0;
    const net = revenue - expense;
    const runtimeDays = Math.max(0, (Number(data?.week) || 1) - 1);
    out.push({
      studioName: data?.studioName || `Slot ${i} Studio`,
      score: Math.round(calculateStudioScore({ net, visits, peak, games, runtimeDays })),
      cash: Number(data?.cash) || 0,
      net,
      visits,
      peak,
      games,
      activeGames: gameStats.activeGames,
      deadGames: gameStats.deadGames,
      avgScore: gameStats.avgScore,
      updates: gameStats.totalUpdates,
      totalPayout: gameStats.totalPayout,
      debt: Array.isArray(data?.loans) ? data.loans.reduce((sum, loan) => sum + (Number(loan?.balance) || 0), 0) : 0,
      reputation: Number(data?.reputation) || 0,
      creditScore: Number(data?.creditScore) || 0,
      teamSize: Object.values(data?.staff || {}).reduce((sum, n) => sum + (Number(n) || 0), 0),
      revenue,
      expense,
      bestGameTitle: gameStats.bestGame ? gameStats.bestGame.title : "N/A",
      bestGameScore: gameStats.bestGame ? gameStats.bestGame.score : 0,
      bestGamePeak: gameStats.bestGame ? gameStats.bestGame.peakPlayers : 0,
      bestGameVisits: gameStats.bestGame ? gameStats.bestGame.visits : 0,
      runtime: formatDurationYMW(runtimeDays),
      runtimeDays,
      source: `active-slot-${i}`,
      createdAt: Date.now()
    });
  }
  return out;
}

function renderLeaderboard() {
  if (!els.leaderboardList) return;
  const historical = loadLeaderboardRecords();
  const active = collectActiveSlotRecords();
  const ranked = [...historical, ...active]
    .sort((a, b) => (b.score - a.score) || (b.visits - a.visits) || (b.net - a.net))
    .slice(0, 100);
  els.leaderboardList.innerHTML = "";
  if (!ranked.length) {
    els.leaderboardList.innerHTML = '<div class="mini-card">No leaderboard entries yet. Keep building and disband to archive runs.</div>';
    return;
  }
  ranked.forEach((entry, idx) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    const src = String(entry.source || "").startsWith("active-slot") ? "Active" : "Retired";
    card.innerHTML =
      `<b>#${idx + 1} ${entry.studioName}</b><br>` +
      `Score: ${Math.round(entry.score).toLocaleString()} • ${src}<br>` +
      `Visits: ${Math.round(entry.visits).toLocaleString()} • Net: ${fmtMoney(entry.net)}<br>` +
      `Games: ${Math.round(entry.games)} • Peak: ${Math.round(entry.peak).toLocaleString()} • Runtime: ${entry.runtime}`;
    els.leaderboardList.appendChild(card);
  });
}

function showDisbandSummary(summary) {
  els.disbandLead.textContent = `${summary.studioName} ran for ${summary.runtime}. Final report below.`;
  els.sumRuntime.textContent = summary.runtime;
  els.sumCash.textContent = fmtMoney(summary.cash);
  els.sumNet.textContent = fmtMoney(summary.net);
  els.sumNet.className = summary.net >= 0 ? "good" : "bad";
  els.sumGames.textContent = String(summary.games);
  els.sumVisits.textContent = Math.round(summary.visits).toLocaleString();
  els.sumPeak.textContent = Math.round(summary.peak).toLocaleString();
  els.sumRevenue.textContent = fmtMoney(summary.revenue);
  els.sumExpense.textContent = fmtMoney(summary.expense);
  els.sumUpdates.textContent = Math.round(summary.updates).toLocaleString();
  els.disbandOverlay.style.display = "grid";
}

function slotKey(n) {
  return `rbx_dev_slot_${n}`;
}

function loadSlotData(n) {
  const raw = localStorage.getItem(slotKey(n));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCurrentSlot() {
  if (!activeSlot) return;
  const payload = {
    ...state,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(slotKey(activeSlot), JSON.stringify(payload));
}

function normalizeGame(game) {
  const safe = { ...game };
  safe.launchDay = Number(safe.launchDay || safe.launchWeek) || state.week;
  safe.ageDays = Number(safe.ageDays || ((safe.ageWeeks || 0) * 7)) || 0;
  safe.currentPlayers = Math.max(0, Number(safe.currentPlayers) || 0);
  safe.peakPlayers = Math.max(safe.currentPlayers, Number(safe.peakPlayers) || 0);
  safe.totalVisits = Math.max(0, Number(safe.totalVisits) || 0);
  safe.lifetimePayout = Math.max(0, Number(safe.lifetimePayout) || 0);
  safe.weeklyPayout = Math.max(0, Number(safe.weeklyPayout) || 0);
  safe.updates = Math.max(0, Number(safe.updates) || 0);
  safe.lastUpdateDay = Number(safe.lastUpdateDay || safe.lastUpdateWeek) || safe.launchDay;
  const legacyPass = safe.gamepass && typeof safe.gamepass === "object"
    ? [{ enabled: Boolean(safe.gamepass.enabled), price: Math.max(1, Math.round(Number(safe.gamepass.price) || 99)), buyers: Math.max(0, Math.round(Number(safe.gamepass.buyers) || 0)), revenue: Math.max(0, Number(safe.gamepass.revenue) || 0) }]
    : [];
  const passList = Array.isArray(safe.gamepasses) ? safe.gamepasses : legacyPass;
  safe.gamepasses = passList
    .filter((p) => p && (p.enabled || p.price))
    .map((p) => ({
      enabled: true,
      price: Math.max(1, Math.round(Number(p.price) || 99)),
      buyers: Math.max(0, Math.round(Number(p.buyers) || 0)),
      revenue: Math.max(0, Number(p.revenue) || 0)
    }));
  safe.pendingPayout = Math.max(0, Number(safe.pendingPayout) || 0);
  safe.dead = Boolean(safe.dead);
  safe.trend = Number(safe.trend) || 0;
  safe.monetization = Number(safe.monetization) || rand(0.8, 1.2);
  safe.channels = safe.channels || { discover: true, sponsored: false, groupBoost: false };
  return safe;
}

function applyLoadedState(data) {
  const cleanName = (data && data.studioName ? String(data.studioName) : "").trim() || "BlockForge Studio";
  const base = createDefaultState(cleanName);
  state = {
    ...base,
    ...data,
    studioName: cleanName,
    workspace: workspaceData[data?.workspace] ? data.workspace : "bedroom",
    pnl: data?.pnl && typeof data.pnl === "object" ? data.pnl : { revenue: 0, expense: 0 },
    staff: data?.staff && typeof data.staff === "object" ? { ...base.staff, ...data.staff } : base.staff
  };
  state.games = Array.isArray(state.games) ? state.games.map(normalizeGame) : [];
  state.players = Number(state.players) || 0;
  state.offers = Array.isArray(state.offers)
    ? state.offers.filter((o) => o && o.kind === "acquisition" && typeof o.buyoutPrice === "number")
    : [];
  state.trend = state.trend && typeof state.trend === "object" ? state.trend : { genre: "simulator", refreshDay: state.week + 14 };
  if (!gameTypeMultipliers[state.trend.genre]) state.trend.genre = "simulator";
  state.trend.refreshDay = Math.max(state.week + 1, Number(state.trend.refreshDay) || (state.week + 14));
  state.missions = Array.isArray(state.missions) ? state.missions : [];
  state.missionSeedDay = Math.max(1, Number(state.missionSeedDay) || 1);
  state.activeContract = state.activeContract && typeof state.activeContract === "object" ? state.activeContract : null;
  state.lastActionDay = Number.isFinite(state.lastActionDay) ? state.lastActionDay : -999;
  state.actionCooldownDays = Math.max(1, Number(state.actionCooldownDays) || 3);
  state.buffs = state.buffs && typeof state.buffs === "object" ? state.buffs : { marketingUntil: 0, updateSuccessUntil: 0 };
  state.buffs.marketingUntil = Number(state.buffs.marketingUntil) || 0;
  state.buffs.updateSuccessUntil = Number(state.buffs.updateSuccessUntil) || 0;
  state.lastCrateDay = Number.isFinite(state.lastCrateDay) ? state.lastCrateDay : -999;
  state.achievements = state.achievements && typeof state.achievements === "object" ? state.achievements : {};
}

function refreshSlotButtons() {
  els.slotGrid.querySelectorAll(".slot-btn").forEach((btn) => {
    const slot = Number(btn.dataset.slot);
    const data = loadSlotData(slot);
    if (!data) {
      btn.innerHTML = `<b>Slot ${slot}</b><small>Empty save</small>`;
    } else {
      const name = (data.studioName || "Studio").toString();
      const week = data.week || 1;
      const cash = fmtMoney(data.cash || 0);
      btn.innerHTML = `<b>Slot ${slot}: ${name}</b><small>Day ${week} • Balance ${cash}</small>`;
    }
  });
}

function closeOverlay() {
  els.saveOverlay.style.display = "none";
}

function openCreateForSlot(slot) {
  pendingSlotForCreation = slot;
  els.slotCreate.classList.add("active");
  els.slotStudioName.value = "";
  els.slotStudioName.focus();
}

function selectSlot(slot) {
  const data = loadSlotData(slot);
  if (data) {
    activeSlot = slot;
    applyLoadedState(data);
    closeOverlay();
    log(`Loaded Slot ${slot}.`, "good");
    renderStats();
    return;
  }
  openCreateForSlot(slot);
}

function createSlotSave() {
  if (!pendingSlotForCreation) return;
  const name = (els.slotStudioName.value || "").trim();
  if (!name) return;
  activeSlot = pendingSlotForCreation;
  applyLoadedState(createDefaultState(name));
  saveCurrentSlot();
  refreshSlotButtons();
  closeOverlay();
  log(`Created Slot ${activeSlot} for ${state.studioName}.`, "good");
  renderStats();
}

function syncStudioNameLocked() {
  els.studioNameDisplay.textContent = state.studioName;
  els.studioNameInput.value = state.studioName;
  document.title = `${state.studioName} Roblox Dev Simulator`;
}

function initCollapsibleCards() {
  document.querySelectorAll(".card").forEach((card) => {
    const heading = card.querySelector("h2");
    if (!heading || heading.querySelector(".collapse-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "collapse-btn";
    btn.textContent = "Minimize";
    btn.addEventListener("click", () => {
      const collapsed = card.classList.toggle("collapsed");
      btn.textContent = collapsed ? "Expand" : "Minimize";
    });
    heading.appendChild(btn);
  });
}

function getBudgets() {
  return {
    script: Math.max(0, Number(els.bScript.value) || 0),
    art: Math.max(0, Number(els.bArt.value) || 0),
    systems: Math.max(0, Number(els.bSystems.value) || 0),
    ui: Math.max(0, Number(els.bUi.value) || 0),
    ads: Math.max(0, Number(els.bAds.value) || 0),
    ops: Math.max(0, Number(els.bOps.value) || 0)
  };
}

function getConfiguredGamepasses() {
  const passes = [
    { enabled: els.gp1Enabled.checked, price: Math.max(1, Math.floor(Number(els.gp1Price.value) || 1)) },
    { enabled: els.gp2Enabled.checked, price: Math.max(1, Math.floor(Number(els.gp2Price.value) || 1)) },
    { enabled: els.gp3Enabled.checked, price: Math.max(1, Math.floor(Number(els.gp3Price.value) || 1)) }
  ];
  return passes.filter((p) => p.enabled).map((p) => ({ ...p, buyers: 0, revenue: 0 }));
}

function rotateTrendIfNeeded() {
  if (state.week < state.trend.refreshDay) return;
  const genres = Object.keys(gameTypeMultipliers);
  const next = pick(genres);
  state.trend.genre = next;
  state.trend.refreshDay = state.week + 14;
  log(`Trend shift: ${next.toUpperCase()} games are hot right now.`, "warn");
}

function refreshMissionsIfNeeded() {
  if (state.week - state.missionSeedDay < 1 && state.missions.length) return;
  state.missionSeedDay = state.week;
  const totalVisits = state.games.reduce((sum, g) => sum + (g.totalVisits || 0), 0);
  state.missions = [
    { id: "update", label: "Ship 1 update today", reward: { cash: 80, rep: 1 }, goal: 1, progress: 0, metric: "updates", base: state.games.reduce((s, g) => s + (g.updates || 0), 0), claimed: false },
    { id: "visits", label: "Gain 500 visits today", reward: { cash: 120, rep: 0.5 }, goal: 500, progress: 0, metric: "visits", base: totalVisits, claimed: false },
    { id: "players", label: "Reach 300 active players", reward: { cash: 100, rep: 1 }, goal: 300, progress: 0, metric: "players", base: 0, claimed: false }
  ];
}

function updateMissionProgress() {
  if (!state.missions.length) return;
  const totalUpdates = state.games.reduce((s, g) => s + (g.updates || 0), 0);
  const totalVisits = state.games.reduce((sum, g) => sum + (g.totalVisits || 0), 0);
  state.missions.forEach((m) => {
    if (m.metric === "updates") m.progress = Math.max(0, totalUpdates - (m.base || 0));
    if (m.metric === "visits") m.progress = Math.max(0, totalVisits - (m.base || 0));
    if (m.metric === "players") m.progress = state.players;
  });
}

function claimMission(id) {
  const mission = state.missions.find((m) => m.id === id);
  if (!mission || mission.claimed) return;
  if (mission.progress < mission.goal) return log("Mission goal not completed yet.", "warn");
  mission.claimed = true;
  if (mission.reward.cash) addRevenue(mission.reward.cash);
  if (mission.reward.rep) state.reputation = clamp(state.reputation + mission.reward.rep, 0, 100);
  log(`Mission claimed: ${mission.label}.`, "good");
  renderStats();
}

function renderMissions() {
  if (!els.missionList) return;
  els.missionList.innerHTML = "";
  state.missions.forEach((m) => {
    const done = m.progress >= m.goal;
    const card = document.createElement("div");
    card.className = `mini-card ${done ? "good" : "warn"}`;
    card.innerHTML = `<b>${m.label}</b><br>Progress: ${Math.floor(m.progress)} / ${m.goal}<br>Reward: ${fmtMoney(m.reward.cash)}${m.reward.rep ? ` + ${m.reward.rep} rep` : ""}<div class="mini-actions"><button data-mission="${m.id}" ${!done || m.claimed ? "disabled" : ""}>${m.claimed ? "Claimed" : "Claim"}</button></div>`;
    els.missionList.appendChild(card);
  });
}

function createNewContract() {
  const type = pick(["release", "visits", "updates"]);
  const deadlineDay = state.week + 21;
  if (type === "release") return { type, title: "Publish 1 game in 21 days", goal: 1, progress: 0, base: state.games.length, reward: 900, penalty: 180, deadlineDay, accepted: true };
  if (type === "visits") return { type, title: "Gain 6,000 visits in 21 days", goal: 6000, progress: 0, base: state.games.reduce((s, g) => s + (g.totalVisits || 0), 0), reward: 1100, penalty: 220, deadlineDay, accepted: true };
  return { type, title: "Ship 4 updates in 21 days", goal: 4, progress: 0, base: state.games.reduce((s, g) => s + (g.updates || 0), 0), reward: 1000, penalty: 200, deadlineDay, accepted: true };
}

function updateContractProgress() {
  if (!state.activeContract) return;
  const c = state.activeContract;
  if (c.type === "release") c.progress = Math.max(0, state.games.length - c.base);
  if (c.type === "visits") c.progress = Math.max(0, state.games.reduce((s, g) => s + (g.totalVisits || 0), 0) - c.base);
  if (c.type === "updates") c.progress = Math.max(0, state.games.reduce((s, g) => s + (g.updates || 0), 0) - c.base);
}

function settleContractIfNeeded() {
  if (!state.activeContract) return;
  const c = state.activeContract;
  if (c.progress >= c.goal) {
    addRevenue(c.reward);
    log(`Contract complete: ${c.title}. Reward ${fmtMoney(c.reward)}.`, "good");
    state.activeContract = null;
    return;
  }
  if (state.week >= c.deadlineDay) {
    addExpense(c.penalty);
    state.reputation = clamp(state.reputation - 1.5, 0, 100);
    log(`Contract failed: ${c.title}. Penalty ${fmtMoney(c.penalty)}.`, "bad");
    state.activeContract = null;
  }
}

function renderContract() {
  if (!els.contractBox) return;
  if (!state.activeContract) {
    els.contractBox.innerHTML = "No active contract.";
    return;
  }
  const c = state.activeContract;
  const left = Math.max(0, c.deadlineDay - state.week);
  els.contractBox.innerHTML = `<b>${c.title}</b><br>Progress: ${Math.floor(c.progress)} / ${c.goal}<br>Reward ${fmtMoney(c.reward)} | Penalty ${fmtMoney(c.penalty)}<br>Deadline: ${left} day(s)`;
}

function actionCooldownLeft() {
  return Math.max(0, (state.lastActionDay + state.actionCooldownDays) - state.week);
}

function usePowerAction(kind) {
  const left = actionCooldownLeft();
  if (left > 0) return log(`Power action cooling down (${left} day(s)).`, "warn");
  state.lastActionDay = state.week;
  if (kind === "devjam" && state.activeProduction) {
    state.activeProduction.elapsedDays = Math.min(state.activeProduction.totalDays, state.activeProduction.elapsedDays + 1);
    log("Dev Jam executed: production advanced by 1 day.", "good");
  } else if (kind === "community") {
    state.buffs.marketingUntil = state.week + 5;
    log("Community Blast active for 5 days.", "good");
  } else if (kind === "qa") {
    state.buffs.updateSuccessUntil = state.week + 5;
    log("QA Sprint active for 5 days (better update success).", "good");
  } else {
    log("No active production for Dev Jam. Try other actions.", "warn");
  }
  renderStats();
}

function openMysteryCrate() {
  const cooldown = Math.max(0, (state.lastCrateDay + 7) - state.week);
  if (cooldown > 0) return log(`Mystery Crate available in ${cooldown} day(s).`, "warn");
  const cost = 150;
  if (state.cash < cost) return log(`Need ${fmtMoney(cost)} to open Mystery Crate.`, "bad");
  addExpense(cost);
  state.lastCrateDay = state.week;
  const roll = Math.random();
  if (roll < 0.2) {
    addRevenue(600); log("Mystery Crate jackpot: you found R$600 sponsorship bonus!", "good");
  } else if (roll < 0.45) {
    state.reputation = clamp(state.reputation + 3, 0, 100); log("Mystery Crate: positive press boost (+rep).", "good");
  } else if (roll < 0.7) {
    state.players += 180; log("Mystery Crate: influencer shoutout (+players).", "good");
  } else if (roll < 0.9) {
    addExpense(180); log("Mystery Crate: tool failure cost extra repairs.", "bad");
  } else {
    state.reputation = clamp(state.reputation - 2, 0, 100); log("Mystery Crate: backlash event hurt reputation.", "bad");
  }
  renderStats();
}

function applyRiskPreset(risk, totalInput) {
  const requestedTotal = Math.floor(Number(totalInput) || 0);
  if (!Number.isFinite(requestedTotal) || requestedTotal <= 0) return null;
  const total = requestedTotal;
  let weights = [];

  if (risk === "low") {
    weights = [0.2, 0.2, 0.24, 0.16, 0.1, 0.1];
  } else if (risk === "medium") {
    weights = [0.18, 0.2, 0.24, 0.14, 0.14, 0.1];
  } else {
    weights = [0.16, 0.19, 0.23, 0.13, 0.17, 0.12];
  }

  const noisy = weights.map((w) => Math.max(0.05, w + rand(-0.025, 0.025)));
  const sum = noisy.reduce((a, b) => a + b, 0);
  const normalized = noisy.map((n) => n / sum);

  const keys = ["bScript", "bArt", "bSystems", "bUi", "bAds", "bOps"];
  let remaining = total;
  keys.forEach((k, idx) => {
    const value = idx === keys.length - 1 ? remaining : Math.max(0, Math.round(total * normalized[idx]));
    els[k].value = String(value);
    remaining -= value;
  });
  if (remaining !== 0) {
    els.bOps.value = String(Math.max(0, Number(els.bOps.value) + remaining));
  }
  return { appliedTotal: total };
}

function totalBudget() {
  const b = getBudgets();
  return b.script + b.art + b.systems + b.ui + b.ads + b.ops;
}

function riskLabel(total, ads, systems) {
  if (total < 30) return "Very High";
  const adRatio = total ? ads / total : 0;
  const systemsRatio = total ? systems / total : 0;
  if (adRatio < 0.08 || systemsRatio < 0.2) return "High";
  if (total >= 70 && adRatio >= 0.13 && systemsRatio >= 0.24) return "Low";
  return "Medium";
}

function getAdvisedSchedule() {
  const budget = totalBudget();
  const ws = workspaceData[state.workspace] || workspaceData.bedroom;
  const team = teamEffects();
  const overscale = Math.max(0, (budget / Math.max(ws.maxBudget, 1)) - 1);
  const scheduleDrag = 1 + (overscale * 0.45);
  const baseline = ((4 + budget / 20 + 1.5) * scheduleDrag) / team.speed;
  const advised = clamp(Math.round(baseline * 7), 14, 365);
  const min = clamp(Math.round(advised * 0.78), 7, 365);
  const max = clamp(Math.round(advised * 1.3), 14, 420);
  return { advised, min, max };
}

function totalStaff() {
  return Object.values(state.staff).reduce((sum, n) => sum + n, 0);
}

function currentWorkspaceIndex() {
  const idx = workspaceOrder.indexOf(state.workspace);
  return idx >= 0 ? idx : 0;
}

function nextWorkspaceKey() {
  const idx = currentWorkspaceIndex();
  return idx < workspaceOrder.length - 1 ? workspaceOrder[idx + 1] : null;
}

function workspaceUpgradeCost(nextKey) {
  const nextWs = workspaceData[nextKey];
  if (!nextWs) return 0;
  return Math.max(250, Math.round((nextWs.rent * 34) + (nextWs.maxBudget * 0.48)));
}

function payrollWeekly() {
  return Object.entries(staffData).reduce((sum, [role, cfg]) => sum + ((state.staff[role] || 0) * cfg.weeklySalary), 0);
}

function selectedRole() {
  return els.hireRole.value;
}

function updateRoleUi() {
  const role = selectedRole();
  const cfg = staffData[role];
  els.roleCountView.value = String(state.staff[role] || 0);
  els.hireCostVal.textContent = fmtMoney(cfg ? cfg.hireCost : 0);
  els.payrollVal.textContent = fmtMoney(payrollWeekly());
}

function teamEffects() {
  const s = state.staff;
  const speed = clamp(1 + (s.scripter * 0.035) + (s.builder * 0.03) + (s.uiux * 0.02) + (s.qa * 0.015), 1, 2.8);
  const quality = clamp(1 + (s.scripter * 0.02) + (s.builder * 0.018) + (s.uiux * 0.015) + (s.qa * 0.02) + (s.vfx * 0.012), 1, 2.3);
  const liveOps = clamp(1 + (s.community * 0.04) + (s.qa * 0.01) + (s.scripter * 0.01), 1, 2.2);
  const hype = clamp(1 + (s.community * 0.03) + (s.vfx * 0.015), 1, 2.0);
  return { speed, quality, liveOps, hype };
}
function currentAPR() {
  const s = state.creditScore;
  if (s >= 780) return rand(9, 12);
  if (s >= 720) return rand(13, 18);
  if (s >= 670) return rand(18, 25);
  if (s >= 620) return rand(24, 33);
  return rand(34, 48);
}

function totalDebt() {
  return state.loans.reduce((sum, l) => sum + l.balance, 0);
}

function creditLimit() {
  const base = 60 + (state.creditScore - 500) * 7 + state.reputation * 4 + Math.sqrt(Math.max(state.players, 1)) * 9;
  const debtDrag = totalDebt() * 0.88;
  return clamp(Math.round(base - debtDrag), 80, 12000);
}

function weeklyPaymentFor(principal, apr, weeks) {
  const r = apr / 100 / 52;
  if (r <= 0.00001) return principal / weeks;
  return (principal * r * Math.pow(1 + r, weeks)) / (Math.pow(1 + r, weeks) - 1);
}

function addRevenue(amount) {
  state.cash += amount;
  state.pnl.revenue += amount;
}

function addExpense(amount) {
  state.cash -= amount;
  state.pnl.expense += amount;
}

function log(message, tone = "") {
  const entry = document.createElement("div");
  entry.className = `mini-card ${tone}`;
  entry.textContent = `Day ${state.week}: ${message}`;
  els.log.prepend(entry);
}

function renderLoans() {
  els.loanList.innerHTML = "";
  if (!state.loans.length) {
    els.loanList.innerHTML = '<div class="mini-card">No active funding.</div>';
    return;
  }
  state.loans.forEach((loan) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<b>Funding #${loan.id}</b><br>Balance: ${fmtMoney(loan.balance)}<br>APR: ${loan.apr.toFixed(1)}%<br>Payment: ${fmtMoney(loan.paymentWeekly)} / week<br>Weeks Left: ${loan.weeksLeft}`;
    els.loanList.appendChild(card);
  });
}

function renderGames() {
  els.gameList.innerHTML = "";
  if (!state.games.length) {
    els.gameList.innerHTML = '<div class="mini-card">Your published experiences will appear here.</div>';
    return;
  }

  [...state.games].reverse().forEach((game) => {
    const totalPassBuyers = (game.gamepasses || []).reduce((sum, p) => sum + (p.buyers || 0), 0);
    const totalPassRevenue = (game.gamepasses || []).reduce((sum, p) => sum + (p.revenue || 0), 0);
    const passSummary = (game.gamepasses || []).length
      ? game.gamepasses.map((p) => `R$${p.price}`).join(", ")
      : "Off";
    const totalReturned = game.gross + game.extraRevenue + game.lifetimePayout;
    const roi = (totalReturned - game.budget) / Math.max(game.budget, 1);
    const roiClass = roi >= 0 ? "good" : "bad";
    const routes = [];
    if (game.channels.discover) routes.push("Discover");
    if (game.channels.sponsored) routes.push("Sponsored");
    if (game.channels.groupBoost) routes.push("Group Boost");

    const cooldown = Math.max(0, 4 - (state.week - game.lastUpdateDay));
    const canUpdate = !game.dead && !game.acquired && cooldown === 0;
    const status = game.dead ? "Dead" : game.currentPlayers < 60 ? "Dying" : game.currentPlayers < 350 ? "Stable" : "Growing";
    const statusClass = game.dead ? "bad" : status === "Growing" ? "good" : "warn";
    const soldTag = game.acquired ? '<br><span class="warn">Sold During Development</span>' : "";

    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML =
      `<div class="game-card-head"><b>${game.title}</b><span class="chip ${statusClass}">${status}</span></div>` +
      `<div style="color: var(--muted);">${game.genre.toUpperCase()} • Launch D${game.launchDay} • Age ${game.ageDays}d • Score ${game.score.toFixed(1)}/100</div>` +
      `<div class="kv-grid">` +
      `<div class="kv"><small>Current Players</small><b>${Math.round(game.currentPlayers).toLocaleString()}</b></div>` +
      `<div class="kv"><small>Peak Players</small><b>${Math.round(game.peakPlayers).toLocaleString()}</b></div>` +
      `<div class="kv"><small>Weekly Payout</small><b>${fmtMoney(game.weeklyPayout)}</b></div>` +
      `<div class="kv"><small>Total Visits</small><b>${Math.round(game.totalVisits).toLocaleString()}</b></div>` +
      `<div class="kv"><small>Gamepasses</small><b>${passSummary}</b></div>` +
      `<div class="kv"><small>Pass Buyers</small><b>${Math.round(totalPassBuyers).toLocaleString()}</b></div>` +
      `<div class="kv"><small>Pass Revenue</small><b>${fmtMoney(totalPassRevenue)}</b></div>` +
      `<div class="kv"><small>Lifetime Payout</small><b>${fmtMoney(game.lifetimePayout)}</b></div>` +
      `<div class="kv"><small>ROI</small><b class="${roiClass}">${(roi * 100).toFixed(1)}%</b></div>` +
      `</div>` +
      `<div style="color: var(--muted);">Updates ${game.updates} • Channels ${routes.length ? routes.join(", ") : "None"}${soldTag ? " • Sold" : ""}</div>` +
      `<div class="mini-actions">` +
      `<button class="alt" data-game="${game.id}" data-action="update" ${canUpdate ? "" : "disabled"}>Ship Update${cooldown > 0 && !game.dead && !game.acquired ? ` (${cooldown}d)` : ""}</button>` +
      `</div>`;
    els.gameList.appendChild(card);
  });
}

function renderProduction() {
  if (!state.activeProduction) {
    els.prodStatus.textContent = "No active development";
    els.prodFill.style.width = "0%";
    return;
  }
  const p = state.activeProduction;
  const progress = clamp((p.elapsedDays / p.totalDays) * 100, 0, 100);
  els.prodStatus.textContent = `${p.title} (${p.elapsedDays}/${p.totalDays} days)`;
  els.prodFill.style.width = `${progress.toFixed(1)}%`;
}

function recalcStudioPlayers() {
  const gamePlayers = state.games.reduce((sum, g) => sum + (g.dead ? 0 : g.currentPlayers), 0);
  const teamCommunity = (state.staff.community || 0) * 55;
  const brandBase = state.reputation * 4;
  state.players = Math.round(clamp(gamePlayers + teamCommunity + brandBase, 0, 20000000));
}

function renderStats() {
  recalcStudioPlayers();
  refreshMissionsIfNeeded();
  updateMissionProgress();
  updateContractProgress();
  updateAchievements();
  const debt = totalDebt();
  const totalVisits = state.games.reduce((sum, game) => sum + (Number(game.totalVisits) || 0), 0);
  const net = state.pnl.revenue - state.pnl.expense;
  const margin = state.pnl.revenue > 0 ? (net / state.pnl.revenue) * 100 : 0;
  const ws = workspaceData[state.workspace];
  syncStudioNameLocked();

  els.weekVal.textContent = formatTimeline(state.week);
  els.cashVal.textContent = fmtMoney(state.cash);
  els.creditVal.textContent = Math.round(state.creditScore);
  els.playersVal.textContent = Math.round(state.players).toLocaleString();
  els.repVal.textContent = `${Math.round(state.reputation)} / 100`;
  els.debtVal.textContent = fmtMoney(debt);
  els.gamesVal.textContent = String(state.games.length);
  els.visitsVal.textContent = Math.round(totalVisits).toLocaleString();
  els.dealsVal.textContent = String(state.monetizationDeals.length);
  els.teamVal.textContent = String(totalStaff());
  els.trendGenre.textContent = state.trend.genre.toUpperCase();
  els.trendDaysLeft.textContent = `${Math.max(0, state.trend.refreshDay - state.week)}d`;
  els.workspaceTierView.value = ws.label;
  els.workspaceRentView.value = `${fmtMoney(ws.rent)} / week`;
  const nextKey = nextWorkspaceKey();
  if (nextKey) {
    const next = workspaceData[nextKey];
    const cost = workspaceUpgradeCost(nextKey);
    els.nextUpgradeView.value = next.label;
    els.nextUpgradeCostView.value = fmtMoney(cost);
    els.upgradeBtn.disabled = false;
  } else {
    els.nextUpgradeView.value = "Max Tier Reached";
    els.nextUpgradeCostView.value = "R$0";
    els.upgradeBtn.disabled = true;
  }
  if (state.activeProduction) {
    const remaining = Math.max(0, state.activeProduction.totalDays - state.activeProduction.elapsedDays);
    els.publishEta.textContent = `${remaining} day${remaining === 1 ? "" : "s"} remaining`;
  } else {
    els.publishEta.textContent = "No active project";
  }

  const budget = totalBudget();
  const budgets = getBudgets();
  const schedule = getAdvisedSchedule();
  els.totalBudget.textContent = fmtMoney(budget);
  const risk = riskLabel(budget, budgets.ads, budgets.systems);
  const tone = risk === "Low" ? "good" : risk === "High" || risk === "Very High" ? "bad" : "warn";
  els.riskView.textContent = risk;
  els.riskView.className = tone;
  els.advisedDays.value = `${schedule.advised} days (safe range ${schedule.min}-${schedule.max})`;
  if (!els.devDays.value) {
    els.devDays.value = String(schedule.advised);
  }

  const apr = currentAPR();
  els.aprOffer.textContent = `${apr.toFixed(1)}%`;
  els.creditLimit.textContent = fmtMoney(creditLimit());

  els.pnlRevenue.textContent = fmtMoney(state.pnl.revenue);
  els.pnlExpense.textContent = fmtMoney(state.pnl.expense);
  els.pnlNet.textContent = fmtMoney(net);
  els.pnlNet.className = net >= 0 ? "good" : "bad";
  els.pnlMargin.textContent = `${margin.toFixed(1)}%`;

  updateRoleUi();
  renderLoans();
  renderGames();
  renderMissions();
  renderContract();
  const cd = actionCooldownLeft();
  els.actionCooldownView.textContent = cd > 0 ? `${cd}d` : "Ready";
  renderAchievements();
  renderProduction();
  renderLeaderboard();
  saveCurrentSlot();
}

function updateAchievements() {
  achievementDefs.forEach((a) => {
    if (state.achievements[a.id]) return;
    if (a.check(state)) {
      state.achievements[a.id] = { unlockedAtDay: state.week };
      log(`Achievement unlocked: ${a.name}`, "good");
    }
  });
}

function renderAchievements() {
  if (!els.achievementList) return;
  els.achievementList.innerHTML = "";
  achievementDefs.forEach((a) => {
    const unlocked = Boolean(state.achievements[a.id]);
    const day = unlocked ? state.achievements[a.id].unlockedAtDay : null;
    const card = document.createElement("div");
    card.className = `mini-card ${unlocked ? "good" : "warn"}`;
    card.innerHTML = `<b>${a.name}</b><br>${a.desc}<br><span class="${unlocked ? "good" : "warn"}">${unlocked ? `Unlocked on Day ${day}` : "Locked"}</span>`;
    els.achievementList.appendChild(card);
  });
}

function processWeeklyLoans() {
  if (!state.loans.length) return;
  const survivors = [];
  state.loans.forEach((loan) => {
    const weeklyRate = loan.apr / 100 / 52;
    const interest = loan.balance * weeklyRate;
    const due = Math.min(loan.balance + interest, loan.paymentWeekly);
    if (state.cash >= due) {
      addExpense(due);
      loan.balance = loan.balance + interest - due;
      loan.weeksLeft -= 1;
      state.creditScore = clamp(state.creditScore + 0.3, 380, 850);
      if (loan.balance <= 1) {
        log(`Funding #${loan.id} fully paid off.`, "good");
        state.creditScore = clamp(state.creditScore + 7, 380, 850);
        return;
      }
    } else {
      const lateFee = Math.max(2, loan.balance * 0.006);
      loan.balance += interest + lateFee;
      loan.weeksLeft -= 1;
      state.creditScore = clamp(state.creditScore - rand(8, 16), 380, 850);
      state.reputation = clamp(state.reputation - rand(0.5, 2), 0, 100);
      log(`Missed Funding #${loan.id} payment. Late fee ${fmtMoney(lateFee)}.`, "bad");
    }
    if (loan.weeksLeft <= 0 && loan.balance > 1) loan.weeksLeft = 4;
    survivors.push(loan);
  });
  state.loans = survivors;
}
function processStaffPayroll() {
  const payroll = payrollWeekly();
  if (payroll <= 0) return;

  if (state.cash >= payroll) {
    addExpense(payroll);
    return;
  }

  const availableCash = Math.max(0, state.cash);
  const affordableRatio = clamp(availableCash / Math.max(payroll, 1), 0, 1);
  const forcedLayoffs = Math.max(1, Math.ceil((1 - affordableRatio) * totalStaff() * 0.6));
  if (availableCash > 0) addExpense(availableCash);

  for (let i = 0; i < forcedLayoffs; i += 1) {
    const staffedRoles = Object.keys(staffData).filter((role) => state.staff[role] > 0);
    if (!staffedRoles.length) break;
    const role = pick(staffedRoles);
    state.staff[role] -= 1;
  }
  state.reputation = clamp(state.reputation - rand(1.5, 4), 0, 100);
  state.creditScore = clamp(state.creditScore - rand(2, 6), 380, 850);
  log(`Could not cover payroll ${fmtMoney(payroll)}. Emergency layoffs triggered.`, "bad");
}

function chargeWorkspaceRent() {
  const ws = workspaceData[state.workspace];
  if (!ws || ws.rent <= 0) return;
  if (state.cash >= ws.rent) addExpense(ws.rent);
  else {
    state.creditScore = clamp(state.creditScore - rand(5, 10), 380, 850);
    state.reputation = clamp(state.reputation - rand(1, 3), 0, 100);
    state.workspace = "bedroom";
    log(`Could not afford ${ws.label}. You were forced back to Used Laptop + Bedroom.`, "bad");
  }
}

function buyNextWorkspaceUpgrade() {
  const nextKey = nextWorkspaceKey();
  if (!nextKey) {
    log("You already have the maximum computer/house upgrade tier.", "warn");
    return;
  }
  const cost = workspaceUpgradeCost(nextKey);
  if (state.cash < cost) {
    log(`Need ${fmtMoney(cost)} to buy ${workspaceData[nextKey].label}.`, "bad");
    return;
  }
  addExpense(cost);
  state.workspace = nextKey;
  state.reputation = clamp(state.reputation + rand(0.4, 1.2), 0, 100);
  log(`Upgraded to ${workspaceData[nextKey].label} for ${fmtMoney(cost)}.`, "good");
  renderStats();
}

function processOffersWeek() {
  if (state.offers.length) {
    const active = [];
    state.offers.forEach((offer) => {
      offer.weeksLeft -= 1;
      if (offer.weeksLeft > 0) active.push(offer);
      else log(`${offer.buyer} withdrew a buyout offer.`, "warn");
    });
    state.offers = active;
  }

  const prod = state.activeProduction;
  if (!prod || prod.budget < 10) return;

  const team = teamEffects();
  const progressRatio = clamp(prod.elapsedDays / Math.max(prod.totalDays, 1), 0, 1);
  const attention =
    (prod.budget * 2.1) +
    (prod.budgets.ads * 2.6) +
    (state.reputation * 1.3) +
    (Math.sqrt(Math.max(state.players, 1)) * 1.1) +
    (progressRatio * 24) +
    (team.hype * 14);
  const chance = clamp((attention - 75) / 320, 0.01, 0.32);
  if (Math.random() >= chance) return;

  const alreadyPending = state.offers.some((o) => o.productionId === prod.id);
  if (alreadyPending) return;

  let buyer = null;
  let rights = "";
  let multiple = 0;
  if (prod.budget >= 25 && attention > 120 && Math.random() < 0.55) {
    buyer = pick(["MetaBlocks Publishing", "NextPlay Network", "CloudByte Partners"]);
    rights = "Global Publishing Rights";
    multiple = rand(1.18, 1.85);
  } else if (prod.budget >= 14 && attention > 95) {
    buyer = pick(["Pixel Arcade", "Riftline", "Novus Interactive"]);
    rights = "Platform Distribution Rights";
    multiple = rand(1.05, 1.45);
  }
  if (!buyer) return;

  const offer = {
    id: state.nextOfferId++,
    kind: "acquisition",
    productionId: prod.id,
    productionTitle: prod.title,
    buyer,
    rights,
    projectBudget: prod.budget,
    buyoutPrice: prod.budget * multiple,
    weeksLeft: Math.round(rand(1, 4))
  };
  state.offers.push(offer);
  log(`${offer.buyer} is interested in buying ${prod.title}.`, "good");
}

function clearOffersForProduction(productionId) {
  state.offers = state.offers.filter((o) => o.productionId !== productionId);
}

function openReleaseAdOverlay(prod) {
  const suggested = Math.max(10, Math.round((prod.budgets.ads + prod.budgets.ops) * 1.15));
  els.adLead.textContent = `Release day for ${prod.title}. Enter ad spend to launch with ads, or skip.`;
  els.adSpendInput.value = String(suggested);
  els.adCashView.value = fmtMoney(Math.max(0, state.cash));
  els.adOverlay.style.display = "grid";
}

function closeReleaseAdOverlay() {
  els.adOverlay.style.display = "none";
}

function completePendingRelease(runWithAds) {
  if (!pendingReleaseProduction) return;
  let releaseAdSpend = 0;
  if (runWithAds) {
    const raw = Math.floor(Number(els.adSpendInput.value) || 0);
    if (!Number.isFinite(raw) || raw <= 0) {
      log("Enter a valid ad spend amount to launch with ads.", "warn");
      return;
    }
    releaseAdSpend = Math.min(raw, Math.floor(Math.max(0, state.cash)));
    if (releaseAdSpend <= 0) {
      log(`Skipped release ad campaign for ${pendingReleaseProduction.title} due to low cash.`, "warn");
    } else {
      addExpense(releaseAdSpend);
      log(`Release ad campaign funded for ${pendingReleaseProduction.title}: ${fmtMoney(releaseAdSpend)}.`, "warn");
    }
  }
  const prod = pendingReleaseProduction;
  pendingReleaseProduction = null;
  closeReleaseAdOverlay();
  finalizeGameRelease(prod, releaseAdSpend);
  renderStats();
}

function finalizeGameRelease(prod, releaseAdSpend = 0) {
  const b = prod.budgets;
  const ws = workspaceData[prod.workspace];
  const team = teamEffects();
  const totalSpent = prod.spent;
  const codeQ = Math.log1p((b.script + (state.staff.scripter * 6)) / 14) * 19;
  const artQ = Math.log1p((b.art + (state.staff.builder * 6) + (state.staff.vfx * 4)) / 24) * 25;
  const systemsQ = Math.log1p((b.systems + (state.staff.scripter * 5) + (state.staff.qa * 3)) / 30) * 28;
  const uiQ = Math.log1p((b.ui + (state.staff.uiux * 5)) / 22) * 20;
  const launchPower = Math.log1p((b.ads + b.ops + releaseAdSpend + (state.staff.community * 3)) / 20) * 26;
  const fitMultiplier = clamp(1 - (prod.overscale * 0.22), 0.55, 1);
  const designScore = (codeQ + artQ + systemsQ + uiQ + state.reputation * 0.23 + rand(-11, 11)) * ws.quality * fitMultiplier * team.quality;
  const audiencePull = launchPower + Math.log1p(Math.max(state.players, 1) / 180) * 18 + rand(-6, 8) + (team.hype * 3);
  const genreMod = gameTypeMultipliers[prod.genre] || gameTypeMultipliers.simulator;
  const quality = clamp(designScore, 10, 98);
  const receptionSwing = rand(-22, 22) * genreMod.volatility;
  let finalScore = clamp(quality + receptionSwing * 0.35, 5, 99);
  if (prod.genre === state.trend.genre) {
    finalScore = clamp(finalScore + rand(2, 6), 5, 99);
  }
  if (prod.scheduleRush > 1) {
    const rushPenalty = clamp((prod.scheduleRush - 1) * rand(6, 14), 0, 14);
    finalScore = clamp(finalScore - rushPenalty, 5, 99);
    if (Math.random() < clamp((prod.scheduleRush - 1) * 0.22, 0, 0.28)) {
      finalScore = clamp(finalScore + rand(2, 7), 5, 99);
      log(`${prod.title} had a lucky fast-build launch despite schedule pressure.`, "warn");
    } else {
      log(`${prod.title} shipped rushed and had extra polish issues.`, "bad");
    }
  } else if (prod.scheduleRush < 0.9) {
    const stabilityBoost = clamp((1 - prod.scheduleRush) * rand(3, 9), 0, 9);
    finalScore = clamp(finalScore + stabilityBoost, 5, 99);
    log(`${prod.title} benefited from extra polish time.`, "good");
  }
  const baseGross = totalSpent * (0.28 + quality / 85 + audiencePull / 72) * genreMod.audience;
  const marketNoise = rand(-0.65, 1.05) * genreMod.volatility;
  const wordOfMouth = (finalScore - 50) / 100;
  const gross = Math.max(totalSpent * rand(0.08, 0.25), baseGross * (1 + marketNoise + wordOfMouth));
  const studioCut = gross * rand(0.44, 0.62);
  addRevenue(studioCut);

  const trendBoost = prod.genre === state.trend.genre ? rand(60, 180) : 0;
  const initialPlayers = Math.max(30, Math.round((finalScore * 2.1) + (b.ads * 2.2) + (b.ops * 1.8) + (releaseAdSpend * 0.9) + (state.reputation * 1.2) + trendBoost + rand(-40, 80)));

  state.games.push(normalizeGame({
    id: state.nextGameId++,
    title: prod.title,
    description: prod.description,
    genre: prod.genre,
    budget: totalSpent,
    gross: studioCut,
    extraRevenue: 0,
    score: finalScore,
    acquired: false,
    launchDay: state.week,
    currentPlayers: initialPlayers,
    peakPlayers: initialPlayers,
    totalVisits: Math.round(initialPlayers * rand(4, 9)),
    lifetimePayout: 0,
    weeklyPayout: 0,
    pendingPayout: 0,
    updates: 0,
    lastUpdateDay: state.week,
    dead: false,
    trend: rand(-0.02, 0.05) - Math.max(0, prod.scheduleRush - 1) * 0.03 + Math.max(0, 1 - prod.scheduleRush) * 0.02,
    monetization: clamp((b.systems + b.ops) / Math.max(totalSpent, 1) * 4, 0.6, 1.5),
    gamepasses: (prod.gamepasses || []).map((p) => ({ enabled: true, price: p.price, buyers: 0, revenue: 0 })),
    channels: { discover: true, sponsored: false, groupBoost: false }
  }));

  const releasedGame = state.games[state.games.length - 1];
  if (releaseAdSpend > 0) {
    const burstVisits = Math.max(0, Math.round((releaseAdSpend * rand(22, 68)) + rand(300, 2200)));
    const burstPlayers = Math.max(0, Math.round(burstVisits / rand(18, 46)));
    releasedGame.totalVisits += burstVisits;
    releasedGame.currentPlayers += burstPlayers;
    releasedGame.peakPlayers = Math.max(releasedGame.peakPlayers, releasedGame.currentPlayers);
    releasedGame.trend = clamp((releasedGame.trend || 0) + rand(0.015, 0.07), -0.09, 0.12);
    releasedGame.channels.sponsored = true;
    state.monetizationDeals.push({ type: "release-campaign", gameId: releasedGame.id, value: releaseAdSpend });
    log(`${releasedGame.title} gained a release traffic burst from ads (${Math.round(burstVisits).toLocaleString()} visits).`, "good");
  }
  const roi = (studioCut - totalSpent) / Math.max(totalSpent, 1);

  if (roi >= 0.65) {
    state.reputation = clamp(state.reputation + rand(7, 13), 0, 100);
    state.creditScore = clamp(state.creditScore + rand(8, 16), 380, 850);
    log(`${prod.title} went viral. Profit ${fmtMoney(studioCut - totalSpent)}.`, "good");
  } else if (roi >= 0.15) {
    state.reputation = clamp(state.reputation + rand(2, 6), 0, 100);
    state.creditScore = clamp(state.creditScore + rand(1, 5), 380, 850);
    log(`${prod.title} performed well. Profit ${fmtMoney(studioCut - totalSpent)}.`, "good");
  } else if (roi >= -0.2) {
    state.reputation = clamp(state.reputation - rand(1, 3), 0, 100);
    state.creditScore = clamp(state.creditScore - rand(2, 7), 380, 850);
    log(`${prod.title} barely broke even (${fmtMoney(studioCut - totalSpent)}).`, "warn");
  } else {
    state.reputation = clamp(state.reputation - rand(5, 11), 0, 100);
    state.creditScore = clamp(state.creditScore - rand(8, 20), 380, 850);
    log(`${prod.title} underperformed. Loss ${fmtMoney(Math.abs(studioCut - totalSpent))}.`, "bad");
  }

  clearOffersForProduction(prod.id);
}
function processLiveOpsDay(settleWeekly = false) {
  if (!state.games.length) return;
  const team = teamEffects();
  let weeklyPayoutPaid = 0;

  state.games.forEach((game, idx) => {
    const g = normalizeGame(game);
    state.games[idx] = g;
    g.ageDays += 1;

    if (g.acquired || g.dead) {
      if (settleWeekly) g.weeklyPayout = 0;
      g.currentPlayers = g.acquired ? 0 : g.currentPlayers;
      return;
    }

    const type = gameTypeMultipliers[g.genre] || gameTypeMultipliers.simulator;
    const daysSinceUpdate = Math.max(0, state.week - (g.lastUpdateDay || g.launchDay || state.week));
    const stalePenalty =
      daysSinceUpdate <= 4 ? 0 :
      daysSinceUpdate <= 10 ? 0.022 :
      daysSinceUpdate <= 18 ? 0.044 :
      0.08 + ((daysSinceUpdate - 18) * 0.0044);
    const ageDecay = 0.016 + ((g.ageDays / 28) * 0.0031);
    const qualityBuffer = (g.score / 100) * 0.022 * type.shelfLife;
    const updateBuffer = Math.min(0.022, g.updates * 0.0026) + (daysSinceUpdate <= 4 ? 0.013 : 0);
    const liveOpsBuffer = (team.liveOps - 1) * 0.014;
    const trendSwing = clamp((g.trend || 0) + rand(-0.015, 0.015), -0.08, 0.08);

    const churnRate = clamp(ageDecay + stalePenalty - qualityBuffer - updateBuffer - liveOpsBuffer - trendSwing, 0.04, 0.74);
    const retention = 1 - churnRate;
    const marketingBoost = state.week <= state.buffs.marketingUntil ? 1.45 : 1;
    const freshInflux = Math.max(0, Math.round((state.reputation * 0.12 + (state.staff.community * 8)) * marketingBoost * rand(0.1, 0.7)));
    let nextPlayers = Math.round(g.currentPlayers * retention + freshInflux);

    if (g.currentPlayers < 110 && g.ageDays > 70 && Math.random() < 0.08) {
      nextPlayers = Math.round(nextPlayers * rand(0.3, 0.7));
    }

    g.currentPlayers = Math.max(0, nextPlayers);
    g.peakPlayers = Math.max(g.peakPlayers, g.currentPlayers);

    if (g.currentPlayers === 0 || (g.ageDays > 45 && g.currentPlayers < 55 && (daysSinceUpdate > 7 || Math.random() < 0.65))) {
      g.currentPlayers = 0;
      g.weeklyPayout = 0;
      g.dead = true;
      g.trend = -0.09;
      log(`${g.title} has effectively died off.`, "bad");
      return;
    }

    const visits = Math.max(0, Math.round(g.currentPlayers * rand(0.35, 1.05)));
    g.totalVisits += visits;

    const payoutPerVisit = rand(0.00018, 0.00105);
    const adPayout = visits * payoutPerVisit * g.monetization;
    g.pendingPayout += adPayout;

    (g.gamepasses || []).forEach((pass) => {
      const price = Math.max(1, Number(pass.price) || 1);
      const lnPrice = Math.log(price + 1);
      const optimalLn = Math.log(130);
      const priceFit = Math.exp(-Math.pow(lnPrice - optimalLn, 2) / (2 * Math.pow(0.85, 2)));
      const valueFit = clamp((g.score / 100) * 1.1 + (state.reputation / 100) * 0.28, 0.18, 1.5);
      const baseRate = clamp(0.000015 + (0.0010 * priceFit * valueFit), 0.000002, 0.0022);
      const buyers = Math.max(0, Math.round(visits * baseRate * rand(0.15, 1.1)));
      if (buyers > 0) {
        const passRevenue = buyers * price * 0.7;
        pass.buyers += buyers;
        pass.revenue += passRevenue;
        g.pendingPayout += passRevenue;
      }
    });

    if (settleWeekly) {
      g.weeklyPayout = g.pendingPayout;
      g.lifetimePayout += g.pendingPayout;
      weeklyPayoutPaid += g.pendingPayout;
      addRevenue(g.pendingPayout);
      g.pendingPayout = 0;
    }

    g.trend = clamp((g.trend || 0) * 0.85 + rand(-0.01, 0.01), -0.09, 0.09);
  });

  if (settleWeekly && weeklyPayoutPaid > 0) {
    log(`Weekly payout credited: ${fmtMoney(weeklyPayoutPaid)} across ${state.games.filter((g) => !g.dead && !g.acquired).length} active games.`, "good");
  }
}

function progressProductionWeek() {
  const prod = state.activeProduction;
  if (!prod) return;
  const team = teamEffects();
  const remaining = Math.max(0, prod.budget - prod.spent);
  if (remaining > 0) {
    const dailyCost = Math.min(remaining, prod.dailySpend);
    if (state.cash < dailyCost) {
      state.reputation = clamp(state.reputation - 0.8, 0, 100);
      state.creditScore = clamp(state.creditScore - rand(1, 3), 380, 850);
      log(`Cash shortfall on ${prod.title}. Development continues with emergency spending.`, "warn");
    }
    addExpense(dailyCost);
    prod.spent += dailyCost;

    if (prod.overscale > 0 && Math.random() < clamp(prod.overscale * 0.05, 0.01, 0.12)) {
      const overrun = dailyCost * rand(0.05, 0.16) / team.quality;
      addExpense(overrun);
      state.reputation = clamp(state.reputation - rand(0.05, 0.3), 0, 100);
      log(`${prod.title} had unexpected optimization costs of ${fmtMoney(overrun)}.`, "warn");
    }
    if (Math.random() < 0.09) {
      const incidentCost = dailyCost * rand(0.06, 0.2) / clamp(team.quality, 1, 2.4);
      addExpense(incidentCost);
      state.reputation = clamp(state.reputation - rand(0.04, 0.25), 0, 100);
      log(`${prod.title} hit a realistic production issue and cost +${fmtMoney(incidentCost)}.`, "warn");
    }
  }
  prod.elapsedDays += 1;
  if (prod.elapsedDays >= prod.totalDays) {
    pendingReleaseProduction = prod;
    openReleaseAdOverlay(prod);
    state.activeProduction = null;
  }
}

function nextWeek() {
  if (pendingReleaseProduction) {
    log("Complete the release-day ad decision before advancing time.", "warn");
    return;
  }
  state.week += 1;
  rotateTrendIfNeeded();
  refreshMissionsIfNeeded();
  const isWeeklyCycle = state.week % 7 === 0;
  processLiveOpsDay(isWeeklyCycle);
  if (isWeeklyCycle) {
    chargeWorkspaceRent();
    processStaffPayroll();
    processWeeklyLoans();
  }
  progressProductionWeek();
  updateContractProgress();
  settleContractIfNeeded();
  if (state.cash < 0) state.creditScore = clamp(state.creditScore - rand(4, 8), 380, 850);
  renderStats();
}

function startProduction() {
  if (state.activeProduction) return log("A project is already in development. Keep pressing Next Day.", "warn");
  const title = els.title.value.trim();
  const description = els.description.value.trim();
  const genre = els.genre.value;
  if (!title || !description) return log("Enter both a game title and concept.", "warn");
  const budget = totalBudget();
  if (budget < 15) return log("Budget is too low for a viable launch.", "warn");
  const ws = workspaceData[state.workspace];
  const kickoff = Math.max(3, budget * 0.2);
  if (state.cash < kickoff) return log(`Need ${fmtMoney(kickoff)} cash to start development.`, "bad");
  const schedule = getAdvisedSchedule();
  const selectedDays = Math.floor(Number(els.devDays.value) || 0);
  if (!Number.isFinite(selectedDays) || selectedDays < 2) return log("Set a valid development day count (2+).", "warn");
  const gamepasses = getConfiguredGamepasses();
  addExpense(kickoff);
  const team = teamEffects();
  const overscale = Math.max(0, (budget / ws.maxBudget) - 1);
  const totalDays = clamp(selectedDays, 2, 420);
  const scheduleRush = schedule.advised / Math.max(totalDays, 1);
  state.activeProduction = {
    id: state.nextProductionId++,
    title,
    description,
    genre,
    workspace: state.workspace,
    budgets: getBudgets(),
    budget,
    overscale,
    scheduleRush,
    advisedDays: schedule.advised,
    gamepasses,
    spent: kickoff,
    totalDays,
    elapsedDays: 0,
    dailySpend: Math.max(0, (budget - kickoff) / totalDays)
  };
  log(`${title} started in ${ws.label}. ${totalDays} days to complete.`, "good");
  if (totalDays < schedule.min) {
    log(`This schedule is faster than advised (${schedule.min}-${schedule.max}). Higher bug risk, but a small upside if launch luck hits.`, "warn");
  } else if (totalDays > schedule.max) {
    log(`This schedule is slower than advised (${schedule.min}-${schedule.max}). Better polish, but slower time-to-market.`, "good");
  }
  if (overscale > 0) log(`${ws.label} is undersized for this budget, so expect slower output and extra costs.`, "warn");
  if (gamepasses.length) log(`${title} configured ${gamepasses.length} gamepass(es). Purchases depend on pricing and player conversion.`, "warn");
  else log(`${title} has no gamepasses enabled.`, "warn");
  log(`${title} release-day ad campaign choice will appear when development finishes.`, "warn");
  els.creatorOverlay.style.display = "none";
  renderStats();
}

function updateGame(gameId) {
  const game = state.games.find((g) => g.id === gameId);
  if (!game) return;
  if (game.dead) return log(`${game.title} is dead and cannot be updated.`, "bad");
  if (game.acquired) return log(`${game.title} is sold and no longer under your control.`, "warn");
  const since = state.week - game.lastUpdateDay;
  if (since < 4) return log(`You need to wait ${4 - since} more day(s) before updating ${game.title}.`, "warn");

  const team = teamEffects();
  const baseCost = 30 + (game.updates * 13) + (game.currentPlayers * 0.055);
  const discountedCost = baseCost / clamp(1 + (state.staff.scripter * 0.03) + (state.staff.builder * 0.02), 1, 1.7);
  const cost = Math.max(8, Math.round(discountedCost));
  if (state.cash < cost) return log(`Need ${fmtMoney(cost)} to ship an update for ${game.title}.`, "bad");

  addExpense(cost);
  const qaBuffBonus = state.week <= state.buffs.updateSuccessUntil ? 0.08 : 0;
  const successChance = clamp(0.56 + ((team.liveOps - 1) * 0.16) + ((state.staff.qa || 0) * 0.008) + qaBuffBonus, 0.4, 0.94);
  if (Math.random() < successChance) {
    const boost = Math.round(Math.max(8, game.currentPlayers * rand(0.08, 0.24) + state.reputation * 1.4));
    game.currentPlayers += boost;
    game.peakPlayers = Math.max(game.peakPlayers, game.currentPlayers);
    game.updates += 1;
    game.lastUpdateDay = state.week;
    game.score = clamp(game.score + rand(0.2, 1.4), 5, 99);
    game.trend = clamp((game.trend || 0) + rand(0.02, 0.08), -0.09, 0.12);
    game.channels.groupBoost = true;
    state.reputation = clamp(state.reputation + rand(0.4, 1.8), 0, 100);
    log(`Update shipped for ${game.title}. Players +${boost.toLocaleString()}.`, "good");
  } else {
    const drop = Math.round(Math.max(5, game.currentPlayers * rand(0.04, 0.12)));
    game.currentPlayers = Math.max(0, game.currentPlayers - drop);
    game.updates += 1;
    game.lastUpdateDay = state.week;
    game.score = clamp(game.score - rand(0.3, 1.3), 5, 99);
    game.trend = clamp((game.trend || 0) - rand(0.03, 0.09), -0.12, 0.1);
    state.reputation = clamp(state.reputation - rand(0.3, 1.5), 0, 100);
    log(`Update for ${game.title} caused issues. Players -${drop.toLocaleString()}.`, "bad");
  }
  renderStats();
}

function acceptOffer(id) {
  const offerIdx = state.offers.findIndex((o) => o.id === id);
  if (offerIdx < 0) return;
  const offer = state.offers[offerIdx];
  if (offer.kind !== "acquisition") return;
  const prod = state.activeProduction;
  if (!prod || prod.id !== offer.productionId) {
    state.offers.splice(offerIdx, 1);
    return log("Offer expired because the project changed.", "warn");
  }

  addRevenue(offer.buyoutPrice);
  state.games.push(normalizeGame({
    id: state.nextGameId++,
    title: prod.title,
    description: `${prod.description} (Sold to ${offer.buyer})`,
    genre: prod.genre,
    budget: prod.spent,
    gross: offer.buyoutPrice,
    extraRevenue: 0,
    score: clamp(45 + state.reputation * 0.4 + rand(-8, 12), 20, 90),
    acquired: true,
    launchDay: state.week,
    currentPlayers: 0,
    peakPlayers: 0,
    totalVisits: 0,
    lifetimePayout: 0,
    weeklyPayout: 0,
    pendingPayout: 0,
    updates: 0,
    lastUpdateDay: state.week,
    dead: false,
    trend: 0,
    gamepasses: [],
    channels: { discover: false, sponsored: false, groupBoost: false }
  }));
  state.monetizationDeals.push({ type: "buyout", value: offer.buyoutPrice });
  state.offers.splice(offerIdx, 1);
  clearOffersForProduction(prod.id);
  state.activeProduction = null;
  state.reputation = clamp(state.reputation + rand(2, 8), 0, 100);
  state.creditScore = clamp(state.creditScore + rand(1, 8), 380, 850);
  log(`Sold ${offer.productionTitle} to ${offer.buyer} for ${fmtMoney(offer.buyoutPrice)}.`, "good");
  renderStats();
}

function declineOffer(id) {
  const offerIdx = state.offers.findIndex((o) => o.id === id);
  if (offerIdx < 0) return;
  const offer = state.offers[offerIdx];
  state.offers.splice(offerIdx, 1);
  log(`Declined ${offer.buyer}'s buyout offer.`, "warn");
  renderStats();
}

function takeLoan() {
  const amount = Math.round(Number(els.loanAmount.value) || 0);
  const months = Math.round(Number(els.loanTerm.value) || 12);
  const limit = creditLimit();
  if (amount < 50) return log("Minimum funding amount is R$50.", "warn");
  if (amount > limit) {
    state.creditScore = clamp(state.creditScore - rand(1, 4), 380, 850);
    return log(`Funding denied. Limit is ${fmtMoney(limit)}.`, "bad");
  }
  const apr = currentAPR();
  const weeks = months * 4;
  const paymentWeekly = weeklyPaymentFor(amount, apr, weeks);
  const dti = (totalDebt() + amount) / Math.max(state.cash + amount, 1);
  if (dti > 6.2) {
    state.creditScore = clamp(state.creditScore - rand(2, 6), 380, 850);
    return log("Funding denied due to high debt risk.", "bad");
  }
  state.loans.push({ id: state.nextLoanId++, principal: amount, balance: amount, apr, paymentWeekly, weeksLeft: weeks });
  addRevenue(amount);
  state.creditScore = clamp(state.creditScore - rand(1, 3), 380, 850);
  log(`Funding approved: ${fmtMoney(amount)} at ${apr.toFixed(1)}% APR (${weeks} weeks).`, "warn");
  renderStats();
}

function hireStaff() {
  const role = selectedRole();
  const cfg = staffData[role];
  if (!cfg) return;
  if (state.cash < cfg.hireCost) return log(`Need ${fmtMoney(cfg.hireCost)} to hire a ${cfg.label}.`, "bad");
  addExpense(cfg.hireCost);
  state.staff[role] += 1;
  state.reputation = clamp(state.reputation + rand(0.1, 0.4), 0, 100);
  log(`Hired 1 ${cfg.label}.`, "good");
  renderStats();
}

function fireStaff() {
  const role = selectedRole();
  const cfg = staffData[role];
  if (!cfg) return;
  if ((state.staff[role] || 0) <= 0) return log(`No ${cfg.label} to fire.`, "warn");
  state.staff[role] -= 1;
  state.reputation = clamp(state.reputation - rand(0.15, 0.45), 0, 100);
  log(`Fired 1 ${cfg.label}.`, "warn");
  renderStats();
}

function disbandStudio() {
  if (!activeSlot) {
    log("No active save slot selected.", "warn");
    return;
  }
  const confirmed = window.confirm("Disband studio and permanently delete this save slot?");
  if (!confirmed) return;
  pendingReleaseProduction = null;
  closeReleaseAdOverlay();
  const summary = buildDisbandSummary();
  saveLeaderboardRecord(summary, "retired");

  localStorage.removeItem(slotKey(activeSlot));
  activeSlot = null;
  pendingSlotForCreation = null;

  applyLoadedState(createDefaultState("BlockForge Studio"));
  els.hireRole.value = "scripter";
  els.title.value = "";
  els.description.value = "";
  els.genre.value = "simulator";
  els.bScript.value = 5;
  els.bArt.value = 10;
  els.bSystems.value = 12;
  els.bUi.value = 7;
  els.bAds.value = 8;
  els.bOps.value = 5;
  els.gp1Enabled.checked = true;
  els.gp2Enabled.checked = false;
  els.gp3Enabled.checked = false;
  els.gp1Price.value = 99;
  els.gp2Price.value = 199;
  els.gp3Price.value = 399;
  els.devDays.value = "";
  els.presetBudgetTotal.value = "";
  els.loanAmount.value = 300;
  els.loanTerm.value = 12;
  els.log.innerHTML = "";
  els.creatorOverlay.style.display = "none";

  refreshSlotButtons();
  els.slotCreate.classList.remove("active");
  els.slotStudioName.value = "";
  els.saveOverlay.style.display = "none";
  renderStats();
  showDisbandSummary(summary);
}

document.querySelectorAll(".slot-btn").forEach((btn) => {
  btn.addEventListener("click", () => selectSlot(Number(btn.dataset.slot)));
});
els.slotCreateBtn.addEventListener("click", createSlotSave);
els.slotStudioName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") createSlotSave();
});
els.adLaunchBtn.addEventListener("click", () => completePendingRelease(true));
els.adSkipBtn.addEventListener("click", () => completePendingRelease(false));

document.querySelectorAll(".budget").forEach((input) => input.addEventListener("input", renderStats));
els.devDays.addEventListener("input", renderStats);
els.riskLowBtn.addEventListener("click", () => {
  const result = applyRiskPreset("low", els.presetBudgetTotal.value);
  if (!result) return log("Enter a total budget amount first.", "warn");
  log(`Low-risk split applied for ${fmtMoney(result.appliedTotal)}.`, "good");
  renderStats();
});
els.riskMedBtn.addEventListener("click", () => {
  const result = applyRiskPreset("medium", els.presetBudgetTotal.value);
  if (!result) return log("Enter a total budget amount first.", "warn");
  log(`Medium-risk split applied for ${fmtMoney(result.appliedTotal)}.`, "warn");
  renderStats();
});
els.riskHighBtn.addEventListener("click", () => {
  const result = applyRiskPreset("high", els.presetBudgetTotal.value);
  if (!result) return log("Enter a total budget amount first.", "warn");
  log(`High-risk split applied for ${fmtMoney(result.appliedTotal)}.`, "warn");
  renderStats();
});
els.upgradeBtn.addEventListener("click", buyNextWorkspaceUpgrade);
els.openCreatorBtn.addEventListener("click", () => {
  els.creatorOverlay.style.display = "grid";
});
els.closeCreatorBtn.addEventListener("click", () => {
  els.creatorOverlay.style.display = "none";
});
els.gp1Enabled.addEventListener("change", renderStats);
els.gp2Enabled.addEventListener("change", renderStats);
els.gp3Enabled.addEventListener("change", renderStats);
els.gp1Price.addEventListener("input", renderStats);
els.gp2Price.addEventListener("input", renderStats);
els.gp3Price.addEventListener("input", renderStats);
els.hireRole.addEventListener("change", updateRoleUi);
els.hireBtn.addEventListener("click", hireStaff);
els.fireBtn.addEventListener("click", fireStaff);
els.releaseBtn.addEventListener("click", startProduction);
els.nextWeekBtn.addEventListener("click", nextWeek);
els.loanBtn.addEventListener("click", takeLoan);
els.disbandBtn.addEventListener("click", disbandStudio);
els.disbandContinueBtn.addEventListener("click", () => {
  els.disbandOverlay.style.display = "none";
  els.saveOverlay.style.display = "grid";
});
els.acceptContractBtn.addEventListener("click", () => {
  if (state.activeContract) {
    const refreshFee = 80;
    if (state.cash < refreshFee) {
      log(`Need ${fmtMoney(refreshFee)} to refresh your sponsor contract.`, "bad");
      return;
    }
    addExpense(refreshFee);
    state.activeContract = createNewContract();
    log(`Contract refreshed for ${fmtMoney(refreshFee)}. New brief: ${state.activeContract.title}.`, "warn");
    renderStats();
    return;
  }
  state.activeContract = createNewContract();
  log(`Accepted contract: ${state.activeContract.title}.`, "good");
  renderStats();
});
els.actionDevJamBtn.addEventListener("click", () => usePowerAction("devjam"));
els.actionCommunityBtn.addEventListener("click", () => usePowerAction("community"));
els.actionQaBtn.addEventListener("click", () => usePowerAction("qa"));
els.mysteryCrateBtn.addEventListener("click", openMysteryCrate);
els.missionList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-mission]");
  if (!btn) return;
  claimMission(btn.dataset.mission);
});
els.gameList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-game]");
  if (!btn) return;
  const id = Number(btn.dataset.game);
  if (!id || btn.dataset.action !== "update") return;
  updateGame(id);
});

window.addEventListener("beforeunload", saveCurrentSlot);
initCollapsibleCards();
refreshSlotButtons();
syncStudioNameLocked();
renderStats();
