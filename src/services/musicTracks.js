import * as arcade from "./musicScore.js";
import * as jazz from "./jazzScore.js";
import * as ambient from "./ambientScore.js";
import { createVoiceRenderer } from "./jazzInstruments.js";

export const MUSIC_TRACKS = Object.freeze([
  Object.freeze({
    id: "jazz",
    name: "Traditional jazz",
    description: "Piano, upright bass and brushes",
  }),
  Object.freeze({
    id: "ambient",
    name: "Atmospheric jazz",
    description: "Soft keys, pads and subtle arcade tones",
  }),
  Object.freeze({
    id: "arcade",
    name: "Original arcade",
    description: "The original chiptune jazz",
  }),
]);

const scores = { jazz, ambient, arcade };
const tracks = MUSIC_TRACKS.map((metadata) =>
  Object.freeze({
    ...metadata,
    beat: scores[metadata.id].BEAT,
    barLength: scores[metadata.id].BAR_LENGTH,
    scoreBar: scores[metadata.id].scoreBar,
    renderVoice:
      metadata.id === "arcade"
        ? arcade.renderVoice
        : createVoiceRenderer(
            scores[metadata.id].BEAT,
            metadata.id === "jazz" ? 0.7 : 0.85,
          ),
  }),
);

export function getMusicTrack(id) {
  return tracks.find((track) => track.id === id) || tracks[0];
}
