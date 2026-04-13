const SUPPORTED_WEATHER = new Set(["sunny", "cloudy", "rainy"]);

const WEATHER_TO_PLACE_TYPES = {
  sunny: ["park", "tourist_attraction", "cafe"],
  cloudy: ["shopping_mall", "book_store", "cafe"],
  rainy: ["shopping_mall", "movie_theater", "museum"]
};

const TYPE_LABELS = {
  park: "公園",
  tourist_attraction: "お出かけスポット",
  cafe: "カフェ",
  shopping_mall: "ショッピングモール",
  book_store: "書店",
  movie_theater: "映画館",
  museum: "博物館"
};

const WEATHER_TEMPLATES = {
  sunny: [
    "{place} は晴れの日の気分転換に向いています。移動ついでに短時間だけ寄るのがおすすめです。",
    "天気が良いので {place} を候補に。外出を1回にまとめると時間も使いやすくなります。",
    "{place} 周辺を軽く歩くプランは、晴れの日のリフレッシュに相性が良いです。"
  ],
  cloudy: [
    "{place} はくもりの日でも使いやすいスポットです。用事とセットで立ち寄ると効率的です。",
    "気温が読みづらい日は {place} のような {category} を軸にすると予定を組みやすいです。",
    "{place} を起点に近場でまとめると、くもりの日の移動負担を減らせます。"
  ],
  rainy: [
    "雨の日は {place} のような屋内スポットが安全です。外移動を減らして過ごしやすくしましょう。",
    "{place} を候補にして、雨の日の外出回数を1回にまとめると負担を抑えられます。",
    "{place}（{category}）なら、雨でも過ごしやすく予定を崩しにくいです。"
  ]
};

const COUPON_TEMPLATES = {
  sunny: [
    "{place} 周辺は晴れの日の回遊がしやすいので、公式サイトやアプリの当日クーポンを出発前にチェックしておくと使いやすいです。",
    "{place} の近くで買い物をまとめるなら、店舗の時間帯セールを先に見ておくと移動回数を減らしやすいです。",
    "{place} エリアは天気が安定しやすいので、ポイントアップデーと合わせるとお得になりやすいです。"
  ],
  cloudy: [
    "{place} 周辺のセール情報は日替わりになりやすいので、公式情報を1回確認してから動くと効率的です。",
    "{place} に行く前にクーポン配布アプリを確認しておくと、くもりの日でも無駄足を減らしやすいです。",
    "{place} の近場店舗で、食品と日用品の特売日を合わせて回るのがおすすめです。"
  ],
  rainy: [
    "雨の日は {place} のような屋内スポット中心で、アプリ限定クーポンと館内セールを先に確認すると移動負担を抑えられます。",
    "{place} 周辺の屋内店舗は雨天時キャンペーンが出る場合があるので、事前チェックがおすすめです。",
    "天気が雨寄りなので、{place} エリアのまとめ買いとクーポン併用で外出回数を減らすのが効果的です。"
  ]
};

function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
}

function pickBySeed(items, seed, offset) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }
  return items[(seed + offset) % items.length];
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(req) {
  if (req && typeof req.query === "object" && req.query !== null) {
    return req.query;
  }
  if (req && typeof req.url === "string") {
    const url = new URL(req.url, "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  }
  return {};
}

function formatTodayTokyo() {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function labelFromTypes(types) {
  if (!Array.isArray(types)) {
    return "スポット";
  }
  for (const type of types) {
    if (typeof type === "string" && TYPE_LABELS[type]) {
      return TYPE_LABELS[type];
    }
  }
  return "スポット";
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_MAPS_API_KEY is not configured" });
    return;
  }

  try {
    const query = parseQuery(req);
    const lat = Number(firstQueryValue(query.lat));
    const lon = Number(firstQueryValue(query.lon));
    const weather = String(firstQueryValue(query.weather) || "").trim();

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      res.status(400).json({ error: "Invalid lat/lon" });
      return;
    }

    if (!SUPPORTED_WEATHER.has(weather)) {
      res.status(400).json({ error: "Invalid weather type" });
      return;
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.shortFormattedAddress,places.types"
      },
      body: JSON.stringify({
        includedTypes: WEATHER_TO_PLACE_TYPES[weather],
        maxResultCount: 12,
        languageCode: "ja",
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lon
            },
            radius: 3500
          }
        }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Places API error: ${response.status} ${detail}`);
    }

    const payload = await response.json();
    const places = Array.isArray(payload.places) ? payload.places : [];

    if (places.length === 0) {
      throw new Error("Google Places response has no places");
    }

    const dateKey = formatTodayTokyo();
    const seed = hashString(`${weather}-${lat.toFixed(3)}-${lon.toFixed(3)}-${dateKey}`);
    const place = places[seed % places.length] || {};
    const placeName =
      (typeof place.displayName?.text === "string" && place.displayName.text.trim()) ||
      (typeof place.shortFormattedAddress === "string" && place.shortFormattedAddress.trim()) ||
      "近くのスポット";
    const category = labelFromTypes(place.types);
    const template = pickBySeed(WEATHER_TEMPLATES[weather], seed, 19);
    const tip = template
      .replaceAll("{place}", placeName)
      .replaceAll("{category}", category);
    const couponTemplate = pickBySeed(COUPON_TEMPLATES[weather], seed, 41);
    const couponTip = couponTemplate
      .replaceAll("{place}", placeName)
      .replaceAll("{category}", category);
    const couponQuery = `${placeName} クーポン セール`;
    const couponUrl = `https://www.google.com/search?q=${encodeURIComponent(couponQuery)}`;

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({
      tip,
      placeName,
      source: "Google Places",
      couponTip,
      couponSource: "Google Places + Google Search",
      couponUrl
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Failed to fetch deal tips from Google Places" });
  }
};
