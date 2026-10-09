import { useRef, useState } from "react";
import { CHARACTERS } from "../../shared/characters.js";
import { Avatar } from "./PixelArt.jsx";
import "./ProfilePicker.css";

export default function ProfilePicker({ profile, setProfile }) {
  const selected =
    CHARACTERS.find((character) => character.id === profile.avatar) ||
    CHARACTERS[0];
  const [category, setCategory] = useState(selected.category);
  const grid = useRef(null);
  const options = CHARACTERS.filter(
    (character) => character.category === category,
  );
  const tabStop = options.some((character) => character.id === selected.id)
    ? selected.id
    : options[0].id;
  const choose = (id) => setProfile({ ...profile, avatar: id });
  const navigate = (event, index) => {
    const columns = getComputedStyle(grid.current).gridTemplateColumns.split(
      " ",
    ).length;
    const offsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    };
    let next;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "ArrowUp")
      next =
        index >= columns
          ? index - columns
          : index +
            Math.floor((options.length - 1 - index) / columns) * columns;
    else if (event.key === "ArrowDown")
      next =
        index + columns < options.length ? index + columns : index % columns;
    else if (event.key in offsets)
      next = (index + offsets[event.key] + options.length) % options.length;
    else return;
    event.preventDefault();
    choose(options[next].id);
    grid.current.querySelectorAll('[role="radio"]')[next].focus();
  };
  return (
    <>
      <label className="field-label" htmlFor="player-name">
        NAME
      </label>
      <input
        id="player-name"
        autoComplete="nickname"
        maxLength={18}
        minLength={2}
        required
        placeholder="Your name"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <section className="character-picker" aria-label="Choose your character">
        <div className="character-preview">
          <div className="character-portrait">
            <Avatar kind={selected.id} />
          </div>
          <div>
            <span className="character-label">YOUR CHARACTER</span>
            <strong>{selected.name}</strong>
          </div>
          <span className="character-selected-mark" aria-hidden="true">
            ✓
          </span>
        </div>
        <div className="character-categories" aria-label="Character categories">
          {[
            ["animals", "Animals"],
            ["people", "People"],
          ].map(([id, name]) => (
            <button
              type="button"
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {name}
              <span>
                {
                  CHARACTERS.filter((character) => character.category === id)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div
          className="character-grid"
          role="radiogroup"
          aria-label={
            category === "animals" ? "Animal characters" : "Human characters"
          }
          ref={grid}
        >
          {options.map((character, index) => (
            <button
              type="button"
              role="radio"
              key={character.id}
              className={`character-choice ${selected.id === character.id ? "selected" : ""}`}
              aria-label={character.name}
              aria-checked={selected.id === character.id}
              tabIndex={tabStop === character.id ? 0 : -1}
              onKeyDown={(event) => navigate(event, index)}
              onClick={() => choose(character.id)}
            >
              <Avatar kind={character.id} />
              <span>{character.name}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
