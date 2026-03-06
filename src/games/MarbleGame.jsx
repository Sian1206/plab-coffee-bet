import { useState, useRef, useEffect, useCallback } from "react";

const COLORS = ["#f97316","#8b5cf6","#22c55e","#ec4899","#eab308","#14b8a6","#60a5fa","#f43f5e"];
const W = 340, H = 900;
const R = 9; // marble radius
const TUBE_X = W / 2, TUBE_W = 32;
const TUBE_TOP = H - 145;

// ── 장애물 ── 핀 없음, 축구공 + 곡면 벽만
// 곡면 벽: 호(arc) 형태로 구슬을 부드럽게 튕김
const BALLS = [
  { x: 80,  y: 155 }, { x: 260, y: 225 },
  { x: 90,  y: 340 }, { x: 250, y: 420 },
  { x: 75,  y: 510 }, { x: 265, y: 580 },
  { x: 170, y: 280 }, { x: 170, y: 470 },
];

// 평면 벽 (선분) — 충분히 넓은 간격
const WALLS = [
  { x1: 55,  y1: 195, x2: 130, y2: 175 },
  { x1: 210, y1: 270, x2: 285, y2: 255 },
  { x1: 60,  y1: 385, x2: 135, y2: 365 },
  { x1: 205, y1: 460, x2: 280, y2: 445 },
  { x1: 60,  y1: 560, x2: 130, y2: 545 },
  { x1: 210, y1: 620, x2: 280, y2: 605 },
];

// 곡면 벽 (원호) — 구슬을 부드럽게 반사
const ARCS = [
  { cx: 170, cy: 130, r: 45, startA: 0.15 * Math.PI, endA: 0.85 * Math.PI },   // 상단 오목 호
  { cx: 80,  cy: 640, r: 55, startA: -0.4 * Math.PI, endA: 0.4 * Math.PI },   // 좌 볼록
  { cx: 260, cy: 660, r: 55, startA: 0.6 * Math.PI, endA: 1.4 * Math.PI },    // 우 볼록
];

function createMarble(idx, total) {
  const spread = W * 0.38;
  return {
    id: idx,
    x: W / 2 - spread / 2 + (idx / Math.max(total - 1, 1)) * spread + (Math.random() - 0.5) * 8,
    y: 18,
    vx: (Math.random() - 0.5) * 0.7,
    vy: 0.2,
    landed: false,
    rank: null,
  };
}

// 선분과의 최근접 점 + 법선 반사
function reflectWall(m, x1, y1, x2, y2, margin) {
  const lx = x2 - x1, ly = y2 - y1, len2 = lx * lx + ly * ly;
  if (len2 === 0) return;
  const t = Math.max(0, Math.min(1, ((m.x - x1) * lx + (m.y - y1) * ly) / len2));
  const cx = x1 + t * lx, cy = y1 + t * ly;
  const dx = m.x - cx, dy = m.y - cy, dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < margin && dist > 0) {
    const nx = dx / dist, ny = dy / dist;
    const dot = m.vx * nx + m.vy * ny;
    if (dot < 0) { m.vx -= 1.65 * dot * nx; m.vy -= 1.65 * dot * ny; }
    m.x = cx + nx * (margin + 0.5);
    m.y = cy + ny * (margin + 0.5);
  }
}

export default function MarbleGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [loserRank, setLoserRank] = useState(1);
  const [rankings, setRankings] = useState([]);
  const marblesRef = useRef([]);
  const animRef = useRef(null);
  const rankRef = useRef(0);
  const tubeRef = useRef([]);
  const loserRankRef = useRef(1);
  useEffect(() => { loserRankRef.current = loserRank; }, [loserRank]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(0, 0, W, H);

    // ── 축구공 ──
    BALLS.forEach(b => {
      ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⚽", b.x, b.y);
    });

    // ── 평면 벽 ──
    WALLS.forEach(w => {
      ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2);
      ctx.strokeStyle = "rgba(100,200,255,0.45)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
    });

    // ── 곡면 벽 (원호) ──
    ARCS.forEach(a => {
      ctx.beginPath(); ctx.arc(a.cx, a.cy, a.r, a.startA, a.endA);
      ctx.strokeStyle = "rgba(180,120,255,0.45)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
    });

    // ── 깔때기 ──
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(R + 6, H - 188); ctx.lineTo(TUBE_X - TUBE_W / 2, TUBE_TOP); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - R - 6, H - 188); ctx.lineTo(TUBE_X + TUBE_W / 2, TUBE_TOP); ctx.stroke();

    // ── 튜브 ──
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(TUBE_X - TUBE_W/2, TUBE_TOP); ctx.lineTo(TUBE_X - TUBE_W/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TUBE_X + TUBE_W/2, TUBE_TOP); ctx.lineTo(TUBE_X + TUBE_W/2, H); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "9px 'Pretendard',sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("도착", TUBE_X, TUBE_TOP - 10);

    // ── 튜브 안 구슬 ──
    tubeRef.current.forEach((lm, i) => {
      const my = H - 12 - i * (R * 2 + 2);
      const color = COLORS[lm.id % COLORS.length];
      const isTarget = lm.rank === loserRankRef.current;
      ctx.save();
      if (isTarget) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 14; }
      ctx.beginPath(); ctx.arc(TUBE_X, my, R, 0, 2 * Math.PI);
      ctx.fillStyle = color; ctx.fill();
      if (isTarget) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(lm.rank, TUBE_X, my);
      ctx.fillStyle = color; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "left";
      const nm = participants[lm.id];
      ctx.fillText(nm.length > 3 ? nm.slice(0, 3) + "…" : nm, TUBE_X + TUBE_W / 2 + 5, my);
    });

    // ── 움직이는 구슬 ──
    marblesRef.current.forEach(m => {
      if (m.landed) return;
      const color = COLORS[m.id % COLORS.length];
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 2 * Math.PI);
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(m.x - 2.5, m.y - 2.5, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold 7px 'Pretendard',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const nm = participants[m.id];
      ctx.fillText(nm.length > 2 ? nm.slice(0, 2) : nm, m.x, m.y + R + 9);
    });

    // ── 예측 표시 ──
    const remaining = marblesRef.current.filter(m => !m.landed);
    const targetRem = loserRankRef.current - rankRef.current;
    if (remaining.length > 0 && targetRem > 0 && targetRem <= remaining.length) {
      const sorted = [...remaining].sort((a, b) => b.y - a.y);
      const pred = sorted[targetRem - 1];
      if (pred) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(pred.x, pred.y, R + 6, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `bold 8px 'Pretendard',sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("☕?", pred.x, pred.y - R - 12);
        ctx.restore();
      }
    }
  }, [participants]);

  const update = useCallback(() => {
    const marbles = marblesRef.current;

    marbles.forEach(m => {
      if (m.landed) return;

      m.vy += 0.22; m.vx *= 0.992;
      m.x += m.vx; m.y += m.vy;

      // 벽 반발
      if (m.x < R + 6) { m.x = R + 6; m.vx = Math.abs(m.vx) * 0.6 + 1.8; }
      if (m.x > W - R - 6) { m.x = W - R - 6; m.vx = -(Math.abs(m.vx) * 0.6 + 1.8); }

      // 깔때기 — 중력 기반 유도 (강제 없음)
      if (m.y > H - 200) {
        const p = Math.max(0, Math.min(1, (m.y - (H - 188)) / (TUBE_TOP - (H - 188))));
        const lBound = R + 6 + p * (TUBE_X - TUBE_W / 2 - R - 6);
        const rBound = W - R - 6 - p * (W - R - 6 - TUBE_X - TUBE_W / 2);
        if (m.x < lBound) { m.x = lBound; if (m.vx < 0) m.vx = Math.abs(m.vx) * 0.5; }
        if (m.x > rBound) { m.x = rBound; if (m.vx > 0) m.vx = -Math.abs(m.vx) * 0.5; }
      }

      // 축구공 충돌
      BALLS.forEach(b => {
        const dx = m.x - b.x, dy = m.y - b.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < R + 14 && dist > 0) {
          const nx = dx/dist, ny = dy/dist;
          const dot = m.vx*nx + m.vy*ny;
          m.vx = (m.vx - 2*dot*nx)*0.72 + (Math.random()-0.5)*2.5;
          m.vy = (m.vy - 2*dot*ny)*0.72;
          m.x = b.x + nx*(R+15); m.y = b.y + ny*(R+15);
        }
      });

      // 평면 벽 충돌
      WALLS.forEach(w => reflectWall(m, w.x1, w.y1, w.x2, w.y2, R + 4));

      // 곡면 벽(원호) 충돌 — 원 내외면 반사
      ARCS.forEach(a => {
        const dx = m.x - a.cx, dy = m.y - a.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        // 구슬이 호 위에 가까우면 반사
        if (Math.abs(dist - a.r) < R + 5 && dist > 0) {
          const angle = Math.atan2(dy, dx);
          // 호 범위 안인지 확인
          let inArc = false;
          const norm = (a) => ((a % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
          const na = norm(angle), ns = norm(a.startA), ne = norm(a.endA);
          inArc = ns <= ne ? (na >= ns && na <= ne) : (na >= ns || na <= ne);
          if (inArc) {
            const nx = dx/dist, ny = dy/dist;
            // 외부에서 접근 → 안쪽으로, 내부에서 접근 → 바깥으로
            const dot = m.vx*nx + m.vy*ny;
            if ((dist > a.r && dot < 0) || (dist < a.r && dot > 0)) {
              m.vx -= 1.7*dot*nx; m.vy -= 1.7*dot*ny;
            }
            const target = dist > a.r ? a.r + R + 4 : a.r - R - 4;
            m.x = a.cx + nx*target; m.y = a.cy + ny*target;
          }
        }
      });

      // 구슬 간 충돌
      marbles.forEach(other => {
        if (other.id === m.id || other.landed) return;
        const dx = m.x-other.x, dy = m.y-other.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < R*2+1 && dist > 0) {
          const nx = dx/dist, ny = dy/dist;
          const dot = (m.vx-other.vx)*nx + (m.vy-other.vy)*ny;
          if (dot < 0) { m.vx -= dot*nx*0.5; m.vy -= dot*ny*0.5; other.vx += dot*nx*0.5; other.vy += dot*ny*0.5; }
        }
      });

      // 착지
      if (m.y >= H - 28) {
        m.landed = true; rankRef.current++;
        m.rank = rankRef.current; m.x = TUBE_X;
        tubeRef.current = [...tubeRef.current, { id: m.id, rank: m.rank }];
        setRankings(prev => [...prev, { name: participants[m.id], rank: m.rank, color: COLORS[m.id%COLORS.length] }]);
      }
    });
    return marbles.every(m => m.landed);
  }, [participants]);

  const startGame = () => {
    rankRef.current = 0; tubeRef.current = [];
    marblesRef.current = Array.from({ length: n }, (_, i) => createMarble(i, n));
    setRankings([]); setPhase("running");
    const loop = () => { const done = update(); draw(); if (!done) animRef.current = requestAnimationFrame(loop); else setPhase("done"); };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => { draw(); return () => { if (animRef.current) cancelAnimationFrame(animRef.current); }; }, [draw]);

  const loser = phase === "done" ? rankings.find(r => r.rank === Math.min(loserRank, n)) : null;
  const reset = () => { setPhase("idle"); setRankings([]); marblesRef.current = []; tubeRef.current = []; rankRef.current = 0; setTimeout(() => draw(), 50); };

  return (
    <div style={{ padding:"24px 20px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#777", fontSize:14, cursor:"pointer", padding:0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, padding:"6px 12px", color:"#aaa", fontSize:13, cursor:"pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign:"center", marginBottom:8 }}>
        <div style={{ fontSize:28, marginBottom:2 }}>{bet.emoji}</div>
        <div style={{ fontSize:18, fontWeight:900 }}>{bet.title}</div>
      </div>

      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, color:"#666", marginBottom:5, textAlign:"center" }}>☕ 몇 번째로 들어온 구슬이 커피?</div>
        <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap" }}>
          {Array.from({ length: n }, (_, i) => i+1).map(rank => (
            <button key={rank} onClick={() => setLoserRank(rank)}
              style={{ background: loserRank===rank ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(255,255,255,0.07)", border:"none", borderRadius:9, padding:"5px 9px", color: loserRank===rank?"#fff":"#aaa", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              {rank===1?"🥇1등":rank===n?`🐢${rank}등`:`${rank}등`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width:W, maxHeight:430, overflowY:"auto", borderRadius:18, border:"1px solid rgba(255,255,255,0.08)", margin:"0 auto 10px", scrollbarWidth:"none" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display:"block" }} />
      </div>

      {rankings.length > 0 && (
        <div style={{ marginBottom:10, display:"flex", flexDirection:"column", gap:4 }}>
          {rankings.map((r,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background: r.rank===loserRank?`${r.color}28`:`${r.color}10`, border:`1px solid ${r.color}${r.rank===loserRank?"55":"28"}`, borderRadius:10, padding:"5px 11px", animation:"popIn 0.3s ease" }}>
              <span style={{ fontSize:13, minWidth:22 }}>{r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":`${r.rank}.`}</span>
              <span style={{ fontWeight:700, color:r.color, flex:1 }}>{r.name}</span>
              {phase==="done" && r.rank===loserRank && <span style={{ fontSize:11, color:"#f97316", fontWeight:700 }}>☕ 커피!</span>}
            </div>
          ))}
        </div>
      )}

      {phase==="done" && loser && (
        <div style={{ textAlign:"center", background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.4)", borderRadius:16, padding:"12px", marginBottom:10, animation:"popIn 0.4s ease" }}>
          <div style={{ fontSize:26, marginBottom:3 }}>☕</div>
          <div style={{ fontSize:20, fontWeight:900, color:loser.color }}>{loser.name}</div>
          <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{loserRank}번째 도착 — 커피 한 잔 쏘세요!</div>
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={phase!=="running"?startGame:undefined} disabled={phase==="running"}
          style={{ flex:2, background: phase==="running"?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#8b5cf6,#6366f1)", border:"none", borderRadius:14, padding:"13px", color: phase==="running"?"#555":"#fff", fontSize:14, fontWeight:800, cursor: phase==="running"?"not-allowed":"pointer" }}>
          {phase==="running"?"구슬 떨어지는 중...":phase==="done"?"🔄 다시 하기":"🎰 구슬 떨어뜨리기"}
        </button>
        {phase==="done" && <button onClick={reset} style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"13px", color:"#ccc", fontSize:12, fontWeight:700, cursor:"pointer" }}>초기화</button>}
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
