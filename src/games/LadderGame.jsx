import { useState, useRef } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

function generateLadder(n, rows = 12) {
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

// 점(x,y) 배열로 전체 경로 반환. 핵심: 수직 이동은 반드시 현재 col만 사용
function tracePath(startCol, bars, n, colX, rowY, topY, botY) {
  let col = startCol;
  // 시작점
  const pts = [{ x: colX(col), y: topY }];

  for (let r = 0; r < bars.length; r++) {
    const y = rowY(r);
    // 이전 점과 x가 같으면 수직으로 내려옴
    pts.push({ x: colX(col), y });

    // 가로 막대 이동
    if (col > 0 && bars[r][col - 1]) {
      col = col - 1;
      pts.push({ x: colX(col), y });
    } else if (col < n - 1 && bars[r][col]) {
      col = col + 1;
      pts.push({ x: colX(col), y });
    }
  }
  pts.push({ x: colX(col), y: botY });
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
  const [revealPts, setRevealPts] = useState([]); // 현재까지 표시된 점들
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [popup, setPopup] = useState(null);
  const intervalRef = useRef(null);

  const rows = bars.length;
  const W = Math.min(320, 54 * n + 20);
  const H = 460;
  const TOP_Y = 36;
  const BOT_Y = H - 64;
  // 가려지는 구간
  const HIDE_TOP = TOP_Y + (BOT_Y - TOP_Y) * 0.22;
  const HIDE_BOT = TOP_Y + (BOT_Y - TOP_Y) * 0.78;

  const colX = (i) => 26 + i * ((W - 52) / Math.max(n - 1, 1));
  const rowY = (r) => TOP_Y + (r + 1) * ((BOT_Y - TOP_Y) / (rows + 1));

  const showPopup = (type, name) => {
    setPopup({ type, name });
    setTimeout(() => setPopup(null), 2400);
  };

  const revealPath = (idx) => {
    if (revealing || allResults) return;
    const { pts, dest } = tracePath(idx, bars, n, colX, rowY, TOP_Y, BOT_Y);
    setSelected(idx); setRevealing(true); setRevealPts([]); setResult(null);

    let step = 1;
    intervalRef.current = setInterval(() => {
      setRevealPts(pts.slice(0, step + 1));
      step++;
      if (step >= pts.length) {
        clearInterval(intervalRef.current);
        setResult({ from: idx, dest, prize: prizes[dest] });
        setRevealing(false);
        showPopup(prizes[dest] === "💰" ? "money" : "coffee", participants[idx]);
      }
    }, 150);
  };

  const revealAll = () => {
    const results = participants.map((_, i) => {
      const { dest } = tracePath(i, bars, n, colX, rowY, TOP_Y, BOT_Y);
      return { from: i, dest, prize: prizes[dest] };
    });
    setAllResults(results); setSelected(null); setRevealPts([]); setResult(null);
    const loser = results.find(r => r.prize === "💰");
    if (loser) showPopup("money", participants[loser.from]);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setSelected(null); setRevealPts([]); setResult(null);
    setAllResults(null); setRevealing(false); setPopup(null);
  };

  const ptsToD = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const selectedColor = selected !== null ? COLORS[selected % COLORS.length] : "#fff";

  // 헤드 포인트 (경로 끝)
  const headPt = revealPts.length > 0 ? revealPts[revealPts.length - 1] : null;

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      {/* Popup */}
      {popup && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, pointerEvents:"none" }}>
          <div style={{ background: popup.type==="money" ? "linear-gradient(135deg,#1a1200,#2d1f00)" : "linear-gradient(135deg,#0a1a0a,#0d2b0d)", border: popup.type==="money" ? "2px solid #f97316" : "2px solid #22c55e", borderRadius:24, padding:"28px 40px", textAlign:"center", animation:"popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: popup.type==="money" ? "0 0 60px rgba(249,115,22,0.5)" : "0 0 60px rgba(34,197,94,0.3)" }}>
            <div style={{ fontSize:52, marginBottom:10 }}>{popup.type==="money" ? "💰" : "☕"}</div>
            <div style={{ fontSize:24, fontWeight:900, color: popup.type==="money" ? "#fbbf24" : "#4ade80", marginBottom:6 }}>{popup.name}</div>
            <div style={{ fontSize:17, fontWeight:700, color: popup.type==="money" ? "#f97316" : "#86efac" }}>
              {popup.type==="money" ? "지갑 여는 날이에요! 당첨! 🎉" : "커피 획득! ☕"}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>

        {/* 안내 — 눈에 잘 띄게 */}
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"9px 18px", textAlign:"center" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#e2e8f0", letterSpacing:"0.01em" }}>
            👆 이름 클릭 → 사다리 타기
          </div>
          <div style={{ fontSize:12, color:"#f97316", fontWeight:700, marginTop:3 }}>
            💰 당첨자가 커피를 쏩니다
          </div>
        </div>

        <svg width={W} height={H} style={{ overflow:"visible" }}>
          <defs>
            {/* 중단부 가리는 클리핑 — 상단+하단만 보임 */}
            <clipPath id="showTopBot">
              <rect x={0} y={0} width={W} height={HIDE_TOP} />
              <rect x={0} y={HIDE_BOT} width={W} height={H - HIDE_BOT} />
            </clipPath>
            {/* 중단부 클리핑 */}
            <clipPath id="showMiddle">
              <rect x={0} y={HIDE_TOP} width={W} height={HIDE_BOT - HIDE_TOP} />
            </clipPath>
          </defs>

          {/* ── 중단부 물음표 박스 ── */}
          <rect x={4} y={HIDE_TOP} width={W - 8} height={HIDE_BOT - HIDE_TOP} rx={12}
            fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} strokeDasharray="6,4" />
          <text x={W/2} y={(HIDE_TOP+HIDE_BOT)/2 - 14} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={32} fontFamily="sans-serif">?</text>
          <text x={W/2} y={(HIDE_TOP+HIDE_BOT)/2 + 14} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize={11} fontFamily="'Pretendard',sans-serif">숨겨진 구간</text>

          {/* ── 상단+하단 레일 (보임) ── */}
          <g clipPath="url(#showTopBot)">
            {participants.map((_, i) => (
              <line key={i} x1={colX(i)} y1={TOP_Y} x2={colX(i)} y2={BOT_Y}
                stroke={selected===i ? `${COLORS[i%COLORS.length]}55` : "rgba(255,255,255,0.2)"} strokeWidth={2} />
            ))}
            {bars.map((row, ri) => row.map((has, ci) => has ? (
              <line key={`${ri}-${ci}`} x1={colX(ci)} y1={rowY(ri)} x2={colX(ci+1)} y2={rowY(ri)}
                stroke="rgba(255,255,255,0.32)" strokeWidth={3} strokeLinecap="round" />
            ) : null))}
          </g>

          {/* ── 전체 공개 경로 (상단+하단만) ── */}
          {allResults && (
            <g clipPath="url(#showTopBot)">
              {allResults.map((res, ri) => {
                const { pts } = tracePath(res.from, bars, n, colX, rowY, TOP_Y, BOT_Y);
                if (pts.length < 2) return null;
                return <path key={ri} d={ptsToD(pts)} stroke={COLORS[ri%COLORS.length]} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />;
              })}
            </g>
          )}

          {/* ── 선택 경로 진행 (상단+하단만, 중단 숨김) ── */}
          {selected !== null && revealPts.length >= 2 && (
            <g clipPath="url(#showTopBot)">
              <path d={ptsToD(revealPts)} stroke={selectedColor} strokeWidth={4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter:`drop-shadow(0 0 5px ${selectedColor})` }} />
            </g>
          )}

          {/* ── 이동 헤드 포인트 ── */}
          {headPt && !result && (
            <circle cx={headPt.x} cy={headPt.y} r={6} fill={selectedColor}
              style={{ filter:`drop-shadow(0 0 8px ${selectedColor})` }} />
          )}

          {/* ── 상단 이름 버튼 ── */}
          {participants.map((name, i) => (
            <g key={i} onClick={() => !revealing && !allResults && revealPath(i)}
              style={{ cursor: revealing||allResults ? "default" : "pointer" }}>
              <rect x={colX(i)-24} y={2} width={48} height={28} rx={8}
                fill={selected===i ? COLORS[i%COLORS.length] : allResults ? `${COLORS[i%COLORS.length]}44` : "rgba(255,255,255,0.09)"}
                stroke={selected===i ? "none" : "rgba(255,255,255,0.12)"} strokeWidth={1} />
              <text x={colX(i)} y={20} textAnchor="middle" fill={selected===i?"#fff":"#ccc"}
                fontSize={n>5?9:11} fontWeight="700" fontFamily="'Pretendard',sans-serif">
                {name.length>4 ? name.slice(0,4) : name}
              </text>
            </g>
          ))}

          {/* ── 하단 결과 ── */}
          {prizes.map((prize, i) => {
            const arrived = allResults
              ? allResults.find(r => r.dest===i)
              : result && result.dest===i ? result : null;
            const isMoney = prize === "💰";
            return (
              <g key={i}>
                <rect x={colX(i)-24} y={H-60} width={48} height={28} rx={8}
                  fill={arrived ? (isMoney?"rgba(249,115,22,0.3)":"rgba(34,197,94,0.15)") : "rgba(255,255,255,0.05)"}
                  stroke={arrived ? (isMoney?"#f97316":"#22c55e") : "transparent"} strokeWidth={1.5} />
                <text x={colX(i)} y={H-40} textAnchor="middle" fontSize={15} fontFamily="'Pretendard',sans-serif">{prize}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ display:"flex", gap:10, width:"100%" }}>
          {!allResults && (
            <button onClick={revealAll} disabled={revealing}
              style={{ flex:1, background: revealing?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:14, padding:"13px", color:"#fff", fontSize:14, fontWeight:700, cursor: revealing?"not-allowed":"pointer" }}>
              전체 공개
            </button>
          )}
          <button onClick={reset}
            style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"13px", color:"#ccc", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            새 사다리
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding:"24px 20px 0", position:"relative" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#777", fontSize:14, cursor:"pointer", padding:0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, padding:"6px 12px", color:"#aaa", fontSize:13, cursor:"pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ fontSize:32, marginBottom:4 }}>{bet.emoji}</div>
        <div style={{ fontSize:20, fontWeight:900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`
        @keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes popupIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  );
}
