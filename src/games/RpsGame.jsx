import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const MOVES = ["✊","✌️","🖐️"];
const MOVE_NAMES = ["주먹","가위","보"];
const BEATS = { 0: 2, 1: 0, 2: 1 }; // rock beats scissors, scissors beats paper, paper beats rock

export default function RpsGame({ participants, bet, onBack, onHome }) {
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(participants);
  const [choices, setChoices] = useState({});
  const [roundResult, setRoundResult] = useState(null);
  const [champion, setChampion] = useState(null);

  const selectMove = (name, moveIdx) => {
    if (choices[name] !== undefined || roundResult) return;
    setChoices(prev => ({ ...prev, [name]: moveIdx }));
  };

  const allChosen = remaining.every(n => choices[n] !== undefined);

  const resolveRound = () => {
    const moveCounts = [0, 1, 2].map(m => remaining.filter(n => choices[n] === m).length);
    const usedMoves = [0, 1, 2].filter(m => moveCounts[m] > 0);

    // All same -> tie
    if (usedMoves.length === 1 || usedMoves.length === 3) {
      setRoundResult({ type: "tie", survivors: remaining });
      return;
    }

    // Find the winning move
    let winningMove = usedMoves[0];
    for (const m of usedMoves) {
      if (BEATS[m] === winningMove || usedMoves.every(om => om === m || BEATS[m] === om)) {
        winningMove = m;
      }
    }
    // Actually: find which move beats all other moves present
    const winner = usedMoves.find(m => usedMoves.every(other => other === m || BEATS[m] === other));

    if (!winner && winner !== 0) {
      // three way tie
      setRoundResult({ type: "tie", survivors: remaining });
      return;
    }

    const survivors = remaining.filter(n => choices[n] === winner);
    setRoundResult({ type: "win", winningMove: winner, survivors, eliminated: remaining.filter(n => choices[n] !== winner) });
  };

  const nextRound = () => {
    const survivors = roundResult.survivors;
    if (survivors.length === 1) {
      setChampion(survivors[0]);
      return;
    }
    setRemaining(survivors);
    setChoices({});
    setRoundResult(null);
    setRound(r => r + 1);
  };

  const reset = () => { setRound(1); setRemaining(participants); setChoices({}); setRoundResult(null); setChampion(null); };

  if (champion) {
    return (
      <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 64, marginBottom: 12, animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>🏆</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{champion}</div>
          <div style={{ fontSize: 15, color: "#aaa", marginBottom: 28 }}>최후의 승자!</div>
          <button onClick={reset} style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", border: "none", borderRadius: 16, padding: "14px 36px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>다시 하기</button>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>라운드 {round}</div>
          <div style={{ fontSize: 13, color: "#666" }}>남은 인원 {remaining.length}명</div>
        </div>

        {/* Eliminated */}
        {remaining.length < participants.length && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {participants.filter(n => !remaining.includes(n)).map(n => (
              <span key={n} style={{ fontSize: 12, color: "#555", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "3px 8px", textDecoration: "line-through" }}>{n}</span>
            ))}
          </div>
        )}

        {/* Player choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {remaining.map((name, i) => {
            const chosen = choices[name];
            const revealed = roundResult !== null;
            return (
              <div key={name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: COLORS[participants.indexOf(name) % COLORS.length] }}>{name}</div>
                {revealed ? (
                  <div style={{ fontSize: 28, textAlign: "center" }}>{MOVES[chosen]}<span style={{ fontSize: 13, color: "#aaa", marginLeft: 6 }}>{MOVE_NAMES[chosen]}</span></div>
                ) : (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {MOVES.map((m, mi) => (
                      <button key={mi} onClick={() => selectMove(name, mi)} style={{ width: 52, height: 52, borderRadius: 14, background: chosen === mi ? `${COLORS[participants.indexOf(name) % COLORS.length]}33` : "rgba(255,255,255,0.06)", border: chosen === mi ? `2px solid ${COLORS[participants.indexOf(name) % COLORS.length]}` : "1px solid rgba(255,255,255,0.12)", fontSize: 24, cursor: chosen !== undefined ? "default" : "pointer", transition: "all 0.15s" }}>
                        {chosen !== undefined && chosen !== mi ? "?" : m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Result */}
        {roundResult && (
          <div style={{ background: roundResult.type === "tie" ? "rgba(255,255,255,0.06)" : "rgba(34,197,94,0.1)", border: roundResult.type === "tie" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(34,197,94,0.3)", borderRadius: 16, padding: "14px", textAlign: "center", animation: "popIn 0.3s ease" }}>
            {roundResult.type === "tie" ? (
              <><div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🤝 비겼어요!</div><div style={{ fontSize: 13, color: "#aaa" }}>다시 골라요</div></>
            ) : (
              <><div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{MOVES[roundResult.winningMove]} {MOVE_NAMES[roundResult.winningMove]} 승리!</div><div style={{ fontSize: 14, color: "#aaa" }}>다음 라운드: {roundResult.survivors.join(", ")}</div></>
            )}
          </div>
        )}

        {!roundResult && (
          <button onClick={resolveRound} disabled={!allChosen} style={{ background: allChosen ? "linear-gradient(135deg,#14b8a6,#0d9488)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 16, padding: "14px", color: allChosen ? "#fff" : "#444", fontSize: 15, fontWeight: 800, cursor: allChosen ? "pointer" : "not-allowed", boxShadow: allChosen ? "0 4px 20px rgba(20,184,166,0.4)" : "none", transition: "all 0.25s" }}>
            {allChosen ? "결과 확인!" : `${remaining.length - Object.keys(choices).length}명 남음`}
          </button>
        )}

        {roundResult && (
          <button onClick={nextRound} style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", border: "none", borderRadius: 16, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            {roundResult.survivors.length === 1 ? "🏆 최종 결과!" : "다음 라운드 →"}
          </button>
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
