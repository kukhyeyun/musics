// src/StaffRenderer.js
import React, { useEffect, useRef } from "react";
import Vex from "vexflow";

const { Renderer, Stave, StaveNote, Formatter } = Vex.Flow;

export default function StaffRenderer({ events }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(800, 200);
    const context = renderer.getContext();

    const stave = new Stave(10, 20, 760);
    stave.addClef("treble");
    stave.setContext(context).draw();

    const vexNotes = [];

    events.forEach((ev) => {
      const duration = ev.duration || "q";

      if (ev.isRest) {
        vexNotes.push(
          new StaveNote({
            keys: ["b/4"],     // 쉼표 안전 키
            duration: duration + "r",
          })
        );
        return;
      }

      if (!ev.keys || ev.keys.length === 0) return;

      const vKeys = ev.keys.map((k) => {
        const [letter, octave] = k.split("/");
        return `${letter.toLowerCase()}/${octave}`;
      });

      vexNotes.push(
        new StaveNote({
          keys: vKeys,
          duration: duration,
        })
      );
    });

    if (vexNotes.length > 0) {
      Formatter.FormatAndDraw(context, stave, vexNotes);
    }
  }, [events]);

  return <div ref={containerRef}></div>;
}
