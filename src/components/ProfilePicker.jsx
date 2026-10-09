import { AVATARS } from "../../shared/settings.js";
import { Avatar } from "./PixelArt.jsx";

export default function ProfilePicker({ profile, setProfile }) {
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
      <span className="field-label">AVATAR</span>
      <div className="avatar-picker">
        {AVATARS.map((kind) => (
          <button
            type="button"
            key={kind}
            className={profile.avatar === kind ? "selected" : ""}
            aria-label={`Choose ${kind} avatar`}
            aria-pressed={profile.avatar === kind}
            onClick={() => setProfile({ ...profile, avatar: kind })}
          >
            <Avatar kind={kind} />
          </button>
        ))}
      </div>
    </>
  );
}
