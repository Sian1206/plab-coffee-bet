import { useState } from "react";

export default function ChovyGame({ bet, onBack, onHome }) {
  const [phase, setPhase] = useState("input"); // input | playing | done
  const [nameInput, setNameInput] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [records, setRecords] = useState([]); // [{name, score}]
  const [pendingScore, setPendingScore] = useState("");

  const startPlay = () => {
    if (!nameInput.trim()) return;
    setCurrentName(nameInput.trim());
    setNameInput("");
    setPhase("playing");
  };

  const submitScore = () => {
    const s = parseFloat(pendingScore);
    if (isNaN(s) || s <= 0) return;
    const newRecords = [...records, { name: currentName, score: s }]
      .sort((a, b) => b.score - a.score);
    setRecords(newRecords);
    setPendingScore("");
    setPhase("done");
  };

  const playAgain = () => { setPhase("input"); };

  const loser = records.length > 0 ? records[records.length - 1] : null;

  return (
    <div style={{ padding: "24px 20px 0", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 목록으로</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>🏃</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>쵸비 피하기</div>
        <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>각자 한 번씩 플레이하고 기록을 입력하세요!</div>
      </div>

      {/* Leaderboard */}
      {records.length > 0 && (
        <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 18, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee", marginBottom: 10 }}>🏆 현재 순위</div>
          {records.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < records.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ fontSize: 16, minWidth: 28 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <span style={{ flex: 1, fontWeight: 700, color: i === records.length - 1 ? "#f87171" : "#e2e8f0" }}>{r.name}</span>
              <span style={{ fontWeight: 900, color: i === 0 ? "#fbbf24" : "#94a3b8", fontSize: 15 }}>{r.score}초</span>
              {i === records.length - 1 && records.length > 1 && <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>☕</span>}
            </div>
          ))}
        </div>
      )}

      {/* Input phase */}
      {phase === "input" && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ccc" }}>
            {records.length === 0 ? "첫 번째 플레이어 이름을 입력하세요" : "다음 플레이어 이름을 입력하세요"}
          </div>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startPlay()}
            placeholder="이름 입력..."
            style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "11px 14px", color: "#f0f0f0", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          <button onClick={startPlay} disabled={!nameInput.trim()}
            style={{ width: "100%", background: nameInput.trim() ? "linear-gradient(135deg,#06b6d4,#0891b2)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 14, padding: "14px", color: nameInput.trim() ? "#fff" : "#444", fontSize: 15, fontWeight: 800, cursor: nameInput.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            🎮 게임 시작
          </button>
        </div>
      )}

      {/* Playing phase */}
      {phase === "playing" && (
        <div>
          <div style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.35)", borderRadius: 14, padding: "10px 16px", marginBottom: 12, textAlign: "center" }}>
            <span style={{ fontWeight: 800, color: "#22d3ee", fontSize: 16 }}>{currentName}</span>
            <span style={{ color: "#777", fontSize: 13 }}> 님 플레이 중...</span>
          </div>

          {/* iframe */}
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 14, background: "#000" }}>
            <iframe
              src="https://avoid-chovy.lovable.app/avoid"
              style={{ width: "100%", height: 480, border: "none", display: "block" }}
              title="쵸비 피하기"
              allow="autoplay"
            />
          </div>

          {/* Score input */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 10 }}>게임 종료 후 기록한 시간을 입력하세요 (초)</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={pendingScore}
                onChange={e => setPendingScore(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitScore()}
                placeholder="예: 12.5"
                type="number"
                min="0"
                step="0.1"
                style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "11px 14px", color: "#f0f0f0", fontSize: 15, outline: "none" }}
              />
              <button onClick={submitScore} disabled={!pendingScore || isNaN(parseFloat(pendingScore))}
                style={{ background: pendingScore ? "linear-gradient(135deg,#06b6d4,#0891b2)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, padding: "11px 20px", color: pendingScore ? "#fff" : "#444", fontSize: 14, fontWeight: 700, cursor: pendingScore ? "pointer" : "not-allowed" }}>
                기록 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Done phase */}
      {phase === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 16, padding: "14px", textAlign: "center", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>기록 등록 완료!</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#22d3ee" }}>{records[0]?.name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>현재 1위 — {records[0]?.score}초</div>
          </div>
          {loser && records.length > 1 && (
            <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 16, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>☕ 현재 꼴찌: {loser.name} ({loser.score}초)</div>
            </div>
          )}
          <button onClick={playAgain}
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", border: "none", borderRadius: 14, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            다음 플레이어 추가
          </button>
          <button onClick={() => { setRecords([]); setPhase("input"); }}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px", color: "#aaa", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            처음부터 다시
          </button>
        </div>
      )}

      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
