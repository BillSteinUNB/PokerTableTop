import Modal from "./Modal.jsx";
import { Suit } from "./PixelArt.jsx";

export default function Help({ onClose }) {
  const rankings = [
    "Royal flush",
    "Straight flush",
    "Four of a kind",
    "Full house",
    "Flush",
    "Straight",
    "Three of a kind",
    "Two pair",
    "One pair",
    "High card",
  ];
  return (
    <Modal title="How to play" onClose={onClose} wide>
      <div className="help-grid">
        <div>
          <h3>Texas Hold’em</h3>
          <p>
            Make your best five-card hand using your two private cards and the
            five community cards. Or get everyone else to fold.
          </p>
          <h3>Betting</h3>
          <p>
            <b>Check</b> when there’s no bet to match. <b>Call</b> to match it.{" "}
            <b>Raise to</b> is your total bet for this round. <b>Fold</b> lets
            the hand go.
          </p>
          <h3>Stacks and elimination</h3>
          <p>
            Your chips carry between hands. Run out and you can watch the rest
            of the game. The last player with chips wins. The host can bring
            everyone back for a rematch.
          </p>
          <p className="muted">
            Blinds can double every few hands. All-ins use side pots, so you can
            only win the chips your stack covers. A short all-in may not reopen
            raising.
          </p>
          <p className="muted">
            Online turns have a timer: an expired turn checks for free or folds
            facing a bet. Disconnected seats stay reserved; when everyone is
            offline the table pauses for up to 24 hours.
          </p>
        </div>
        <div className="rank-list">
          <span className="eyebrow">STRONGEST → WEAKEST</span>
          {rankings.map((name, i) => (
            <div key={name}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {name}
              <Suit suit={i % 2 ? "diamonds" : "spades"} />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
