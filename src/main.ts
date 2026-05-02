import "./style.css";
import { fortunes, luckyActions, luckyColors, miniChallengeCategories, quotes } from "./data";

type OfficeLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

const locations = {
  tokyo: {
    name: "東京の下丸子付近",
    latitude: 35.5717,
    longitude: 139.6864
  },
  tochigi: {
    name: "栃木県大田原市付近",
    latitude: 36.8714,
    longitude: 140.0174
  }
} as const satisfies Record<string, OfficeLocation>;

type LocationKey = keyof typeof locations;
type WeatherType = "rainy" | "cloudy" | "sunny";
type LocationMode = "preset" | "custom";
type MoodLevel = 1 | 2 | 3 | 4 | 5;
type MoodHistory = Record<string, MoodLevel>;
type MoodLog = Record<string, MoodHistory>;
type MoodStatusTone = "default" | "error" | "success";
type LocationStatusTone = "default" | "error" | "success";
type MoodGraphEntry = {
  label: string;
  mood: MoodLevel | 0;
};
type SavedLocationState =
  | {
      mode: "preset";
      presetKey: LocationKey;
    }
  | {
      mode: "custom";
      location: OfficeLocation;
    };
type GeocodingResult = {
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country?: string;
};
type GeocodingResponse = {
  results?: GeocodingResult[];
  error?: boolean;
  reason?: string;
};
type GsiGeocodingFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    title?: string;
  };
};

let selectedLocationKey: LocationKey = "tochigi";
let activeWeatherLocation: OfficeLocation = locations[selectedLocationKey];
let activeLocationMode: LocationMode = "preset";
let customWeatherLocation: OfficeLocation | null = null;
const LOCATION_STORAGE_KEY = "gdm.selectedLocation";
const MOOD_LOG_STORAGE_KEY = "gdm:moodLog";
const GSI_GEOCODING_API_ENDPOINT = "https://msearch.gsi.go.jp/address-search/AddressSearch";
const GEOCODING_API_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const TRANSLATE_API_BASE_URL = "https://api.mymemory.translated.net/get";
const WIKIMEDIA_ONTHISDAY_API_BASE_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all";
const QUOTE_API_ENDPOINT = "/api/quote";
let latestQuoteText = "";
let currentMoodLog: MoodLog = {};
let activeProfileName = "";
const moodOptions = [
  { value: 1, emoji: "😴", label: "低め" },
  { value: 2, emoji: "😐", label: "ぼちぼち" },
  { value: 3, emoji: "🙂", label: "ふつう" },
  { value: 4, emoji: "😄", label: "よい" },
  { value: 5, emoji: "🔥", label: "最高" }
] as const satisfies ReadonlyArray<{ value: MoodLevel; emoji: string; label: string }>;

const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const cloudyCodes = [1, 2, 3, 45, 48];

type TranslationResponse = {
  responseData?: {
    translatedText?: string;
  };
};

type WikimediaEntry = {
  year?: number;
  text?: string;
};

type WikimediaResponse = {
  selected?: WikimediaEntry[];
  events?: WikimediaEntry[];
};

type QuoteResponse = {
  quote?: string;
  author?: string;
};

function getElementByIdOrThrow<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element not found: #${id}`);
  }
  return element as T;
}

function isLocationKey(value: string): value is LocationKey {
  return value in locations;
}

function isOfficeLocation(value: unknown): value is OfficeLocation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OfficeLocation>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  );
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateSeed(date = new Date(), name = ""): number {
  const dateSeed = Number(getLocalDateKey(date).replaceAll("-", ""));
  return dateSeed + hashString(name.trim());
}

function getTodaySeed(name = ""): number {
  return getDateSeed(new Date(), name);
}

function pickBySeed<T>(array: T[], seed: number, offset = 0): T {
  return array[(seed + offset) % array.length];
}

function isMoodLevel(value: unknown): value is MoodLevel {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

function getMoodOption(mood: MoodLevel): (typeof moodOptions)[number] {
  return moodOptions.find((option) => option.value === mood) ?? moodOptions[2];
}

function setLocationStatus(message: string, tone: LocationStatusTone = "default"): void {
  const locationStatus = getElementByIdOrThrow<HTMLElement>("locationStatus");
  locationStatus.textContent = message;
  locationStatus.classList.remove("text-slate-500", "text-emerald-600", "text-rose-500");

  if (tone === "success") {
    locationStatus.classList.add("text-emerald-600");
    return;
  }

  if (tone === "error") {
    locationStatus.classList.add("text-rose-500");
    return;
  }

  locationStatus.classList.add("text-slate-500");
}

function formatActiveLocationStatus(): string {
  if (activeLocationMode === "custom") {
    return `現在: ${activeWeatherLocation.name}（入力場所）`;
  }

  return `現在: ${activeWeatherLocation.name}（プリセット）`;
}

function setLocationButtonBusy(isBusy: boolean): void {
  const customLocationButton = getElementByIdOrThrow<HTMLButtonElement>("customLocationButton");
  customLocationButton.disabled = isBusy;
  customLocationButton.textContent = isBusy ? "検索中..." : "この場所を使う";
}

function setActivePresetLocation(locationKey: LocationKey): void {
  selectedLocationKey = locationKey;
  activeLocationMode = "preset";
  activeWeatherLocation = locations[locationKey];
  getElementByIdOrThrow<HTMLSelectElement>("locationSelect").value = locationKey;
  setLocationStatus(formatActiveLocationStatus());
}

function setActiveCustomLocation(location: OfficeLocation): void {
  customWeatherLocation = location;
  activeLocationMode = "custom";
  activeWeatherLocation = location;
  getElementByIdOrThrow<HTMLSelectElement>("locationSelect").value = "custom";
  getElementByIdOrThrow<HTMLInputElement>("customLocationInput").value = location.name;
  setLocationStatus(formatActiveLocationStatus(), "success");
}

function buildCustomLocationLabel(result: GeocodingResult, query: string): string {
  const baseName = typeof result.name === "string" && result.name.trim() ? result.name.trim() : query;
  const extraParts = [result.admin1, result.country]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .filter((value) => value.trim() !== baseName);

  return extraParts.length > 0 ? `${baseName} (${extraParts.join(" / ")})` : baseName;
}

function normalizeLocationQuery(query: string): string {
  return query.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function containsJapaneseCharacters(value: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
}

function stripAdministrativeSuffix(value: string): string {
  return value.replace(/[都道府県市区町村]$/u, "");
}

function buildLocationSearchQueries(query: string): string[] {
  const normalized = normalizeLocationQuery(query);
  const compact = normalized.replace(/\s+/gu, "");
  const queries = new Set<string>();

  const addQuery = (value: string): void => {
    const nextValue = normalizeLocationQuery(value).replace(/\s+/gu, "");
    if (nextValue.length >= 2) {
      queries.add(nextValue);
    }
  };

  addQuery(normalized);
  addQuery(compact);

  let suffixStripped = compact;
  while (suffixStripped.length >= 2) {
    const nextValue = stripAdministrativeSuffix(suffixStripped);
    if (nextValue === suffixStripped) {
      break;
    }
    addQuery(nextValue);
    suffixStripped = nextValue;
  }

  for (const separator of ["都", "道", "府", "県", "市", "区"] as const) {
    const splitIndex = compact.lastIndexOf(separator);
    if (splitIndex >= 0 && splitIndex < compact.length - 1) {
      addQuery(compact.slice(splitIndex + 1));
      addQuery(stripAdministrativeSuffix(compact.slice(splitIndex + 1)));
    }
  }

  return Array.from(queries);
}

function scoreGeocodingResult(result: GeocodingResult, query: string): number {
  const comparableQuery = normalizeLocationQuery(query).replace(/\s+/gu, "");
  const candidates = [result.name, result.admin1, result.country]
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizeLocationQuery(value).replace(/\s+/gu, ""));

  if (candidates.includes(comparableQuery)) {
    return 100;
  }

  if (candidates.some((value) => value.startsWith(comparableQuery))) {
    return 80;
  }

  if (candidates.some((value) => value.includes(comparableQuery))) {
    return 60;
  }

  return 0;
}

function scoreCandidateStrings(values: string[], query: string): number {
  const comparableQuery = normalizeLocationQuery(query).replace(/\s+/gu, "");
  const candidates = values
    .map((value) => normalizeLocationQuery(value).replace(/\s+/gu, ""))
    .filter((value) => value.length > 0);

  if (candidates.includes(comparableQuery)) {
    return 100;
  }

  if (candidates.some((value) => value.startsWith(comparableQuery))) {
    return 80;
  }

  if (candidates.some((value) => value.includes(comparableQuery))) {
    return 60;
  }

  return 0;
}

async function requestOpenMeteoGeocoding(query: string): Promise<GeocodingResponse> {
  const params = new URLSearchParams({
    name: query,
    count: "5",
    countryCode: "JP",
    language: "ja",
    format: "json"
  });
  const response = await fetch(`${GEOCODING_API_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`場所検索APIエラー: ${response.status}`);
  }

  return (await response.json()) as GeocodingResponse;
}

async function requestGsiGeocoding(query: string): Promise<GsiGeocodingFeature[]> {
  const params = new URLSearchParams({
    q: query
  });
  const response = await fetch(`${GSI_GEOCODING_API_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`国土地理院 地名検索APIエラー: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as GsiGeocodingFeature[]) : [];
}

function pickBestGsiResult(results: GsiGeocodingFeature[], query: string): OfficeLocation | null {
  const bestResult = results
    .filter((result) => Array.isArray(result.geometry?.coordinates) && typeof result.properties?.title === "string")
    .sort((left, right) => {
      const leftTitle = left.properties?.title ?? "";
      const rightTitle = right.properties?.title ?? "";
      return scoreCandidateStrings([rightTitle], query) - scoreCandidateStrings([leftTitle], query);
    })[0];

  const coordinates = bestResult?.geometry?.coordinates;
  const title = bestResult?.properties?.title?.trim();
  if (!coordinates || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number" || !title) {
    return null;
  }

  return {
    name: title,
    latitude: coordinates[1],
    longitude: coordinates[0]
  };
}

async function searchCustomLocation(query: string): Promise<OfficeLocation> {
  const searchQueries = buildLocationSearchQueries(query);

  for (const searchQuery of searchQueries) {
    if (containsJapaneseCharacters(searchQuery)) {
      try {
        const gsiResults = await requestGsiGeocoding(searchQuery);
        const gsiLocation = pickBestGsiResult(gsiResults, searchQuery);
        if (gsiLocation) {
          return gsiLocation;
        }
      } catch (error) {
        console.warn("国土地理院の場所検索に失敗しました", error);
      }
    }

    const data = await requestOpenMeteoGeocoding(searchQuery);
    const candidates = Array.isArray(data.results) ? data.results : [];
    const bestResult = candidates
      .filter((result) => typeof result.latitude === "number" && typeof result.longitude === "number")
      .sort((left, right) => scoreGeocodingResult(right, searchQuery) - scoreGeocodingResult(left, searchQuery))[0];

    if (bestResult && typeof bestResult.latitude === "number" && typeof bestResult.longitude === "number") {
      return {
        name: buildCustomLocationLabel(bestResult, query),
        latitude: bestResult.latitude,
        longitude: bestResult.longitude
      };
    }
  }

  throw new Error("場所が見つかりませんでした");
}

function getTodayMiniChallenge(): { category: string; text: string } {
  const category = pickBySeed(miniChallengeCategories, getTodaySeed("mini-challenge-category"), 13);
  const text = pickBySeed(category.challenges, getTodaySeed(`mini-challenge-${category.category}`), 7);
  return {
    category: category.category,
    text
  };
}

function loadMoodLog(): MoodLog {
  try {
    const stored = localStorage.getItem(MOOD_LOG_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const nextMoodLog: MoodLog = {};
    for (const [profileName, moodHistory] of Object.entries(parsed)) {
      if (!moodHistory || typeof moodHistory !== "object" || Array.isArray(moodHistory)) {
        continue;
      }

      const nextMoodHistory: MoodHistory = {};
      for (const [dateKey, moodValue] of Object.entries(moodHistory)) {
        if (isMoodLevel(moodValue)) {
          nextMoodHistory[dateKey] = moodValue;
        }
      }

      if (Object.keys(nextMoodHistory).length > 0) {
        nextMoodLog[profileName] = nextMoodHistory;
      }
    }
    return nextMoodLog;
  } catch (error) {
    console.warn("気分ログの読み込みに失敗しました", error);
    return {};
  }
}

function persistMoodLog(moodLog: MoodLog): boolean {
  try {
    localStorage.setItem(MOOD_LOG_STORAGE_KEY, JSON.stringify(moodLog));
    return true;
  } catch (error) {
    console.warn("気分ログの保存に失敗しました", error);
    return false;
  }
}

function getRecentMoodEntries(moodHistory: MoodHistory): MoodGraphEntry[] {
  const baseDate = new Date();
  baseDate.setHours(12, 0, 0, 0);

  const entries: MoodGraphEntry[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - offset);

    entries.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      mood: moodHistory[getLocalDateKey(date)] ?? 0
    });
  }

  return entries;
}

function normalizeProfileName(name: string): string {
  return name.trim();
}

function getActiveMoodHistory(): MoodHistory {
  if (!activeProfileName) {
    return {};
  }

  return currentMoodLog[activeProfileName] ?? {};
}

function renderMiniChallenge(): void {
  const miniChallenge = getTodayMiniChallenge();
  getElementByIdOrThrow<HTMLElement>("miniChallengeCategory").textContent = miniChallenge.category;
  getElementByIdOrThrow<HTMLElement>("miniChallengeText").textContent = miniChallenge.text;
}

function getMoonPhaseInfo(date = new Date()): {
  emoji: string;
  name: string;
  age: number;
  illumination: number;
  description: string;
} {
  const synodicMonth = 29.530588853;
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoonUtc) / 86400000;
  const moonAge = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
  const normalizedPhase = moonAge / synodicMonth;
  const illumination = Math.round(((1 - Math.cos(normalizedPhase * Math.PI * 2)) / 2) * 100);

  const phaseIndex = Math.floor((normalizedPhase * 8) + 0.5) % 8;
  const phaseInfo = [
    {
      emoji: "🌑",
      name: "新月",
      description: "月はほぼ見えない時期です。空はすっきり暗めで、星が見やすい日です。"
    },
    {
      emoji: "🌒",
      name: "満ち始めの月",
      description: "細い月が少しずつ育っていく時期です。夕方の西の空で見つけやすいです。"
    },
    {
      emoji: "🌓",
      name: "上弦の月",
      description: "月の半分ほどが明るく見える頃です。夜の前半に存在感があります。"
    },
    {
      emoji: "🌔",
      name: "満月前の月",
      description: "かなり明るい月です。夜空でも見つけやすく、光もはっきり感じられます。"
    },
    {
      emoji: "🌕",
      name: "満月",
      description: "月がもっとも丸く明るく見える頃です。空を見上げる楽しさが強い日です。"
    },
    {
      emoji: "🌖",
      name: "欠け始めの月",
      description: "満月を過ぎて、少しずつ細くなっていく時期です。夜更けから朝方に目立ちます。"
    },
    {
      emoji: "🌗",
      name: "下弦の月",
      description: "月の半分ほどが見える頃です。深夜から朝にかけて空に残りやすいです。"
    },
    {
      emoji: "🌘",
      name: "新月前の月",
      description: "かなり細い月です。早朝の東の空で見えることが多い時期です。"
    }
  ] as const;

  return {
    ...phaseInfo[phaseIndex],
    age: moonAge,
    illumination
  };
}

function renderMoonPhase(): void {
  const moonInfo = getMoonPhaseInfo();
  getElementByIdOrThrow<HTMLElement>("moonEmoji").textContent = moonInfo.emoji;
  getElementByIdOrThrow<HTMLElement>("moonPhaseName").textContent = moonInfo.name;
  getElementByIdOrThrow<HTMLElement>("moonDescription").textContent = moonInfo.description;
  getElementByIdOrThrow<HTMLElement>("moonAge").textContent = `${moonInfo.age.toFixed(1)}`;
  getElementByIdOrThrow<HTMLElement>("moonIllumination").textContent = `${moonInfo.illumination}%くらい`;
}

function setMoodStatus(message: string, tone: MoodStatusTone): void {
  const moodStatus = getElementByIdOrThrow<HTMLElement>("moodSaveStatus");
  moodStatus.textContent = message;
  moodStatus.classList.remove("text-slate-500", "text-emerald-600", "text-rose-500");

  if (tone === "success") {
    moodStatus.classList.add("text-emerald-600");
    return;
  }

  if (tone === "error") {
    moodStatus.classList.add("text-rose-500");
    return;
  }

  moodStatus.classList.add("text-slate-500");
}

function updateMoodSelection(selectedMood: MoodLevel | undefined): void {
  document.querySelectorAll<HTMLButtonElement>("[data-mood-value]").forEach((button) => {
    const rawMoodValue = Number(button.dataset.moodValue);
    const isSelected = isMoodLevel(rawMoodValue) && rawMoodValue === selectedMood;
    button.dataset.selected = String(isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function createMoodGraphItem(entry: MoodGraphEntry): HTMLElement {
  const isEmpty = entry.mood === 0;

  const wrapper = document.createElement("div");
  wrapper.className = "flex min-w-0 flex-col items-center gap-2";

  const chartArea = document.createElement("div");
  chartArea.className = "flex h-24 w-full items-end justify-center rounded-2xl bg-slate-50/90 px-2 py-2";

  const bar = document.createElement("div");
  bar.className = "mood-graph-bar flex h-full w-full max-w-9 items-end justify-center rounded-xl";
  bar.dataset.empty = String(isEmpty);

  const fill = document.createElement("div");
  fill.className = "mood-graph-fill w-full rounded-lg";
  fill.dataset.empty = String(isEmpty);
  fill.style.height = isEmpty ? "12%" : `${(entry.mood / 5) * 100}%`;

  const score = document.createElement("p");
  score.className = `text-sm font-semibold ${isEmpty ? "text-slate-400" : "text-slate-700"}`;
  score.textContent = isEmpty ? "-" : String(entry.mood);

  const label = document.createElement("p");
  label.className = "text-[11px] text-slate-500";
  label.textContent = entry.label;

  bar.append(fill);
  chartArea.append(bar);
  wrapper.append(chartArea, score, label);

  return wrapper;
}

function renderMoodGraph(): void {
  const moodGraph = getElementByIdOrThrow<HTMLElement>("moodGraph");
  const graphItems = getRecentMoodEntries(getActiveMoodHistory()).map((entry) => createMoodGraphItem(entry));
  moodGraph.replaceChildren(...graphItems);
}

function renderMoodSection(status?: { text: string; tone: MoodStatusTone }): void {
  const todayMood = getActiveMoodHistory()[getLocalDateKey()];
  const moodSelectedLabel = getElementByIdOrThrow<HTMLElement>("moodSelectedLabel");

  updateMoodSelection(todayMood);
  renderMoodGraph();

  if (!activeProfileName) {
    moodSelectedLabel.textContent = "名前を入れてから記録できます";
  } else if (todayMood) {
    const moodOption = getMoodOption(todayMood);
    moodSelectedLabel.textContent = `${activeProfileName}さんの今日の気分: ${moodOption.emoji} ${moodOption.label}`;
  } else {
    moodSelectedLabel.textContent = `${activeProfileName}さんはまだ記録していません`;
  }

  if (status) {
    setMoodStatus(status.text, status.tone);
    return;
  }

  setMoodStatus(
    todayMood
      ? "保存済みです。選び直しもできます"
      : activeProfileName
        ? "1〜5で今朝の気分を記録できます"
        : "名前を入れてから記録できます",
    "default"
  );
}

function handleMoodSelection(mood: MoodLevel): void {
  if (!activeProfileName) {
    renderMoodSection({ text: "名前を入れてから記録できます", tone: "error" });
    return;
  }

  const todayKey = getLocalDateKey();
  const moodHistory = getActiveMoodHistory();
  currentMoodLog = {
    ...currentMoodLog,
    [activeProfileName]: {
      ...moodHistory,
      [todayKey]: mood
    }
  };

  const isSaved = persistMoodLog(currentMoodLog);
  renderMoodSection(
    isSaved
      ? { text: "今日の気分を保存しました", tone: "success" }
      : { text: "この環境では気分を保存できませんでした", tone: "error" }
  );
}

function setTodayLabel(): void {
  const todayLabel = getElementByIdOrThrow<HTMLElement>("todayLabel");
  const now = new Date();

  const text = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  todayLabel.textContent = `${text} ・ 良い一日を`;
}

function revealResults(): void {
  const resultSection = getElementByIdOrThrow<HTMLElement>("resultSection");
  if (!resultSection.classList.contains("hidden")) {
    return;
  }

  resultSection.classList.remove("hidden");
  resultSection.querySelectorAll<HTMLElement>(".animate-float-up").forEach((element) => {
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
  });
}

function replayCardAnimation(element: HTMLElement): void {
  element.classList.remove("animate-glow-soft");
  void element.offsetWidth;
  element.classList.add("animate-glow-soft");
}

function drawFortune(): void {
  const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
  const seed = getTodaySeed(nameInput.value);

  const fortune = pickBySeed(fortunes, seed, 1);
  const color = pickBySeed(luckyColors, seed, 3);
  const action = pickBySeed(luckyActions, seed, 5);
  const fallbackQuote = pickBySeed(quotes, seed, 7);

  getElementByIdOrThrow<HTMLElement>("fortuneRank").textContent = fortune.rank;
  getElementByIdOrThrow<HTMLElement>("fortuneMessage").textContent = fortune.message;
  getElementByIdOrThrow<HTMLElement>("luckyColor").textContent = color;
  getElementByIdOrThrow<HTMLElement>("luckyAction").textContent = action;
  getElementByIdOrThrow<HTMLElement>("quoteText").textContent = latestQuoteText || fallbackQuote;

  replayCardAnimation(getElementByIdOrThrow<HTMLElement>("fortuneCard"));
}

async function loadQuote(name = ""): Promise<void> {
  const quoteText = getElementByIdOrThrow<HTMLElement>("quoteText");
  quoteText.textContent = "名言を取得中です...";

  try {
    const response = await fetch(QUOTE_API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`quote APIエラー: ${response.status}`);
    }

    const data = (await response.json()) as QuoteResponse;
    const quote = typeof data.quote === "string" ? data.quote.trim() : "";
    const author = typeof data.author === "string" ? data.author.trim() : "";
    if (!quote) {
      throw new Error("quote APIレスポンスに quote がありません");
    }

    latestQuoteText = author ? `「${quote}」 - ${author}` : `「${quote}」`;
    quoteText.textContent = latestQuoteText;
  } catch (error) {
    console.error(error);
    const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
    const fallbackQuote = pickBySeed(quotes, getTodaySeed(name || nameInput.value), 7);
    latestQuoteText = fallbackQuote;
    quoteText.textContent = fallbackQuote;
  }
}

async function translateTextToJapanese(text: string): Promise<string> {
  try {
    const translateUrl =
      `${TRANSLATE_API_BASE_URL}?q=${encodeURIComponent(text)}` +
      "&langpair=en|ja";
    const translateResponse = await fetch(translateUrl);
    if (!translateResponse.ok) {
      return "";
    }

    const translateData = (await translateResponse.json()) as TranslationResponse;
    return typeof translateData.responseData?.translatedText === "string"
      ? translateData.responseData.translatedText.trim()
      : "";
  } catch (translateError) {
    console.warn("翻訳に失敗しました。", translateError);
    return "";
  }
}

async function loadOnThisDay(): Promise<void> {
  const onThisDayText = getElementByIdOrThrow<HTMLElement>("onThisDayText");
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  onThisDayText.textContent = "今日は何の日を取得中です...";

  try {
    const response = await fetch(`${WIKIMEDIA_ONTHISDAY_API_BASE_URL}/${month}/${day}`);
    if (!response.ok) {
      throw new Error(`Wikimedia APIエラー: ${response.status}`);
    }

    const data = (await response.json()) as WikimediaResponse;
    const entries = Array.isArray(data.selected) && data.selected.length > 0
      ? data.selected
      : (Array.isArray(data.events) ? data.events : []);

    if (entries.length === 0) {
      throw new Error("Wikimedia のレスポンスに出来事がありません");
    }

    const entry = entries[getTodaySeed() % entries.length];
    const rawText = typeof entry.text === "string" ? entry.text.trim() : "";
    if (!rawText) {
      throw new Error("Wikimedia のレスポンスに text がありません");
    }

    const translatedText = await translateTextToJapanese(rawText);
    const yearLabel = typeof entry.year === "number" ? `【${entry.year}年】` : "";
    onThisDayText.textContent = `${yearLabel}${translatedText || rawText}`;
  } catch (error) {
    console.error(error);
    onThisDayText.textContent = "今日は何の日を取得できませんでした。";
  }
}

function weatherCodeToEmoji(code: number | undefined): string {
  if (code === 0) return "☀️";
  if (code !== undefined && [1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if (code !== undefined && [45, 48].includes(code)) return "🌫️";
  if (code !== undefined && [51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if (code !== undefined && [61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if (code !== undefined && [71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if (code !== undefined && [95, 96, 99].includes(code)) return "⛈️";
  return "⛅";
}

function buildWeatherComment(eveningTemp: number, eveningRain: number): string {
  if (eveningRain >= 60) {
    return "帰りは雨の可能性が高めです。折りたたみ傘があると安心です。";
  }
  if (eveningRain >= 30) {
    return "帰りは少し雨を気にしておくと良さそうです。空模様を軽くチェックしておきましょう。";
  }
  if (eveningTemp <= 10) {
    return "帰るころはかなりひんやりしそうです。羽織るものがあると安心です。";
  }
  if (eveningTemp <= 16) {
    return "帰りは少し肌寒いかもしれません。朝より一枚あるとちょうど良さそうです。";
  }
  if (eveningTemp >= 28) {
    return "帰りの時間もまだ暖かそうです。水分を意識すると良さそうです。";
  }
  return "帰りの天気は比較的おだやかそうです。気持ちよく帰れそうですね。";
}

function findHourlyIndex(times: string[], targetHour: number): number {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const target = `${yyyy}-${mm}-${dd}T${String(targetHour).padStart(2, "0")}:00`;

  return times.findIndex((time) => time.startsWith(target));
}

function classifyWeatherForBackground(code: number | undefined): WeatherType {
  if (code !== undefined && rainCodes.includes(code)) {
    return "rainy";
  }
  if (code !== undefined && cloudyCodes.includes(code)) {
    return "cloudy";
  }
  return "sunny";
}

function setWeatherBackground(type: "rainy" | "cloudy" | "sunny"): void {
  const body = getElementByIdOrThrow<HTMLElement>("appBody");
  body.classList.remove("bg-weather-sunny", "bg-weather-cloudy", "bg-weather-rainy", "bg-sky-soft");

  if (type === "rainy") {
    body.classList.add("bg-weather-rainy");
    return;
  }
  if (type === "cloudy") {
    body.classList.add("bg-weather-cloudy");
    return;
  }
  body.classList.add("bg-weather-sunny");
}

function loadSavedLocationState(): SavedLocationState {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!stored) {
      return {
        mode: "preset",
        presetKey: selectedLocationKey
      };
    }

    if (isLocationKey(stored)) {
      return {
        mode: "preset",
        presetKey: stored
      };
    }

    const parsed = JSON.parse(stored) as unknown;
    if (parsed && typeof parsed === "object" && "mode" in parsed) {
      const nextState = parsed as Partial<SavedLocationState>;
      if (nextState.mode === "preset" && typeof nextState.presetKey === "string" && isLocationKey(nextState.presetKey)) {
        return {
          mode: "preset",
          presetKey: nextState.presetKey
        };
      }
      if (nextState.mode === "custom" && isOfficeLocation(nextState.location)) {
        return {
          mode: "custom",
          location: nextState.location
        };
      }
    }
  } catch (error) {
    console.warn("場所の保存データを読み込めませんでした", error);
  }

  return {
    mode: "preset",
    presetKey: selectedLocationKey
  };
}

function saveLocationState(locationState: SavedLocationState): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationState));
  } catch (error) {
    console.warn("場所の保存に失敗しました", error);
  }
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
  };
};

async function loadWeather(): Promise<void> {
  const weatherStatus = getElementByIdOrThrow<HTMLElement>("weatherStatus");
  const currentTemp = getElementByIdOrThrow<HTMLElement>("currentTemp");
  const eveningTemp = getElementByIdOrThrow<HTMLElement>("eveningTemp");
  const eveningRain = getElementByIdOrThrow<HTMLElement>("eveningRain");
  const weatherComment = getElementByIdOrThrow<HTMLElement>("weatherComment");
  const weatherEmoji = getElementByIdOrThrow<HTMLElement>("weatherEmoji");
  const officeLocation = activeWeatherLocation;

  try {
    weatherStatus.textContent = `${officeLocation.name} の天気を取得中です...`;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${officeLocation.latitude}` +
      `&longitude=${officeLocation.longitude}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,precipitation_probability` +
      `&timezone=Asia%2FTokyo`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`天気APIエラー: ${response.status}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const currentTemperature = data.current?.temperature_2m;
    const currentCode = data.current?.weather_code;
    const hourlyTimes = data.hourly?.time ?? [];
    const hourlyTemps = data.hourly?.temperature_2m ?? [];
    const hourlyRainProb = data.hourly?.precipitation_probability ?? [];
    const eveningIndex = findHourlyIndex(hourlyTimes, 18);

    currentTemp.textContent = typeof currentTemperature === "number" ? `${currentTemperature} ℃` : "取得できませんでした";
    weatherEmoji.textContent = weatherCodeToEmoji(currentCode);
    weatherStatus.textContent = `${officeLocation.name} の予報です`;
    setWeatherBackground(classifyWeatherForBackground(currentCode));

    if (eveningIndex < 0) {
      eveningTemp.textContent = "取得できませんでした";
      eveningRain.textContent = "取得できませんでした";
      weatherComment.textContent = "帰る時間の予報がまだ取得できませんでした。";
      return;
    }

    const eveTemp = hourlyTemps[eveningIndex];
    const eveRain = hourlyRainProb[eveningIndex];

    eveningTemp.textContent = typeof eveTemp === "number" ? `${eveTemp} ℃` : "取得できませんでした";
    eveningRain.textContent = typeof eveRain === "number" ? `${eveRain} %` : "取得できませんでした";
    weatherComment.textContent = buildWeatherComment(typeof eveTemp === "number" ? eveTemp : 20, typeof eveRain === "number" ? eveRain : 0);
  } catch (error) {
    console.error(error);
    weatherStatus.textContent = "天気の取得に失敗しました";
    currentTemp.textContent = "---";
    eveningTemp.textContent = "---";
    eveningRain.textContent = "---";
    weatherComment.textContent = "通信状況を確認して、もう一度読み込んでみてください。";
    setWeatherBackground("cloudy");
  }
}

async function useCustomLocation(): Promise<void> {
  const customLocationInput = getElementByIdOrThrow<HTMLInputElement>("customLocationInput");
  customLocationInput.setCustomValidity("");
  const query = customLocationInput.value.trim();

  if (!query) {
    customLocationInput.setCustomValidity("場所を入力してください");
    customLocationInput.reportValidity();
    customLocationInput.setCustomValidity("");
    return;
  }

  setLocationButtonBusy(true);
  setLocationStatus(`「${query}」を検索しています...`);

  try {
    const customLocation = await searchCustomLocation(query);
    setActiveCustomLocation(customLocation);
    saveLocationState({
      mode: "custom",
      location: customLocation
    });
    void loadWeather();
  } catch (error) {
    console.error(error);
    setLocationStatus("場所を見つけられませんでした。別の書き方でも試してみてください", "error");
  } finally {
    setLocationButtonBusy(false);
  }
}

function showMorningCards(): void {
  const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
  nameInput.setCustomValidity("");
  const submittedName = normalizeProfileName(nameInput.value);
  if (!submittedName) {
    nameInput.setCustomValidity("名前を入れてください");
    nameInput.reportValidity();
    nameInput.setCustomValidity("");
    return;
  }

  activeProfileName = submittedName;
  drawFortune();
  renderMiniChallenge();
  renderMoonPhase();
  renderMoodSection();
  revealResults();
  void loadQuote(submittedName);
}

function setupEvents(): void {
  const nameForm = getElementByIdOrThrow<HTMLFormElement>("nameForm");
  const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
  const locationSelect = getElementByIdOrThrow<HTMLSelectElement>("locationSelect");
  const customLocationInput = getElementByIdOrThrow<HTMLInputElement>("customLocationInput");
  const customLocationButton = getElementByIdOrThrow<HTMLButtonElement>("customLocationButton");
  const moodButtons = document.querySelectorAll<HTMLButtonElement>("[data-mood-value]");

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showMorningCards();
  });

  locationSelect.addEventListener("change", () => {
    const nextLocation = locationSelect.value;
    if (nextLocation === "custom") {
      if (!customWeatherLocation) {
        setLocationStatus("まず下の入力欄から場所を追加してください", "error");
        locationSelect.value = selectedLocationKey;
        return;
      }

      setActiveCustomLocation(customWeatherLocation);
      saveLocationState({
        mode: "custom",
        location: customWeatherLocation
      });
      void loadWeather();
      return;
    }

    if (!isLocationKey(nextLocation)) {
      return;
    }
    setActivePresetLocation(nextLocation);
    saveLocationState({
      mode: "preset",
      presetKey: nextLocation
    });
    void loadWeather();
  });

  customLocationButton.addEventListener("click", () => {
    void useCustomLocation();
  });

  customLocationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void useCustomLocation();
    }
  });

  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      showMorningCards();
    }
  });

  moodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const rawMoodValue = Number(button.dataset.moodValue);
      if (!isMoodLevel(rawMoodValue)) {
        return;
      }
      handleMoodSelection(rawMoodValue);
    });
  });
}

function init(): void {
  const locationSelect = getElementByIdOrThrow<HTMLSelectElement>("locationSelect");
  const savedLocationState = loadSavedLocationState();
  if (savedLocationState.mode === "custom") {
    setActiveCustomLocation(savedLocationState.location);
  } else if (isLocationKey(savedLocationState.presetKey)) {
    setActivePresetLocation(savedLocationState.presetKey);
  } else if (isLocationKey(locationSelect.value)) {
    setActivePresetLocation(locationSelect.value);
  }

  setTodayLabel();
  renderMoonPhase();
  currentMoodLog = loadMoodLog();
  setupEvents();
  void loadWeather();
  void loadQuote();
  void loadOnThisDay();
}

init();
