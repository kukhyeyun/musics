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

import { db } from "./firebase";

import Section from "./components/Section";
import PianoKeyboard from "./components/PianoKeyboard";
import InputRecord from "./components/InputRecord";
import StaffRenderer from "./StaffRenderer";
import { durationToBeats } from "./utils/measure";
import { playScoreEvents } from "./utils/playback";
import "./App.css";

function generateScoreId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "score-" + Date.now();
}

const DURATIONS = [
  { label: "온음표", value: "w" },
  { label: "2분음표", value: "h" },
  { label: "4분음표", value: "q" },
  { label: "8분음표", value: "8" },
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

  // 💥 왼손 삭제 — 항상 오른손으로 고정
  const hand = "RH";

  const [mode, setMode] = useState("single");
  const [selectedDuration, setSelectedDuration] = useState("q");
  const [selectedChordKeys, setSelectedChordKeys] = useState([]);

  const localUserId = "anonymous-user";

  useEffect(() => {
    let savedId = localStorage.getItem("currentScoreId");
    if (!savedId) {
      savedId = generateScoreId();
      localStorage.setItem("currentScoreId", savedId);
      localStorage.setItem("scoreIds", JSON.stringify([savedId]));
    }
    setCurrentScoreId(savedId);
  }, []);

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
          keys: d.keys || [],
          isRest: !!d.isRest,
          duration: d.duration,
          userId: d.userId,
          createdAt: d.createdAt,
          shiftBeats: d.shiftBeats || 0,
        });
      });
      setNotes(result);
    });

    return () => unsub();
  }, [currentScoreId]);

  const aliasMap = useAliasMap(notes);
  const timeline = useMemo(() => buildTimeline(notes), [notes]);

  const addEvent = async ({ keys, isRest, duration }) => {
    if (!currentScoreId) return;

    const totalBeat = notes.reduce(
      (acc, n) => acc + durationToBeats(n.duration),
      0
    );

    const usedInMeasure = totalBeat % 4;
    const addBeats = durationToBeats(duration);

    let shiftBeats = 0;
    if (usedInMeasure + addBeats > 4) {
      shiftBeats = 4 - usedInMeasure;
    }

    const docData = {
      scoreId: currentScoreId,
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
      alert("음표 저장 오류");
    }
  };

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
      alert("화음이 없습니다.");
      return;
    }
    addEvent({
      keys: selectedChordKeys,
      isRest: false,
      duration: selectedDuration,
    });
    setSelectedChordKeys([]);
  };

  const handleRest = (duration) => {
    addEvent({ keys: [], isRest: true, duration });
  };

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
      alert("재생 오류");
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
        <div className="header-right">🔥 자유 입력 모드</div>
      </header>

      <main className="main">
        {/* 악보 관리 */}
        <Section title="악보 관리">
          <div className="button-row">
            <button className="btn" onClick={handleNewScore}>📂 새 악보</button>
            <button className="btn" onClick={handleLoadScore}>📁 불러오기</button>
            <button className="btn secondary" onClick={handlePlay}>🎧 전체 재생</button>
          </div>
          <div>ID: {currentScoreId}</div>
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
                화음 저장
              </button>
            </div>
          )}
        </Section>

        {/* 음 길이 */}
        <Section title="길이 선택">
          <div className="button-row center">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                className={"btn small " + (selectedDuration === d.value ? "selected" : "")}
                onClick={() => setSelectedDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="sub-title">쉼표</div>
          <div className="button-row center">
            <button className="btn small" onClick={() => handleRest("q")}>4분 쉼표</button>
            <button className="btn small" onClick={() => handleRest("8")}>8분 쉼표</button>
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
        <Section title="악보">
          <StaffRenderer events={timeline} />
        </Section>

        {/* 기록 */}
        <Section title="입력 기록">
          <InputRecord events={notes} aliasMap={aliasMap} />
        </Section>
      </main>
    </div>
  );
}

export default App;
