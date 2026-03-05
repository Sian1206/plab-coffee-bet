import { useState, useRef } from "react";
import RouletteGame from "./games/RouletteGame";
import MarbleGame from "./games/MarbleGame";
import LadderGame from "./games/LadderGame";
import CardGame from "./games/CardGame";
import DiceGame from "./games/DiceGame";

const BETS = [
  { id: 1, emoji: "🎡", title: "룰렛 돌리기", description: "참가자 이름을 넣고 룰렛을 돌려 한 명을 뽑아요.", recommendedCount: "2~10명", winnerCount: "1명", category: "뽑기", color: "#f97316", tag: "인기", game: "roulette" },
  { id: 2, emoji: "🎰", title: "마블 룰렛", description: "각자의 구슬이 핀을 튕기며 떨어져요. 가장 먼저 or 마지막으로 떨어진 구슬 주인이 커피를!", recommendedCount: "2~8명", winnerCount: "1명", category: "뽑기", color: "#8b5cf6", tag: "신규", game: "marble" },
  { id: 3, emoji: "🪜", title: "사다리 타기", description: "사다리를 타고 내려가 💰를 피하세요! 돈 걸린 사람이 커피 한 잔 쏩니다.", recommendedCount: "2~8명", winnerCount: "꼴찌 1명", category: "사다리", color: "#22c55e", tag: null, game: "ladder" },
  { id: 4, emoji: "🃏", title: "카드 뒤집기", description: "뒤집힌 카드 중 단 하나의 💣 카드를 고른 사람이 커피를 쏩니다!", recommendedCount: "2~6명", winnerCount: "꼴찌 1명", category: "카드", color: "#ec4899", tag: null, game: "card" },
  { id: 5, emoji: "🎲", title: "주사위 대결", description: "드래그로 주사위 두 개를 던져요! 합산 최고점자가 승리!", recommendedCount: "2~6명", winnerCount: "최고점 1명", category: "주사위", color: "#eab308", tag: null, game: "dice" },
];

const CATEGORIES = ["전체", "뽑기", "사다리", "카드", "주사위"];
const GAME_COMPONENTS = { roulette: RouletteGame, marble: MarbleGame, ladder: LadderGame, card: CardGame, dice: DiceGame };

const ALL_MEMBERS = (() => {
  const rest = ["호두","라크","정남","루니","번즈","쿠스","키커","아쿠","뿌까",
    "제리","맥국","후크","뮤츠","뚜비","옐로","따오","릴라","뉴진","라미",
    "비버","미누","로쿤","소피아","아키","준타","무민","아이언","준리","페페",
    "펑키","히로","야무치","솔트","쵸비","테디","머시","터키","티모시","피르",
    "상떼","워즈","피치","큐","라임","스톤","엔도"].sort((a,b) => a.localeCompare(b,'ko'));
  return ["시안", ...rest];
})();

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedBet, setSelectedBet] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ name: "", title: "", desc: "" });
  const [reportSent, setReportSent] = useState(false);
  const cardRefs = useRef({});

  const filteredBets = filterCategory === "전체" ? BETS : BETS.filter(b => b.category === filterCategory);

  const pickRandom = () => {
    const pool = filterCategory === "전체" ? BETS : filteredBets;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setHighlightedId(pick.id);
    setTimeout(() => { const el = cardRefs.current[pick.id]; if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
    setTimeout(() => setHighlightedId(null), 2800);
  };

  const handleSelectBet = (bet) => { setSelectedBet(bet); setParticipants([]); setSearchQuery(""); setScreen("select-participants"); };
  const toggleParticipant = (name) => setParticipants(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  const removeParticipant = (name) => setParticipants(prev => prev.filter(n => n !== name));
  const submitReport = () => { if (!reportForm.title.trim()) return; setReportSent(true); setTimeout(() => { setReportSent(false); setShowReport(false); setReportForm({ name: "", title: "", desc: "" }); }, 2200); };
  const filteredMembers = searchQuery.trim() ? ALL_MEMBERS.filter(m => m.includes(searchQuery.trim())) : ALL_MEMBERS;

  const GameComponent = selectedBet ? GAME_COMPONENTS[selectedBet.game] : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(140deg,#0d0d1a 0%,#111827 60%,#0f172a 100%)", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", color: "#f0f0f0", position: "relative" }}>
      <div style={{ position: "fixed", top: -100, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 110px" }}>

        {screen === "home" && (
          <>
            <div style={{ padding: "28px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em" }}>☕ PLAB 커피 내기</div>
              </div>
              <button onClick={pickRandom} style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", border: "none", borderRadius: 14, padding: "10px 15px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 18px rgba(249,115,22,0.45)", whiteSpace: "nowrap", transition: "transform 0.12s" }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                🎯 랜덤 추천
              </button>
            </div>
            <div style={{ padding: "18px 20px 0", display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} style={{ background: filterCategory === cat ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.06)", border: filterCategory === cat ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "7px 14px", color: filterCategory === cat ? "#fff" : "#999", fontSize: 13, fontWeight: filterCategory === cat ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.18s" }}>{cat}</button>
              ))}
            </div>
            <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 13 }}>
              {filteredBets.map((bet, i) => (
                <BetCard key={bet.id} bet={bet} onClick={() => handleSelectBet(bet)} delay={i * 55} highlighted={highlightedId === bet.id} cardRef={el => { cardRefs.current[bet.id] = el; }} />
              ))}
            </div>
            <div style={{ textAlign: "center", padding: "32px 0 8px", fontSize: 12, color: "#888", letterSpacing: "0.05em" }}>
              made by 시안
            </div>
          </>
        )}

        {screen === "select-participants" && selectedBet && (
          <div style={{ padding: "24px 20px 0" }}>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 18, padding: 0 }}>← 목록으로</button>
            <div style={{ background: `linear-gradient(135deg,${selectedBet.color}1e,${selectedBet.color}0d)`, border: `1px solid ${selectedBet.color}44`, borderRadius: 22, padding: "18px 20px", marginBottom: 22, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ fontSize: 38 }}>{selectedBet.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedBet.title}</div>
                <div style={{ fontSize: 13, color: "#bbb", marginTop: 3 }}>{selectedBet.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: selectedBet.color, background: `${selectedBet.color}22`, borderRadius: 8, padding: "3px 9px" }}>👥 {selectedBet.recommendedCount}</span>
                  <span style={{ fontSize: 12, color: "#999", background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "3px 9px" }}>🏅 {selectedBet.winnerCount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>참가자 선택</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {participants.length > 0 && (
                  <button onClick={() => setParticipants([])} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "4px 10px", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>전체 해제</button>
                )}
                <div style={{ background: participants.length > 0 ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)", borderRadius: 20, padding: "4px 13px", fontSize: 13, fontWeight: 700, transition: "all 0.3s" }}>{participants.length}명</div>
              </div>
            </div>

            {/* 선택된 참가자 칩 — 항상 공간 확보 */}
            <div style={{ minHeight: 44, display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14, alignContent: "flex-start", padding: "2px 0" }}>
              {participants.map(name => (
                <div key={name} style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)", borderRadius: 20, padding: "6px 10px 6px 13px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, animation: "popIn 0.2s ease" }}>
                  {name}
                  <span onClick={() => removeParticipant(name)} style={{ opacity: 0.7, fontSize: 16, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}>×</span>
                </div>
              ))}
            </div>

            {/* 고정 팀원 목록 */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16, marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: "#777", fontWeight: 600 }}>
                  플랩풋볼 팀원 <span style={{ color: "#555", fontWeight: 400 }}>({ALL_MEMBERS.length}명)</span>
                </div>
              </div>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 이름 검색..."
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "9px 13px", color: "#f0f0f0", fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filteredMembers.map(name => (
                  <div key={name} onClick={() => toggleParticipant(name)}
                    style={{ background: participants.includes(name) ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.08)", border: participants.includes(name) ? "none" : "1px solid rgba(255,255,255,0.12)", borderRadius: 12, width: 64, height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s", userSelect: "none", color: participants.includes(name) ? "#fff" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", flexShrink: 0 }}>
                    {participants.includes(name) ? "✓" : ""}{name}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 80 }} />{/* floating button spacer */}
          </div>
        )}

        {screen === "select-participants" && selectedBet && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 28px", background: "linear-gradient(to top, #0d0d1a 60%, transparent)", zIndex: 50, maxWidth: 480, margin: "0 auto" }}>
            <button disabled={participants.length < 2} onClick={() => setScreen("game")} style={{ width: "100%", background: participants.length >= 2 ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 18, padding: "16px", color: participants.length >= 2 ? "#fff" : "#444", fontSize: 16, fontWeight: 800, cursor: participants.length >= 2 ? "pointer" : "not-allowed", boxShadow: participants.length >= 2 ? "0 6px 24px rgba(139,92,246,0.5)" : "none", transition: "all 0.3s" }}>
              {participants.length < 2 ? "2명 이상 선택하세요" : `☕ ${participants.length}명으로 내기 시작!`}
            </button>
          </div>
        )}

        {screen === "game" && selectedBet && GameComponent && (
          <GameComponent participants={participants} bet={selectedBet} onBack={() => setScreen("select-participants")} onHome={() => setScreen("home")} />
        )}
      </div>

      {screen === "home" && (
        <button onClick={() => setShowReport(true)} style={{ position: "fixed", bottom: 28, right: 24, background: "linear-gradient(135deg,#1e1e2e,#16213e)", border: "1px solid rgba(139,92,246,0.45)", borderRadius: 50, padding: "13px 20px", color: "#c4b5fd", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 6px 28px rgba(0,0,0,0.5)", zIndex: 50, transition: "transform 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          💡 내기 제안하기
        </button>
      )}

      {showReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)" }} onClick={e => { if (e.target === e.currentTarget) setShowReport(false); }}>
          <div style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "28px 28px 0 0", padding: "28px 24px 44px", width: "100%", maxWidth: 480, animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}>
            {reportSent ? (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <div style={{ fontSize: 54, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>제보 완료!</div>
                <div style={{ fontSize: 14, color: "#999" }}>아이디어를 보내주셔서 감사해요.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                  <div><div style={{ fontWeight: 900, fontSize: 20 }}>💡 내기 제안하기</div><div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>새로운 내기 아이디어를 알려주세요!</div></div>
                  <button onClick={() => setShowReport(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 34, height: 34, color: "#aaa", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>제보자 이름 <span style={{ color: "#555" }}>(선택)</span></div><input value={reportForm.name} onChange={e => setReportForm(f => ({ ...f, name: e.target.value }))} placeholder="익명으로 제출해도 돼요" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>내기 이름 <span style={{ color: "#8b5cf6" }}>*</span></div><input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 젓가락 뽑기, 눈치게임..." style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${reportForm.title ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>설명 / 규칙 <span style={{ color: "#555" }}>(선택)</span></div><textarea value={reportForm.desc} onChange={e => setReportForm(f => ({ ...f, desc: e.target.value }))} placeholder="어떻게 진행하는 내기인지 간단히 적어주세요." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} /></div>
                  <button onClick={submitReport} disabled={!reportForm.title.trim()} style={{ background: reportForm.title.trim() ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 15, padding: "14px", color: reportForm.title.trim() ? "#fff" : "#444", fontSize: 15, fontWeight: 800, cursor: reportForm.title.trim() ? "pointer" : "not-allowed", transition: "all 0.25s" }}>제보 보내기 →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeSlideIn { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.6); } 50% { box-shadow: 0 0 0 12px rgba(249,115,22,0); } }
        input::placeholder, textarea::placeholder { color: #444; }
        ::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

function BetCard({ bet, onClick, delay, highlighted, cardRef }) {
  return (
    <div ref={cardRef} onClick={onClick} style={{ background: highlighted ? `${bet.color}18` : "rgba(255,255,255,0.04)", border: highlighted ? `1.5px solid ${bet.color}99` : "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "18px", cursor: "pointer", transition: "all 0.22s", animation: `fadeSlideIn 0.4s ease both`, animationDelay: `${delay}ms`, position: "relative", overflow: "hidden", boxShadow: highlighted ? `0 0 0 3px ${bet.color}44,0 8px 32px ${bet.color}22` : "none" }}
      onMouseEnter={e => { if (!highlighted) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${bet.color}55`; e.currentTarget.style.background = `${bet.color}0f`; } }}
      onMouseLeave={e => { if (!highlighted) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${bet.color},transparent)`, borderRadius: "22px 22px 0 0" }} />
      {highlighted && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center,${bet.color}12 0%,transparent 70%)`, pointerEvents: "none", borderRadius: 22 }} />}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${bet.color}22`, border: `1px solid ${bet.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, animation: highlighted ? "pulse 0.9s ease 2" : "none" }}>{bet.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {bet.title}
              {bet.tag && <span style={{ fontSize: 10, background: bet.tag === "인기" ? "rgba(249,115,22,0.25)" : "rgba(34,197,94,0.2)", color: bet.tag === "인기" ? "#fb923c" : "#4ade80", borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>{bet.tag}</span>}
            </div>
            <span style={{ fontSize: 11, color: bet.color, background: `${bet.color}22`, borderRadius: 8, padding: "3px 8px", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{bet.category}</span>
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 11, lineHeight: 1.5 }}>{bet.description}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#666" }}>👥 추천 {bet.recommendedCount}</span>
            <span style={{ fontSize: 12, color: "#666" }}>🏅 {bet.winnerCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
