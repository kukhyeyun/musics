// src/App.js
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "./firebase"; // 로그인 제거 → auth 불필요

import Section from "./components/Section";
import PianoKeyboard from "./components/PianoKeyboard";
import InputRecord from "./components/InputRecord";
import StaffRenderer from "./StaffRenderer";
import { calculateMeasureIndex, durationToBeats } from "./utils/measure";
import { playScoreEvents } from "./utils/playback";
import "./App.css";

function generateScoreId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "score-" + Date.now();
}

const DURATIONS = [
  { label: "온음표", value: "w" }, // 4박
  { label: "2분음표", value: "h" }, // 2박
  { label: "4분음표", value: "q" }, // 1박
  { label: "8분음표", value: "8" }, // 0.5박
];

function useAliasMap(notes) {
  return useMemo(() => {
    const map = {};
    let idx = 1;
    notes.forEach((n) => {
      if (n.userId && !map[n.userId]) {
        map[n.userId] = `User #${idx++}`;
      }
    });
    return map;
  }, [notes]);
}

function buildTimeline(notes) {
  let beat = 0;
  return notes.map((n) => {
    const beats = durationToBeats(n.duration);

    if (n.shiftBeats) beat += n.shiftBeats;

    const ev = {
      ...n,
      isRest: !!n.isRest,
      durationBeats: beats,
      startBeat: beat,
    };

    beat += beats;
    return ev;
  });
}

function App() {
  const [currentScoreId, setCurrentScoreId] = useState(null);
  const [notes, setNotes] = useState([]);

  const [hand, setHand] = useState("RH"); // 오른손 / 왼손
  const [mode, setMode] = useState("single"); // 단일음 / 화음
  const [selectedDuration, setSelectedDuration] = useState("q");
  const [selectedChordKeys, setSelectedChordKeys] = useState([]);

  // ❗ 사용자 제거 ⇒ 익명 사용자 ID 하나 고정
  const localUserId = "anonymous-user";

  // scoreId 초기화
  useEffect(() => {
    let savedId = localStorage.getItem("currentScoreId");
    if (!savedId) {
      savedId = generateScoreId();
      localStorage.setItem("currentScoreId", savedId);
      localStorage.setItem("scoreIds", JSON.stringify([savedId]));
    }
    setCurrentScoreId(savedId);
  }, []);

  // Firestore notes 구독
  useEffect(() => {
    if (!currentScoreId) return;

    const qNotes = query(
      collection(db, "notes"),
      where("scoreId", "==", currentScoreId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(qNotes, (snap) => {
      const result = [];
      snap.forEach((doc) => {
        const d = doc.data();
        result.push({
          id: doc.id,
          scoreId: d.scoreId,
          hand: d.hand,
          keys: d.keys || [],
          isRest: !!d.isRest,
          duration: d.duration,
          userId: d.userId,
          shiftBeats: d.shiftBeats || 0,
        });
      });
      setNotes(result);
    });

    return () => unsub();
  }, [currentScoreId]);

  const aliasMap = useAliasMap(notes);
  const timeline = useMemo(() => buildTimeline(notes), [notes]);

  // 🔥 자동 마디 넘김 포함 addEvent
  const addEvent = async ({ keys, isRest, duration }) => {
    if (!currentScoreId) {
      alert("악보 ID가 아직 초기화되지 않았습니다.");
      return;
    }

    // 1) 현재까지 쌓인 전체 박자
    const totalBeat = notes.reduce(
      (acc, n) => acc + durationToBeats(n.duration),
      0
    );

    // 2) 이번 마디에서 이미 채워진 박자
    const usedInMeasure = totalBeat % 4;

    // 3) 새로 입력되는 음표의 박자
    const addBeats = durationToBeats(duration);

    // 4) 자동 마디 넘김 계산
    let shiftBeats = 0;
    if (usedInMeasure + addBeats > 4) {
      shiftBeats = 4 - usedInMeasure;
    }

    const docData = {
      scoreId: currentScoreId,
      hand,
      keys: isRest ? [] : keys,
      isRest: !!isRest,
      duration,
      userId: localUserId,
      createdAt: serverTimestamp(),
      shiftBeats,
    };

    try {
      await addDoc(collection(db, "notes"), docData);
    } catch (err) {
      console.error(err);
      alert("음표 저장 중 오류가 발생했습니다.");
    }
  };

  // 피아노 키 클릭 시
  const handleKeyClick = (keyObj) => {
    const vexKey = keyObj.vexKey;

    if (mode === "single") {
      addEvent({ keys: [vexKey], isRest: false, duration: selectedDuration });
      return;
    }

    setSelectedChordKeys((prev) =>
      prev.includes(vexKey) ? prev.filter((k) => k !== vexKey) : [...prev, vexKey]
    );
  };

  const handleSaveChord = () => {
    if (selectedChordKeys.length === 0) {
      alert("선택된 화음이 없습니다.");
      return;
    }
    addEvent({
      keys: selectedChordKeys,
      isRest: false,
      duration: selectedDuration,
    });
    setSelectedChordKeys([]);
  };

  // 쉼표 입력
  const handleRest = (duration) => {
    addEvent({ keys: [], isRest: true, duration });
  };

  // 새 악보
  const handleNewScore = () => {
    const newId = generateScoreId();
    setCurrentScoreId(newId);
    localStorage.setItem("currentScoreId", newId);

    const raw = localStorage.getItem("scoreIds");
    const arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(newId)) {
      arr.push(newId);
      localStorage.setItem("scoreIds", JSON.stringify(arr));
    }
  };

  // 악보 불러오기
  const handleLoadScore = () => {
    const raw = localStorage.getItem("scoreIds");
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.length === 0) return alert("저장된 악보가 없습니다.");
    const id = prompt("불러올 악보 ID:\n" + arr.join("\n"));
    if (id && arr.includes(id)) {
      setCurrentScoreId(id);
      localStorage.setItem("currentScoreId", id);
    }
  };

  const handlePlay = async () => {
    try {
      await playScoreEvents(notes);
    } catch (err) {
      console.error(err);
      alert("재생 중 오류가 발생했습니다.");
    }
  };

  const chordLabel =
    selectedChordKeys.length === 0
      ? "없음"
      : selectedChordKeys
          .map((k) => {
            const [l, o] = k.split("/");
            return `${l.toUpperCase()}${o}`;
          })
          .join(" + ");

  return (
    <div className="page">
      <header className="header">
        <div className="header-title">🎵 협업 작곡 웹앱 (베타)</div>

        {/* 로그인 완전 제거된 영역 */}
        <div className="header-right">🔥 자유 입력 모드</div>
      </header>

      <main className="main">
        {/* 악보 관리 */}
        <Section title="악보 관리">
          <div className="button-row">
            <button className="btn" onClick={handleNewScore}>
              📂 새 악보 만들기
            </button>
            <button className="btn" onClick={handleLoadScore}>
              📁 내 악보 불러오기
            </button>
            <button className="btn secondary" onClick={handlePlay}>
              🎧 전체 악보 재생
            </button>
          </div>
          <div>현재 작업 중인 악보: <b>무제 악보</b></div>
          <div>ID: {currentScoreId}</div>
        </Section>

        {/* 손 선택 */}
        <Section title="손 선택">
          <div className="button-row center">
            <button
              className={"btn toggle " + (hand === "RH" ? "active-right" : "")}
              onClick={() => setHand("RH")}
            >
              👉 오른손
            </button>
            <button
              className={"btn toggle " + (hand === "LH" ? "active-left" : "")}
              onClick={() => setHand("LH")}
            >
              ✋ 왼손
            </button>
          </div>
        </Section>

        {/* 입력 모드 */}
        <Section title="입력 모드">
          <div className="button-row center">
            <button
              className={"btn toggle " + (mode === "single" ? "active-right" : "")}
              onClick={() => setMode("single")}
            >
              🎵 단일음
            </button>
            <button
              className={"btn toggle " + (mode === "chord" ? "active-left" : "")}
              onClick={() => setMode("chord")}
            >
              🎵🎵 화음
            </button>
          </div>
          <div className="chord-status">
            현재 선택된 화음: <span>{chordLabel}</span>
          </div>
          {mode === "chord" && (
            <div className="button-row center">
              <button className="btn primary" onClick={handleSaveChord}>
                선택된 화음 저장
              </button>
            </div>
          )}
        </Section>

        {/* 음 길이 */}
        <Section title="음 길이 선택">
          <div className="button-row center">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                className={
                  "btn small " + (selectedDuration === d.value ? "selected" : "")
                }
                onClick={() => setSelectedDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="sub-title">쉼표 입력</div>
          <div className="button-row center">
            <button className="btn small" onClick={() => handleRest("q")}>
              🎵 4분 쉼표
            </button>
            <button className="btn small" onClick={() => handleRest("8")}>
              🎵 8분 쉼표
            </button>
          </div>
        </Section>

        {/* 피아노 */}
        <Section title="3옥타브 피아노">
          <PianoKeyboard
            mode={mode}
            selectedChordKeys={selectedChordKeys}
            onKeyClick={handleKeyClick}
          />
        </Section>

        {/* 오선지 */}
        <Section title="악보 (오선지)">
          <div className="staff-description">
            입력된 음표는 4/4 박자 기준으로 자동 정렬됩니다.
          </div>
          <StaffRenderer events={timeline} />
        </Section>

        {/* 입력 기록 */}
        <Section title="입력 기록">
          <InputRecord events={notes} aliasMap={aliasMap} />
        </Section>
      </main>
    </div>
  );
}

export default App;
