import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

function generateLadder(n, rows = 8) {
  // Each row: array of booleans — true means horizontal bar between col i and i+1
  const bars = [];
  for (let r = 0; r < rows; r++) {
    const row = Array(n - 1).fill(false);
    for (let c = 0; c < n - 1; c++) {
      if (!row[c - 1]) row[c] = Math.random() > 0.5;
    }
    bars.push(row);
  }
  return bars;
}

function tracePath(start, bars, n) {
  let col = start;
  const rows = bars.length;
  const path = [{ col, row: -1 }];
  for (let r = 0; r < rows; r++) {
    // Check left
    if (col > 0 && bars[r][col - 1]) { col--; }
    // Check right
    else if (col < n - 1 && bars[r][col]) { col++; }
    path.push({ col, row: r });
  }
  return { path, dest: col };
}

export default function LadderGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const prizes = [...participants]; // destinations = same names shuffled
  const [bars] = useState(() => generateLadder(n));
  const [selected, setSelected] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealedPath, setRevealedPath] = useState([]);
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);

  const W = Math.min(320, 40 * n + 40);
  const H = 380;
  const rows = bars.length;
  const colX = (i) => 20 + i * ((W - 40) / (n - 1));
  const rowY = (r) => 30 + r * ((H - 90) / (rows - 1));

  const revealPath = (idx) => {
    if (revealing) return;
    const { path, dest } = tracePath(idx, bars, n);
    setSelected(idx);
    setRevealing(true);
    setRevealedPath([]);
    setResult(null);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setRevealedPath(path.slice(0, step + 1));
      if (step >= path.length - 1) {
        clearInterval(interval);
        setResult({ from: idx, dest, name: participants[dest] });
        setRevealing(false);
      }
    }, 120);
  };

  const revealAll = () => {
    const results = participants.map((_, i) => {
      const { dest } = tracePath(i, bars, n);
      return { from: i, dest, name: participants[dest] };
    });
    setAllResults(results);
    setSelected(null);
    setRevealedPath([]);
    setResult(null);
  };

  const reset = () => { setSelected(null); setRevealedPath([]); setResult(null); setAllResults(null); setRevealing(false); };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>이름을 클릭하면 사다리를 타요!</div>

        {/* SVG Ladder */}
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          {/* Vertical rails */}
          {participants.map((_, i) => (
            <line key={i} x1={colX(i)} y1={30} x2={colX(i)} y2={H - 50} stroke={selected === i ? COLORS[i % COLORS.length] : "rgba(255,255,255,0.2)"} strokeWidth={selected === i ? 3 : 2} />
          ))}

          {/* Horizontal bars */}
          {bars.map((row, ri) =>
            row.map((has, ci) => has ? (
              <line key={`${ri}-${ci}`} x1={colX(ci)} y1={rowY(ri)} x2={colX(ci + 1)} y2={rowY(ri)} stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round" />
            ) : null)
          )}

          {/* Revealed path */}
          {revealedPath.length > 1 && revealedPath.slice(1).map((pt, i) => {
            const prev = revealedPath[i];
            const x1 = colX(prev.col), y1 = prev.row === -1 ? 30 : rowY(prev.row);
            const x2 = colX(pt.col), y2 = pt.row === -1 ? 30 : rowY(pt.row);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS[selected % COLORS.length]} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${COLORS[selected % COLORS.length]})` }} />;
          })}

          {/* Top names */}
          {participants.map((name, i) => (
            <g key={i} onClick={() => !revealing && !allResults && revealPath(i)} style={{ cursor: revealing || allResults ? "default" : "pointer" }}>
              <rect x={colX(i) - 22} y={0} width={44} height={26} rx={8} fill={selected === i ? COLORS[i % COLORS.length] : "rgba(255,255,255,0.09)"} />
              <text x={colX(i)} y={17} textAnchor="middle" fill={selected === i ? "#fff" : "#ccc"} fontSize={n > 5 ? 9 : 11} fontWeight="700" fontFamily="'Pretendard','Apple SD Gothic Neo',sans-serif">{name.length > 4 ? name.slice(0, 4) : name}</text>
            </g>
          ))}

          {/* Bottom destinations */}
          {participants.map((name, i) => {
            const arrived = allResults ? allResults.find(r => r.dest === i) : (result && result.dest === i ? result : null);
            return (
              <g key={i}>
                <rect x={colX(i) - 22} y={H - 48} width={44} height={26} rx={8} fill={arrived ? COLORS[arrived.from % COLORS.length] + "44" : "rgba(255,255,255,0.07)"} stroke={arrived ? COLORS[arrived.from % COLORS.length] : "transparent"} strokeWidth={1.5} />
                <text x={colX(i)} y={H - 30} textAnchor="middle" fill={arrived ? COLORS[arrived.from % COLORS.length] : "#666"} fontSize={n > 5 ? 9 : 11} fontWeight="700" fontFamily="'Pretendard','Apple SD Gothic Neo',sans-serif">{name.length > 4 ? name.slice(0, 4) : name}</text>
              </g>
            );
          })}
        </svg>

        {result && !allResults && (
          <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{participants[result.from]} → {result.name}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>도착!</div>
          </div>
        )}

        {allResults && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, animation: "popIn 0.3s ease" }}>
            {allResults.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", background: `${COLORS[r.from % COLORS.length]}18`, border: `1px solid ${COLORS[r.from % COLORS.length]}44`, borderRadius: 12, padding: "8px 14px" }}>
                <span style={{ color: COLORS[r.from % COLORS.length], fontWeight: 700 }}>{participants[r.from]}</span>
                <span style={{ color: "#888" }}>→</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}

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
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
    </div>
  );
}
