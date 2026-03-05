import { useState, useRef } from "react";
import RouletteGame from "./games/RouletteGame";
import MarbleGame from "./games/MarbleGame";
import LadderGame from "./games/LadderGame";
import CardGame from "./games/CardGame";
import DiceGame from "./games/DiceGame";
import RpsGame from "./games/RpsGame";
import NumberGame from "./games/NumberGame";
import BottleGame from "./games/BottleGame";

const BETS = [
  { id: 1, emoji: "🎡", title: "룰렛 돌리기", description: "참가자 이름을 넣고 룰렛을 돌려 한 명을 뽑아요.", recommendedCount: "2~10명", winnerCount: "1명", category: "뽑기", color: "#f97316", tag: "인기", game: "roulette" },
  { id: 2, emoji: "🎰", title: "마블 룰렛", description: "구슬이 튀어 랜덤 번호에 꽂히는 마블 방식으로 승자를 결정해요.", recommendedCount: "2~8명", winnerCount: "1명", category: "뽑기", color: "#8b5cf6", tag: "신규", game: "marble" },
  { id: 3, emoji: "🪜", title: "사다리 타기", description: "클래식 사다리 게임! 각자 줄을 고르고 결과를 확인하세요.", recommendedCount: "2~8명", winnerCount: "결과에 따라", category: "사다리", color: "#22c55e", tag: null, game: "ladder" },
  { id: 4, emoji: "🃏", title: "카드 뒤집기", description: "뒤집어진 카드 중 특정 카드를 고른 사람이 당첨(혹은 꼴찌)!", recommendedCount: "2~6명", winnerCount: "1명", category: "카드", color: "#ec4899", tag: null, game: "card" },
  { id: 5, emoji: "🎲", title: "주사위 대결", description: "모두가 주사위를 굴려 가장 높은 숫자가 나온 사람이 승리!", recommendedCount: "2~6명", winnerCount: "최고점 1명", category: "주사위", color: "#eab308", tag: null, game: "dice" },
  { id: 6, emoji: "✂️", title: "가위바위보 토너먼트", description: "토너먼트 방식으로 진행되는 팀 가위바위보. 최후의 1인을 가려요.", recommendedCount: "4~16명", winnerCount: "최종 1명", category: "대결", color: "#14b8a6", tag: null, game: "rps" },
  { id: 7, emoji: "🔢", title: "숫자 추첨", description: "범위 내 숫자를 각자 고른 뒤, 랜덤 숫자와 가장 가까운 사람이 당첨!", recommendedCount: "2~20명", winnerCount: "최근접 1명", category: "추첨", color: "#60a5fa", tag: null, game: "number" },
  { id: 8, emoji: "🫵", title: "지목 돌리기", description: "병을 돌려 멈춘 방향에 있는 사람이 미션 수행!", recommendedCount: "3~10명", winnerCount: "지목된 1명", category: "대결", color: "#f43f5e", tag: null, game: "bottle" },
];

const CATEGORIES = ["전체", "뽑기", "사다리", "카드", "주사위", "대결", "추첨"];

const GAME_COMPONENTS = { roulette: RouletteGame, marble: MarbleGame, ladder: LadderGame, card: CardGame, dice: DiceGame, rps: RpsGame, number: NumberGame, bottle: BottleGame };

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedBet, setSelectedBet] = useState(null);
  const [savedMembers, setSavedMembers] = useState(["김민준", "이서연", "박지호", "최유나", "정태양"]);
  const [participants, setParticipants] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [tempNewName, setTempNewName] = useState("");
  const [filterCategory, setFilterCategory] = useState("전체");
  const [deletingMember, setDeletingMember] = useState(null);
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

  const handleSelectBet = (bet) => { setSelectedBet(bet); setParticipants([]); setScreen("select-participants"); };
  const toggleParticipant = (name) => setParticipants(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  const addTempMember = () => { const n = tempNewName.trim(); if (!n) return; if (!participants.includes(n)) setParticipants(p => [...p, n]); setTempNewName(""); };
  const saveMember = () => { const n = newMemberName.trim(); if (!n || savedMembers.includes(n)) return; setSavedMembers(p => [...p, n]); setNewMemberName(""); };
  const removeSavedMember = (name) => { setSavedMembers(p => p.filter(n => n !== name)); setParticipants(p => p.filter(n => n !== name)); setDeletingMember(null); };
  const submitReport = () => { if (!reportForm.title.trim()) return; setReportSent(true); setTimeout(() => { setReportSent(false); setShowReport(false); setReportForm({ name: "", title: "", desc: "" }); }, 2200); };

  const GameComponent = selectedBet ? GAME_COMPONENTS[selectedBet.game] : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(140deg,#0d0d1a 0%,#111827 60%,#0f172a 100%)", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", color: "#f0f0f0", position: "relative" }}>
      <div style={{ position: "fixed", top: -100, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 110px" }}>

        {/* HOME */}
        {screen === "home" && (
          <>
            <div style={{ padding: "28px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>COMPANY BET</div>
                <div style={{ fontSize: 27, fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em" }}>우리끼리<br />내기 🎲</div>
              </div>
              <button onClick={pickRandom} style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", border: "none", borderRadius: 14, padding: "10px 15px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 18px rgba(249,115,22,0.45)", whiteSpace: "nowrap", transition: "transform 0.12s" }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                🎯 랜덤 추천
              </button>
            </div>

            <div style={{ padding: "18px 20px 0", display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} style={{ background: filterCategory === cat ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.06)", border: filterCategory === cat ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "7px 14px", color: filterCategory === cat ? "#fff" : "#999", fontSize: 13, fontWeight: filterCategory === cat ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.18s" }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 13 }}>
              {filteredBets.map((bet, i) => (
                <BetCard key={bet.id} bet={bet} onClick={() => handleSelectBet(bet)} delay={i * 55} highlighted={highlightedId === bet.id} cardRef={el => { cardRefs.current[bet.id] = el; }} />
              ))}
            </div>
          </>
        )}

        {/* SELECT PARTICIPANTS */}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>참가자 선택</div>
              <div style={{ background: participants.length > 0 ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)", borderRadius: 20, padding: "4px 13px", fontSize: 13, fontWeight: 700, transition: "all 0.3s" }}>{participants.length}명 선택됨</div>
            </div>

            {participants.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                {participants.map(name => (
                  <div key={name} onClick={() => toggleParticipant(name)} style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)", borderRadius: 20, padding: "6px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, animation: "popIn 0.2s ease" }}>
                    {name} <span style={{ opacity: 0.75, fontSize: 15, lineHeight: 1 }}>×</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "#777", fontWeight: 600, marginBottom: 11 }}>저장된 팀원</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 13 }}>
                {savedMembers.map(name => (
                  <div key={name} style={{ position: "relative" }}>
                    <div onClick={() => deletingMember !== name && toggleParticipant(name)} style={{ background: participants.includes(name) ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.08)", border: participants.includes(name) ? "none" : "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "8px 34px 8px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.18s", userSelect: "none" }}>
                      {participants.includes(name) ? "✓ " : ""}{name}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setDeletingMember(deletingMember === name ? null : name); }} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: deletingMember === name ? "#ef4444" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 24, height: 24, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", fontWeight: 800 }}>
                      {deletingMember === name ? "✓" : "×"}
                    </button>
                    {deletingMember === name && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#1a1a2e", border: "1px solid #ef4444", borderRadius: 12, padding: "10px 12px", fontSize: 12, zIndex: 20, whiteSpace: "nowrap", boxShadow: "0 8px 28px rgba(0,0,0,0.6)" }}>
                        <div style={{ color: "#ccc", marginBottom: 8 }}>"{name}" 삭제할까요?</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => removeSavedMember(name)} style={{ background: "#ef4444", border: "none", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>삭제</button>
                          <button onClick={() => setDeletingMember(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "5px 10px", color: "#ccc", fontSize: 12, cursor: "pointer" }}>취소</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveMember()} placeholder="이름 입력 후 저장..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "9px 13px", color: "#f0f0f0", fontSize: 13, outline: "none" }} />
                <button onClick={saveMember} style={{ background: "rgba(99,102,241,0.28)", border: "1px solid rgba(99,102,241,0.38)", borderRadius: 12, padding: "9px 15px", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16, marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: "#777", fontWeight: 600, marginBottom: 10 }}>이번 내기만 참여 (저장 안 함)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tempNewName} onChange={e => setTempNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addTempMember()} placeholder="이름 입력..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "9px 13px", color: "#f0f0f0", fontSize: 13, outline: "none" }} />
                <button onClick={addTempMember} style={{ background: "rgba(236,72,153,0.18)", border: "1px solid rgba(236,72,153,0.28)", borderRadius: 12, padding: "9px 15px", color: "#f9a8d4", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
              </div>
            </div>

            <button disabled={participants.length < 2} onClick={() => setScreen("game")} style={{ width: "100%", background: participants.length >= 2 ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 18, padding: "16px", color: participants.length >= 2 ? "#fff" : "#444", fontSize: 16, fontWeight: 800, cursor: participants.length >= 2 ? "pointer" : "not-allowed", boxShadow: participants.length >= 2 ? "0 6px 24px rgba(139,92,246,0.4)" : "none", transition: "all 0.3s", letterSpacing: "0.02em" }}>
              {participants.length < 2 ? "2명 이상 선택하세요" : `🎲 ${participants.length}명으로 내기 시작!`}
            </button>
          </div>
        )}

        {/* GAME */}
        {screen === "game" && selectedBet && GameComponent && (
          <GameComponent
            participants={participants}
            bet={selectedBet}
            onBack={() => setScreen("select-participants")}
            onHome={() => setScreen("home")}
          />
        )}
      </div>

      {screen === "home" && (
        <button onClick={() => setShowReport(true)} style={{ position: "fixed", bottom: 28, right: 24, background: "linear-gradient(135deg,#1e1e2e,#16213e)", border: "1px solid rgba(139,92,246,0.45)", borderRadius: 50, padding: "13px 20px", color: "#c4b5fd", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 6px 28px rgba(0,0,0,0.5),0 0 0 1px rgba(139,92,246,0.2)", zIndex: 50, transition: "transform 0.15s,box-shadow 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          💡 내기 제보하기
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
                  <div><div style={{ fontWeight: 900, fontSize: 20 }}>💡 내기 제보하기</div><div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>새로운 내기 아이디어를 알려주세요!</div></div>
                  <button onClick={() => setShowReport(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 34, height: 34, color: "#aaa", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>제보자 이름 <span style={{ color: "#555" }}>(선택)</span></div><input value={reportForm.name} onChange={e => setReportForm(f => ({ ...f, name: e.target.value }))} placeholder="익명으로 제출해도 돼요" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>내기 이름 <span style={{ color: "#8b5cf6" }}>*</span></div><input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 젓가락 뽑기, 눈치게임..." style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${reportForm.title ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} /></div>
                  <div><div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6 }}>설명 / 규칙 <span style={{ color: "#555" }}>(선택)</span></div><textarea value={reportForm.desc} onChange={e => setReportForm(f => ({ ...f, desc: e.target.value }))} placeholder="어떻게 진행하는 내기인지 간단히 적어주세요." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} /></div>
                  <button onClick={submitReport} disabled={!reportForm.title.trim()} style={{ background: reportForm.title.trim() ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 15, padding: "14px", color: reportForm.title.trim() ? "#fff" : "#444", fontSize: 15, fontWeight: 800, cursor: reportForm.title.trim() ? "pointer" : "not-allowed", boxShadow: reportForm.title.trim() ? "0 4px 20px rgba(139,92,246,0.4)" : "none", transition: "all 0.25s", marginTop: 2 }}>제보 보내기 →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeSlideIn { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
