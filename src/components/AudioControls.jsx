import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { audio } from "../services/audio.js";
import "./AudioControls.css";

function SoundIcon({ muted }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M3 9h4V7h2V5h3v14H9v-2H7v-2H3z" />
      {muted ? (
        <path d="M15 8h2v2h2V8h2v2h-2v4h2v2h-2v-2h-2v2h-2v-2h2v-4h-2z" />
      ) : (
        <>
          <path d="M15 8h2v2h2v4h-2v2h-2v-2h2v-4h-2z" />
          <path d="M18 4h2v2h2v12h-2v2h-2v-2h2V6h-2z" />
        </>
      )}
    </svg>
  );
}

export default function AudioControls({ atTable }) {
  const settings = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const firstControl = useRef(null);
  const id = useId();
  const muted =
    (!settings.music || !settings.musicVolume) &&
    (!settings.effects || !settings.effectsVolume);

  useEffect(() => {
    if (!open) return;
    firstControl.current?.focus();
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      className="audio-control"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        className={`audio-trigger ${settings.playing ? "is-playing" : ""}`}
        ref={trigger}
        aria-label="Audio settings"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => {
          audio.unlock();
          setOpen(!open);
        }}
      >
        <SoundIcon muted={muted} />
        <span>AUDIO</span>
        <i className={`audio-indicator ${muted ? "muted" : ""}`} />
      </button>
      {open && (
        <section
          className="audio-popover"
          id={`${id}-panel`}
          aria-labelledby={`${id}-title`}
        >
          <div className="audio-heading">
            <h2 id={`${id}-title`}>Audio</h2>
            <button
              className="audio-close"
              aria-label="Close audio settings"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              ×
            </button>
          </div>
          {!settings.available ? (
            <p>Audio isn’t supported in this browser.</p>
          ) : (
            <>
              <div className="audio-channel">
                <div className="audio-channel-heading">
                  <span>
                    <span id={`${id}-music`}>Table music</span>
                    <small id={`${id}-music-status`}>
                      {!atTable
                        ? "Plays during the game"
                        : settings.playing
                          ? "Playing"
                          : !settings.music
                            ? "Off"
                            : !settings.musicVolume
                              ? "Muted"
                              : "Paused"}
                    </small>
                  </span>
                  <button
                    className="audio-switch"
                    role="switch"
                    aria-checked={settings.music}
                    aria-labelledby={`${id}-music`}
                    aria-describedby={`${id}-music-status`}
                    ref={firstControl}
                    onClick={() =>
                      audio.setPreferences({ music: !settings.music })
                    }
                  >
                    <span />
                  </button>
                </div>
                <div className="audio-volume">
                  <label
                    className="audio-visually-hidden"
                    htmlFor={`${id}-music-volume`}
                  >
                    Music volume
                  </label>
                  <input
                    id={`${id}-music-volume`}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(settings.musicVolume * 100)}
                    style={{ "--volume": `${settings.musicVolume * 100}%` }}
                    onChange={(event) =>
                      audio.setPreferences({
                        musicVolume: Number(event.target.value) / 100,
                      })
                    }
                  />
                  <output htmlFor={`${id}-music-volume`}>
                    {Math.round(settings.musicVolume * 100)}%
                  </output>
                </div>
              </div>
              <div className="audio-channel">
                <div className="audio-channel-heading">
                  <span>
                    <span id={`${id}-effects`}>Sound effects</span>
                    <small id={`${id}-effects-description`}>
                      Cards, chips and turns
                    </small>
                  </span>
                  <button
                    className="audio-switch"
                    role="switch"
                    aria-checked={settings.effects}
                    aria-labelledby={`${id}-effects`}
                    aria-describedby={`${id}-effects-description`}
                    onClick={() => {
                      audio.setPreferences({ effects: !settings.effects });
                      if (!settings.effects) audio.play("check");
                    }}
                  >
                    <span />
                  </button>
                </div>
                <div className="audio-volume">
                  <label
                    className="audio-visually-hidden"
                    htmlFor={`${id}-effects-volume`}
                  >
                    Sound effects volume
                  </label>
                  <input
                    id={`${id}-effects-volume`}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(settings.effectsVolume * 100)}
                    style={{ "--volume": `${settings.effectsVolume * 100}%` }}
                    onChange={(event) =>
                      audio.setPreferences({
                        effectsVolume: Number(event.target.value) / 100,
                      })
                    }
                    onPointerUp={() => audio.play("check")}
                    onKeyUp={() => audio.play("check")}
                  />
                  <output htmlFor={`${id}-effects-volume`}>
                    {Math.round(settings.effectsVolume * 100)}%
                  </output>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
