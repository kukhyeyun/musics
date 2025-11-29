// src/utils/measure.js

export function durationToBeats(duration) {
  switch (duration) {
    case "w": return 4;
    case "h": return 2;
    case "q": return 1;
    case "8": return 0.5;
    default: return 1;
  }
}

export function calculateMeasureIndex(totalBeats) {
  return Math.floor(totalBeats / 4);
}
