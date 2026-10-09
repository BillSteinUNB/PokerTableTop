import { useState } from "react";
import { useTable } from "../services/ui.js";

export default function ShareRoom() {
  const { room } = useTable();
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const url = `${location.origin}${location.pathname}?room=${room.code}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setManual(true);
    }
  }
  return (
    <div className="share-room">
      <div>
        <span className="eyebrow">ROOM CODE</span>
        <strong>{room.code}</strong>
      </div>
      <button className="button secondary compact" onClick={copy}>
        {copied ? "✓ COPIED" : "COPY INVITE ↗"}
      </button>
      {manual && (
        <label className="manual-copy">
          Copy this link
          <input value={url} readOnly onFocus={(e) => e.target.select()} />
        </label>
      )}
    </div>
  );
}
