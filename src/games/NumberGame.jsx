import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

export default function NumberGame({ participants, bet, onBack, onHome }) {
  const [range] = useState({ min: 1, max: 100 });
  const [guesses, setGuesses] = useState({});
  const [target, setTarget] = useState(null);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState({});

  const setGuess = (name, val) => {
    const n = parseInt(val);
    if (isNaN(n)) return;
    setGuesses(prev => ({ ...prev, [name]: Math.max(range.min, Math.min(range.max, n)) }));
  };

  const reveal = () => {
    const t = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    setTarget(t);
    setDone(true);
  };

  const allGuessed = participants.every(n => guesses[n] !== undefined);

  const distances = done ? participants.map(n => ({ name: n, guess: guesses[n] ?? "?", dist: Math.abs((guesses[n] ?? Infinity) - target) })).sort((a, b) => a.dist - b.dist) : [];
  const winner = distances[0];

  const reset = () => { setGuesses({}); setTarget(null); setDone(false); setInput({}); };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#888" }}>숫자 범위</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#60a5fa" }}>{range.min} ~ {range.max}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>가장 가까운 숫자를 고른 사람이 승리!</div>
        </div>

        {!done ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {participants.map((name, i) => {
                const locked = guesses[name] !== undefined;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, background: locked ? `${COLORS[i % COLORS.length]}15` : "rgba(255,255,255,0.04)", border: locked ? `1px solid ${COLORS[i % COLORS.length]}44` : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 14px", transition: "all 0.3s" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS[i % COLORS.length], minWidth: 60 }}>{name}</div>
                    {locked ? (
                      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 20, fontWeight: 900 }}>{guesses[name]}</span>
                        <span style={{ fontSize: 20 }}>🔒</span>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: "flex", gap: 8 }}>
                        <input
                          type="number" min={range.min} max={range.max}
                          value={input[name] || ""}
                          onChange={e => setInput(p => ({ ...p, [name]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && input[name] && setGuess(name, input[name])}
                          placeholder={`${range.min}~${range.max}`}
                          style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 10px", color: "#f0f0f0", fontSize: 15, outline: "none", width: 0 }}
                        />
                        <button onClick={() => input[name] && setGuess(name, input[name])} style={{ background: `${COLORS[i % COLORS.length]}33`, border: `1px solid ${COLORS[i % COLORS.length]}55`, borderRadius: 10, padding: "8px 12px", color: COLORS[i % COLORS.length], fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>확정</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={reveal} disabled={!allGuessed} style={{ background: allGuessed ? "linear-gradient(135deg,#60a5fa,#3b82f6)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 16, padding: "15px", color: allGuessed ? "#fff" : "#444", fontSize: 16, fontWeight: 800, cursor: allGuessed ? "pointer" : "not-allowed", boxShadow: allGuessed ? "0 4px 20px rgba(96,165,250,0.4)" : "none", transition: "all 0.25s" }}>
              {allGuessed ? "🔢 숫자 공개!" : `${participants.length - Object.keys(guesses).length}명 남음`}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)", borderRadius: 18, padding: "20px", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>정답은</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: "#60a5fa", lineHeight: 1 }}>{target}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {distances.map((d, rank) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, background: rank === 0 ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)", border: rank === 0 ? "1.5px solid rgba(234,179,8,0.5)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 14px", animation: `popIn 0.3s ease ${rank * 80}ms both` }}>
                  <div style={{ fontSize: 18, minWidth: 28 }}>{rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`}</div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: rank === 0 ? "#fbbf24" : "#ccc" }}>{d.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: rank === 0 ? "#fbbf24" : "#888" }}>{d.guess}</div>
                  <div style={{ fontSize: 12, color: "#666", minWidth: 50, textAlign: "right" }}>차이 {d.dist}</div>
                </div>
              ))}
            </div>

            <button onClick={reset} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              다시 하기
            </button>
          </>
        )}
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
