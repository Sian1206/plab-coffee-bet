import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

const DICE_DOTS = {
  1:[[50,50]],2:[[28,28],[72,72]],3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,28],[72,28],[28,50],[72,50],[28,72],[72,72]],
};

function DiceCanvas({ value, color, x, y, angle, size = 80 }) {
  const scale = size / 100;
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  return (
    <g transform={`translate(${x - size/2}, ${y - size/2}) rotate(${angle}, ${size/2}, ${size/2})`}>
      <rect x={3} y={3} width={size-6} height={size-6} rx={size*0.15}
        fill={color + "33"} stroke={color} strokeWidth={2.5}
        style={{ filter: `drop-shadow(0 0 8px ${color}88)` }} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx*scale} cy={cy*scale} r={size*0.085} fill={color} />
      ))}
    </g>
  );
}

export default function DiceGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]); // [{name, score, color}]
  const [phase, setPhase] = useState("idle"); // idle | throwing | rolling | done
  const [diceVal, setDiceVal] = useState(6);
  const [dicePos, setDicePos] = useState({ x: 160, y: 200, vx: 0, vy: 0, angle: 0, va: 0 });
  const [throwResult, setThrowResult] = useState(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const animRef = useRef(null);
  const rollIntervalRef = useRef(null);

  const AREA_W = 320, AREA_H = 320;

  const startThrow = (clientX, clientY) => {
    if (phase !== "idle") return;
    const rect = svgRef.current.getBoundingClientRect();
    dragRef.current = { startX: clientX - rect.left, startY: clientY - rect.top, time: Date.now() };
    setPhase("throwing");
    setDicePos(p => ({ ...p, x: clientX - rect.left, y: clientY - rect.top }));
  };

  const endThrow = (clientX, clientY) => {
    if (phase !== "throwing" || !dragRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ex = clientX - rect.left, ey = clientY - rect.top;
    const dt = Math.max((Date.now() - dragRef.current.time) / 1000, 0.05);
    const dx = ex - dragRef.current.startX, dy = ey - dragRef.current.startY;
    const speed = Math.sqrt(dx*dx + dy*dy) / dt;
    const vx = (dx / dt) * 0.035;
    const vy = (dy / dt) * 0.035;
    const va = (Math.random() - 0.5) * 12 * (speed / 200);

    setDicePos(p => ({ ...p, x: ex, y: ey, vx, vy, va }));
    setPhase("rolling");
    dragRef.current = null;

    // Rolling animation
    let tick = 0;
    const maxTicks = Math.floor(18 + speed / 25);
    rollIntervalRef.current = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      tick++;
      if (tick >= maxTicks) {
        clearInterval(rollIntervalRef.current);
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceVal(final);
        setThrowResult(final);
      }
    }, Math.max(35, 100 - speed / 8));
  };

  // Physics bounce
  useEffect(() => {
    if (phase !== "rolling") return;
    const loop = () => {
      setDicePos(p => {
        let { x, y, vx, vy, va, angle } = p;
        vx *= 0.92; vy *= 0.92; va *= 0.88;
        x += vx; y += vy; angle += va;
        if (x < 40) { x = 40; vx = Math.abs(vx) * 0.7; }
        if (x > AREA_W - 40) { x = AREA_W - 40; vx = -Math.abs(vx) * 0.7; }
        if (y < 40) { y = 40; vy = Math.abs(vy) * 0.7; }
        if (y > AREA_H - 40) { y = AREA_H - 40; vy = -Math.abs(vy) * 0.7; }
        return { x, y, vx, vy, angle, va };
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // Stop when result confirmed
  useEffect(() => {
    if (throwResult !== null) {
      setTimeout(() => {
        cancelAnimationFrame(animRef.current);
        const name = participants[currentIdx];
        const color = COLORS[currentIdx % COLORS.length];
        const newResults = [...results, { name, score: throwResult, color }];
        setResults(newResults);
        setThrowResult(null);
        setPhase("idle");
        setDicePos({ x: 160, y: 200, vx: 0, vy: 0, angle: 0, va: 0 });
        setDiceVal(6);
        if (currentIdx + 1 >= n) {
          setPhase("done");
        } else {
          setCurrentIdx(currentIdx + 1);
        }
      }, 800);
    }
  }, [throwResult]);

  const reset = () => {
    setCurrentIdx(0); setResults([]); setPhase("idle"); setThrowResult(null);
    setDicePos({ x: 160, y: 200, vx: 0, vy: 0, angle: 0, va: 0 }); setDiceVal(6);
    cancelAnimationFrame(animRef.current); clearInterval(rollIntervalRef.current);
  };

  const maxScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const winners = results.filter(r => r.score === maxScore);
  const currentColor = COLORS[currentIdx % COLORS.length];

  const handleMouseDown = (e) => startThrow(e.clientX, e.clientY);
  const handleMouseUp = (e) => endThrow(e.clientX, e.clientY);
  const handleTouchStart = (e) => { e.preventDefault(); startThrow(e.touches[0].clientX, e.touches[0].clientY); };
  const handleTouchEnd = (e) => { e.preventDefault(); endThrow(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

        {phase !== "done" && (
          <>
            {/* 순서 표시 */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {participants.map((name, i) => (
                <div key={i} style={{ background: i < results.length ? `${COLORS[i%COLORS.length]}33` : i === currentIdx ? `${COLORS[i%COLORS.length]}55` : "rgba(255,255,255,0.06)", border: i === currentIdx ? `1.5px solid ${COLORS[i%COLORS.length]}` : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: i === currentIdx ? COLORS[i%COLORS.length] : i < results.length ? "#555" : "#666", transition: "all 0.2s" }}>
                  {name}{i < results.length ? ` ${results[i].score}` : ""}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 14, color: currentColor, fontWeight: 700, textAlign: "center" }}>
              {phase === "rolling" || throwResult !== null ? "🎲 구르는 중..." : `${participants[currentIdx]} 차례 — 드래그해서 던지세요!`}
            </div>

            {/* Throw area */}
            <svg ref={svgRef} width={AREA_W} height={AREA_H}
              style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: `1.5px dashed ${currentColor}44`, cursor: phase === "idle" ? "grab" : "default", touchAction: "none", userSelect: "none" }}
              onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

              {/* Grid lines subtle */}
              <line x1={AREA_W/2} y1={0} x2={AREA_W/2} y2={AREA_H} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <line x1={0} y1={AREA_H/2} x2={AREA_W} y2={AREA_H/2} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

              {phase === "idle" && (
                <text x={AREA_W/2} y={AREA_H/2 + 5} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={13} fontFamily="'Pretendard',sans-serif">여기서 드래그!</text>
              )}

              <DiceCanvas value={diceVal} color={currentColor} x={dicePos.x} y={dicePos.y} angle={dicePos.angle} size={80} />
            </svg>
          </>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${r.color}18`, border: `1px solid ${r.color}44`, borderRadius: 12, padding: "8px 14px" }}>
                <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: r.color }}>{r.score}</span>
                {phase === "done" && r.score === maxScore && <span style={{ fontSize: 14 }}>🏆</span>}
              </div>
            ))}
          </div>
        )}

        {phase === "done" && (
          <div style={{ textAlign: "center", background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", borderRadius: 18, padding: "16px", width: "100%", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{winners.length > 1 ? "🤝" : "🏆"}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24" }}>{winners.map(w=>w.name).join(", ")}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{winners.length > 1 ? "동점! 다시 던져요" : `${maxScore}점으로 승리!`}</div>
          </div>
        )}

        <button onClick={reset} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "13px 32px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          🔄 다시 하기
        </button>
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>주사위 던지기</div>
      </div>
      {children}
      <style>{`@keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
