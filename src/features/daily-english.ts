import { dailyEnglishCards, type DailyEnglishCard } from "../english-data";
import { getLocalDateKey } from "./daily-content";

const STORAGE_KEY = "gdm:dailyEnglishRotation";
const VERSION = 1;

type RotationState = { version: number; dateKey: string; order: number[]; position: number };
export type DailyEnglishSelection = { card: DailyEnglishCard; status: string };

function shuffle(length: number, avoidFirstIndex?: number): number[] {
  const values = Array.from({ length }, (_, index) => index);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  if (avoidFirstIndex !== undefined && values.length > 1 && values[0] === avoidFirstIndex) [values[0], values[1]] = [values[1], values[0]];
  return values;
}

function createState(dateKey: string, avoidFirstIndex?: number): RotationState {
  return { version: VERSION, dateKey, order: shuffle(dailyEnglishCards.length, avoidFirstIndex), position: 0 };
}

function isState(value: unknown): value is RotationState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Partial<RotationState>;
  if (state.version !== VERSION || typeof state.dateKey !== "string" || !Array.isArray(state.order) || !Number.isInteger(state.position)) return false;
  if (state.order.length !== dailyEnglishCards.length || new Set(state.order).size !== dailyEnglishCards.length) return false;
  return state.order.every((index) => Number.isInteger(index) && index >= 0 && index < dailyEnglishCards.length) && state.position! >= 0 && state.position! < state.order.length;
}

function dayDifference(from: string, to: string): number {
  const difference = Math.floor((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);
  return Number.isFinite(difference) ? Math.max(0, difference) : 0;
}

function advance(state: RotationState, days: number): RotationState {
  let order = [...state.order];
  let position = state.position;
  for (let count = 0; count < days; count += 1) {
    if (position < order.length - 1) position += 1;
    else {
      const previous = order[position];
      order = shuffle(dailyEnglishCards.length, previous);
      position = 0;
    }
  }
  return { ...state, order, position };
}

function persist(state: RotationState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getDailyEnglishSelection(): DailyEnglishSelection {
  const today = getLocalDateKey();
  let state = createState(today);
  let didPersist = false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    if (isState(parsed)) {
      const elapsed = dayDifference(parsed.dateKey, today);
      state = elapsed > 0 ? { ...advance(parsed, elapsed), dateKey: today } : parsed;
      didPersist = elapsed > 0 ? persist(state) : true;
    } else didPersist = persist(state);
  } catch {
    didPersist = persist(state);
  }
  return {
    card: dailyEnglishCards[state.order[state.position]] ?? dailyEnglishCards[0],
    status: didPersist ? "毎日1つずつランダムに入れ替わります" : "保存できないため、再読み込みで変わる場合があります"
  };
}
