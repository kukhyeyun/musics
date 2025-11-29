// src/utils/measure.js

// duration 문자열을 4/4 기준 "박자 수"로 변환
// w = 온음(4), h = 2분(2), q = 4분(1), 8 = 8분(0.5)
export function durationToBeats(duration) {
  switch (duration) {
    case "w":
      return 4;
    case "h":
      return 2;
    case "q":
      return 1;
    case "8":
      return 0.5;
    default:
      return 1;
  }
}

// 각 음표가 몇 번째 마디에 속하는지 계산 (0번 마디부터 시작)
// notes: [{ duration: "q", ... }, ...]
export function calculateMeasureIndex(notes) {
  let beatSum = 0;
  const measures = [];

  notes.forEach((n) => {
    const b = durationToBeats(n.duration);
    beatSum += b;
    const m = Math.floor((beatSum - 0.0001) / 4); // 4/4, 한 마디 = 4박
    measures.push(m);
  });

  return measures; // 예: [0,0,0,1,1,...]
}
