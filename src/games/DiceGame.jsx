import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

const DOTS = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,28],[72,28],[28,50],[72,50],[28,72],[72,72]],
};

function Dice3D({ value, rolling, color, size = 52, angle = 0 }) {
  const half = size / 2;
  const dotR = size * 0.085;
  const rx = rolling ? 0 : -20 + angle * 0.3;
  const ry = rolling ? 0 : -30 + angle * 0.5;

  const Face = ({ dots, transform, dimmed }) => (
    <div style={{
      position: "absolute", width: size, height: size,
      background: dimmed
        ? `linear-gradient(135deg, ${color}88, ${color}44)`
        : `linear-gradient(135deg, ${color}ee, ${color}aa)`,
      border: "1.5px solid rgba(255,255,255,0.2)",
      borderRadius: size * 0.13,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform, backfaceVisibility: "hidden",
      boxShadow: "inset 0 0 10px rgba(0,0,0,0.35)",
    }}>
      <svg width={size} height={size}>
        {(dots || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx / 100 * size} cy={cy / 100 * size} r={dotR} fill="rgba(255,255,255,0.9)" />
        ))}
      </svg>
    </div>
  );

  const opp = v => v <= 3 ? v + 3 : v - 3;

  return (
    <div style={{ width: size, height: size, position: "relative", perspective: size * 5 }}>
      <div style={{
        width: size, height: size, position: "relative",
        transformStyle: "preserve-3d",
        transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
        animation: rolling ? "roll3d 0.2s linear infinite" : "none",
        transition: rolling ? "none" : "transform 0.5s ease",
      }}>
        <Face dots={DOTS[value] || DOTS[1]} transform={`translateZ(${half}px)`} />
        <Face dots={DOTS[opp(value)] || DOTS[1]} transform={`rotateY(180deg) translateZ(${half}px)`} dimmed />
        <Face dots={DOTS[value === 6 ? 1 : value + 1] || DOTS[1]} transform={`rotateY(90deg) translateZ(${half}px)`} dimmed />
        <Face dots={DOTS[value === 1 ? 6 : value - 1] || DOTS[1]} transform={`rotateY(-90deg) translateZ(${half}px)`} dimmed />
        <Face dots={DOTS[value <= 3 ? value + 2 : value - 2] || DOTS[1]} transform={`rotateX(-90deg) translateZ(${half}px)`} dimmed />
        <Face dots={DOTS[value <= 3 ? value + 1 : value - 1] || DOTS[1]} transform={`rotateX(90deg) translateZ(${half}px)`} dimmed />
      </div>
      <style>{`@keyframes roll3d{0%{transform:rotateX(0)rotateY(0)rotateZ(0)}25%{transform:rotateX(90deg)rotateY(60deg)rotateZ(30deg)}50%{transform:rotateX(180deg)rotateY(120deg)rotateZ(60deg)}75%{transform:rotateX(270deg)rotateY(180deg)rotateZ(90deg)}100%{transform:rotateX(360deg)rotateY(240deg)rotateZ(120deg)}}`}</style>
    </div>
  );
}

export default function DiceGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [penaltyMode, setPenaltyMode] = useState("high"); // high=최고점이 벌칙, low=최저점이 벌칙
  const [phase, setPhase] = useState("setup");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [diceVals, setDiceVals] = useState([1, 6]);
  const [rolling, setRolling] = useState(false);

  const AREA_W = 310, AREA_H = 230;
  // 두 주사위 각각 독립적인 물리
  const dice1Ref = useRef({ x: AREA_W * 0.32, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 });
  const dice2Ref = useRef({ x: AREA_W * 0.68, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 });
  const [dicePos, setDicePos] = useState({ d1: { ...dice1Ref.current }, d2: { ...dice2Ref.current } });

  const dragRef = useRef(null);
  const areaRef = useRef(null);
  const animRef = useRef(null);
  const rollRef = useRef(null);

  const startDrag = (cx, cy) => {
    if (rolling || phase !== "playing") return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { sx: cx - rect.left, sy: cy - rect.top, t: Date.now() };
  };

  const endDrag = (cx, cy) => {
    if (!dragRef.current || rolling) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ex = cx - rect.left, ey = cy - rect.top;
    const dt = Math.max((Date.now() - dragRef.current.t) / 1000, 0.04);
    const dx = ex - dragRef.current.sx, dy = ey - dragRef.current.sy;
    const speed = Math.sqrt(dx * dx + dy * dy);
    dragRef.current = null;

    // 두 주사위가 서로 다른 방향으로 분리되어 날아감
    const baseVx = (dx / dt) * 0.04;
    const baseVy = (dy / dt) * 0.04;
    const spread = 1.5 + speed * 0.008;

    dice1Ref.current = { x: AREA_W * 0.35, y: AREA_H * 0.45, vx: baseVx - spread, vy: baseVy - spread * 0.5, angle: Math.random() * 360 };
    dice2Ref.current = { x: AREA_W * 0.65, y: AREA_H * 0.45, vx: baseVx + spread, vy: baseVy + spread * 0.5, angle: Math.random() * 360 };

    doRoll(speed);
  };

  const doRoll = (speed = 80) => {
    setRolling(true);
    const ticks = Math.floor(10 + speed / 18);
    let tick = 0;
    rollRef.current = setInterval(() => {
      setDiceVals([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      tick++;
      if (tick >= ticks) {
        clearInterval(rollRef.current);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        setDiceVals([d1, d2]);
        setRolling(false);
        setTimeout(() => {
          const newResults = [...results, { name: participants[currentIdx], d1, d2, total: d1 + d2, color: COLORS[currentIdx % COLORS.length] }];
          setResults(newResults);
          dice1Ref.current = { x: AREA_W * 0.32, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 };
          dice2Ref.current = { x: AREA_W * 0.68, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 };
          setDicePos({ d1: { ...dice1Ref.current }, d2: { ...dice2Ref.current } });
          if (currentIdx + 1 >= n) setPhase("done");
          else setCurrentIdx(currentIdx + 1);
        }, 700);
      }
    }, Math.max(32, 100 - speed / 5));
  };

  // 독립 물리 애니메이션
  useEffect(() => {
    if (!rolling) return;
    const DSIZE = 52;
    const loop = () => {
      const update = (d) => {
        d.vx *= 0.89; d.vy *= 0.89;
        d.x += d.vx; d.y += d.vy;
        d.angle += d.vx * 1.5;
        if (d.x < DSIZE / 2) { d.x = DSIZE / 2; d.vx = Math.abs(d.vx) * 0.75; }
        if (d.x > AREA_W - DSIZE / 2) { d.x = AREA_W - DSIZE / 2; d.vx = -Math.abs(d.vx) * 0.75; }
        if (d.y < DSIZE / 2) { d.y = DSIZE / 2; d.vy = Math.abs(d.vy) * 0.75; }
        if (d.y > AREA_H - DSIZE / 2) { d.y = AREA_H - DSIZE / 2; d.vy = -Math.abs(d.vy) * 0.75; }
        return { ...d };
      };
      dice1Ref.current = update(dice1Ref.current);
      dice2Ref.current = update(dice2Ref.current);
      setDicePos({ d1: { ...dice1Ref.current }, d2: { ...dice2Ref.current } });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [rolling]);

  const reset = () => {
    setPhase("setup"); setCurrentIdx(0); setResults([]);
    setDiceVals([1, 6]); setRolling(false);
    dice1Ref.current = { x: AREA_W * 0.32, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 };
    dice2Ref.current = { x: AREA_W * 0.68, y: AREA_H * 0.45, vx: 0, vy: 0, angle: 0 };
    setDicePos({ d1: { ...dice1Ref.current }, d2: { ...dice2Ref.current } });
  };

  const maxScore = results.length > 0 ? Math.max(...results.map(r => r.total)) : 0;
  const minScore = results.length > 0 ? Math.min(...results.map(r => r.total)) : 0;
  const penaltyScore = penaltyMode === "high" ? maxScore : minScore;
  const penalized = phase === "done" ? results.filter(r => r.total === penaltyScore) : [];
  const currentColor = COLORS[currentIdx % COLORS.length];

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>

        {phase === "setup" && (
          <>
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.8 }}>
              드래그 방향으로 주사위 2개를 던져요!<br/>합산 점수로 벌칙자를 가립니다
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "16px", width: "100%" }}>
              <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 10, textAlign: "center" }}>☕ 누가 커피를 사나요?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPenaltyMode("high")}
                  style={{ flex: 1, background: penaltyMode === "high" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px", color: penaltyMode === "high" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  ☕ 점수 높은 사람
                </button>
                <button onClick={() => setPenaltyMode("low")}
                  style={{ flex: 1, background: penaltyMode === "low" ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px", color: penaltyMode === "low" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  ☕ 점수 낮은 사람
                </button>
              </div>
            </div>
            <button onClick={() => setPhase("playing")}
              style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)", border: "none", borderRadius: 18, padding: "15px 48px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(234,179,8,0.5)" }}>
              🎲 던지기 시작!
            </button>
          </>
        )}

        {phase === "playing" && (
          <>
            <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
              {participants.map((name, i) => (
                <div key={i} style={{ background: i < results.length ? `${COLORS[i % COLORS.length]}22` : i === currentIdx ? `${COLORS[i % COLORS.length]}44` : "rgba(255,255,255,0.05)", border: i === currentIdx ? `1.5px solid ${COLORS[i % COLORS.length]}` : "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: i === currentIdx ? COLORS[i % COLORS.length] : "#555" }}>
                  {name}{i < results.length ? ` (${results[i].total})` : ""}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: currentColor, textAlign: "center" }}>
              {rolling ? "🎲 주사위 구르는 중..." : `${participants[currentIdx]} — 드래그해서 던지세요!`}
            </div>

            <div
              ref={areaRef}
              onMouseDown={e => startDrag(e.clientX, e.clientY)}
              onMouseUp={e => endDrag(e.clientX, e.clientY)}
              onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
              onTouchEnd={e => { e.preventDefault(); endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }}
              style={{ width: AREA_W, height: AREA_H, background: "rgba(255,255,255,0.03)", borderRadius: 20, border: `1.5px dashed ${currentColor}44`, cursor: "grab", touchAction: "none", userSelect: "none", position: "relative", overflow: "hidden" }}>
              {!rolling && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 12, color: "rgba(255,255,255,0.12)", pointerEvents: "none", textAlign: "center" }}>
                  여기서 드래그
                </div>
              )}
              {/* 주사위 1 */}
              <div style={{ position: "absolute", left: dicePos.d1.x - 26, top: dicePos.d1.y - 26, pointerEvents: "none", transition: rolling ? "none" : "left 0.3s, top 0.3s" }}>
                <Dice3D value={diceVals[0]} rolling={rolling} color={currentColor} size={52} angle={dicePos.d1.angle} />
              </div>
              {/* 주사위 2 */}
              <div style={{ position: "absolute", left: dicePos.d2.x - 26, top: dicePos.d2.y - 26, pointerEvents: "none", transition: rolling ? "none" : "left 0.3s, top 0.3s" }}>
                <Dice3D value={diceVals[1]} rolling={rolling} color={currentColor} size={52} angle={dicePos.d2.angle} />
              </div>
            </div>

            {!rolling && results.length > 0 && (
              <div style={{ fontSize: 12, color: "#555", textAlign: "center" }}>
                이전: {results[results.length - 1].name} — {results[results.length - 1].d1}+{results[results.length - 1].d2} = <strong style={{ color: COLORS[(results.length - 1) % COLORS.length] }}>{results[results.length - 1].total}</strong>
              </div>
            )}
          </>
        )}

        {results.length > 0 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${r.color}15`, border: `1px solid ${r.color}33`, borderRadius: 11, padding: "7px 13px" }}>
                <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: "#666" }}>{r.d1}+{r.d2}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: r.color }}>{r.total}</span>
                {phase === "done" && r.total === penaltyScore && <span style={{ fontSize: 14 }}>☕</span>}
              </div>
            ))}
          </div>
        )}

        {phase === "done" && penalized.length > 0 && (
          <div style={{ textAlign: "center", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 18, padding: "16px", width: "100%", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>☕</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fb923c" }}>{penalized.map(w => w.name).join(", ")}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
              {penalized.length > 1 ? "동점! 다시 던져요" : `${penaltyScore}점 — 커피 한 잔 쏘세요!`}
            </div>
          </div>
        )}

        <button onClick={reset}
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 32px", color: "#ccc", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
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
