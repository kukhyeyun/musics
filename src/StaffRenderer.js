// src/StaffRenderer.js
import React, { useEffect, useRef } from "react";
import Vex from "vexflow";

const { Renderer, Stave, StaveNote, Formatter } = Vex.Flow;

export default function StaffRenderer({ events }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // SVG 초기화
    containerRef.current.innerHTML = "";

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);

    // 오선지 전체 크기
    const width = 760;
    const height = 220;

    renderer.resize(width, height);
    const context = renderer.getContext();

    // --------------------------
    // 상단 오선(오른손)
    // --------------------------
    const trebleStave = new Stave(30, 20, width - 60);
    trebleStave.addClef("treble").addTimeSignature("4/4");
    trebleStave.setContext(context).draw();

    // --------------------------
    // 하단 오선(왼손)
    // --------------------------
    const bassStave = new Stave(30, 120, width - 60);
    bassStave.addClef("bass").addTimeSignature("4/4");
    bassStave.setContext(context).draw();

    // --------------------------
    // 이벤트 분배
    // --------------------------
    const rightEvents = events.filter((e) => e.hand === "RH");
    const leftEvents = events.filter((e) => e.hand === "LH");

    const createNotes = (evts, clef) => {
      if (!evts || evts.length === 0) return [];

      return evts.map((ev) => {
        const keys =
          ev.isRest || !ev.keys || ev.keys.length === 0
            ? clef === "treble"
              ? ["b/4"]
              : ["d/3"]
            : ev.keys;

        const duration = ev.isRest
          ? (ev.duration || "q") + "r"
          : ev.duration || "q";

        return new StaveNote({
          clef,
          keys,
          duration,
        });
      });
    };

    const trebleNotes = createNotes(rightEvents, "treble");
    const bassNotes = createNotes(leftEvents, "bass");

    if (trebleNotes.length > 0) {
      Formatter.FormatAndDraw(context, trebleStave, trebleNotes);
    }

    if (bassNotes.length > 0) {
      Formatter.FormatAndDraw(context, bassStave, bassNotes);
    }

    // --------------------------
    // 마디 구분선 (4마디 기준)
    // --------------------------
    const staveX = trebleStave.getX();
    const staveWidth = trebleStave.getWidth();

    const barXs = [
      staveX + staveWidth * 0.25,
      staveX + staveWidth * 0.5,
      staveX + staveWidth * 0.75,
    ];

    context.setLineWidth(1);
    barXs.forEach((x) => {
      context.beginPath();
      context.moveTo(x, 15); // 위 오선 조금 위
      context.lineTo(x, 205); // 아래 오선 조금 아래
      context.stroke();
    });
  }, [events]);

  return (
    <div
      className="staff-card"
      style={{
        pointerEvents: "none", // 오선지 클릭 완전 차단 (핵심)
        userSelect: "none",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        ref={containerRef}
        style={{
          pointerEvents: "none", // 내부 SVG 클릭도 완전 차단
        }}
      />
    </div>
  );
}
