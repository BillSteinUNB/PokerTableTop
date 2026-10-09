import { useEffect, useState, useSyncExternalStore } from "react";
import { gameClient } from "./gameClient.js";
import { audio } from "./audio.js";
export const number = (value) => new Intl.NumberFormat("en").format(value || 0);
export const reactionLabels = {
  gg: "GG!",
  nice: "NICE HAND",
  wow: "WOW!",
  thinking: "HMM…",
  unlucky: "OOF.",
  hello: "HEY!",
};
export const readLocal = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export const saveLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage is optional. */
  }
};
export const useTable = () =>
  useSyncExternalStore(gameClient.subscribe, gameClient.getSnapshot);
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export const run = (fn) => {
  audio.unlock();
  return gameClient.run(fn);
};
