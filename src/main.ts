import "./style.css";
import {
  fortunes,
  luckyActions,
  luckyBoxMissResults,
  luckyBoxNormalResults,
  luckyBoxRareResult,
  luckyColors,
  miniChallengeCategories,
  quotes,
  type LuckyBoxResult
} from "./data";

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
type LuckyBoxEntry = {
  selectedIndex: number;
  winningIndex: number;
  result: LuckyBoxResult;
};
type LuckyBoxLog = Record<string, LuckyBoxEntry>;
type MoodStatusTone = "default" | "error" | "success";
type LocationStatusTone = "default" | "error" | "success";
type BuddyType = "dog" | "cat";
type MoodGraphEntry = {
  label: string;
  mood: MoodLevel | 0;
};
type BuddyEntry = {
  type: BuddyType;
  imageUrl: string;
  message: string;
  fetchedAt: string;
};
type BuddyLog = Record<string, BuddyEntry>;
type ReadingCategory = "cozy" | "tech";
type ReadingItem = {
  title: string;
  url: string;
  source: string;
  description: string;
};
type DailyReadingEntry = {
  cozy: ReadingItem;
  tech: ReadingItem;
};
type DailyReadingLog = Record<string, DailyReadingEntry>;
type ReadingSource = {
  source: string;
  url: string;
};
type ReadingPickResult = {
  item: ReadingItem;
  usedFallback: boolean;
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
const NAME_STORAGE_KEY = "gdm:profileName";
const LUCKY_BOX_LOG_STORAGE_KEY = "gdm:luckyBoxLog";
const GSI_GEOCODING_API_ENDPOINT = "https://msearch.gsi.go.jp/address-search/AddressSearch";
const GEOCODING_API_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const TRANSLATE_API_BASE_URL = "https://api.mymemory.translated.net/get";
const WIKIMEDIA_ONTHISDAY_API_BASE_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all";
const QUOTE_API_ENDPOINT = "/api/quote";
const DOG_IMAGE_API_ENDPOINT = "https://dog.ceo/api/breeds/image/random";
const CAT_IMAGE_API_ENDPOINT = "https://api.thecatapi.com/v1/images/search";
const DAILY_BUDDY_LOG_STORAGE_KEY = "gdm:dailyBuddyLog";
const BUDDY_PREFERENCE_STORAGE_KEY = "gdm:buddyPreference";
const DAILY_READING_LOG_STORAGE_KEY = "gdm:dailyReadingLog";
let latestQuoteText = "";
let currentMoodLog: MoodLog = {};
let currentLuckyBoxEntry: LuckyBoxEntry | null = null;
let currentLuckyBoxDateKey = "";
let activeProfileName = "";
let activeBuddyPreference: BuddyType = "dog";
let currentBuddyRequestToken = 0;
let currentReadingRequestToken = 0;
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

type DogApiResponse = {
  message?: string;
  status?: string;
};

type CatApiResponse = Array<{
  url?: string;
}>;

const cozyReadingSources: ReadingSource[] = [
  { source: "デイリーポータルZ", url: "https://dailyportalz.jp/feed/headline" },
  { source: "GIGAZINE", url: "https://gigazine.net/news/rss_2.0/" },
  { source: "ロケットニュース24", url: "https://rocketnews24.com/feed/" }
];

const techReadingSources: ReadingSource[] = [
  { source: "Ruby Weekly", url: "https://rubyweekly.com/rss/" },
  { source: "Zenn", url: "https://zenn.dev/feed" },
  { source: "Hacker News", url: "https://hnrss.org/frontpage" }
];

const excludedReadingKeywords = [
  "事件",
  "事故",
  "災害",
  "政治",
  "炎上",
  "訃報",
  "戦争",
  "犯罪",
  "不祥事",
  "逮捕",
  "株価",
  "暴落"
];

const cozyPriorityKeywords = [
  "かわいい",
  "楽しい",
  "おもしろい",
  "作ってみた",
  "食べてみた",
  "動物",
  "犬",
  "猫",
  "散歩",
  "工作",
  "生活",
  "発見"
];

const techPriorityKeywords = [
  "ruby",
  "rails",
  "javascript",
  "typescript",
  "ai",
  "robotics",
  "robot",
  "embedded",
  "raspberry pi",
  "pico",
  "arduino",
  "programming",
  "developer",
  "open source"
];

const cozyReadingFallbackItems: ReadingItem[] = [
  {
    title: "デイリーポータルZ 記事一覧をのぞいてみる",
    url: "https://dailyportalz.jp/kiji",
    source: "デイリーポータルZ",
    description: "散歩・工作・食べ物など、朝に軽く読める記事を探しやすいページです。"
  },
  {
    title: "犬や猫の話題をゆるくチェック",
    url: "https://sippo.asahi.com/",
    source: "sippo",
    description: "動物の話題を中心に、ほっとする読み物を拾いやすいサイトです。"
  },
  {
    title: "身近な発見を楽しむ読み物",
    url: "https://www.1101.com/home.html",
    source: "ほぼ日刊イトイ新聞",
    description: "生活の気づきや小ネタを、短い時間で読みやすい構成でチェックできます。"
  }
];

const techReadingFallbackItems: ReadingItem[] = [
  {
    title: "Ruby Weekly 最新号をチェック",
    url: "https://rubyweekly.com/",
    source: "Ruby Weekly",
    description: "RubyとRails周辺の更新をまとめて追える定番ニュースレターです。"
  },
  {
    title: "TypeScript / JavaScript の新着を探す",
    url: "https://zenn.dev/topics/typescript",
    source: "Zenn",
    description: "実装寄りの記事が多く、朝に短く読んで今日のヒントを得やすいです。"
  },
  {
    title: "組み込み・ロボティクス系の話題を追う",
    url: "https://mag.switch-science.com/",
    source: "スイッチサイエンス マガジン",
    description: "Arduino、Raspberry Pi、ハードウェア制作の話題を拾えます。"
  }
];

const buddyMessages = [
  "今日もぼちぼちいきましょう",
  "肩の力を抜いていきましょう",
  "小さく始めれば大丈夫",
  "帰るころには少し軽くなっていますように",
  "ゆっくりでも前に進めばOKです",
  "ひとつ終えたら、ちゃんとひと息つきましょう"
];

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

function isLuckyBoxResult(value: unknown): value is LuckyBoxResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LuckyBoxResult>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.emoji === "string" &&
    (candidate.rarity === "normal" || candidate.rarity === "rare")
  );
}

function isLuckyBoxEntry(value: unknown): value is LuckyBoxEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LuckyBoxEntry>;
  return (
    Number.isInteger(candidate.selectedIndex) &&
    Number(candidate.selectedIndex) >= 0 &&
    Number(candidate.selectedIndex) <= 2 &&
    Number.isInteger(candidate.winningIndex) &&
    Number(candidate.winningIndex) >= 0 &&
    Number(candidate.winningIndex) <= 2 &&
    isLuckyBoxResult(candidate.result)
  );
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

function loadLuckyBoxLog(): LuckyBoxLog {
  try {
    const stored = localStorage.getItem(LUCKY_BOX_LOG_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const nextLog: LuckyBoxLog = {};
    for (const [dateKey, entry] of Object.entries(parsed)) {
      if (isLuckyBoxEntry(entry)) {
        nextLog[dateKey] = entry;
      }
    }

    return nextLog;
  } catch (error) {
    console.warn("ラッキーボックスログの読み込みに失敗しました", error);
    return {};
  }
}

function persistLuckyBoxLog(luckyBoxLog: LuckyBoxLog): boolean {
  try {
    localStorage.setItem(LUCKY_BOX_LOG_STORAGE_KEY, JSON.stringify(luckyBoxLog));
    return true;
  } catch (error) {
    console.warn("ラッキーボックスログの保存に失敗しました", error);
    return false;
  }
}

function getLuckyBoxWinningIndex(date = new Date()): number {
  return getDateSeed(date, "lucky-box-winning-index") % 3;
}

function isLuckyBoxRareDay(date = new Date()): boolean {
  return getDateSeed(date, "lucky-box-rare-roll") % 100 < 5;
}

function pickLuckyBoxResult(date: Date, selectedIndex: number, isWin: boolean): LuckyBoxResult {
  if (isWin) {
    if (isLuckyBoxRareDay(date)) {
      return luckyBoxRareResult;
    }
    return pickBySeed(luckyBoxNormalResults, getDateSeed(date, "lucky-box-normal-result"), selectedIndex);
  }

  return pickBySeed(luckyBoxMissResults, getDateSeed(date, "lucky-box-miss-result"), selectedIndex);
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

function getLuckyBoxButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-lucky-box-index]"));
}

function setLuckyBoxStatus(message: string, tone: MoodStatusTone = "default"): void {
  const luckyBoxStatus = getElementByIdOrThrow<HTMLElement>("luckyBoxStatus");
  luckyBoxStatus.textContent = message;
  luckyBoxStatus.classList.remove("text-slate-500", "text-emerald-600", "text-rose-500");

  if (tone === "success") {
    luckyBoxStatus.classList.add("text-emerald-600");
    return;
  }

  if (tone === "error") {
    luckyBoxStatus.classList.add("text-rose-500");
    return;
  }

  luckyBoxStatus.classList.add("text-slate-500");
}

function getTodayLuckyBoxEntry(): LuckyBoxEntry | null {
  const todayKey = getLocalDateKey();
  if (currentLuckyBoxDateKey === todayKey) {
    return currentLuckyBoxEntry;
  }

  const luckyBoxLog = loadLuckyBoxLog();
  currentLuckyBoxDateKey = todayKey;
  currentLuckyBoxEntry = luckyBoxLog[todayKey] ?? null;
  return currentLuckyBoxEntry;
}

function updateLuckyBoxButtons(entry: LuckyBoxEntry | null): void {
  const luckyBoxButtons = getLuckyBoxButtons();

  luckyBoxButtons.forEach((button, index) => {
    const isSelected = entry?.selectedIndex === index;
    const isOpened = Boolean(entry && isSelected);
    const isHit = Boolean(entry && isSelected && entry.selectedIndex === entry.winningIndex);
    button.disabled = Boolean(entry);
    button.dataset.selected = String(isSelected);
    button.dataset.opened = String(isOpened);
    button.dataset.hit = String(isHit);
    button.setAttribute("aria-pressed", String(isSelected));

    const icon = button.querySelector<HTMLElement>("[data-lucky-box-icon]");
    const hint = button.querySelector<HTMLElement>("[data-lucky-box-hint]");
    if (!icon || !hint) {
      return;
    }

    if (!entry) {
      icon.textContent = "📦";
      hint.textContent = `BOX ${index + 1}`;
      return;
    }

    if (isSelected) {
      icon.textContent = isHit ? "🎁" : "📭";
      hint.textContent = isHit ? "OPEN!" : "TRY!";
      return;
    }

    icon.textContent = "📦";
    hint.textContent = `BOX ${index + 1}`;
  });
}

function renderLuckyBoxCard(status?: { text: string; tone: MoodStatusTone }): void {
  const card = getElementByIdOrThrow<HTMLElement>("luckyBoxCard");
  const resultPanel = getElementByIdOrThrow<HTMLElement>("luckyBoxResultPanel");
  const outcomeBadge = getElementByIdOrThrow<HTMLElement>("luckyBoxOutcomeBadge");
  const resultEmoji = getElementByIdOrThrow<HTMLElement>("luckyBoxResultEmoji");
  const resultTitle = getElementByIdOrThrow<HTMLElement>("luckyBoxResultTitle");
  const resultMessage = getElementByIdOrThrow<HTMLElement>("luckyBoxResultMessage");
  const rarityBadge = getElementByIdOrThrow<HTMLElement>("luckyBoxRarityBadge");
  const todayEntry = getTodayLuckyBoxEntry();

  updateLuckyBoxButtons(todayEntry);

  if (!todayEntry) {
    resultPanel.classList.add("hidden");
    card.classList.remove("lucky-box-card-rare");
    setLuckyBoxStatus(status?.text ?? "どれか1つ選んでください", status?.tone ?? "default");
    return;
  }

  const isWin = todayEntry.selectedIndex === todayEntry.winningIndex;
  resultPanel.classList.remove("hidden", "lucky-box-result-win", "lucky-box-result-miss", "lucky-box-result-rare");
  resultPanel.classList.add(isWin ? "lucky-box-result-win" : "lucky-box-result-miss");

  if (todayEntry.result.rarity === "rare") {
    resultPanel.classList.add("lucky-box-result-rare");
    card.classList.add("lucky-box-card-rare");
    rarityBadge.textContent = "RARE";
    rarityBadge.classList.remove("hidden");
  } else {
    card.classList.remove("lucky-box-card-rare");
    rarityBadge.textContent = "";
    rarityBadge.classList.add("hidden");
  }

  outcomeBadge.textContent = isWin ? "当たり！" : "今日はこの結果";
  outcomeBadge.classList.remove("bg-emerald-100", "text-emerald-700", "bg-slate-200", "text-slate-700");
  outcomeBadge.classList.add(isWin ? "bg-emerald-100" : "bg-slate-200", isWin ? "text-emerald-700" : "text-slate-700");

  resultEmoji.textContent = todayEntry.result.emoji;
  resultTitle.textContent = todayEntry.result.title;
  resultMessage.textContent = todayEntry.result.message;
  setLuckyBoxStatus(status?.text ?? "今日はもう選択済みです。結果は固定されています。", status?.tone ?? "success");
}

function handleLuckyBoxSelection(selectedIndex: number): void {
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const existingEntry = getTodayLuckyBoxEntry();
  if (existingEntry) {
    renderLuckyBoxCard();
    return;
  }

  const winningIndex = getLuckyBoxWinningIndex(today);
  const isWin = selectedIndex === winningIndex;
  const result = pickLuckyBoxResult(today, selectedIndex, isWin);
  const todayEntry: LuckyBoxEntry = {
    selectedIndex,
    winningIndex,
    result
  };

  currentLuckyBoxDateKey = todayKey;
  currentLuckyBoxEntry = todayEntry;

  const luckyBoxLog = loadLuckyBoxLog();
  const isSaved = persistLuckyBoxLog({
    ...luckyBoxLog,
    [todayKey]: todayEntry
  });

  renderLuckyBoxCard(
    isSaved
      ? { text: "箱を開封しました。今日はこの結果で固定です。", tone: "success" }
      : {
          text: "箱を開封しました。保存に失敗したため、この環境では再読み込み後に結果が戻らない場合があります。",
          tone: "error"
        }
  );
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

function isBuddyType(value: unknown): value is BuddyType {
  return value === "dog" || value === "cat";
}

function isBuddyEntry(value: unknown): value is BuddyEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<BuddyEntry>;
  return (
    isBuddyType(candidate.type) &&
    typeof candidate.imageUrl === "string" &&
    candidate.imageUrl.trim().length > 0 &&
    typeof candidate.message === "string" &&
    candidate.message.trim().length > 0 &&
    typeof candidate.fetchedAt === "string" &&
    candidate.fetchedAt.trim().length > 0
  );
}

function loadBuddyPreference(): BuddyType {
  try {
    const stored = localStorage.getItem(BUDDY_PREFERENCE_STORAGE_KEY);
    return isBuddyType(stored) ? stored : "dog";
  } catch (error) {
    console.warn("相棒の設定読み込みに失敗しました", error);
    return "dog";
  }
}

function saveBuddyPreference(type: BuddyType): void {
  try {
    localStorage.setItem(BUDDY_PREFERENCE_STORAGE_KEY, type);
  } catch (error) {
    console.warn("相棒の設定保存に失敗しました", error);
  }
}

function loadDailyBuddyLog(): BuddyLog {
  try {
    const raw = localStorage.getItem(DAILY_BUDDY_LOG_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const nextLog: BuddyLog = {};
    for (const [dateKey, entry] of Object.entries(parsed)) {
      if (isBuddyEntry(entry)) {
        nextLog[dateKey] = entry;
      }
    }

    return nextLog;
  } catch (error) {
    console.warn("相棒ログの読み込みに失敗しました", error);
    return {};
  }
}

function saveDailyBuddyLog(log: BuddyLog): boolean {
  try {
    localStorage.setItem(DAILY_BUDDY_LOG_STORAGE_KEY, JSON.stringify(log));
    return true;
  } catch (error) {
    console.warn("相棒ログの保存に失敗しました", error);
    return false;
  }
}

function setBuddyTypeButtons(type: BuddyType): void {
  document.querySelectorAll<HTMLButtonElement>("[data-buddy-type]").forEach((button) => {
    const isSelected = button.dataset.buddyType === type;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("buddy-type-button-active", isSelected);
  });

  const fallbackEmoji = document.getElementById("buddyFallbackEmoji");
  if (fallbackEmoji) {
    fallbackEmoji.textContent = type === "cat" ? "🐱" : "🐶";
  }
}

function setBuddyLoadingState(message = "本日の相棒を準備中です..."): void {
  const loading = getElementByIdOrThrow<HTMLElement>("buddyLoading");
  const image = getElementByIdOrThrow<HTMLImageElement>("buddyImage");
  const fallback = getElementByIdOrThrow<HTMLElement>("buddyFallback");
  const buddyMessage = getElementByIdOrThrow<HTMLElement>("buddyMessage");
  const buddyStatus = getElementByIdOrThrow<HTMLElement>("buddyStatus");

  loading.classList.remove("hidden");
  image.classList.add("hidden");
  image.classList.remove("buddy-image-visible");
  fallback.classList.add("hidden");
  fallback.classList.remove("flex");
  buddyMessage.textContent = "読み込み中...";
  buddyStatus.textContent = message;
}

function showBuddyFallback(type: BuddyType, message: string): void {
  const loading = getElementByIdOrThrow<HTMLElement>("buddyLoading");
  const image = getElementByIdOrThrow<HTMLImageElement>("buddyImage");
  const fallback = getElementByIdOrThrow<HTMLElement>("buddyFallback");
  const fallbackEmoji = getElementByIdOrThrow<HTMLElement>("buddyFallbackEmoji");
  const buddyMessage = getElementByIdOrThrow<HTMLElement>("buddyMessage");
  const buddyStatus = getElementByIdOrThrow<HTMLElement>("buddyStatus");

  loading.classList.add("hidden");
  image.classList.add("hidden");
  image.classList.remove("buddy-image-visible");
  fallback.classList.remove("hidden");
  fallback.classList.add("flex");
  fallbackEmoji.textContent = type === "cat" ? "🐱" : "🐶";
  buddyMessage.textContent = message;
  buddyStatus.textContent = "画像を取得できませんでした";
}

function showBuddyImage(entry: BuddyEntry, token: number, statusMessage: string): void {
  const loading = getElementByIdOrThrow<HTMLElement>("buddyLoading");
  const image = getElementByIdOrThrow<HTMLImageElement>("buddyImage");
  const fallback = getElementByIdOrThrow<HTMLElement>("buddyFallback");
  const buddyMessage = getElementByIdOrThrow<HTMLElement>("buddyMessage");
  const buddyStatus = getElementByIdOrThrow<HTMLElement>("buddyStatus");

  setBuddyTypeButtons(entry.type);
  fallback.classList.add("hidden");
  fallback.classList.remove("flex");
  buddyMessage.textContent = entry.message;
  buddyStatus.textContent = statusMessage;
  loading.classList.remove("hidden");
  image.classList.add("hidden");
  image.classList.remove("buddy-image-visible");
  const fallbackTimeoutId = window.setTimeout(() => {
    if (token !== currentBuddyRequestToken) {
      return;
    }
    showBuddyFallback(entry.type, "今日は相棒がお休み中です。またあとで会いにきてください。");
  }, 8000);

  image.onload = () => {
    if (token !== currentBuddyRequestToken) {
      return;
    }
    window.clearTimeout(fallbackTimeoutId);
    loading.classList.add("hidden");
    image.classList.remove("hidden");
    image.classList.add("buddy-image-visible");
  };

  image.onerror = () => {
    if (token !== currentBuddyRequestToken) {
      return;
    }
    window.clearTimeout(fallbackTimeoutId);
    showBuddyFallback(entry.type, "今日は相棒がお休み中です。またあとで会いにきてください。");
  };

  image.src = entry.imageUrl;
  if (image.complete && image.naturalWidth > 0) {
    window.clearTimeout(fallbackTimeoutId);
    loading.classList.add("hidden");
    image.classList.remove("hidden");
    image.classList.add("buddy-image-visible");
  }
}

function pickDailyBuddyMessage(dateKey: string, type: BuddyType): string {
  const seed = hashString(`${dateKey}-${type}`);
  return pickBySeed(buddyMessages, seed, 5);
}

function getBuddyLogKey(dateKey: string, type: BuddyType): string {
  return `${dateKey}:${type}`;
}

async function fetchDogImageUrl(): Promise<string> {
  const response = await fetch(DOG_IMAGE_API_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Dog APIエラー: ${response.status}`);
  }

  const data = (await response.json()) as DogApiResponse;
  const imageUrl = typeof data.message === "string" ? data.message.trim() : "";
  if (data.status !== "success" || !imageUrl) {
    throw new Error("Dog APIレスポンスが不正です");
  }

  return imageUrl;
}

async function fetchCatImageUrl(): Promise<string> {
  const response = await fetch(CAT_IMAGE_API_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Cat APIエラー: ${response.status}`);
  }

  const data = (await response.json()) as CatApiResponse;
  const first = Array.isArray(data) ? data[0] : null;
  const imageUrl = typeof first?.url === "string" ? first.url.trim() : "";
  if (!imageUrl) {
    throw new Error("Cat APIレスポンスが不正です");
  }

  return imageUrl;
}

async function fetchBuddyImageUrl(type: BuddyType): Promise<string> {
  return type === "cat" ? fetchCatImageUrl() : fetchDogImageUrl();
}

async function loadDailyBuddy(): Promise<void> {
  const todayKey = getLocalDateKey();
  const buddyLog = loadDailyBuddyLog();
  const todayBuddy = buddyLog[getBuddyLogKey(todayKey, activeBuddyPreference)] ?? buddyLog[todayKey];

  if (isBuddyEntry(todayBuddy) && todayBuddy.type === activeBuddyPreference) {
    currentBuddyRequestToken += 1;
    showBuddyImage(todayBuddy, currentBuddyRequestToken, "今日はこの子が相棒です");
    return;
  }

  currentBuddyRequestToken += 1;
  const requestToken = currentBuddyRequestToken;
  setBuddyLoadingState("本日の相棒を準備中です...");

  try {
    const imageUrl = await fetchBuddyImageUrl(activeBuddyPreference);
    if (requestToken !== currentBuddyRequestToken) {
      return;
    }

    const entry: BuddyEntry = {
      type: activeBuddyPreference,
      imageUrl,
      message: pickDailyBuddyMessage(todayKey, activeBuddyPreference),
      fetchedAt: new Date().toISOString()
    };

    const isSaved = saveDailyBuddyLog({
      ...buddyLog,
      [getBuddyLogKey(todayKey, activeBuddyPreference)]: entry
    });

    showBuddyImage(
      entry,
      requestToken,
      isSaved ? "今日はこの子が相棒です" : "この環境では保存できないため、再読み込みで変わる場合があります"
    );
  } catch (error) {
    if (requestToken !== currentBuddyRequestToken) {
      return;
    }
    console.error(error);
    showBuddyFallback(activeBuddyPreference, "今日は相棒がお休み中です。またあとで会いにきてください。");
  }
}

function isReadingItem(value: unknown): value is ReadingItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<ReadingItem>;
  return (
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.url === "string" &&
    candidate.url.trim().length > 0 &&
    typeof candidate.source === "string" &&
    candidate.source.trim().length > 0 &&
    typeof candidate.description === "string"
  );
}

function isDailyReadingEntry(value: unknown): value is DailyReadingEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<DailyReadingEntry>;
  return isReadingItem(candidate.cozy) && isReadingItem(candidate.tech);
}

function loadDailyReadingLog(): DailyReadingLog {
  try {
    const raw = localStorage.getItem(DAILY_READING_LOG_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const nextLog: DailyReadingLog = {};
    for (const [dateKey, entry] of Object.entries(parsed)) {
      if (isDailyReadingEntry(entry)) {
        nextLog[dateKey] = entry;
      }
    }

    return nextLog;
  } catch (error) {
    console.warn("読み物ログの読み込みに失敗しました", error);
    return {};
  }
}

function saveDailyReadingLog(log: DailyReadingLog): boolean {
  try {
    localStorage.setItem(DAILY_READING_LOG_STORAGE_KEY, JSON.stringify(log));
    return true;
  } catch (error) {
    console.warn("読み物ログの保存に失敗しました", error);
    return false;
  }
}

function normalizeReadingText(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function stripHtml(text: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = text;
  return (temp.textContent ?? "").replace(/\s+/gu, " ").trim();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasExcludedReadingKeyword(item: ReadingItem): boolean {
  const target = normalizeReadingText(`${item.title} ${item.description} ${item.source}`);
  return excludedReadingKeywords.some((keyword) => target.includes(normalizeReadingText(keyword)));
}

function countMatchedKeywords(text: string, keywords: string[]): number {
  const normalizedText = normalizeReadingText(text);
  return keywords.reduce(
    (count, keyword) => count + (normalizedText.includes(normalizeReadingText(keyword)) ? 1 : 0),
    0
  );
}

function scoreReadingItem(item: ReadingItem, category: ReadingCategory, dateKey: string): number {
  if (hasExcludedReadingKeyword(item)) {
    return -1000;
  }

  const target = `${item.title} ${item.description} ${item.source}`;
  const keywordScore = countMatchedKeywords(
    target,
    category === "cozy" ? cozyPriorityKeywords : techPriorityKeywords
  );
  const descriptionBonus = item.description.trim().length > 0 ? 1 : 0;
  const stableNoise = hashString(`${dateKey}-${item.url}`) % 5;

  return keywordScore * 10 + descriptionBonus + stableNoise;
}

function parseFeedItems(feedText: string, source: string): ReadingItem[] {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(feedText, "application/xml");
  if (documentNode.querySelector("parsererror")) {
    return [];
  }

  const itemNodes = Array.from(documentNode.querySelectorAll("item, entry"));
  const items: ReadingItem[] = [];
  for (const itemNode of itemNodes) {
    const title = itemNode.querySelector("title")?.textContent?.trim() ?? "";
    const descriptionRaw =
      itemNode.querySelector("description")?.textContent ??
      itemNode.querySelector("summary")?.textContent ??
      itemNode.querySelector("content")?.textContent ??
      "";

    const linkNodes = Array.from(itemNode.querySelectorAll("link"));
    let link = "";
    for (const linkNode of linkNodes) {
      const href = linkNode.getAttribute("href")?.trim();
      const textContent = linkNode.textContent?.trim() ?? "";
      const candidate = href || textContent;
      if (candidate && isHttpUrl(candidate)) {
        link = candidate;
        break;
      }
    }

    if (!title || !link) {
      continue;
    }

    items.push({
      title,
      url: link,
      source,
      description: truncateText(stripHtml(descriptionRaw), 120)
    });
  }

  return items;
}

async function fetchReadingItemsFromSources(sources: ReadingSource[]): Promise<ReadingItem[]> {
  const collected: ReadingItem[] = [];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const feedText = await response.text();
      const parsed = parseFeedItems(feedText, source.source);
      if (parsed.length > 0) {
        collected.push(...parsed);
      }
    } catch (error) {
      console.warn(`読み物RSSの取得に失敗しました: ${source.source}`, error);
    }
  }

  return collected;
}

function pickFallbackReadingItem(category: ReadingCategory, dateKey: string): ReadingItem {
  const pool = category === "cozy" ? cozyReadingFallbackItems : techReadingFallbackItems;
  return pickBySeed(pool, hashString(`${dateKey}-${category}-fallback`), 3);
}

function pickDailyReadingItem(candidates: ReadingItem[], category: ReadingCategory, dateKey: string): ReadingPickResult {
  const filtered = candidates
    .filter((item) => isHttpUrl(item.url) && item.title.trim().length > 0)
    .filter((item) => !hasExcludedReadingKeyword(item));

  if (filtered.length === 0) {
    return {
      item: pickFallbackReadingItem(category, dateKey),
      usedFallback: true
    };
  }

  const sorted = filtered
    .map((item) => ({ item, score: scoreReadingItem(item, category, dateKey) }))
    .sort((left, right) => right.score - left.score);

  if (!sorted[0]?.item) {
    return {
      item: pickFallbackReadingItem(category, dateKey),
      usedFallback: true
    };
  }

  return {
    item: sorted[0].item,
    usedFallback: false
  };
}

function renderReadingCard(category: ReadingCategory, item: ReadingItem, statusText: string): void {
  const prefix = category === "cozy" ? "cozy" : "tech";
  const title = getElementByIdOrThrow<HTMLElement>(`${prefix}ReadingTitle`);
  const description = getElementByIdOrThrow<HTMLElement>(`${prefix}ReadingDescription`);
  const source = getElementByIdOrThrow<HTMLElement>(`${prefix}ReadingSource`);
  const link = getElementByIdOrThrow<HTMLAnchorElement>(`${prefix}ReadingLink`);
  const status = getElementByIdOrThrow<HTMLElement>(`${prefix}ReadingStatus`);

  title.textContent = item.title;
  description.textContent = item.description || "朝に短く読める記事を選びました。";
  source.textContent = item.source;
  link.href = item.url;
  status.textContent = statusText;
}

function setReadingLoadingState(): void {
  getElementByIdOrThrow<HTMLElement>("cozyReadingTitle").textContent = "読み込み中...";
  getElementByIdOrThrow<HTMLElement>("cozyReadingDescription").textContent = "";
  getElementByIdOrThrow<HTMLElement>("cozyReadingSource").textContent = "---";
  getElementByIdOrThrow<HTMLAnchorElement>("cozyReadingLink").href = "#";
  getElementByIdOrThrow<HTMLElement>("cozyReadingStatus").textContent = "記事を選んでいます...";

  getElementByIdOrThrow<HTMLElement>("techReadingTitle").textContent = "読み込み中...";
  getElementByIdOrThrow<HTMLElement>("techReadingDescription").textContent = "";
  getElementByIdOrThrow<HTMLElement>("techReadingSource").textContent = "---";
  getElementByIdOrThrow<HTMLAnchorElement>("techReadingLink").href = "#";
  getElementByIdOrThrow<HTMLElement>("techReadingStatus").textContent = "記事を選んでいます...";
}

async function loadDailyReadings(forceRefresh = false): Promise<void> {
  const todayKey = getLocalDateKey();
  const readingLog = loadDailyReadingLog();
  const todayReading = readingLog[todayKey];

  if (!forceRefresh && isDailyReadingEntry(todayReading)) {
    renderReadingCard("cozy", todayReading.cozy, "今日はこの読み物にしてみました");
    renderReadingCard("tech", todayReading.tech, "今日はこの読み物にしてみました");
    return;
  }

  currentReadingRequestToken += 1;
  const requestToken = currentReadingRequestToken;
  setReadingLoadingState();

  try {
    const [cozyCandidates, techCandidates] = await Promise.all([
      fetchReadingItemsFromSources(cozyReadingSources),
      fetchReadingItemsFromSources(techReadingSources)
    ]);

    if (requestToken !== currentReadingRequestToken) {
      return;
    }

    const cozyPick = pickDailyReadingItem(cozyCandidates, "cozy", todayKey);
    const techPick = pickDailyReadingItem(techCandidates, "tech", todayKey);

    const entry: DailyReadingEntry = { cozy: cozyPick.item, tech: techPick.item };
    const isSaved = saveDailyReadingLog({
      ...readingLog,
      [todayKey]: entry
    });

    const usedFallback = cozyPick.usedFallback || techPick.usedFallback;
    const statusText = usedFallback
      ? "外部取得に失敗したため、フォールバック記事を表示しています"
      : isSaved
        ? "今日はこの読み物にしてみました"
        : "保存できなかったため、再読み込みで変わる場合があります";

    renderReadingCard("cozy", cozyPick.item, statusText);
    renderReadingCard("tech", techPick.item, statusText);
  } catch (error) {
    if (requestToken !== currentReadingRequestToken) {
      return;
    }

    console.warn("読み物の取得に失敗したためフォールバックを表示します", error);
    const cozy = pickFallbackReadingItem("cozy", todayKey);
    const tech = pickFallbackReadingItem("tech", todayKey);

    renderReadingCard("cozy", cozy, "フォールバック記事を表示しています");
    renderReadingCard("tech", tech, "フォールバック記事を表示しています");
  }
}

async function loadQuote(name = ""): Promise<void> {
  const quoteText = getElementByIdOrThrow<HTMLElement>("quoteText");
  quoteText.textContent = "名言を取得中です...";

  try {
    const response = await fetch(QUOTE_API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`quote APIエラー: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`quote APIがJSON以外を返しました: ${contentType || "unknown"}`);
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
    console.warn("名言APIの取得に失敗したため、ローカル名言を利用します", error);
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

function loadProfileName(): string {
  try {
    const stored = localStorage.getItem(NAME_STORAGE_KEY);
    return stored ? stored : "";
  } catch (error) {
    console.warn("名前の保存データを読み込めませんでした", error);
    return "";
  }
}

function saveProfileName(name: string): void {
  try {
    localStorage.setItem(NAME_STORAGE_KEY, name);
  } catch (error) {
    console.warn("名前の保存に失敗しました", error);
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
  renderLuckyBoxCard();
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
  const luckyBoxButtons = getLuckyBoxButtons();
  const buddyTypeButtons = document.querySelectorAll<HTMLButtonElement>("[data-buddy-type]");

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

  luckyBoxButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedIndex = Number(button.dataset.luckyBoxIndex);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 2) {
        return;
      }
      handleLuckyBoxSelection(selectedIndex);
    });
  });

  buddyTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedType = button.dataset.buddyType;
      if (!isBuddyType(selectedType) || selectedType === activeBuddyPreference) {
        return;
      }

      activeBuddyPreference = selectedType;
      setBuddyTypeButtons(selectedType);
      saveBuddyPreference(selectedType);
      void loadDailyBuddy();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("nameInput") as HTMLInputElement | null;
  if (nameInput) {
    nameInput.value = loadProfileName();
    activeProfileName = nameInput.value.trim();
    nameInput.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value.trim();
      activeProfileName = value;
      saveProfileName(value);
    });
  }
});

const LEAVING_NOTE_STORAGE_KEY = "gdm:leavingNoteLog";
const LEAVING_REMINDER_HOUR = 16;
const LEAVING_REMINDER_MINUTE = 0;

function getLeavingNoteLog(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LEAVING_NOTE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch (e) {
    console.warn("明日へのメッセージの読み込み失敗", e);
    return {};
  }
}

function saveLeavingNoteLog(log: Record<string, string>) {
  try {
    localStorage.setItem(LEAVING_NOTE_STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.warn("明日へのメッセージの保存失敗", e);
  }
}

function getTodayLeavingNote(): string {
  const log = getLeavingNoteLog();
  return log[getLocalDateKey()] || "";
}

function getYesterdayLeavingNote(): string {
  const log = getLeavingNoteLog();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return log[getLocalDateKey(yesterday)] || "";
}

function isLeavingTime(): boolean {
  const now = new Date();
  return now.getHours() > LEAVING_REMINDER_HOUR || (now.getHours() === LEAVING_REMINDER_HOUR && now.getMinutes() >= LEAVING_REMINDER_MINUTE);
}

function renderLeavingNoteCard(clearStatus = true) {
  const card = document.getElementById("leavingNoteCard");
  const input = document.getElementById("leavingNoteInput") as HTMLTextAreaElement | null;
  const status = document.getElementById("leavingNoteStatus");
  const yesterday = document.getElementById("leavingNoteYesterday");
  const icon = document.getElementById("leavingNoteIcon");
  const title = document.getElementById("leavingNoteTitle");
  const pulse = document.getElementById("leavingNotePulse");
  if (!card || !input || !status || !yesterday || !icon || !title || !pulse) return;

  // 復元
  input.value = getTodayLeavingNote();
  if (clearStatus) {
    status.textContent = "";
  }
  const yNote = getYesterdayLeavingNote();
  yesterday.textContent = yNote ? `昨日: ${yNote}` : "";

  // 強調表示
  if (isLeavingTime()) {
    card.classList.add("leaving-note-highlight");
    title.classList.add("leaving-note-title-highlight");
    icon.classList.add("leaving-note-icon-highlight");
    pulse.classList.remove("hidden");
    pulse.textContent = "そろそろ明日へのメッセージを確認しましょう";
  } else {
    card.classList.remove("leaving-note-highlight");
    title.classList.remove("leaving-note-title-highlight");
    icon.classList.remove("leaving-note-icon-highlight");
    pulse.classList.add("hidden");
    pulse.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderLeavingNoteCard();
  const form = document.getElementById("leavingNoteForm");
  const input = document.getElementById("leavingNoteInput") as HTMLTextAreaElement | null;
  const status = document.getElementById("leavingNoteStatus");
  if (form && input && status) {
    input.addEventListener("input", () => {
      status.textContent = "";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) {
        status.textContent = "";
        return;
      }
      if (value.length > 100) {
        status.textContent = "100文字以内で入力してください";
        return;
      }
      const log = getLeavingNoteLog();
      log[getLocalDateKey()] = value;
      saveLeavingNoteLog(log);
      status.textContent = "保存しました";
      renderLeavingNoteCard(false);
    });
  }
  // 16:00以降の強調を毎分チェック
  setInterval(renderLeavingNoteCard, 60 * 1000);
});

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
  renderLuckyBoxCard();
  currentMoodLog = loadMoodLog();
  activeBuddyPreference = loadBuddyPreference();
  setBuddyTypeButtons(activeBuddyPreference);
  setupEvents();
  void loadWeather();
  void loadQuote();
  void loadOnThisDay();
  void loadDailyBuddy();
  void loadDailyReadings();
}

init();
