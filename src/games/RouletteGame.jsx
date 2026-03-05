import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e","#a78bfa","#34d399"];

export default function RouletteGame({ participants, bet, onBack, onHome }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const rotRef = useRef(0);
  const animRef = useRef(null);
  const n = participants.length;
  const sliceAngle = (2 * Math.PI) / n;

  const drawWheel = (rot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#111"; ctx.fill(); ctx.restore();
    for (let i = 0; i < n; i++) {
      const start = rot + i * sliceAngle, end = start + sliceAngle;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = "#0d0d1a"; ctx.lineWidth = 2; ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right"; ctx.fillStyle = "#fff";
      ctx.font = `bold ${n > 6 ? 11 : 14}px 'Pretendard',sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4;
      ctx.fillText(participants[i], r - 12, 5);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#0d0d1a"; ctx.fill();
    ctx.strokeStyle = "#fff3"; ctx.lineWidth = 2; ctx.stroke();
  };

  useEffect(() => { drawWheel(0); }, [participants]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true); setWinner(null);
    const totalRot = (Math.random() * 4 + 9) * 2 * Math.PI;
    const duration = 6000;
    const start = performance.now();
    const startRot = rotRef.current;

    // 순수 감속만 - 절대 빨라지지 않음. easeOutQuart
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const cur = startRot + totalRot * easeOut(t);
      rotRef.current = cur;
      drawWheel(cur);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const finalAngle = (cur % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((2 * Math.PI - finalAngle) % (2 * Math.PI)) / sliceAngle) % n;
        setWinner(participants[idx]);
        setSpinning(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative" }}>
          <canvas ref={canvasRef} width={300} height={300} style={{ display: "block", borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "50%", right: -6, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderRight: "24px solid #fff", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        </div>
        {winner && (
          <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>☕</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{winner}</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>커피 한 잔 쏘세요!</div>
          </div>
        )}
        <button onClick={spin} disabled={spinning} style={{ background: spinning ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#f97316,#ef4444)", border: "none", borderRadius: 18, padding: "16px 48px", color: spinning ? "#555" : "#fff", fontSize: 18, fontWeight: 800, cursor: spinning ? "not-allowed" : "pointer", boxShadow: spinning ? "none" : "0 6px 24px rgba(249,115,22,0.5)", transition: "all 0.3s" }}>
          {spinning ? "돌아가는 중..." : winner ? "다시 돌리기" : "🎡 룰렛 돌리기"}
        </button>
      </div>
    </GameLayout>
  );
}

function GameLayout({ bet, onBack, onHome, children }) {
  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>
      {children}
      <style>{`@keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
