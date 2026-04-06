module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const response = await fetch("https://zenquotes.io/api/random", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`ZenQuotes API error: ${response.status}`);
    }

    const payload = await response.json();
    const item = Array.isArray(payload) ? payload[0] : null;
    const quote = typeof item?.q === "string" ? item.q.trim() : "";
    const author = typeof item?.a === "string" ? item.a.trim() : "";

    if (!quote) {
      throw new Error("ZenQuotes response does not contain quote text");
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({
      quote,
      author,
      source: "ZenQuotes"
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Failed to fetch quote from ZenQuotes" });
  }
};
