import { useState, useRef } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

function generateLadder(n, rows = 10) {
  const bars = [];
  for (let r = 0; r < rows; r++) {
    const row = Array(n - 1).fill(false);
    const shuffled = Array.from({ length: n - 1 }, (_, i) => i).sort(() => Math.random() - 0.5);
    let placed = 0;
    for (const c of shuffled) {
      if (row[c - 1] || row[c + 1]) continue;
      if (Math.random() > 0.4 || placed === 0) {
        row[c] = true;
        placed++;
        if (placed >= Math.ceil((n - 1) / 2)) break;
      }
    }
    bars.push(row);
  }
  return bars;
}

// 경로를 점(x,y) 배열로 반환 — 각 꼭짓점을 명시적으로 계산
function tracePath(start, bars, n, colX, rowY, startY, endY) {
  let col = start;
  const pts = [{ x: colX(col), y: startY }];

  for (let r = 0; r < bars.length; r++) {
    const y = rowY(r);
    // 현재 col에서 y까지 수직으로
    pts.push({ x: colX(col), y });

    // 가로 막대 확인
    if (col > 0 && bars[r][col - 1]) {
      const newCol = col - 1;
      pts.push({ x: colX(newCol), y });
      col = newCol;
    } else if (col < n - 1 && bars[r][col]) {
      const newCol = col + 1;
      pts.push({ x: colX(newCol), y });
      col = newCol;
    }
  }

  // 마지막 수직
  pts.push({ x: colX(col), y: endY });
  return { pts, dest: col };
}

export default function LadderGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [prizes] = useState(() => {
    const arr = Array(n - 1).fill("☕").concat(["💰"]);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [bars] = useState(() => generateLadder(n));
  const [selected, setSelected] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0); // 0~1
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [popup, setPopup] = useState(null);
  const intervalRef = useRef(null);

  const rows = bars.length;
  const W = Math.min(320, 54 * n + 16);
  const H = 430;
  const TOP_Y = 36, BOT_Y = H - 66;
  const colX = (i) => 26 + i * ((W - 52) / Math.max(n - 1, 1));
  const rowY = (r) => TOP_Y + (r + 1) * ((BOT_Y - TOP_Y) / (rows + 1));

  const showPopup = (type, name) => {
    setPopup({ type, name });
    setTimeout(() => setPopup(null), 2400);
  };

  const revealPath = (idx) => {
    if (revealing || allResults) return;
    const { pts, dest } = tracePath(idx, bars, n, colX, rowY, TOP_Y, BOT_Y);
    setSelected(idx); setRevealing(true); setRevealProgress(0); setResult(null);

    const totalSteps = pts.length;
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setRevealProgress(step / totalSteps);
      if (step >= totalSteps) {
        clearInterval(intervalRef.current);
        setResult({ from: idx, dest, prize: prizes[dest] });
        setRevealing(false);
        showPopup(prizes[dest] === "💰" ? "money" : "coffee", participants[idx]);
      }
    }, 170);
  };

  const revealAll = () => {
    const results = participants.map((_, i) => {
      const { dest } = tracePath(i, bars, n, colX, rowY, TOP_Y, BOT_Y);
      return { from: i, dest, prize: prizes[dest] };
    });
    setAllResults(results); setSelected(null); setRevealProgress(0); setResult(null);
    const loser = results.find(r => r.prize === "💰");
    if (loser) showPopup("money", participants[loser.from]);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setSelected(null); setRevealProgress(0); setResult(null);
    setAllResults(null); setRevealing(false); setPopup(null);
  };

  // 선택된 경로의 점 배열 전체
  const selectedPts = selected !== null
    ? tracePath(selected, bars, n, colX, rowY, TOP_Y, BOT_Y).pts
    : [];

  // revealProgress에 따라 일부 점만 사용해 polyline 그리기
  const visiblePtsCount = Math.ceil(revealProgress * selectedPts.length);
  const visiblePts = selectedPts.slice(0, visiblePtsCount);

  // 끝 점 (마지막으로 그려진 위치)
  const headPt = visiblePts.length > 0 ? visiblePts[visiblePts.length - 1] : null;

  const color = selected !== null ? COLORS[selected % COLORS.length] : "#fff";

  const renderPath = (pts, c, width = 4, opacity = 1) => {
    if (pts.length < 2) return null;
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    return (
      <path key={c} d={d} stroke={c} strokeWidth={width} fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={opacity}
        style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
    );
  };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      {popup && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}>
          <div style={{ background: popup.type === "money" ? "linear-gradient(135deg,#1a1200,#2d1f00)" : "linear-gradient(135deg,#0a1a0a,#0d2b0d)", border: popup.type === "money" ? "2px solid #f97316" : "2px solid #22c55e", borderRadius: 24, padding: "28px 40px", textAlign: "center", animation: "popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: popup.type === "money" ? "0 0 60px rgba(249,115,22,0.5)" : "0 0 60px rgba(34,197,94,0.3)" }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>{popup.type === "money" ? "💰" : "☕"}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: popup.type === "money" ? "#fbbf24" : "#4ade80", marginBottom: 6 }}>{popup.name}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: popup.type === "money" ? "#f97316" : "#86efac" }}>
              {popup.type === "money" ? "지갑 여는 날이에요! 당첨! 🎉" : "커피 획득! ☕"}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 12, color: "#777", textAlign: "center" }}>
          이름 클릭 → 사다리 타기<br/>
          <span style={{ color: "#f97316" }}>💰 당첨자가 커피를 쏩니다</span>
        </div>

        <svg width={W} height={H} style={{ overflow: "visible" }}>
          {/* 세로 레일 */}
          {participants.map((_, i) => (
            <line key={i} x1={colX(i)} y1={TOP_Y} x2={colX(i)} y2={BOT_Y}
              stroke={selected === i ? `${COLORS[i % COLORS.length]}55` : "rgba(255,255,255,0.18)"}
              strokeWidth={2} />
          ))}

          {/* 가로 막대 */}
          {bars.map((row, ri) => row.map((has, ci) => has ? (
            <line key={`${ri}-${ci}`} x1={colX(ci)} y1={rowY(ri)} x2={colX(ci + 1)} y2={rowY(ri)}
              stroke="rgba(255,255,255,0.3)" strokeWidth={3} strokeLinecap="round" />
          ) : null))}

          {/* 전체 공개 경로들 */}
          {allResults && allResults.map((res, ri) => {
            const { pts } = tracePath(res.from, bars, n, colX, rowY, TOP_Y, BOT_Y);
            return renderPath(pts, COLORS[ri % COLORS.length], 3, 0.75);
          })}

          {/* 진행 중인 경로 */}
          {selected !== null && renderPath(visiblePts, color, 4)}

          {/* 경로 끝 이동 점 */}
          {headPt && !result && (
            <circle cx={headPt.x} cy={headPt.y} r={6} fill={color}
              style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
          )}

          {/* 상단 이름 버튼 */}
          {participants.map((name, i) => (
            <g key={i} onClick={() => !revealing && !allResults && revealPath(i)}
              style={{ cursor: revealing || allResults ? "default" : "pointer" }}>
              <rect x={colX(i) - 24} y={2} width={48} height={28} rx={8}
                fill={selected === i ? COLORS[i % COLORS.length] : allResults ? `${COLORS[i % COLORS.length]}44` : "rgba(255,255,255,0.08)"} />
              <text x={colX(i)} y={20} textAnchor="middle"
                fill={selected === i ? "#fff" : "#ccc"}
                fontSize={n > 5 ? 9 : 11} fontWeight="700" fontFamily="'Pretendard',sans-serif">
                {name.length > 4 ? name.slice(0, 4) : name}
              </text>
            </g>
          ))}

          {/* 하단 결과 */}
          {prizes.map((prize, i) => {
            const arrived = allResults
              ? allResults.find(r => r.dest === i)
              : result && result.dest === i ? result : null;
            const isMoney = prize === "💰";
            return (
              <g key={i}>
                <rect x={colX(i) - 24} y={H - 62} width={48} height={28} rx={8}
                  fill={arrived ? (isMoney ? "rgba(249,115,22,0.3)" : "rgba(34,197,94,0.15)") : "rgba(255,255,255,0.05)"}
                  stroke={arrived ? (isMoney ? "#f97316" : "#22c55e") : "transparent"}
                  strokeWidth={1.5} />
                <text x={colX(i)} y={H - 43} textAnchor="middle" fontSize={15}
                  fontFamily="'Pretendard',sans-serif">{prize}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          {!allResults && (
            <button onClick={revealAll} disabled={revealing}
              style={{ flex: 1, background: revealing ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 14, padding: "13px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: revealing ? "not-allowed" : "pointer" }}>
              전체 공개
            </button>
          )}
          <button onClick={reset}
            style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            새 사다리
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding: "24px 20px 0", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`
        @keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes popupIn { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
