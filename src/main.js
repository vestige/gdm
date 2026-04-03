import "./style.css";
import { fortunes, luckyActions, luckyColors, quotes, trivia } from "./data.js";

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
};
let selectedLocationKey = "tochigi";
const LOCATION_STORAGE_KEY = "gdm.selectedLocation";
const USELESS_FACTS_API_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en";
const TRANSLATE_API_BASE_URL = "https://api.mymemory.translated.net/get";
let latestTriviaText = "";

const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const cloudyCodes = [1, 2, 3, 45, 48];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getTodaySeed(name = "") {
  const now = new Date();
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return dateSeed + hashString(name.trim());
}

function pickBySeed(array, seed, offset = 0) {
  return array[(seed + offset) % array.length];
}

function setTodayLabel() {
  const todayLabel = document.getElementById("todayLabel");
  const now = new Date();

  const text = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  todayLabel.textContent = `${text} ・ 良い一日を`;
}

function revealResults() {
  const resultSection = document.getElementById("resultSection");
  if (!resultSection.classList.contains("hidden")) {
    return;
  }

  resultSection.classList.remove("hidden");
  resultSection.querySelectorAll(".animate-float-up").forEach((el) => {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  });
}

function replayCardAnimation(el) {
  el.classList.remove("animate-glow-soft");
  void el.offsetWidth;
  el.classList.add("animate-glow-soft");
}

function drawFortune() {
  const name = document.getElementById("nameInput").value;
  const seed = getTodaySeed(name);

  const fortune = pickBySeed(fortunes, seed, 1);
  const color = pickBySeed(luckyColors, seed, 3);
  const action = pickBySeed(luckyActions, seed, 5);
  const quote = pickBySeed(quotes, seed, 7);

  document.getElementById("fortuneRank").textContent = fortune.rank;
  document.getElementById("fortuneMessage").textContent = fortune.message;
  document.getElementById("luckyColor").textContent = color;
  document.getElementById("luckyAction").textContent = action;
  document.getElementById("quoteText").textContent = quote;
  document.getElementById("triviaText").textContent = latestTriviaText || "豆知識を取得中です...";

  replayCardAnimation(document.getElementById("fortuneCard"));
}

async function loadUselessFact() {
  const triviaText = document.getElementById("triviaText");
  triviaText.textContent = "豆知識を取得中です...";

  try {
    const response = await fetch(USELESS_FACTS_API_URL);
    if (!response.ok) {
      throw new Error(`uselessfacts APIエラー: ${response.status}`);
    }

    const data = await response.json();
    const factText = typeof data?.text === "string" ? data.text.trim() : "";
    if (!factText) {
      throw new Error("uselessfacts のレスポンスに text がありません");
    }

    let translatedFactText = factText;
    try {
      const translateUrl =
        `${TRANSLATE_API_BASE_URL}?q=${encodeURIComponent(factText)}` +
        "&langpair=en|ja";
      const translateResponse = await fetch(translateUrl);
      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        const translatedText = typeof translateData?.responseData?.translatedText === "string"
          ? translateData.responseData.translatedText.trim()
          : "";
        if (translatedText) {
          translatedFactText = translatedText;
        }
      }
    } catch (translateError) {
      console.warn("豆知識の翻訳に失敗しました。英語原文で表示します。", translateError);
    }

    latestTriviaText = translatedFactText;
    triviaText.textContent = latestTriviaText;
  } catch (error) {
    console.error(error);
    const fallback = pickBySeed(trivia, getTodaySeed(document.getElementById("nameInput").value), 11);
    latestTriviaText = fallback;
    triviaText.textContent = fallback;
  }
}

function weatherCodeToEmoji(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "⛅";
}

function buildWeatherComment(eveningTemp, eveningRain) {
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

function findHourlyIndex(times, targetHour) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const target = `${yyyy}-${mm}-${dd}T${String(targetHour).padStart(2, "0")}:00`;

  return times.findIndex((time) => time.startsWith(target));
}

function classifyWeatherForBackground(code) {
  if (rainCodes.includes(code)) {
    return "rainy";
  }
  if (cloudyCodes.includes(code)) {
    return "cloudy";
  }
  return "sunny";
}

function setWeatherBackground(type) {
  const body = document.getElementById("appBody");
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

function loadSavedLocation() {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored && locations[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn("場所の保存データを読み込めませんでした", error);
  }
  return selectedLocationKey;
}

function saveLocation(locationKey) {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, locationKey);
  } catch (error) {
    console.warn("場所の保存に失敗しました", error);
  }
}

async function loadWeather() {
  const weatherStatus = document.getElementById("weatherStatus");
  const currentTemp = document.getElementById("currentTemp");
  const eveningTemp = document.getElementById("eveningTemp");
  const eveningRain = document.getElementById("eveningRain");
  const weatherComment = document.getElementById("weatherComment");
  const weatherEmoji = document.getElementById("weatherEmoji");
  const officeLocation = locations[selectedLocationKey] ?? locations.tochigi;

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

    const data = await response.json();
    const currentTemperature = data?.current?.temperature_2m;
    const currentCode = data?.current?.weather_code;
    const hourlyTimes = data?.hourly?.time ?? [];
    const hourlyTemps = data?.hourly?.temperature_2m ?? [];
    const hourlyRainProb = data?.hourly?.precipitation_probability ?? [];
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

function setupEvents() {
  const nameForm = document.getElementById("nameForm");
  const nameInput = document.getElementById("nameInput");
  const locationSelect = document.getElementById("locationSelect");

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    drawFortune();
    revealResults();
    loadUselessFact();
  });

  locationSelect.addEventListener("change", (event) => {
    const nextLocation = event.target.value;
    if (!locations[nextLocation]) {
      return;
    }
    selectedLocationKey = nextLocation;
    saveLocation(nextLocation);
    loadWeather();
  });

  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      drawFortune();
      revealResults();
      loadUselessFact();
    }
  });
}

function init() {
  const locationSelect = document.getElementById("locationSelect");
  const savedLocation = loadSavedLocation();
  if (locationSelect && locations[savedLocation]) {
    selectedLocationKey = savedLocation;
    locationSelect.value = savedLocation;
  } else if (locationSelect && locations[locationSelect.value]) {
    selectedLocationKey = locationSelect.value;
  }
  setTodayLabel();
  setupEvents();
  loadWeather();
  loadUselessFact();
}

init();
