// src/components/PianoKeyboard.js
import React from "react";
import * as Tone from "tone";
import "./PianoKeyboard.css";

const PIANO_KEYS = [
  // 3옥타브
  { label: "C3", vexKey: "c/3", isSharp: false },
  { label: "C#3", vexKey: "c#/3", isSharp: true },
  { label: "D3", vexKey: "d/3", isSharp: false },
  { label: "D#3", vexKey: "d#/3", isSharp: true },
  { label: "E3", vexKey: "e/3", isSharp: false },
  { label: "F3", vexKey: "f/3", isSharp: false },
  { label: "F#3", vexKey: "f#/3", isSharp: true },
  { label: "G3", vexKey: "g/3", isSharp: false },
  { label: "G#3", vexKey: "g#/3", isSharp: true },
  { label: "A3", vexKey: "a/3", isSharp: false },
  { label: "A#3", vexKey: "a#/3", isSharp: true },
  { label: "B3", vexKey: "b/3", isSharp: false },

  // 4옥타브
  { label: "C4", vexKey: "c/4", isSharp: false },
  { label: "C#4", vexKey: "c#/4", isSharp: true },
  { label: "D4", vexKey: "d/4", isSharp: false },
  { label: "D#4", vexKey: "d#/4", isSharp: true },
  { label: "E4", vexKey: "e/4", isSharp: false },
  { label: "F4", vexKey: "f/4", isSharp: false },
  { label: "F#4", vexKey: "f#/4", isSharp: true },
  { label: "G4", vexKey: "g/4", isSharp: false },
  { label: "G#4", vexKey: "g#/4", isSharp: true },
  { label: "A4", vexKey: "a/4", isSharp: false },
  { label: "A#4", vexKey: "a#/4", isSharp: true },
  { label: "B4", vexKey: "b/4", isSharp: false },

  // 5옥타브
  { label: "C5", vexKey: "c/5", isSharp: false },
  { label: "C#5", vexKey: "c#/5", isSharp: true },
  { label: "D5", vexKey: "d/5", isSharp: false },
  { label: "D#5", vexKey: "d#/5", isSharp: true },
  { label: "E5", vexKey: "e/5", isSharp: false },
  { label: "F5", vexKey: "f/5", isSharp: false },
  { label: "F#5", vexKey: "f#/5", isSharp: true },
  { label: "G5", vexKey: "g/5", isSharp: false },
  { label: "G#5", vexKey: "g#/5", isSharp: true },
  { label: "A5", vexKey: "a/5", isSharp: false },
  { label: "A#5", vexKey: "a#/5", isSharp: true },
  { label: "B5", vexKey: "b/5", isSharp: false },
];

const WHITE_KEYS = PIANO_KEYS.filter((k) => !k.isSharp);

function PianoKeyboard({ mode, selectedChordKeys, onKeyClick }) {
  const isSelected = (key) =>
    selectedChordKeys && selectedChordKeys.includes(key.vexKey);

  const playSound = async (key) => {
    await Tone.start();
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease(key.label, "8n");
  };

  const handleClick = (key) => {
    playSound(key);
    if (onKeyClick) {
      onKeyClick(key); // {label, vexKey, isSharp}
    }
  };

  const getSharpForWhite = (white) => {
    const letter = white.label[0]; // C, D …
    const octave = white.label.slice(-1);
    return PIANO_KEYS.find(
      (k) => k.isSharp && k.label.startsWith(letter) && k.label.endsWith(octave)
    );
  };

  return (
    <div className="piano-wrapper">
      <div className="piano-mode-indicator">
        현재 모드: {mode === "single" ? "단일음" : "화음"}
      </div>

      <div className="piano-box">
        {WHITE_KEYS.map((white) => {
          const sharp = getSharpForWhite(white);

          return (
            <div className="key-group" key={white.label}>
              {sharp && (
                <button
                  className={
                    "piano-key black" +
                    (isSelected(sharp) ? " selected" : "")
                  }
                  onClick={() => handleClick(sharp)}
                >
                  {sharp.label}
                </button>
              )}

              <button
                className={
                  "piano-key white" +
                  (isSelected(white) ? " selected" : "")
                }
                onClick={() => handleClick(white)}
              >
                {white.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PianoKeyboard;
