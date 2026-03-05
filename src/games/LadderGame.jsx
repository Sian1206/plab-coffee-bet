import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

// 최소 1개 이상의 가로 막대가 반드시 있도록, 그리고 연속 안되게
function generateLadder(n, rows = 10) {
  const bars = [];
  for (let r = 0; r < rows; r++) {
    const row = Array(n - 1).fill(false);
    // shuffle columns to ensure some bars per row
    const shuffled = Array.from({length: n-1}, (_,i) => i).sort(() => Math.random()-0.5);
    let placed = 0;
    for (const c of shuffled) {
      if (row[c-1] || row[c+1]) continue; // no adjacent
      if (Math.random() > 0.38 || placed === 0) {
        row[c] = true;
        placed++;
        if (placed >= Math.ceil((n-1)/2)) break;
      }
    }
    bars.push(row);
  }
  return bars;
}

// 경로 추적 — 세그먼트 단위로 분해 (수직 이동 + 수평 이동)
function traceSegments(start, bars, n) {
  let col = start;
  const segments = []; // {type:"v"|"h", col, row, fromCol, toCol}

  for (let r = 0; r < bars.length; r++) {
    // 수직 이동
    segments.push({ type: "v", col, row: r });

    // 수평 이동 확인
    if (col > 0 && bars[r][col - 1]) {
      segments.push({ type: "h", fromCol: col - 1, toCol: col, row: r, dir: -1 });
      col = col - 1;
    } else if (col < n - 1 && bars[r][col]) {
      segments.push({ type: "h", fromCol: col, toCol: col + 1, row: r, dir: 1 });
      col = col + 1;
    }
  }
  segments.push({ type: "v", col, row: bars.length }); // final descent
  return { segments, dest: col };
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
  const [drawnSegs, setDrawnSegs] = useState([]); // revealed segments so far
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [popup, setPopup] = useState(null); // {type:"coffee"|"money", name}

  const rows = bars.length;
  const W = Math.min(320, 50 * n + 20);
  const H = 420;
  const colX = (i) => 26 + i * ((W - 52) / Math.max(n - 1, 1));
  const rowY = (r) => 38 + r * ((H - 115) / rows);

  const showPopup = (type, name) => {
    setPopup({ type, name });
    setTimeout(() => setPopup(null), 2200);
  };

  const revealPath = (idx) => {
    if (revealing || allResults) return;
    const { segments, dest } = traceSegments(idx, bars, n);
    setSelected(idx); setRevealing(true); setDrawnSegs([]); setResult(null);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDrawnSegs(segments.slice(0, step));
      if (step >= segments.length) {
        clearInterval(interval);
        const prize = prizes[dest];
        setResult({ from: idx, dest, prize });
        setRevealing(false);
        showPopup(prize === "💰" ? "money" : "coffee", participants[idx]);
      }
    }, 160);
  };

  const revealAll = () => {
    const results = participants.map((_, i) => {
      const { dest } = traceSegments(i, bars, n);
      return { from: i, dest, prize: prizes[dest] };
    });
    setAllResults(results); setSelected(null); setDrawnSegs([]); setResult(null);
    const loser = results.find(r => r.prize === "💰");
    if (loser) showPopup("money", participants[loser.from]);
  };

  const reset = () => { setSelected(null); setDrawnSegs([]); setResult(null); setAllResults(null); setRevealing(false); setPopup(null); };
  const loser = allResults ? allResults.find(r => r.prize === "💰") : null;

  // Compute path lines from drawn segments
  const pathLines = [];
  for (let i = 0; i < drawnSegs.length; i++) {
    const seg = drawnSegs[i];
    if (seg.type === "v") {
      const x = colX(seg.col);
      const y1 = seg.row === 0 ? 38 : rowY(seg.row - 1) + (rowY(1) - rowY(0)) * 0;
      // vertical: from previous row to this row
      const prevSeg = drawnSegs[i - 1];
      const y0 = prevSeg ? (prevSeg.type === "h" ? rowY(prevSeg.row) : rowY(seg.row - 1)) : 38;
      const y2 = seg.row >= rows ? H - 68 : rowY(seg.row);
      pathLines.push({ x1: x, y1: y0, x2: x, y2: y2 });
    } else {
      const x1 = colX(seg.fromCol), x2 = colX(seg.toCol);
      const y = rowY(seg.row);
      pathLines.push({ x1, y1: y, x2, y2: y });
    }
  }

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      {/* Popup overlay */}
      {popup && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}>
          <div style={{ background: popup.type === "money" ? "linear-gradient(135deg,#1a1200,#2d1f00)" : "linear-gradient(135deg,#0a1a0a,#0d2b0d)", border: popup.type === "money" ? "2px solid #f97316" : "2px solid #22c55e", borderRadius: 24, padding: "28px 40px", textAlign: "center", animation: "popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: popup.type === "money" ? "0 0 60px rgba(249,115,22,0.4)" : "0 0 60px rgba(34,197,94,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{popup.type === "money" ? "💰" : "☕"}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: popup.type === "money" ? "#fbbf24" : "#4ade80", marginBottom: 4 }}>{popup.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: popup.type === "money" ? "#f97316" : "#86efac" }}>
              {popup.type === "money" ? "지갑 여는 날이에요! 당첨! 🎉" : "커피 획득! ☕"}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#777", textAlign: "center" }}>이름 클릭 → 사다리 타기<br/><span style={{ color: "#f97316" }}>💰 당첨자가 커피를 쏩니다</span></div>

        <svg width={W} height={H} style={{ overflow: "visible" }}>
          {/* Vertical rails */}
          {participants.map((_, i) => (
            <line key={i} x1={colX(i)} y1={38} x2={colX(i)} y2={H - 68}
              stroke={selected === i ? COLORS[i%COLORS.length] : "rgba(255,255,255,0.18)"} strokeWidth={selected === i ? 2.5 : 2} />
          ))}

          {/* Horizontal bars */}
          {bars.map((row, ri) => row.map((has, ci) => has ? (
            <line key={`${ri}-${ci}`} x1={colX(ci)} y1={rowY(ri)} x2={colX(ci+1)} y2={rowY(ri)}
              stroke="rgba(255,255,255,0.3)" strokeWidth={3} strokeLinecap="round" />
          ) : null))}

          {/* Revealed path — proper step-by-step */}
          {selected !== null && drawnSegs.map((seg, i) => {
            const color = COLORS[selected % COLORS.length];
            if (seg.type === "v") {
              const x = colX(seg.col);
              const prevH = drawnSegs.slice(0, i).reverse().find(s => s.type === "h");
              const y1 = i === 0 ? 38 : prevH ? rowY(prevH.row) : rowY(seg.row - 1 < 0 ? 0 : seg.row - 1);
              const y2 = seg.row >= rows ? H - 68 : rowY(seg.row);
              return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />;
            } else {
              const x1 = colX(seg.fromCol), x2 = colX(seg.toCol), y = rowY(seg.row);
              return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />;
            }
          })}

          {/* All results paths */}
          {allResults && allResults.map((res, ri) => {
            const { segments } = traceSegments(res.from, bars, n);
            const color = COLORS[ri % COLORS.length];
            return segments.map((seg, i) => {
              if (seg.type === "v") {
                const x = colX(seg.col);
                const prevH = segments.slice(0, i).reverse().find(s => s.type === "h");
                const y1 = i === 0 ? 38 : prevH ? rowY(prevH.row) : rowY(seg.row - 1 < 0 ? 0 : seg.row - 1);
                const y2 = seg.row >= rows ? H - 68 : rowY(seg.row);
                return <line key={`${ri}-${i}`} x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
              } else {
                return <line key={`${ri}-${i}`} x1={colX(seg.fromCol)} y1={rowY(seg.row)} x2={colX(seg.toCol)} y2={rowY(seg.row)} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
              }
            });
          })}

          {/* Top names */}
          {participants.map((name, i) => (
            <g key={i} onClick={() => !revealing && !allResults && revealPath(i)} style={{ cursor: revealing || allResults ? "default" : "pointer" }}>
              <rect x={colX(i)-24} y={2} width={48} height={28} rx={8}
                fill={selected === i ? COLORS[i%COLORS.length] : allResults ? `${COLORS[i%COLORS.length]}44` : "rgba(255,255,255,0.08)"} />
              <text x={colX(i)} y={20} textAnchor="middle" fill={selected===i?"#fff":"#ccc"}
                fontSize={n>5?9:11} fontWeight="700" fontFamily="'Pretendard',sans-serif">
                {name.length > 4 ? name.slice(0,4) : name}
              </text>
            </g>
          ))}

          {/* Bottom prizes */}
          {prizes.map((prize, i) => {
            const arrived = allResults ? allResults.find(r => r.dest === i) : (result && result.dest === i ? result : null);
            const isMoney = prize === "💰";
            return (
              <g key={i}>
                <rect x={colX(i)-24} y={H-64} width={48} height={28} rx={8}
                  fill={arrived ? (isMoney ? "rgba(249,115,22,0.3)" : "rgba(34,197,94,0.15)") : "rgba(255,255,255,0.05)"}
                  stroke={arrived ? (isMoney ? "#f97316" : "#22c55e") : "transparent"} strokeWidth={1.5} />
                <text x={colX(i)} y={H-45} textAnchor="middle" fontSize={14} fontFamily="'Pretendard',sans-serif">{prize}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          {!allResults && (
            <button onClick={revealAll} disabled={revealing} style={{ flex: 1, background: revealing ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 14, padding: "13px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: revealing ? "not-allowed" : "pointer" }}>
              전체 공개
            </button>
          )}
          <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
        @keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes popupIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  );
}
