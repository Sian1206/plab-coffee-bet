import { useState } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

function CreditCard({ size }) {
  const w = size * 0.88, h = size * 0.58;
  return (
    <svg width={w} height={h} viewBox="0 0 88 58" style={{ display:"block" }}>
      <defs>
        <linearGradient id="ccGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a237e"/>
          <stop offset="50%" stopColor="#4a148c"/>
          <stop offset="100%" stopColor="#1565c0"/>
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={86} height={56} rx={7} fill="url(#ccGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth={1}/>
      <rect x={7} y={20} width={22} height={16} rx={3} fill="#ffd700" opacity={0.92}/>
      <rect x={7} y={24} width={22} height={5} rx={0} fill="#ffb300" opacity={0.4}/>
      <text x={44} y={44} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={5.5} fontFamily="monospace" letterSpacing={1}>•••• •••• •••• 1234</text>
      <circle cx={64} cy={13} r={8} fill="#ef5350" opacity={0.85}/>
      <circle cx={72} cy={13} r={8} fill="#ff8f00" opacity={0.85}/>
      <text x={68} y={16} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={6} fontWeight="bold">MC</text>
    </svg>
  );
}

function CardBack({ size }) {
  return (
    <div style={{ width:size, height:size, borderRadius:10, background:"linear-gradient(135deg,#1e1b4b,#312e81)", border:"2px solid rgba(139,92,246,0.5)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", boxShadow:"0 3px 10px rgba(0,0,0,0.5)" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize:"10px 10px" }} />
      <img src="/flaby.png" alt="flaby" style={{ width:size*0.68, height:size*0.68, objectFit:"contain", position:"relative", zIndex:1 }} onError={e => { e.target.style.display="none"; }} />
    </div>
  );
}

// 정사각형에 가장 가까운 cols × rows 계산 (|cols-rows| 최소)
function bestGrid(total) {
  let bestCols = 1, bestDiff = total;
  for (let c = 1; c <= total; c++) {
    const rows = Math.ceil(total / c);
    const diff = Math.abs(c - rows);
    if (diff < bestDiff) { bestDiff = diff; bestCols = c; }
  }
  return bestCols;
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
  const cols = bestGrid(totalCards);
  const cardSize = Math.min(64, Math.floor((300 - (cols - 1) * 6) / cols));

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
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>

        {phase === "setup" && (
          <>
            <div style={{ fontSize:13, color:"#aaa", textAlign:"center", lineHeight:1.7 }}>
              플래비 카드를 뒤집어 놓고 돌아가며 한 장씩!<br/>
              <span style={{ color:"#ec4899", fontWeight:700 }}>💳 신용카드를 고른 사람이 커피를 쏩니다</span>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {[2,3].map(mult => (
                <button key={mult} onClick={() => setCardMult(mult)} style={{ background: cardMult===mult ? "linear-gradient(135deg,#ec4899,#db2777)" : "rgba(255,255,255,0.07)", border:"none", borderRadius:12, padding:"10px 20px", color: cardMult===mult?"#fff":"#aaa", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
                  카드 {n*mult}장 (×{mult})
                </button>
              ))}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#ec4899,#db2777)", border:"none", borderRadius:18, padding:"16px 48px", color:"#fff", fontSize:17, fontWeight:800, cursor:"pointer", boxShadow:"0 6px 24px rgba(236,72,153,0.5)" }}>
              🃏 카드 깔기
            </button>
          </>
        )}

        {(phase === "playing" || phase === "done") && (
          <>
            {phase === "playing" && (
              <div style={{ background:`${COLORS[currentPlayerIdx%COLORS.length]}22`, border:`1.5px solid ${COLORS[currentPlayerIdx%COLORS.length]}55`, borderRadius:16, padding:"9px 18px", textAlign:"center", width:"100%" }}>
                <div style={{ fontSize:11, color:"#777", marginBottom:2 }}>지금 고를 차례</div>
                <div style={{ fontSize:20, fontWeight:900, color:COLORS[currentPlayerIdx%COLORS.length] }}>{participants[currentPlayerIdx]}</div>
              </div>
            )}

            {/* 최적 정사각형 그리드 */}
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, ${cardSize}px)`, gap:6, justifyContent:"center" }}>
              {cards.map((card) => {
                const isFlipped = flippedBy[card.id] !== undefined;
                const flipperIdx = flippedBy[card.id];
                const isBomb = card.isBomb && isFlipped;
                return (
                  <div key={card.id} onClick={() => flipCard(card.id)}
                    style={{ cursor: isFlipped||phase==="done" ? "default" : "pointer", transition:"transform 0.15s", transform: isFlipped?"scale(1.04)":"scale(1)" }}>
                    {isFlipped ? (
                      <div style={{ width:cardSize, height:cardSize, borderRadius:10, background: isBomb?"linear-gradient(135deg,#0f172a,#1e1b4b)":"#f8fafc", border: isBomb?"2.5px solid #818cf8":"2px solid #e2e8f0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow: isBomb?"0 0 22px rgba(129,140,248,0.65)":"0 2px 8px rgba(0,0,0,0.15)", animation:"popIn 0.25s ease", overflow:"hidden" }}>
                        {isBomb ? (
                          <>
                            <CreditCard size={cardSize} />
                            <div style={{ fontSize:7, fontWeight:700, color:"#818cf8", marginTop:2, textAlign:"center" }}>
                              {participants[flipperIdx]?.length > 4 ? participants[flipperIdx].slice(0,4)+"…" : participants[flipperIdx]}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize:Math.floor(cardSize*0.4) }}>☕</div>
                            <div style={{ fontSize:7, fontWeight:700, color:COLORS[flipperIdx%COLORS.length], marginTop:2, textAlign:"center" }}>
                              {participants[flipperIdx]?.length > 4 ? participants[flipperIdx].slice(0,4)+"…" : participants[flipperIdx]}
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
              <div style={{ textAlign:"center", background:"rgba(129,140,248,0.15)", border:"1px solid rgba(129,140,248,0.4)", borderRadius:18, padding:"18px", width:"100%", animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ marginBottom:10 }}>
                  <CreditCard size={110} />
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:"#a5b4fc" }}>{loser}</div>
                <div style={{ fontSize:14, color:"#aaa", marginTop:6 }}>☕ 커피 한 잔 쏘세요!</div>
              </div>
            )}

            <div style={{ display:"flex", gap:10, width:"100%" }}>
              <button onClick={startGame} style={{ flex:1, background:"linear-gradient(135deg,#ec4899,#db2777)", border:"none", borderRadius:14, padding:"13px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>다시 하기</button>
              <button onClick={reset} style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"13px", color:"#ccc", fontSize:14, fontWeight:700, cursor:"pointer" }}>설정 변경</button>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding:"24px 20px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#777", fontSize:14, cursor:"pointer", padding:0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, padding:"6px 12px", color:"#aaa", fontSize:13, cursor:"pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ fontSize:32, marginBottom:4 }}>{bet.emoji}</div>
        <div style={{ fontSize:20, fontWeight:900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`@keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
