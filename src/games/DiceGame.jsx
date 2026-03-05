import { useState, useRef } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

const DICE_DOTS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,28],[72,28],[28,50],[72,50],[28,72],[72,72]],
};

function DiceFace({ value, color, size = 64 }) {
  const scale = size / 100;
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  return (
    <svg width={size} height={size}>
      <rect x={2} y={2} width={size-4} height={size-4} rx={size*0.15} fill={color + "22"} stroke={color} strokeWidth={2} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx*scale} cy={cy*scale} r={size*0.08} fill={color} />
      ))}
    </svg>
  );
}

function DiceThrow({ playerName, playerIdx, color, onResult }) {
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState([null, null]);
  const [done, setDone] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [holding, setHolding] = useState(false);
  const holdRef = useRef(null);
  const holdStartRef = useRef(null);
  const throwAreaRef = useRef(null);

  const startHold = (clientX, clientY) => {
    setHolding(true);
    holdStartRef.current = Date.now();
    setDragStart({ x: clientX, y: clientY });
  };

  const endThrow = (clientX, clientY) => {
    if (!holding || !dragStart) return;
    setHolding(false);
    const holdTime = Date.now() - holdStartRef.current;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const strength = Math.min(holdTime / 800, 1); // 0~1

    // 강도 + 드래그 속도 반영하여 주사위 결과 계산
    const totalPower = strength * 0.5 + (speed / 150) * 0.5;
    doRoll(totalPower);
  };

  const doRoll = (power = 0.5) => {
    if (rolling || done) return;
    setRolling(true);
    setDice([null, null]);

    const ticks = Math.floor(8 + power * 14); // 강도에 따라 굴리는 횟수
    let tick = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      tick++;
      if (tick >= ticks) {
        clearInterval(interval);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        setDice([d1, d2]);
        setRolling(false);
        setDone(true);
        onResult(d1 + d2);
      }
    }, Math.max(40, 120 - power * 60));
  };

  return (
    <div style={{ background: done ? `${color}15` : "rgba(255,255,255,0.04)", border: done ? `1.5px solid ${color}55` : "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "14px 16px", transition: "all 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: done || rolling ? 12 : 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color, flex: 1 }}>{playerName}</div>
        {done && <div style={{ fontSize: 18, fontWeight: 900, color }}>합계 {dice[0] + dice[1]}</div>}
      </div>

      {(done || rolling) && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          {dice.map((d, i) => d !== null ? (
            <div key={i} style={{ animation: rolling ? "shake 0.1s infinite" : "popIn 0.3s ease", filter: rolling ? "blur(1px)" : "none" }}>
              <DiceFace value={d} color={color} size={56} />
            </div>
          ) : <div key={i} style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px dashed ${color}44` }} />)}
        </div>
      )}

      {!done && (
        <div
          ref={throwAreaRef}
          onMouseDown={e => startHold(e.clientX, e.clientY)}
          onMouseUp={e => endThrow(e.clientX, e.clientY)}
          onMouseLeave={e => { if (holding) endThrow(e.clientX, e.clientY); }}
          onTouchStart={e => startHold(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={e => endThrow(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
          style={{ background: holding ? `${color}33` : `${color}15`, border: `2px dashed ${color}66`, borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer", transition: "all 0.15s", userSelect: "none", touchAction: "none" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎲🎲</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>{holding ? "놓으면 던져요!" : "꾹 누른 후 드래그해서 던지세요"}</div>
          {holding && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 700 }}>충전 중... {Math.round(Math.min((Date.now() - (holdStartRef.current || Date.now())) / 8, 100))}%</div>}
        </div>
      )}
    </div>
  );
}

export default function DiceGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [results, setResults] = useState({});
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);

  const handleResult = (idx, total) => {
    setResults(prev => {
      const next = { ...prev, [idx]: total };
      if (Object.keys(next).length === n) setDone(true);
      return next;
    });
  };

  const reset = () => { setResults({}); setDone(false); setKey(k => k + 1); };

  const maxVal = done ? Math.max(...Object.values(results)) : null;
  const winners = done ? participants.filter((_, i) => results[i] === maxVal) : [];

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 4 }}>꾹 누른 후 드래그 방향과 시간이 강도에 영향을 줘요!</div>
        {participants.map((name, i) => (
          <DiceThrow key={`${key}-${i}`} playerName={name} playerIdx={i} color={COLORS[i % COLORS.length]} onResult={(total) => handleResult(i, total)} />
        ))}

        {done && (
          <div style={{ textAlign: "center", background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", borderRadius: 18, padding: "16px", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", marginTop: 4 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{winners.length > 1 ? "🤝" : "🏆"}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24" }}>{winners.join(", ")}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{winners.length > 1 ? "동점! 다시 던져요" : `${maxVal}점으로 승리!`}</div>
          </div>
        )}

        <button onClick={reset} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
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
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`
        @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
      `}</style>
    </div>
  );
}
