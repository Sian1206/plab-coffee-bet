import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

// 플래비 SVG (플랩풋볼 마스코트 스타일)
function FlabyFace({ size = 52, isHappy = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="24" fill="#4ade80" />
      <circle cx="26" cy="26" r="22" fill="#22c55e" />
      {/* Eyes */}
      <circle cx="19" cy="22" r="4" fill="#fff" />
      <circle cx="33" cy="22" r="4" fill="#fff" />
      <circle cx={isHappy ? 20 : 19} cy={isHappy ? 22 : 23} r="2.2" fill="#111" />
      <circle cx={isHappy ? 34 : 33} cy={isHappy ? 22 : 23} r="2.2" fill="#111" />
      {/* Mouth */}
      {isHappy ? (
        <path d="M19 31 Q26 37 33 31" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      ) : (
        <path d="M19 34 Q26 29 33 34" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      )}
      {/* Cheeks */}
      <circle cx="16" cy="29" r="3.5" fill="rgba(255,100,100,0.35)" />
      <circle cx="36" cy="29" r="3.5" fill="rgba(255,100,100,0.35)" />
    </svg>
  );
}

// 뒷면 카드 — 플래비 무늬
function CardBack({ size }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: "linear-gradient(135deg,#1e1b4b,#312e81)", border: "2px solid rgba(139,92,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(0,0,0,0.4)", overflow: "hidden", position: "relative" }}>
      {/* Pattern */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.15, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, padding: 4 }}>
        {Array(9).fill(0).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>⚽</div>
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <FlabyFace size={Math.floor(size * 0.55)} isHappy={true} />
      </div>
    </div>
  );
}

export default function CardGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [cardMult, setCardMult] = useState(2);
  const [phase, setPhase] = useState("setup");
  const [cards, setCards] = useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [flippedBy, setFlippedBy] = useState({});
  const [loser, setLoser] = useState(null);

  const totalCards = n * cardMult;

  // Card size — always roughly square, fit in grid
  const maxCols = Math.min(totalCards, totalCards <= 8 ? 4 : 5);
  const cardSize = Math.min(64, Math.floor(300 / maxCols) - 6);

  const startGame = () => {
    const bomb = Math.floor(Math.random() * totalCards);
    setCards(Array(totalCards).fill(null).map((_, i) => ({ id: i, isBomb: i === bomb })));
    setFlippedBy({}); setCurrentPlayerIdx(0); setLoser(null); setPhase("playing");
  };

  const flipCard = (cardId) => {
    if (flippedBy[cardId] !== undefined || phase !== "playing") return;
    const card = cards[cardId];
    const newFlipped = { ...flippedBy, [cardId]: currentPlayerIdx };
    setFlippedBy(newFlipped);
    if (card.isBomb) { setLoser(participants[currentPlayerIdx]); setPhase("done"); }
    else setCurrentPlayerIdx((currentPlayerIdx + 1) % n);
  };

  const reset = () => { setPhase("setup"); setCards([]); setFlippedBy({}); setLoser(null); setCurrentPlayerIdx(0); };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

        {phase === "setup" && (
          <>
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.7 }}>
              플래비 카드를 뒤집어 놓고 돌아가며 한 장씩!<br/>
              <span style={{ color: "#ec4899", fontWeight: 700 }}>💣 폭탄을 고른 사람이 커피를 쏩니다</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[2, 3].map(mult => (
                <button key={mult} onClick={() => setCardMult(mult)} style={{ background: cardMult === mult ? "linear-gradient(135deg,#ec4899,#db2777)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "10px 20px", color: cardMult === mult ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  카드 {n * mult}장 (×{mult})
                </button>
              ))}
            </div>
            <button onClick={startGame} style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 18, padding: "16px 48px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(236,72,153,0.5)" }}>
              🃏 카드 깔기
            </button>
          </>
        )}

        {(phase === "playing" || phase === "done") && (
          <>
            {phase === "playing" && (
              <div style={{ background: `${COLORS[currentPlayerIdx%COLORS.length]}22`, border: `1.5px solid ${COLORS[currentPlayerIdx%COLORS.length]}55`, borderRadius: 16, padding: "10px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>지금 고를 차례</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: COLORS[currentPlayerIdx%COLORS.length] }}>{participants[currentPlayerIdx]}</div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", width: "100%" }}>
              {cards.map((card) => {
                const isFlipped = flippedBy[card.id] !== undefined;
                const flipperIdx = flippedBy[card.id];
                const isBomb = card.isBomb && isFlipped;
                return (
                  <div key={card.id} onClick={() => flipCard(card.id)}
                    style={{ cursor: isFlipped || phase === "done" ? "default" : "pointer", transition: "transform 0.15s", transform: isFlipped ? "scale(1.05)" : "scale(1)" }}>
                    {isFlipped ? (
                      <div style={{ width: cardSize, height: cardSize, borderRadius: 10, background: isBomb ? "linear-gradient(135deg,#1a0a0a,#2d0f0f)" : "#fff", border: isBomb ? "2px solid #ef4444" : "2px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: isBomb ? "0 0 20px rgba(239,68,68,0.6)" : "0 2px 6px rgba(0,0,0,0.2)", animation: "popIn 0.25s ease", overflow: "hidden" }}>
                        {isBomb ? (
                          <>
                            <div style={{ fontSize: Math.floor(cardSize*0.38) }}>💣</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#f87171", marginTop: 2, textAlign: "center" }}>
                              {participants[flipperIdx].length > 4 ? participants[flipperIdx].slice(0,4)+"…" : participants[flipperIdx]}
                            </div>
                          </>
                        ) : (
                          <>
                            <FlabyFace size={Math.floor(cardSize*0.58)} isHappy={true} />
                            <div style={{ fontSize: 7, fontWeight: 700, color: COLORS[flipperIdx%COLORS.length], marginTop: 2, textAlign: "center" }}>
                              {participants[flipperIdx].length > 4 ? participants[flipperIdx].slice(0,4)+"…" : participants[flipperIdx]}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <CardBack size={cardSize} />
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
              <button onClick={startGame} style={{ flex: 1, background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 14, padding: "13px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>다시 하기</button>
              <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>설정 변경</button>
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
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`@keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
