import { useState, useRef, useEffect, useCallback } from "react";

const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const BOARD_W = 340;
const BOARD_H = 920;
const MARBLE_R = 10;
const LANDING_X = BOARD_W / 2;
const LANDING_Y = BOARD_H - 50;

function generatePins() {
  const pins = [];
  const rows = 13, cols = 6;
  for (let r = 0; r < rows; r++) {
    const count = r % 2 === 0 ? cols : cols - 1;
    const offsetX = r % 2 === 0 ? 0 : (BOARD_W / cols) / 2;
    for (let c = 0; c < count; c++) {
      pins.push({ x: offsetX + c * (BOARD_W / cols) + (BOARD_W / cols) / 2, y: 90 + r * 58 });
    }
  }
  return pins;
}

const PINS = generatePins();
const OBSTACLES = [
  { type: "ball", x: 75, y: 210 }, { type: "ball", x: 265, y: 370 },
  { type: "ball", x: 130, y: 530 }, { type: "ball", x: 230, y: 670 },
  { type: "line", x1: 55, y1: 300, x2: 125, y2: 330 },
  { type: "line", x1: 215, y1: 450, x2: 285, y2: 420 },
  { type: "line", x1: 95, y1: 610, x2: 165, y2: 580 },
  { type: "line", x1: 185, y1: 740, x2: 255, y2: 770 },
];

function createMarble(idx, total) {
  const spread = BOARD_W * 0.55;
  const startX = BOARD_W/2 - spread/2 + (idx / Math.max(total-1,1)) * spread;
  return { id: idx, x: startX + (Math.random()-0.5)*15, y: 18, vx: (Math.random()-0.5)*1.2, vy: 0.5, landed: false, rank: null };
}

export default function MarbleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [loserRank, setLoserRank] = useState(1);
  const [rankings, setRankings] = useState([]);
  const marblesRef = useRef([]);
  const animRef = useRef(null);
  const rankCountRef = useRef(0);
  const landedRef = useRef([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    PINS.forEach(pin => {
      ctx.beginPath(); ctx.arc(pin.x, pin.y, 5, 0, 2*Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
    });

    OBSTACLES.forEach(obs => {
      if (obs.type === "ball") {
        ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("⚽", obs.x, obs.y);
      } else {
        ctx.beginPath(); ctx.moveTo(obs.x1, obs.y1); ctx.lineTo(obs.x2, obs.y2);
        ctx.strokeStyle = "rgba(255,200,100,0.6)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
      }
    });

    // Funnel lines
    ctx.beginPath(); ctx.moveTo(0, BOARD_H-105); ctx.lineTo(LANDING_X-22, LANDING_Y-14);
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BOARD_W, BOARD_H-105); ctx.lineTo(LANDING_X+22, LANDING_Y-14);
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2; ctx.stroke();

    // Landed marbles stacked
    landedRef.current.forEach((lm, i) => {
      const total = landedRef.current.length;
      const mx = LANDING_X + (i - (total-1)/2) * (MARBLE_R*2 + 3);
      const color = COLORS[lm.id % COLORS.length];
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(mx, LANDING_Y, MARBLE_R, 0, 2*Math.PI);
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = `bold 8px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(lm.rank, mx, LANDING_Y);
      ctx.font = `bold 7px 'Pretendard',sans-serif`; ctx.fillStyle = "rgba(255,255,255,0.65)";
      const label = participants[lm.id].length > 3 ? participants[lm.id].slice(0,3)+"…" : participants[lm.id];
      ctx.fillText(label, mx, LANDING_Y + MARBLE_R + 9);
    });

    // Moving marbles
    marblesRef.current.forEach(m => {
      if (m.landed) return;
      const color = COLORS[m.id % COLORS.length];
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(m.x, m.y, MARBLE_R, 0, 2*Math.PI);
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(m.x-3, m.y-3, 3.5, 0, 2*Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const label = participants[m.id].length > 3 ? participants[m.id].slice(0,3)+"…" : participants[m.id];
      ctx.fillText(label, m.x, m.y + MARBLE_R + 9);
    });
  }, [participants]);

  const update = useCallback(() => {
    const marbles = marblesRef.current;
    marbles.forEach(m => {
      if (m.landed) return;
      m.vy += 0.2; m.vx *= 0.988;
      m.x += m.vx; m.y += m.vy;

      // Strong wall repulsion — no sticking
      if (m.x < MARBLE_R + 3) { m.x = MARBLE_R + 3; m.vx = Math.abs(m.vx) * 0.75 + 1.2; }
      if (m.x > BOARD_W - MARBLE_R - 3) { m.x = BOARD_W - MARBLE_R - 3; m.vx = -(Math.abs(m.vx) * 0.75 + 1.2); }

      // Funnel toward center near bottom
      if (m.y > BOARD_H - 130) { m.vx += (LANDING_X - m.x) * 0.05; }

      PINS.forEach(pin => {
        const dx = m.x-pin.x, dy = m.y-pin.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < MARBLE_R+5 && dist > 0) {
          const nx = dx/dist, ny = dy/dist, dot = m.vx*nx+m.vy*ny;
          m.vx = (m.vx-2*dot*nx)*0.7; m.vy = (m.vy-2*dot*ny)*0.7 + 0.4;
          m.vx += (Math.random()-0.5)*2.2;
          m.x = pin.x+nx*(MARBLE_R+6); m.y = pin.y+ny*(MARBLE_R+6);
        }
      });

      OBSTACLES.forEach(obs => {
        if (obs.type === "ball") {
          const dx = m.x-obs.x, dy = m.y-obs.y, dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < MARBLE_R+13 && dist > 0) {
            const nx = dx/dist, ny = dy/dist, dot = m.vx*nx+m.vy*ny;
            m.vx = (m.vx-2*dot*nx)*0.78 + (Math.random()-0.5)*2.5;
            m.vy = (m.vy-2*dot*ny)*0.78;
            m.x = obs.x+nx*(MARBLE_R+14); m.y = obs.y+ny*(MARBLE_R+14);
          }
        } else if (obs.type === "line") {
          const lx = obs.x2-obs.x1, ly = obs.y2-obs.y1, len2 = lx*lx+ly*ly;
          const t = Math.max(0, Math.min(1, ((m.x-obs.x1)*lx+(m.y-obs.y1)*ly)/len2));
          const cx = obs.x1+t*lx, cy = obs.y1+t*ly;
          const dx = m.x-cx, dy = m.y-cy, dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < MARBLE_R+3 && dist > 0) {
            const nx = dx/dist, ny = dy/dist, dot = m.vx*nx+m.vy*ny;
            if (dot < 0) { m.vx -= 1.6*dot*nx; m.vy -= 1.6*dot*ny; }
            m.x = cx+nx*(MARBLE_R+4); m.y = cy+ny*(MARBLE_R+4);
          }
        }
      });

      marbles.forEach(other => {
        if (other.id === m.id || other.landed) return;
        const dx = m.x-other.x, dy = m.y-other.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < MARBLE_R*2+1 && dist > 0) {
          const nx = dx/dist, ny = dy/dist;
          const dot = (m.vx-other.vx)*nx + (m.vy-other.vy)*ny;
          if (dot < 0) { m.vx -= dot*nx*0.55; m.vy -= dot*ny*0.55; other.vx += dot*nx*0.55; other.vy += dot*ny*0.55; }
        }
      });

      if (m.y >= BOARD_H - 65) {
        m.landed = true; rankCountRef.current += 1; m.rank = rankCountRef.current;
        landedRef.current = [...landedRef.current, { id: m.id, rank: m.rank }];
        setRankings(prev => [...prev, { name: participants[m.id], rank: m.rank, color: COLORS[m.id%COLORS.length], id: m.id }]);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: BOARD_H, behavior: "smooth" });
      }
    });
    return marbles.every(m => m.landed);
  }, [participants]);

  const startGame = () => {
    rankCountRef.current = 0; landedRef.current = [];
    marblesRef.current = Array.from({ length: n }, (_, i) => createMarble(i, n));
    setRankings([]); setPhase("running");
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    const loop = () => { if (update()) setPhase("done"); else animRef.current = requestAnimationFrame(loop); draw(); };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => { draw(); return () => { if (animRef.current) cancelAnimationFrame(animRef.current); }; }, [draw]);

  const loser = phase === "done" ? rankings.find(r => r.rank === Math.min(loserRank, n)) : null;
  const reset = () => { setPhase("idle"); setRankings([]); marblesRef.current = []; landedRef.current = []; rankCountRef.current = 0; setTimeout(() => draw(), 50); };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 30, marginBottom: 3 }}>{bet.emoji}</div>
        <div style={{ fontSize: 19, fontWeight: 900 }}>{bet.title}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#777", marginBottom: 6, textAlign: "center" }}>☕ 몇 번째로 떨어진 구슬이 커피?</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {Array.from({ length: n }, (_, i) => i+1).map(rank => (
            <button key={rank} onClick={() => setLoserRank(rank)} style={{ background: loserRank === rank ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 11px", color: loserRank === rank ? "#fff" : "#aaa", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
              {rank === 1 ? "🥇1등" : rank === n ? `🐢${rank}등` : `${rank}등`}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} style={{ width: BOARD_W, maxHeight: 460, overflowY: "auto", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", margin: "0 auto 12px", scrollbarWidth: "none" }}>
        <canvas ref={canvasRef} width={BOARD_W} height={BOARD_H} style={{ display: "block" }} />
      </div>

      {rankings.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 5 }}>
          {rankings.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${r.color}18`, border: `1px solid ${r.color}44`, borderRadius: 12, padding: "7px 13px", animation: "popIn 0.3s ease" }}>
              <span style={{ fontSize: 15, minWidth: 28 }}>{r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":`${r.rank}.`}</span>
              <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
              {phase === "done" && r.rank === loserRank && <span style={{ fontSize: 12, color: "#f97316", fontWeight: 700 }}>☕ 커피!</span>}
            </div>
          ))}
        </div>
      )}

      {phase === "done" && loser && (
        <div style={{ textAlign: "center", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 18, padding: "16px", marginBottom: 14, animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 30, marginBottom: 5 }}>☕</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: loser.color }}>{loser.name}</div>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 3 }}>{loserRank}번째 착지 — 커피 한 잔 쏘세요!</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={phase !== "running" ? startGame : undefined} disabled={phase === "running"} style={{ flex: 2, background: phase === "running" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 16, padding: "15px", color: phase === "running" ? "#555" : "#fff", fontSize: 15, fontWeight: 800, cursor: phase === "running" ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
          {phase === "running" ? "구슬 떨어지는 중..." : phase === "done" ? "🔄 다시 하기" : "🎰 구슬 떨어뜨리기"}
        </button>
        {phase === "done" && <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "15px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>초기화</button>}
      </div>
      <style>{`@keyframes popIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
