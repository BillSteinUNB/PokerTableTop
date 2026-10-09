import { useEffect, useState } from "react";
import { useTable } from "../services/ui.js";

export default function ShareRoom() {
  const { room } = useTable();
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const url = `${location.origin}${location.pathname}?room=${room.code}`;
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
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
      <button type="button" className="button secondary compact" onClick={copy}>
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
