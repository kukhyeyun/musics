// src/components/InputRecord.js
import React from "react";

function vexToLabel(key) {
  if (!key) return "";
  const [letterPart, octaveStr] = key.split("/");
  if (!octaveStr) return key;
  return `${letterPart.toUpperCase()}${octaveStr}`;
}

const HAND_LABEL = {
  RH: "오른손",
  LH: "왼손",
};

export default function InputRecord({ events, aliasMap }) {
  const lastEvents = [...events].slice(-10).reverse();

  return (
    <div className="record-card">
      {lastEvents.length === 0 && (
        <div className="record-row empty">아직 입력된 음이 없습니다.</div>
      )}
      {lastEvents.map((ev) => {
        let text;
        if (ev.isRest) {
          text = `${ev.duration === "8" ? "8분" : "4분"} 쉼표`;
        } else {
          const labels = (ev.keys || []).map(vexToLabel);
          text = labels.join(" + ");
        }

        const handLabel = HAND_LABEL[ev.hand] || "";
        const userLabel = aliasMap[ev.userId] || "Unknown";

        return (
          <div key={ev.id} className="record-row">
            <span className="record-notes">
              {text} {handLabel && `(${handLabel})`}
            </span>
            <span className="record-user">— {userLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
