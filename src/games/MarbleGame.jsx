import { useState, useRef, useEffect, useCallback } from "react";

const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const BOARD_W = 340;
const BOARD_H = 880;
const MARBLE_R = 9;
const TUBE_X = BOARD_W / 2;
const TUBE_TOP = BOARD_H - 130;
const TUBE_W = 28;

function generatePins() {
  const pins = [];
  const rows = 11, cols = 5;
  const marginX = 45, startY = 80, endY = BOARD_H - 155;
  const spacingX = (BOARD_W - marginX * 2) / (cols - 1);
  const spacingY = (endY - startY) / (rows - 1);
  for (let r = 0; r < rows; r++) {
    const isEven = r % 2 === 0;
    const count = isEven ? cols : cols - 1;
    const offsetX = isEven ? 0 : spacingX / 2;
    for (let c = 0; c < count; c++) {
      pins.push({ x: marginX + offsetX + c * spacingX, y: startY + r * spacingY });
    }
  }
  return pins;
}

const PINS = generatePins();
const OBSTACLES = [
  { type: "ball", x: 95, y: 195 }, { type: "ball", x: 245, y: 310 },
  { type: "ball", x: 105, y: 455 }, { type: "ball", x: 235, y: 555 },
  { type: "line", x1: 68, y1: 265, x2: 125, y2: 290 },
  { type: "line", x1: 215, y1: 385, x2: 272, y2: 360 },
  { type: "line", x1: 72, y1: 515, x2: 128, y2: 490 },
  { type: "line", x1: 212, y1: 620, x2: 268, y2: 645 },
];

function createMarble(idx, total) {
  const spread = BOARD_W * 0.42;
  const startX = BOARD_W / 2 - spread / 2 + (idx / Math.max(total - 1, 1)) * spread;
  return { id: idx, x: startX + (Math.random() - 0.5) * 10, y: 20, vx: (Math.random() - 0.5) * 0.8, vy: 0.3, landed: false, rank: null };
}

export default function MarbleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [loserRank, setLoserRank] = useState(1);
  const [rankings, setRankings] = useState([]);
  const marblesRef = useRef([]);
  const animRef = useRef(null);
  const rankCountRef = useRef(0);
  const tubeStackRef = useRef([]);
  const loserRankRef = useRef(1);

  useEffect(() => { loserRankRef.current = loserRank; }, [loserRank]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    PINS.forEach(pin => {
      ctx.beginPath(); ctx.arc(pin.x, pin.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fill();
    });

    OBSTACLES.forEach(obs => {
      if (obs.type === "ball") {
        ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("⚽", obs.x, obs.y);
      } else {
        ctx.beginPath(); ctx.moveTo(obs.x1, obs.y1); ctx.lineTo(obs.x2, obs.y2);
        ctx.strokeStyle = "rgba(255,200,80,0.6)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
      }
    });

    // Funnel
    ctx.beginPath(); ctx.moveTo(BOARD_W * 0.08, BOARD_H - 148); ctx.lineTo(TUBE_X - TUBE_W/2 - 1, TUBE_TOP);
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BOARD_W * 0.92, BOARD_H - 148); ctx.lineTo(TUBE_X + TUBE_W/2 + 1, TUBE_TOP);
    ctx.stroke();

    // Tube
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(TUBE_X - TUBE_W/2 - 1, TUBE_TOP); ctx.lineTo(TUBE_X - TUBE_W/2 - 1, BOARD_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TUBE_X + TUBE_W/2 + 1, TUBE_TOP); ctx.lineTo(TUBE_X + TUBE_W/2 + 1, BOARD_H); ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "9px 'Pretendard',sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("도착", TUBE_X, TUBE_TOP - 10);

    // Stacked marbles in tube
    tubeStackRef.current.forEach((lm, i) => {
      const my = BOARD_H - 12 - i * (MARBLE_R * 2 + 2);
      const color = COLORS[lm.id % COLORS.length];
      const isTarget = lm.rank === loserRankRef.current;
      ctx.save();
      if (isTarget) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 14; }
      ctx.beginPath(); ctx.arc(TUBE_X, my, MARBLE_R, 0, 2 * Math.PI);
      ctx.fillStyle = color; ctx.fill();
      if (isTarget) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(lm.rank, TUBE_X, my);
      ctx.fillStyle = color; ctx.font = `bold 8px 'Pretendard',sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      const nm = participants[lm.id]; ctx.fillText(nm.length > 3 ? nm.slice(0,3)+"…" : nm, TUBE_X + TUBE_W/2 + 5, my);
    });

    // Moving marbles
    marblesRef.current.forEach(m => {
      if (m.landed) return;
      const color = COLORS[m.id % COLORS.length];
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(m.x, m.y, MARBLE_R, 0, 2 * Math.PI);
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(m.x - 2.5, m.y - 2.5, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const nm = participants[m.id]; ctx.fillText(nm.length > 2 ? nm.slice(0,2) : nm, m.x, m.y + MARBLE_R + 8);
    });

    // Predicted target
    const landed = rankCountRef.current;
    const remaining = marblesRef.current.filter(m => !m.landed);
    const targetRemaining = loserRankRef.current - landed;
    if (remaining.length > 0 && targetRemaining > 0 && targetRemaining <= remaining.length) {
      const sorted = [...remaining].sort((a, b) => b.y - a.y);
      const predicted = sorted[targetRemaining - 1];
      if (predicted) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(predicted.x, predicted.y, MARBLE_R + 6, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = `bold 8px 'Pretendard',sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("☕?", predicted.x, predicted.y - MARBLE_R - 11);
        ctx.restore();
      }
    }
  }, [participants]);

  const update = useCallback(() => {
    const marbles = marblesRef.current;
    marbles.forEach(m => {
      if (m.landed) return;
      m.vy += 0.18; m.vx *= 0.99;
      m.x += m.vx; m.y += m.vy;

      if (m.x < MARBLE_R + 6) { m.x = MARBLE_R + 6; m.vx = Math.abs(m.vx) * 0.65 + 1.8; }
      if (m.x > BOARD_W - MARBLE_R - 6) { m.x = BOARD_W - MARBLE_R - 6; m.vx = -(Math.abs(m.vx) * 0.65 + 1.8); }
      if (m.y > BOARD_H - 160) { m.vx += (TUBE_X - m.x) * 0.07; }

      PINS.forEach(pin => {
        const dx = m.x - pin.x, dy = m.y - pin.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < MARBLE_R + 6 && dist > 0) {
          const nx = dx/dist, ny = dy/dist, dot = m.vx*nx+m.vy*ny;
          m.vx = (m.vx-2*dot*nx)*0.68; m.vy = (m.vy-2*dot*ny)*0.68+0.5;
          m.vx += (Math.random()-0.5)*2.5;
          m.x = pin.x+nx*(MARBLE_R+7); m.y = pin.y+ny*(MARBLE_R+7);
        }
      });

      OBSTACLES.forEach(obs => {
        if (obs.type === "ball") {
          const dx = m.x-obs.x, dy = m.y-obs.y, dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < MARBLE_R+13 && dist > 0) {
            const nx = dx/dist, ny = dy/dist, dot = m.vx*nx+m.vy*ny;
            m.vx = (m.vx-2*dot*nx)*0.72+(Math.random()-0.5)*3;
            m.vy = (m.vy-2*dot*ny)*0.72;
            m.x = obs.x+nx*(MARBLE_R+14); m.y = obs.y+ny*(MARBLE_R+14);
          }
        } else {
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
          const dot = (m.vx-other.vx)*nx+(m.vy-other.vy)*ny;
          if (dot < 0) { m.vx -= dot*nx*0.5; m.vy -= dot*ny*0.5; other.vx += dot*nx*0.5; other.vy += dot*ny*0.5; }
        }
      });

      if (m.y >= BOARD_H - 28) {
        m.landed = true; rankCountRef.current++;
        m.rank = rankCountRef.current;
        m.x = TUBE_X;
        tubeStackRef.current = [...tubeStackRef.current, { id: m.id, rank: m.rank }];
        setRankings(prev => [...prev, { name: participants[m.id], rank: m.rank, color: COLORS[m.id%COLORS.length], id: m.id }]);
        if (containerRef.current) containerRef.current.scrollTo({ top: BOARD_H, behavior: "smooth" });
      }
    });
    return marbles.every(m => m.landed);
  }, [participants]);

  const startGame = () => {
    rankCountRef.current = 0; tubeStackRef.current = [];
    marblesRef.current = Array.from({ length: n }, (_, i) => createMarble(i, n));
    setRankings([]); setPhase("running");
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    const loop = () => { const done = update(); draw(); if (!done) animRef.current = requestAnimationFrame(loop); else setPhase("done"); };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => { draw(); return () => { if (animRef.current) cancelAnimationFrame(animRef.current); }; }, [draw]);

  const loser = phase === "done" ? rankings.find(r => r.rank === Math.min(loserRank, n)) : null;
  const reset = () => { setPhase("idle"); setRankings([]); marblesRef.current = []; tubeStackRef.current = []; rankCountRef.current = 0; setTimeout(() => draw(), 50); };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 28, marginBottom: 2 }}>{bet.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{bet.title}</div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 5, textAlign: "center" }}>☕ 몇 번째로 들어온 구슬이 커피?</div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
          {Array.from({ length: n }, (_, i) => i+1).map(rank => (
            <button key={rank} onClick={() => setLoserRank(rank)} style={{ background: loserRank === rank ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 9, padding: "5px 9px", color: loserRank === rank ? "#fff" : "#aaa", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
              {rank === 1 ? "🥇1등" : rank === n ? `🐢${rank}등` : `${rank}등`}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ width: BOARD_W, maxHeight: 430, overflowY: "auto", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", margin: "0 auto 10px", scrollbarWidth: "none" }}>
        <canvas ref={canvasRef} width={BOARD_W} height={BOARD_H} style={{ display: "block" }} />
      </div>

      {rankings.length > 0 && (
        <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {rankings.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: r.rank === loserRank ? `${r.color}28` : `${r.color}10`, border: `1px solid ${r.color}${r.rank === loserRank ? "55" : "28"}`, borderRadius: 10, padding: "5px 11px", animation: "popIn 0.3s ease" }}>
              <span style={{ fontSize: 13, minWidth: 22 }}>{r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":`${r.rank}.`}</span>
              <span style={{ fontWeight: 700, color: r.color, flex: 1 }}>{r.name}</span>
              {phase === "done" && r.rank === loserRank && <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>☕ 커피!</span>}
            </div>
          ))}
        </div>
      )}

      {phase === "done" && loser && (
        <div style={{ textAlign: "center", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 16, padding: "12px", marginBottom: 10, animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 26, marginBottom: 3 }}>☕</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: loser.color }}>{loser.name}</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{loserRank}번째 도착 — 커피 한 잔 쏘세요!</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={phase !== "running" ? startGame : undefined} disabled={phase === "running"} style={{ flex: 2, background: phase === "running" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 14, padding: "13px", color: phase === "running" ? "#555" : "#fff", fontSize: 14, fontWeight: 800, cursor: phase === "running" ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
          {phase === "running" ? "구슬 떨어지는 중..." : phase === "done" ? "🔄 다시 하기" : "🎰 구슬 떨어뜨리기"}
        </button>
        {phase === "done" && <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>초기화</button>}
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
