import { fortunes, luckyActions, luckyColors, miniChallengeCategories } from "../data";

export type DailyFortune = {
  rank: string;
  message: string;
  color: string;
  action: string;
};

export type DailyChallenge = { category: string; text: string };

export function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  return hash;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodaySeed(name = ""): number {
  return Number(getLocalDateKey().replaceAll("-", "")) + hashString(name.trim());
}

function pickBySeed<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

export function getDailyFortune(name: string): DailyFortune {
  const seed = getTodaySeed(name);
  const fortune = pickBySeed(fortunes, seed, 1);
  return {
    rank: fortune.rank,
    message: fortune.message,
    color: pickBySeed(luckyColors, seed, 3),
    action: pickBySeed(luckyActions, seed, 5)
  };
}

export function getDailyChallenge(): DailyChallenge {
  const category = pickBySeed(miniChallengeCategories, getTodaySeed("mini-challenge-category"), 13);
  return {
    category: category.category,
    text: pickBySeed(category.challenges, getTodaySeed(`mini-challenge-${category.category}`), 7)
  };
}
