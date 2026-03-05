import { useState, useRef, useEffect, useCallback } from "react";

const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const BOARD_W = 340;
const BOARD_H = 900; // 화면보다 훨씬 큰 높이
const PIN_ROWS = 14;
const PIN_COLS = 7;

function generatePins() {
  const pins = [];
  for (let row = 0; row < PIN_ROWS; row++) {
    const cols = row % 2 === 0 ? PIN_COLS : PIN_COLS - 1;
    const offsetX = row % 2 === 0 ? 0 : (BOARD_W / PIN_COLS) / 2;
    for (let col = 0; col < cols; col++) {
      pins.push({
        x: offsetX + col * (BOARD_W / PIN_COLS) + (BOARD_W / PIN_COLS) / 2,
        y: 80 + row * ((BOARD_H - 160) / PIN_ROWS),
      });
    }
  }
  return pins;
}

const PINS = generatePins();

function createMarble(idx, total) {
  const spread = BOARD_W * 0.6;
  const startX = BOARD_W / 2 - spread / 2 + (idx / Math.max(total - 1, 1)) * spread;
  return {
    id: idx,
    x: startX + (Math.random() - 0.5) * 20,
    y: 20,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 0,
    landed: false,
    landedTime: null,
    rank: null,
  };
}

export default function MarbleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [rankMode, setRankMode] = useState("last"); // first | last
  const [rankings, setRankings] = useState([]);
  const marblesRef = useRef([]);
  const animRef = useRef(null);
  const rankCountRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    // Background
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Pins
    PINS.forEach(pin => {
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Slot dividers at bottom
    for (let i = 1; i < n; i++) {
      const x = i * (BOARD_W / n);
      ctx.beginPath();
      ctx.moveTo(x, BOARD_H - 80);
      ctx.lineTo(x, BOARD_H);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Slot labels at bottom
    for (let i = 0; i < n; i++) {
      const slotX = i * (BOARD_W / n) + (BOARD_W / n) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `bold ${n > 6 ? 9 : 11}px 'Pretendard',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = participants[i].length > 4 ? participants[i].slice(0, 3) + "…" : participants[i];
      ctx.fillText(label, slotX, BOARD_H - 40);
    }

    // Marbles
    marblesRef.current.forEach((m) => {
      if (m.landed) return;
      const color = COLORS[m.id % COLORS.length];
      // Glow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 11, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      // Shine
      ctx.beginPath();
      ctx.arc(m.x - 3, m.y - 3, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
      // Name
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${n > 6 ? 7 : 8}px 'Pretendard',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = participants[m.id].length > 3 ? participants[m.id].slice(0, 2) + "…" : participants[m.id];
      ctx.fillText(label, m.x, m.y + 18);
    });

    // Landed marbles shown at bottom
    marblesRef.current.forEach((m) => {
      if (!m.landed) return;
      const color = COLORS[m.id % COLORS.length];
      const slotX = m.finalSlot * (BOARD_W / n) + (BOARD_W / n) / 2;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(slotX, BOARD_H - 70, 11, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = `bold 8px 'Pretendard',sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(m.rank, slotX, BOARD_H - 70);
    });
  }, [participants, n]);

  const update = useCallback(() => {
    const marbles = marblesRef.current;
    const gravity = 0.18;
    const friction = 0.985;
    let allLanded = marbles.every(m => m.landed);
    if (allLanded) return true;

    marbles.forEach(m => {
      if (m.landed) return;
      m.vy += gravity;
      m.vx *= friction;
      m.x += m.vx;
      m.y += m.vy;

      // Wall bounce
      if (m.x < 11) { m.x = 11; m.vx = Math.abs(m.vx) * 0.7 + 0.5; }
      if (m.x > BOARD_W - 11) { m.x = BOARD_W - 11; m.vx = -Math.abs(m.vx) * 0.7 - 0.5; }

      // Pin collision
      PINS.forEach(pin => {
        const dx = m.x - pin.x;
        const dy = m.y - pin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 16) {
          const nx = dx / dist, ny = dy / dist;
          const dot = m.vx * nx + m.vy * ny;
          m.vx = (m.vx - 2 * dot * nx) * 0.75;
          m.vy = (m.vy - 2 * dot * ny) * 0.75 + 0.5;
          // Random kick for chaos
          m.vx += (Math.random() - 0.5) * 1.8;
          m.x = pin.x + nx * 17;
          m.y = pin.y + ny * 17;
        }
      });

      // Marble-marble collision
      marbles.forEach(other => {
        if (other.id === m.id || other.landed) return;
        const dx = m.x - other.x;
        const dy = m.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 22 && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          const dvx = m.vx - other.vx, dvy = m.vy - other.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot < 0) {
            m.vx -= dot * nx * 0.6;
            m.vy -= dot * ny * 0.6;
            other.vx += dot * nx * 0.6;
            other.vy += dot * ny * 0.6;
          }
        }
      });

      // Land at bottom
      if (m.y >= BOARD_H - 85) {
        m.y = BOARD_H - 85;
        m.vx = 0; m.vy = 0;
        m.landed = true;
        rankCountRef.current += 1;
        m.rank = rankCountRef.current;
        m.finalSlot = Math.floor((m.x / BOARD_W) * n);
        m.finalSlot = Math.max(0, Math.min(n - 1, m.finalSlot));
        setRankings(prev => [...prev, { name: participants[m.id], rank: m.rank, color: COLORS[m.id % COLORS.length] }]);
        // Auto-scroll to bottom as marbles land
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: BOARD_H, behavior: "smooth" });
        }
      }
    });

    return marbles.every(m => m.landed);
  }, [participants, n]);

  const startGame = () => {
    rankCountRef.current = 0;
    marblesRef.current = Array.from({ length: n }, (_, i) => createMarble(i, n));
    setRankings([]);
    setPhase("running");

    // Scroll to top when starting
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });

    const loop = () => {
      const done = update();
      draw();
      if (!done) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setPhase("done");
      }
    };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  const loser = phase === "done" ? (rankMode === "first" ? rankings[0] : rankings[rankings.length - 1]) : null;

  const reset = () => {
    setPhase("idle");
    setRankings([]);
    marblesRef.current = [];
    rankCountRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => draw(), 50);
  };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{bet.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{bet.title}</div>
      </div>

      {/* 룰 선택 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" }}>
        <button onClick={() => setRankMode("first")} style={{ background: rankMode === "first" ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "8px 18px", color: rankMode === "first" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
          🥇 첫 번째 착지가 커피
        </button>
        <button onClick={() => setRankMode("last")} style={{ background: rankMode === "last" ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "8px 18px", color: rankMode === "last" ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
          🐢 마지막 착지가 커피
        </button>
      </div>

      {/* Canvas Board - 스크롤 가능 */}
      <div ref={scrollRef} style={{ width: BOARD_W, maxHeight: 500, overflowY: "auto", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", margin: "0 auto 16px", scrollbarWidth: "none" }}>
        <canvas ref={canvasRef} width={BOARD_W} height={BOARD_H} style={{ display: "block" }} />
      </div>

      {/* Rankings */}
      {rankings.length > 0 && (
        <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {rankings.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${r.color}18`, border: `1px solid ${r.color}44`, borderRadius: 12, padding: "8px 14px", animation: "popIn 0.3s ease" }}>
              <span style={{ fontSize: 16, minWidth: 28 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
              <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{i === 0 ? "첫 착지" : i === rankings.length - 1 && phase === "done" ? "마지막 착지" : ""}</span>
            </div>
          ))}
        </div>
      )}

      {phase === "done" && loser && (
        <div style={{ textAlign: "center", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 18, padding: "18px", marginBottom: 16, animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>☕</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: loser.color }}>{loser.name}</div>
          <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>커피 한 잔 쏘세요!</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={phase === "idle" || phase === "done" ? startGame : undefined} disabled={phase === "running"} style={{ flex: 2, background: phase === "running" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 16, padding: "15px", color: phase === "running" ? "#555" : "#fff", fontSize: 16, fontWeight: 800, cursor: phase === "running" ? "not-allowed" : "pointer", boxShadow: phase !== "running" ? "0 4px 20px rgba(139,92,246,0.4)" : "none", transition: "all 0.3s" }}>
          {phase === "running" ? "구슬 떨어지는 중..." : phase === "done" ? "🔄 다시 하기" : "🎰 구슬 떨어뜨리기"}
        </button>
        {phase === "done" && (
          <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "15px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>초기화</button>
        )}
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
