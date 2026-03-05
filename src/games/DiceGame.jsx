import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

const DICE_DOTS = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

function DiceFace({ value, color, rolling }) {
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  return (
    <svg width={60} height={60} style={{ filter: rolling ? "blur(1px)" : "none", transition: "filter 0.1s" }}>
      <rect x={2} y={2} width={56} height={56} rx={12} fill={color + "22"} stroke={color} strokeWidth={2} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx * 0.6} cy={cy * 0.6} r={5} fill={color} />
      ))}
    </svg>
  );
}

export default function DiceGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [rolls, setRolls] = useState(Array(n).fill(null));
  const [rolling, setRolling] = useState(false);
  const [done, setDone] = useState(false);

  const rollAll = () => {
    if (rolling) return;
    setRolling(true);
    setDone(false);
    let tick = 0;
    const interval = setInterval(() => {
      setRolls(Array(n).fill(0).map(() => Math.floor(Math.random() * 6) + 1));
      tick++;
      if (tick > 12) {
        clearInterval(interval);
        const final = Array(n).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
        setRolls(final);
        setRolling(false);
        setDone(true);
      }
    }, 80);
  };

  const maxVal = done ? Math.max(...rolls) : null;
  const winners = done ? participants.filter((_, i) => rolls[i] === maxVal) : [];
  const reset = () => { setRolls(Array(n).fill(null)); setDone(false); };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          {participants.map((name, i) => {
            const isWinner = done && rolls[i] === maxVal;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: isWinner ? `${COLORS[i % COLORS.length]}22` : "rgba(255,255,255,0.04)", border: isWinner ? `1.5px solid ${COLORS[i % COLORS.length]}66` : "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 16px", transition: "all 0.3s" }}>
                <div style={{ fontWeight: 700, fontSize: 15, flex: 1, color: isWinner ? COLORS[i % COLORS.length] : "#ccc" }}>{name} {isWinner ? "🏆" : ""}</div>
                {rolls[i] !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <DiceFace value={rolls[i]} color={COLORS[i % COLORS.length]} rolling={rolling} />
                    <span style={{ fontSize: 20, fontWeight: 900, color: COLORS[i % COLORS.length], minWidth: 24 }}>{rolls[i]}</span>
                  </div>
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎲</div>
                )}
              </div>
            );
          })}
        </div>

        {done && winners.length > 0 && (
          <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{winners.length > 1 ? "🤝" : "🏆"}</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{winners.join(", ")}</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>{winners.length > 1 ? "동점! 다시 굴려요" : `${maxVal}으로 승리!`}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button onClick={rollAll} disabled={rolling} style={{ flex: 2, background: rolling ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#eab308,#ca8a04)", border: "none", borderRadius: 16, padding: "15px", color: rolling ? "#555" : "#fff", fontSize: 16, fontWeight: 800, cursor: rolling ? "not-allowed" : "pointer", boxShadow: !rolling ? "0 6px 20px rgba(234,179,8,0.4)" : "none" }}>
            {rolling ? "굴리는 중..." : done ? "🎲 다시 굴리기" : "🎲 주사위 굴리기"}
          </button>
          {done && <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "15px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>초기화</button>}
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
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
    </div>
  );
}
