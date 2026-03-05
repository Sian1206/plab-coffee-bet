import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

// 3D CSS 주사위 face dots
const DOTS = {
  1:[[50,50]],2:[[25,25],[75,75]],3:[[25,25],[50,50],[75,75]],
  4:[[25,25],[75,25],[25,75],[75,75]],5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
  6:[[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

function Dice3D({ value, rolling, color, size = 56 }) {
  const dotR = size * 0.08;
  const Face = ({ bg, dots, transform }) => (
    <div style={{
      position: "absolute", width: size, height: size,
      background: bg || `linear-gradient(135deg, ${color}dd, ${color}88)`,
      border: `1.5px solid rgba(255,255,255,0.25)`,
      borderRadius: size * 0.14,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform, backfaceVisibility: "hidden",
      boxShadow: "inset 0 0 8px rgba(0,0,0,0.3)",
    }}>
      <svg width={size} height={size}>
        {(dots||[]).map(([cx,cy],i) => (
          <circle key={i} cx={cx/100*size} cy={cy/100*size} r={dotR} fill="rgba(255,255,255,0.92)" />
        ))}
      </svg>
    </div>
  );

  const half = size / 2;
  const anim = rolling ? `spin3d-${Math.floor(Math.random()*3)} 0.18s linear infinite` : "none";

  return (
    <div style={{ width: size, height: size, position: "relative", perspective: size * 4, perspectiveOrigin: "50% 50%" }}>
      <div style={{
        width: size, height: size, position: "relative",
        transformStyle: "preserve-3d",
        transform: rolling ? "rotateX(25deg) rotateY(25deg)" : `rotateX(-20deg) rotateY(-30deg)`,
        transition: rolling ? "none" : "transform 0.5s ease",
        animation: rolling ? `roll3d 0.22s linear infinite` : "none",
      }}>
        <Face dots={DOTS[value]||DOTS[1]} transform={`translateZ(${half}px)`} />
        <Face dots={DOTS[value===6?1:value+1]||DOTS[1]} transform={`rotateY(90deg) translateZ(${half}px)`} />
        <Face dots={DOTS[value===1?6:value-1]||DOTS[1]} transform={`rotateY(-90deg) translateZ(${half}px)`} bg={`linear-gradient(135deg,${color}bb,${color}66)`} />
        <Face dots={DOTS[7-value]||DOTS[1]} transform={`rotateY(180deg) translateZ(${half}px)`} bg={`linear-gradient(135deg,${color}99,${color}55)`} />
        <Face dots={DOTS[value<=3?value+3:value-3]||DOTS[1]} transform={`rotateX(-90deg) translateZ(${half}px)`} />
        <Face dots={DOTS[value<=3?value+3:value-3]||DOTS[1]} transform={`rotateX(90deg) translateZ(${half}px)`} bg={`linear-gradient(135deg,${color}bb,${color}66)`} />
      </div>
      <style>{`
        @keyframes roll3d {
          0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg); }
          25%  { transform: rotateX(90deg)  rotateY(45deg)  rotateZ(30deg); }
          50%  { transform: rotateX(180deg) rotateY(90deg)  rotateZ(60deg); }
          75%  { transform: rotateX(270deg) rotateY(135deg) rotateZ(90deg); }
          100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(120deg); }
        }
      `}</style>
    </div>
  );
}

export default function DiceGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [winMode, setWinMode] = useState("high"); // high=최고점 생존, low=최저점 생존
  const [phase, setPhase] = useState("setup");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [diceVals, setDiceVals] = useState([1, 6]);
  const [rolling, setRolling] = useState(false);
  const [throwDir, setThrowDir] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const rollRef = useRef(null);
  const AREA_W = 310, AREA_H = 240;
  const [dicePos, setDicePos] = useState({ x: AREA_W/2, y: AREA_H/2, vx: 0, vy: 0 });
  const animRef = useRef(null);

  const startDrag = (clientX, clientY) => {
    if (rolling || phase !== "playing") return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { sx: clientX - rect.left, sy: clientY - rect.top, t: Date.now() };
  };

  const endDrag = (clientX, clientY) => {
    if (!dragRef.current || rolling) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ex = clientX - rect.left, ey = clientY - rect.top;
    const dt = Math.max((Date.now() - dragRef.current.t) / 1000, 0.05);
    const dx = ex - dragRef.current.sx, dy = ey - dragRef.current.sy;
    const speed = Math.sqrt(dx*dx + dy*dy);
    dragRef.current = null;

    setThrowDir({ x: dx, y: dy });
    const vx = (dx / dt) * 0.04;
    const vy = (dy / dt) * 0.04;
    setDicePos({ x: ex, y: ey, vx, vy });
    doRoll(speed);
  };

  const doRoll = (speed = 100) => {
    setRolling(true);
    const ticks = Math.floor(12 + speed / 20);
    let tick = 0;
    rollRef.current = setInterval(() => {
      setDiceVals([Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]);
      tick++;
      if (tick >= ticks) {
        clearInterval(rollRef.current);
        const d1 = Math.floor(Math.random()*6)+1;
        const d2 = Math.floor(Math.random()*6)+1;
        setDiceVals([d1, d2]);
        setRolling(false);
        setTimeout(() => {
          const name = participants[currentIdx];
          const color = COLORS[currentIdx % COLORS.length];
          const newResults = [...results, { name, d1, d2, total: d1+d2, color }];
          setResults(newResults);
          setDicePos({ x: AREA_W/2, y: AREA_H/2, vx: 0, vy: 0 });
          if (currentIdx + 1 >= n) { setPhase("done"); }
          else { setCurrentIdx(currentIdx + 1); }
        }, 700);
      }
    }, Math.max(35, 110 - speed/5));
  };

  // Physics bounce for dice while rolling
  useEffect(() => {
    if (!rolling) return;
    const loop = () => {
      setDicePos(p => {
        let { x, y, vx, vy } = p;
        vx *= 0.91; vy *= 0.91;
        x += vx; y += vy;
        if (x < 35) { x = 35; vx = Math.abs(vx)*0.7; }
        if (x > AREA_W-35) { x = AREA_W-35; vx = -Math.abs(vx)*0.7; }
        if (y < 35) { y = 35; vy = Math.abs(vy)*0.7; }
        if (y > AREA_H-35) { y = AREA_H-35; vy = -Math.abs(vy)*0.7; }
        return { x, y, vx, vy };
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [rolling]);

  const reset = () => { setPhase("setup"); setCurrentIdx(0); setResults([]); setDiceVals([1,6]); setRolling(false); };

  const maxScore = results.length > 0 ? Math.max(...results.map(r=>r.total)) : 0;
  const minScore = results.length > 0 ? Math.min(...results.map(r=>r.total)) : 0;
  const targetScore = winMode === "high" ? maxScore : minScore;
  const survivors = results.filter(r => r.total === targetScore);

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>

        {phase === "setup" && (
          <>
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.8 }}>
              드래그 방향으로 주사위 2개를 던져요!<br/>합산 점수로 순위를 가립니다
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "16px", width: "100%" }}>
              <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 10, textAlign: "center" }}>🏆 누가 커피를 면제받나요?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setWinMode("high")} style={{ flex: 1, background: winMode === "high" ? "linear-gradient(135deg,#eab308,#ca8a04)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px", color: winMode === "high" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  🥇 점수 높은 사람이 생존
                </button>
                <button onClick={() => setWinMode("low")} style={{ flex: 1, background: winMode === "low" ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px", color: winMode === "low" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  🐢 점수 낮은 사람이 생존
                </button>
              </div>
            </div>
            <button onClick={() => setPhase("playing")} style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)", border: "none", borderRadius: 18, padding: "15px 48px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(234,179,8,0.5)" }}>
              🎲 던지기 시작!
            </button>
          </>
        )}

        {phase === "playing" && (
          <>
            <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
              {participants.map((name, i) => (
                <div key={i} style={{ background: i < results.length ? `${COLORS[i%COLORS.length]}22` : i === currentIdx ? `${COLORS[i%COLORS.length]}44` : "rgba(255,255,255,0.05)", border: i === currentIdx ? `1.5px solid ${COLORS[i%COLORS.length]}` : "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: i === currentIdx ? COLORS[i%COLORS.length] : i < results.length ? "#555" : "#555" }}>
                  {name}{i < results.length ? ` (${results[i].total})` : ""}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[currentIdx%COLORS.length], textAlign: "center" }}>
              {rolling ? "🎲 주사위 구르는 중..." : `${participants[currentIdx]} — 드래그해서 던지세요!`}
            </div>

            {/* Throw area */}
            <div ref={svgRef}
              onMouseDown={e => startDrag(e.clientX, e.clientY)}
              onMouseUp={e => endDrag(e.clientX, e.clientY)}
              onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
              onTouchEnd={e => { e.preventDefault(); endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }}
              style={{ width: AREA_W, height: AREA_H, background: "rgba(255,255,255,0.03)", borderRadius: 20, border: `1.5px dashed ${COLORS[currentIdx%COLORS.length]}44`, cursor: "grab", touchAction: "none", userSelect: "none", position: "relative", overflow: "hidden" }}>
              {!rolling && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 12, color: "rgba(255,255,255,0.15)", pointerEvents: "none", textAlign: "center" }}>여기서 드래그</div>
              )}
              <div style={{ position: "absolute", left: dicePos.x - 65, top: dicePos.y - 28, display: "flex", gap: 10, pointerEvents: "none" }}>
                <Dice3D value={diceVals[0]} rolling={rolling} color={COLORS[currentIdx%COLORS.length]} size={52} />
                <Dice3D value={diceVals[1]} rolling={rolling} color={COLORS[currentIdx%COLORS.length]} size={52} />
              </div>
            </div>

            {!rolling && results.length > 0 && (
              <div style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
                이전: {results[results.length-1].name} — {results[results.length-1].d1} + {results[results.length-1].d2} = <strong style={{ color: COLORS[(results.length-1)%COLORS.length] }}>{results[results.length-1].total}</strong>
              </div>
            )}
          </>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${r.color}15`, border: `1px solid ${r.color}33`, borderRadius: 11, padding: "7px 13px" }}>
                <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 13, color: "#888" }}>{r.d1}+{r.d2}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: r.color }}>{r.total}</span>
                {phase === "done" && r.total === targetScore && <span style={{ fontSize: 14 }}>🏆</span>}
              </div>
            ))}
          </div>
        )}

        {phase === "done" && (
          <div style={{ textAlign: "center", background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", borderRadius: 18, padding: "16px", width: "100%", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{survivors.length > 1 ? "🤝" : "🏆"}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fbbf24" }}>{survivors.map(w=>w.name).join(", ")}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
              {survivors.length > 1 ? "동점! 다시 던져요" : winMode === "high" ? `${targetScore}점 — 최고점 생존!` : `${targetScore}점 — 최저점 생존!`}
            </div>
          </div>
        )}

        <button onClick={reset} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 32px", color: "#ccc", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          🔄 처음부터
        </button>
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>주사위 던지기</div>
      </div>
      {children}
      <style>{`@keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
