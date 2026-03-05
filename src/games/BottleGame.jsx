import { useState, useRef, useEffect } from "react";
const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];

export default function BottleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [target, setTarget] = useState(null);
  const rotRef = useRef(0);
  const animRef = useRef(null);

  const draw = (rot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Draw people around circle
    const radius = Math.min(cx, cy) - 32;
    const sliceAngle = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);

      // Highlight targeted person
      const isTargeted = target === i;

      ctx.beginPath();
      ctx.arc(px, py, isTargeted ? 24 : 20, 0, 2 * Math.PI);
      ctx.fillStyle = isTargeted ? COLORS[i % COLORS.length] : COLORS[i % COLORS.length] + "44";
      ctx.fill();
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.lineWidth = isTargeted ? 3 : 1.5;
      ctx.stroke();

      ctx.fillStyle = isTargeted ? "#fff" : "#ccc";
      ctx.font = `bold ${n > 6 ? 9 : 11}px 'Pretendard','Apple SD Gothic Neo',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = participants[i].length > 4 ? participants[i].slice(0, 4) : participants[i];
      ctx.fillText(label, px, py);
    }

    // Draw bottle
    const bLen = radius * 0.6;
    const bx = cx + bLen * Math.cos(rot);
    const by = cy + bLen * Math.sin(rot);
    const tx = cx - (bLen * 0.25) * Math.cos(rot);
    const ty = cy - (bLen * 0.25) * Math.sin(rot);

    // Bottle body
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Bottle neck tip
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#60a5fa";
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => { draw(0); }, [participants, target]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setTarget(null);
    const totalRot = (Math.random() * 4 + 6) * 2 * Math.PI;
    const duration = 3500;
    const start = performance.now();
    const startRot = rotRef.current;

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const cur = startRot + totalRot * ease;
      rotRef.current = cur;
      draw(cur);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Find which person the bottle points to
        const finalAngle = ((cur % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const adjustedAngle = (finalAngle + Math.PI / 2) % (2 * Math.PI); // offset for top start
        const idx = Math.round(adjustedAngle / (2 * Math.PI / n)) % n;
        setTarget(idx);
        setSpinning(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <GameLayout bet={bet} onBack={onBack} onHome={onHome}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <canvas ref={canvasRef} width={300} height={300} style={{ display: "block" }} />

        {target !== null && (
          <div style={{ textAlign: "center", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🫵</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: COLORS[target % COLORS.length] }}>{participants[target]}</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>지목됐어요!</div>
          </div>
        )}

        <button onClick={spin} disabled={spinning} style={{ background: spinning ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#f43f5e,#e11d48)", border: "none", borderRadius: 18, padding: "16px 48px", color: spinning ? "#555" : "#fff", fontSize: 18, fontWeight: 800, cursor: spinning ? "not-allowed" : "pointer", boxShadow: !spinning ? "0 6px 24px rgba(244,63,94,0.5)" : "none", transition: "all 0.3s" }}>
          {spinning ? "돌아가는 중..." : target !== null ? "다시 돌리기" : "🫵 병 돌리기"}
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
