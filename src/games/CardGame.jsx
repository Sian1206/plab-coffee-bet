import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const CARD_BACKS = ["🂠","🂡","🂢","🂣"];

export default function CardGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [phase, setPhase] = useState("assign"); // assign | flip | done
  const [assignments, setAssignments] = useState(() => {
    // Assign each participant a card index
    const arr = participants.map((_, i) => i);
    return arr;
  });
  const [shuffled, setShuffled] = useState(false);
  const [flipped, setFlipped] = useState([]);
  const [cards, setCards] = useState([]); // { suit, value, isSpecial }
  const [winner, setWinner] = useState(null);

  const suits = ["♠","♥","♦","♣"];
  const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

  const dealCards = () => {
    // Pick n random unique cards, one is "special" (e.g. Ace of Spades)
    const deck = [];
    for (const s of suits) for (const v of values) deck.push({ suit: s, value: v });
    deck.sort(() => Math.random() - 0.5);
    const hand = deck.slice(0, n);
    // Make one card special (highest card = winner, or lowest = loser)
    const specialIdx = Math.floor(Math.random() * n);
    const result = hand.map((c, i) => ({ ...c, isSpecial: i === specialIdx, participantIdx: i }));
    setCards(result);
    setFlipped([]);
    setShuffled(true);
    setWinner(null);
    setPhase("flip");
  };

  const flipCard = (i) => {
    if (flipped.includes(i) || phase !== "flip") return;
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);
    if (newFlipped.length === n) {
      const special = cards.find(c => c.isSpecial);
      setWinner(participants[special.participantIdx]);
      setPhase("done");
    }
  };

  const reset = () => { setPhase("assign"); setShuffled(false); setFlipped([]); setCards([]); setWinner(null); };

  const isRed = (suit) => suit === "♥" || suit === "♦";

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

        {phase === "assign" && (
          <>
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.6 }}>
              참가자마다 카드 한 장씩 배분돼요.<br/>
              <strong style={{ color: "#ec4899" }}>특별 카드</strong>를 뽑은 사람이 당첨!
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {participants.map((name, i) => (
                <div key={i} style={{ background: `${COLORS[i % COLORS.length]}22`, border: `1px solid ${COLORS[i % COLORS.length]}44`, borderRadius: 12, padding: "8px 16px", fontSize: 14, fontWeight: 600 }}>{name}</div>
              ))}
            </div>
            <button onClick={dealCards} style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 18, padding: "16px 48px", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(236,72,153,0.5)" }}>
              🃏 카드 나누기
            </button>
          </>
        )}

        {(phase === "flip" || phase === "done") && (
          <>
            <div style={{ fontSize: 13, color: "#aaa" }}>카드를 눌러서 뒤집어요!</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {cards.map((card, i) => {
                const isFlipped = flipped.includes(i);
                return (
                  <div key={i} onClick={() => flipCard(i)} style={{ cursor: isFlipped ? "default" : "pointer" }}>
                    <div style={{ fontSize: 11, color: COLORS[i % COLORS.length], textAlign: "center", marginBottom: 4, fontWeight: 700 }}>
                      {participants[card.participantIdx]}
                    </div>
                    <div style={{
                      width: 72, height: 100, borderRadius: 12,
                      background: isFlipped ? "#fff" : `linear-gradient(135deg,${COLORS[i % COLORS.length]},${COLORS[(i+1) % COLORS.length]})`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: isFlipped && card.isSpecial ? "0 0 24px rgba(236,72,153,0.8)" : "0 4px 12px rgba(0,0,0,0.4)",
                      border: isFlipped && card.isSpecial ? "3px solid #ec4899" : "none",
                      transition: "all 0.3s",
                      transform: isFlipped ? "scale(1.05)" : "scale(1)",
                      animation: isFlipped ? "popIn 0.3s ease" : "none",
                    }}>
                      {isFlipped ? (
                        <>
                          {card.isSpecial && <div style={{ fontSize: 18, position: "absolute", top: -10 }}>⭐</div>}
                          <div style={{ fontSize: 22, fontWeight: 900, color: isRed(card.suit) ? "#e11d48" : "#1a1a2e", lineHeight: 1 }}>{card.value}</div>
                          <div style={{ fontSize: 24, color: isRed(card.suit) ? "#e11d48" : "#1a1a2e" }}>{card.suit}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 28, opacity: 0.7 }}>🂠</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {winner && (
              <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>⭐</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>{winner}</div>
                <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>특별 카드 당첨!</div>
              </div>
            )}

            <button onClick={reset} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px 32px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
