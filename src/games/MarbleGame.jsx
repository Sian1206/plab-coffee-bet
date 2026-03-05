import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

export default function MarbleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [phase, setPhase] = useState("idle"); // idle | spinning | done
  const [marblePos, setMarblePos] = useState({ x: 0.5, y: 0 });
  const [winner, setWinner] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const animRef = useRef(null);

  const slotWidth = 1 / n;

  const spin = () => {
    if (phase === "spinning") return;
    setPhase("spinning");
    setWinner(null);
    setWinnerIdx(null);

    const targetSlot = Math.floor(Math.random() * n);
    const targetX = (targetSlot + 0.5) * slotWidth;
    const duration = 2800;
    const start = performance.now();

    // Marble path: starts top center, bounces around, lands in slot
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      // Horizontal: oscillate then converge to target
      const oscillations = 4;
      const osc = Math.sin(t * oscillations * Math.PI) * (1 - ease) * 0.4;
      const x = 0.5 + (targetX - 0.5) * ease + osc;

      // Vertical: drop with bounces
      const bounces = Math.sin(t * Math.PI * 3) * Math.max(0, 1 - t * 1.5) * 0.15;
      const y = ease + bounces * (1 - ease);

      setMarblePos({ x: Math.max(0.05, Math.min(0.95, x)), y: Math.min(0.88, y) });

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setWinnerIdx(targetSlot);
        setWinner(participants[targetSlot]);
        setPhase("done");
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const W = 320, H = 320;

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

        {/* Board */}
        <div style={{ position: "relative", width: W, height: H, background: "linear-gradient(180deg,#1a1a2e,#0d0d1a)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
          {/* Pegs */}
          {[0.25, 0.45, 0.65].map((row, ri) =>
            Array.from({ length: ri % 2 === 0 ? 5 : 4 }).map((_, ci) => {
              const x = (ri % 2 === 0 ? (ci + 0.5) / 5 : (ci + 1) / 5) * W;
              const y = row * H;
              return <div key={`${ri}-${ci}`} style={{ position: "absolute", left: x - 4, top: y - 4, width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.3)", boxShadow: "0 0 6px rgba(255,255,255,0.2)" }} />;
            })
          )}

          {/* Slot dividers + labels */}
          {Array.from({ length: n }).map((_, i) => {
            const x = (i + 1) * (W / n);
            const isWinner = phase === "done" && winnerIdx === i;
            return (
              <div key={i}>
                {i < n - 1 && <div style={{ position: "absolute", left: x - 1, bottom: 0, top: "70%", width: 2, background: "rgba(255,255,255,0.15)" }} />}
                <div style={{ position: "absolute", left: i * (W / n), bottom: 0, width: W / n, height: "28%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isWinner ? `${COLORS[i % COLORS.length]}33` : "transparent", transition: "background 0.4s", borderTop: `2px solid ${isWinner ? COLORS[i % COLORS.length] : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ fontSize: n > 5 ? 9 : 11, fontWeight: 700, color: isWinner ? COLORS[i % COLORS.length] : "#888", textAlign: "center", padding: "0 2px", wordBreak: "break-all" }}>{participants[i]}</div>
                </div>
              </div>
            );
          })}

          {/* Marble */}
          <div style={{ position: "absolute", left: marblePos.x * W - 12, top: marblePos.y * H * 0.72 + 4, width: 24, height: 24, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff 0%, #f97316 40%, #c2410c 100%)", boxShadow: "0 4px 12px rgba(249,115,22,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)", transition: phase === "spinning" ? "none" : "all 0.1s", zIndex: 10 }} />
        </div>

        {winner && (
          <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎰</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{winner}</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>구슬이 선택했어요!</div>
          </div>
        )}

        <button onClick={spin} disabled={phase === "spinning"} style={{ background: phase === "spinning" ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 18, padding: "16px 48px", color: phase === "spinning" ? "#555" : "#fff", fontSize: 18, fontWeight: 800, cursor: phase === "spinning" ? "not-allowed" : "pointer", boxShadow: phase !== "spinning" ? "0 6px 24px rgba(139,92,246,0.5)" : "none", transition: "all 0.3s" }}>
          {phase === "spinning" ? "구슬 이동 중..." : winner ? "다시 굴리기" : "🎰 구슬 굴리기"}
        </button>
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
