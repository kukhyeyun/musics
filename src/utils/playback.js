// src/utils/playback.js
import * as Tone from "tone";
import { durationToBeats } from "./measure";

// "c#/4" -> "C#4"
function vexToTonePitch(key) {
  if (!key) return null;
  const [letterPart, octaveStr] = key.split("/");
  if (!octaveStr) return null;
  return `${letterPart.toUpperCase()}${octaveStr}`;
}

// events: [{ keys:["c/4"], duration:"q", hand:"R", isRest:false }, ...]
export async function playScoreEvents(events, bpm = 90) {
  if (!events || events.length === 0) return;

  await Tone.start(); // 오디오 허용

  const rightSynth = new Tone.PolySynth(Tone.Synth).toDestination();
  const leftSynth = new Tone.PolySynth(Tone.Synth).toDestination();

  const secondsPerBeat = 60 / bpm;
  let now = Tone.now();

  events.forEach((ev) => {
    const beats = durationToBeats(ev.duration);
    const durSec = beats * secondsPerBeat;

    if (ev.isRest || !ev.keys || ev.keys.length === 0) {
      now += durSec;
      return;
    }

    const tones = ev.keys.map(vexToTonePitch).filter(Boolean);

    if (tones.length > 0) {
      if (ev.hand === "L") {
        leftSynth.triggerAttackRelease(tones, durSec, now);
      } else {
        rightSynth.triggerAttackRelease(tones, durSec, now);
      }
    }

    now += durSec;
  });
}
