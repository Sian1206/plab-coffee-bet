import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

export default function CardGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [cardMult, setCardMult] = useState(2);
  const [phase, setPhase] = useState("setup"); // setup | playing | done
  const [cards, setCards] = useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [flippedBy, setFlippedBy] = useState({}); // cardIdx -> playerIdx
  const [loser, setLoser] = useState(null);
  const [bombIdx, setBombIdx] = useState(null);

  const totalCards = n * cardMult;

  const startGame = () => {
    const bomb = Math.floor(Math.random() * totalCards);
    setBombIdx(bomb);
    setCards(Array(totalCards).fill(null).map((_, i) => ({ id: i, isBomb: i === bomb })));
    setFlippedBy({});
    setCurrentPlayerIdx(0);
    setLoser(null);
    setPhase("playing");
  };

  const flipCard = (cardId) => {
    if (flippedBy[cardId] !== undefined || phase !== "playing") return;
    const card = cards[cardId];
    const newFlippedBy = { ...flippedBy, [cardId]: currentPlayerIdx };
    setFlippedBy(newFlippedBy);

    if (card.isBomb) {
      setLoser(participants[currentPlayerIdx]);
      setPhase("done");
    } else {
      setCurrentPlayerIdx((currentPlayerIdx + 1) % n);
    }
  };

  const reset = () => { setPhase("setup"); setCards([]); setFlippedBy({}); setLoser(null); setBombIdx(null); setCurrentPlayerIdx(0); };

  const currentPlayer = participants[currentPlayerIdx];

  // Layout: grid
  const cols = Math.min(totalCards, cardMult === 2 ? (n <= 3 ? 4 : 5) : (n <= 2 ? 4 : 5));

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

        {phase === "setup" && (
          <>
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.7 }}>
              카드를 바닥에 뒤집어 놓고<br />
              돌아가며 한 장씩 눌러요.<br />
              <span style={{ color: "#ec4899", fontWeight: 700 }}>💣 폭탄 카드</span>를 고른 사람이 커피를!
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCardMult(2)} style={{ background: cardMult === 2 ? "linear-gradient(135deg,#ec4899,#db2777)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "10px 20px", color: cardMult === 2 ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                카드 {n * 2}장 (x2)
              </button>
              <button onClick={() => setCardMult(3)} style={{ background: cardMult === 3 ? "linear-gradient(135deg,#ec4899,#db2777)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "10px 20px", color: cardMult === 3 ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                카드 {n * 3}장 (x3)
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {participants.map((name, i) => (
                <div key={i} style={{ background: `${COLORS[i % COLORS.length]}22`, border: `1px solid ${COLORS[i % COLORS.length]}44`, borderRadius: 10, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>{name}</div>
              ))}
            </div>
            <button onClick={startGame} style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 18, padding: "16px 48px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(236,72,153,0.5)" }}>
              🃏 카드 깔기
            </button>
          </>
        )}

        {(phase === "playing" || phase === "done") && (
          <>
            {/* Current player indicator */}
            {phase === "playing" && (
              <div style={{ background: `${COLORS[currentPlayerIdx % COLORS.length]}22`, border: `1.5px solid ${COLORS[currentPlayerIdx % COLORS.length]}55`, borderRadius: 16, padding: "10px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>지금 고를 차례</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: COLORS[currentPlayerIdx % COLORS.length] }}>{currentPlayer}</div>
              </div>
            )}

            {/* Cards grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", width: "100%" }}>
              {cards.map((card) => {
                const isFlipped = flippedBy[card.id] !== undefined;
                const flipperIdx = flippedBy[card.id];
                const isBomb = card.isBomb && isFlipped;
                return (
                  <div key={card.id} onClick={() => flipCard(card.id)}
                    style={{ width: 58, height: 80, borderRadius: 10, cursor: isFlipped || phase === "done" ? "default" : "pointer", position: "relative", transition: "transform 0.15s", transform: isFlipped ? "scale(1.05)" : "scale(1)" }}>
                    {isFlipped ? (
                      <div style={{ width: "100%", height: "100%", borderRadius: 10, background: isBomb ? "linear-gradient(135deg,#1a1a2e,#2d1b1b)" : "#fff", border: isBomb ? "2px solid #ef4444" : "2px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: isBomb ? "0 0 20px rgba(239,68,68,0.6)" : "none", animation: "popIn 0.25s ease" }}>
                        <div style={{ fontSize: isBomb ? 28 : 22 }}>{isBomb ? "💣" : "✅"}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: isBomb ? "#f87171" : COLORS[flipperIdx % COLORS.length], marginTop: 3, textAlign: "center", lineHeight: 1.2 }}>
                          {participants[flipperIdx].length > 5 ? participants[flipperIdx].slice(0, 5) + "…" : participants[flipperIdx]}
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: "100%", borderRadius: 10, background: "linear-gradient(135deg,#4c1d95,#312e81)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                        🂠
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {phase === "done" && loser && (
              <div style={{ textAlign: "center", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 18, padding: "20px", width: "100%", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💣</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f87171" }}>{loser}</div>
                <div style={{ fontSize: 14, color: "#aaa", marginTop: 6 }}>☕ 커피 한 잔 쏘세요!</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={startGame} style={{ flex: 1, background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 14, padding: "13px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                다시 하기
              </button>
              <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                설정 변경
              </button>
            </div>
          </>
        )}
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
      <style>{`@keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
