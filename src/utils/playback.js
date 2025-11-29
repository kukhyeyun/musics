// src/utils/playback.js
import * as Tone from "tone";
import { durationToBeats } from "./measure";

// "c#/4" -> "C#4"
function vexToTonePitch(key) {
  if (!key) return null;
  const [letterPart, octaveStr] = key.split("/");
  if (!octaveStr) return null;
  const base = letterPart.toUpperCase(); // c# -> C#
  return `${base}${octaveStr}`;
}

// events: [{ keys: ["c/4","e/4"], duration: "q", isRest: false }, ...]
export async function playScoreEvents(events, bpm = 90) {
  if (!events || events.length === 0) return;

  await Tone.start(); // 모바일/브라우저 오디오 언락

  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  const secondsPerBeat = 60 / bpm;
  let now = Tone.now();

  events.forEach((ev) => {
    const beats = durationToBeats(ev.duration);
    const durSec = beats * secondsPerBeat;

    if (ev.isRest || !ev.keys || ev.keys.length === 0) {
      // 쉼표: 소리 없이 시간만 진행
      now += durSec;
      return;
    }

    const tones = ev.keys
      .map(vexToTonePitch)
      .filter((v) => v !== null && v !== undefined);

    if (tones.length > 0) {
      synth.triggerAttackRelease(tones, durSec, now);
    }

    now += durSec;
  });
}
