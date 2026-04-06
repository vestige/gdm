import "./style.css";
import { fortunes, luckyActions, luckyColors, quotes, trivia } from "./data";

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

let selectedLocationKey: LocationKey = "tochigi";
const LOCATION_STORAGE_KEY = "gdm.selectedLocation";
const USELESS_FACTS_API_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en";
const TRANSLATE_API_BASE_URL = "https://api.mymemory.translated.net/get";
const WIKIMEDIA_ONTHISDAY_API_BASE_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all";
const QUOTE_API_ENDPOINT = "/api/quote";
const DEAL_TIP_API_ENDPOINT = "/api/deal-tips";
let latestTriviaText = "";
let latestQuoteText = "";
const localDealTips: Record<LocationKey, Record<WeatherType, string[]>> = {
  tokyo: {
    sunny: [
      "多摩川沿いを10〜15分だけ歩くと、気分転換と運動をまとめてこなせます。",
      "晴れの日は下丸子周辺でテイクアウトして外で食べると、ランチ満足度が上がりやすいです。",
      "移動を1駅ぶんだけ徒歩にすると、交通費を抑えつつリフレッシュできます。"
    ],
    cloudy: [
      "曇りの日は混雑ピーク前に買い物を済ませると、待ち時間を減らしやすいです。",
      "気温差に備えて薄手の羽織りを持つと、余計な買い足しを防げます。",
      "屋外と屋内を半々で使える予定にすると、天候変化にも柔軟に動けます。"
    ],
    rainy: [
      "雨の日は駅直結・屋根のある動線を優先すると、傘トラブルや時間ロスを抑えられます。",
      "外出はまとめて1回にすると、移動コストと濡れるストレスを減らせます。",
      "屋内で休める場所を先に決めておくと、急な強雨でも無駄な出費を避けやすいです。"
    ]
  },
  tochigi: {
    sunny: [
      "晴れの日は近場の公園方面へ短時間散歩すると、気分転換コスパが高いです。",
      "明るい時間にまとめ買いを済ませると、夕方の移動回数を減らせます。",
      "車移動前に寄り道先を1つに絞ると、ガソリン消費を抑えやすいです。"
    ],
    cloudy: [
      "曇りの日は外出を短時間に区切ると、天気悪化時のリスクを減らせます。",
      "気温に合わせて飲み物を持参すると、コンビニ立ち寄り回数を減らせます。",
      "予定を近いエリアで固めると、移動の手間と時間を節約できます。"
    ],
    rainy: [
      "雨の日は屋内中心の用事に切り替えると、移動コストを抑えやすいです。",
      "買い物リストを先に作って1回で済ませると、雨の日の外出回数を減らせます。",
      "出発前に駐車場所を決めると、雨の中の移動時間を短縮できます。"
    ]
  }
};

const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const cloudyCodes = [1, 2, 3, 45, 48];

type UselessFactResponse = {
  text?: string;
};

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

type DealTipResponse = {
  tip?: string;
  placeName?: string;
  source?: string;
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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getTodaySeed(name = ""): number {
  const now = new Date();
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return dateSeed + hashString(name.trim());
}

function pickBySeed<T>(array: T[], seed: number, offset = 0): T {
  return array[(seed + offset) % array.length];
}

function getWeatherLabel(weatherType: WeatherType): string {
  const weatherLabel: Record<WeatherType, string> = {
    sunny: "晴れ向け",
    cloudy: "くもり向け",
    rainy: "雨向け"
  };
  return weatherLabel[weatherType];
}

function setDealTipSourceLabel(source: string): void {
  getElementByIdOrThrow<HTMLElement>("dealTipSource").textContent = `データソース: ${source}`;
}

function updateLocalDealTip(weatherType: WeatherType): void {
  const location = locations[selectedLocationKey];
  const tips = localDealTips[selectedLocationKey][weatherType];
  const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
  const tipSeed = getTodaySeed(`${selectedLocationKey}-${weatherType}-${nameInput.value}`);
  const tip = pickBySeed(tips, tipSeed, 17);
  setDealTipSourceLabel("ローカルプリセット（フォールバック）");

  getElementByIdOrThrow<HTMLElement>("localDealTip").textContent =
    `${location.name}の${getWeatherLabel(weatherType)}: ${tip}`;
}

async function loadDealTip(weatherType: WeatherType): Promise<void> {
  const location = locations[selectedLocationKey];
  const dealTipElement = getElementByIdOrThrow<HTMLElement>("localDealTip");
  setDealTipSourceLabel("Google Places");
  dealTipElement.textContent = `${location.name}の${getWeatherLabel(weatherType)}お得ヒントを検索中です...`;

  try {
    const params = new URLSearchParams({
      lat: String(location.latitude),
      lon: String(location.longitude),
      weather: weatherType
    });
    const response = await fetch(`${DEAL_TIP_API_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`deal-tips APIエラー: ${response.status}`);
    }

    const data = (await response.json()) as DealTipResponse;
    const tip = typeof data.tip === "string" ? data.tip.trim() : "";
    const placeName = typeof data.placeName === "string" ? data.placeName.trim() : "";
    const source = typeof data.source === "string" ? data.source.trim() : "";
    if (!tip) {
      throw new Error("deal-tips APIレスポンスに tip がありません");
    }
    setDealTipSourceLabel(source || "Google Places");

    dealTipElement.textContent = placeName
      ? `${location.name}の${getWeatherLabel(weatherType)}: ${placeName} - ${tip}`
      : `${location.name}の${getWeatherLabel(weatherType)}: ${tip}`;
  } catch (error) {
    console.error(error);
    updateLocalDealTip(weatherType);
  }
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
  getElementByIdOrThrow<HTMLElement>("triviaText").textContent = latestTriviaText || "豆知識を取得中です...";

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

async function loadUselessFact(): Promise<void> {
  const triviaText = getElementByIdOrThrow<HTMLElement>("triviaText");
  triviaText.textContent = "豆知識を取得中です...";

  try {
    const response = await fetch(USELESS_FACTS_API_URL);
    if (!response.ok) {
      throw new Error(`uselessfacts APIエラー: ${response.status}`);
    }

    const data = (await response.json()) as UselessFactResponse;
    const factText = typeof data.text === "string" ? data.text.trim() : "";
    if (!factText) {
      throw new Error("uselessfacts のレスポンスに text がありません");
    }

    const translatedFactText = await translateTextToJapanese(factText);
    latestTriviaText = translatedFactText || factText;
    triviaText.textContent = latestTriviaText;
  } catch (error) {
    console.error(error);
    const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
    const fallback = pickBySeed(trivia, getTodaySeed(nameInput.value), 11);
    latestTriviaText = fallback;
    triviaText.textContent = fallback;
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

function loadSavedLocation(): LocationKey {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored && isLocationKey(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn("場所の保存データを読み込めませんでした", error);
  }
  return selectedLocationKey;
}

function saveLocation(locationKey: LocationKey): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, locationKey);
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
  const officeLocation = locations[selectedLocationKey];

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
    const weatherType = classifyWeatherForBackground(currentCode);
    setWeatherBackground(weatherType);
    await loadDealTip(weatherType);

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
    updateLocalDealTip("cloudy");
  }
}

function setupEvents(): void {
  const nameForm = getElementByIdOrThrow<HTMLFormElement>("nameForm");
  const nameInput = getElementByIdOrThrow<HTMLInputElement>("nameInput");
  const locationSelect = getElementByIdOrThrow<HTMLSelectElement>("locationSelect");

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value;
    drawFortune();
    revealResults();
    void loadQuote(name);
    void loadUselessFact();
  });

  locationSelect.addEventListener("change", () => {
    const nextLocation = locationSelect.value;
    if (!isLocationKey(nextLocation)) {
      return;
    }
    selectedLocationKey = nextLocation;
    saveLocation(nextLocation);
    void loadWeather();
  });

  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const name = nameInput.value;
      drawFortune();
      revealResults();
      void loadQuote(name);
      void loadUselessFact();
    }
  });
}

function init(): void {
  const locationSelect = getElementByIdOrThrow<HTMLSelectElement>("locationSelect");
  const savedLocation = loadSavedLocation();
  if (isLocationKey(savedLocation)) {
    selectedLocationKey = savedLocation;
    locationSelect.value = savedLocation;
  } else if (isLocationKey(locationSelect.value)) {
    selectedLocationKey = locationSelect.value;
  }

  setTodayLabel();
  setupEvents();
  void loadWeather();
  void loadQuote();
  void loadUselessFact();
  void loadOnThisDay();
}

init();
