import { useState, useRef, useEffect } from "react";

const HORSES = [
  {
    id: 1, emoji: "🐎", name: "선셋 라이더", color: "#f97316",
    story: "미국 서부 텍사스 평원을 누비던 전설의 경주마. 전성기엔 무패 행진을 이어갔지만, 나이가 들어 은퇴 통보를 받고 하루아침에 경매장에 나왔다. 지금도 석양만 보면 전력질주하는 버릇이 있다.",
    trait: "초반 폭발력", traitIcon: "⚡",
    // 속도 함수: t=0~1 (레이스 진행도), noise=랜덤값
    baseSpeed: (t) => t < 0.25 ? 2.2 : t < 0.6 ? 1.0 : 0.85,
  },
  {
    id: 2, emoji: "🐎", name: "적토마 Jr.", color: "#ef4444",
    story: "삼국지 여포가 타던 그 적토마의 45대손. 혈통서에 적혀있는 말이 사실인지 아무도 확인 못 했지만, 본인은 굳게 믿고 있다. 위기 상황에서 폭발적인 후반 스퍼트를 자랑한다.",
    trait: "후반 폭발력", traitIcon: "🔥",
    baseSpeed: (t) => t < 0.4 ? 0.75 : t < 0.75 ? 1.1 : 2.1,
  },
  {
    id: 3, emoji: "🐎", name: "뚝심 한라봉", color: "#eab308",
    story: "제주도 감귤 농장에서 일하다 어느 날 우연히 경마장 근처를 지나치며 '나도 할 수 있겠다'고 생각했다. 느리지만 절대 멈추지 않는 뚝심으로 베테랑 기수들의 존경을 받는다.",
    trait: "안정적 페이스", traitIcon: "🛡️",
    baseSpeed: (t) => 1.05 + Math.sin(t * Math.PI * 2) * 0.15,
  },
  {
    id: 4, emoji: "🐎", name: "도심 탈주마", color: "#8b5cf6",
    story: "서울 도심 촬영 현장에서 탈출해 강변북로를 질주한 그 말. 3시간 동안 경찰차를 따돌렸다. 경마장으로 오게 된 건 어차피 달리기를 좋아하니까. 페이스가 예측 불허다.",
    trait: "랜덤 페이스", traitIcon: "🎲",
    baseSpeed: (t) => 0.6 + Math.random() * 1.0,
  },
  {
    id: 5, emoji: "🐎", name: "설원의 바람", color: "#06b6d4",
    story: "시베리아 동토에서 썰매를 끌다 글로벌 스카우터 눈에 띄어 한국에 왔다. 영하 40도에서도 멀쩡히 달리던 체력이 장기인데, 한국 여름 더위에 적응 중이다. 중반부터 가속이 붙는다.",
    trait: "중반 가속", traitIcon: "❄️",
    baseSpeed: (t) => t < 0.2 ? 0.7 : t < 0.55 ? 1.35 : 1.2,
  },
  {
    id: 6, emoji: "🐎", name: "황소 플래비", color: "#22c55e",
    story: "플랩풋볼 운동장 옆 목장 출신. 축구공을 보면 흥분해서 무조건 돌진하는 버릇이 있다. 경마장에 우연히 섞여 들어왔는데 생각보다 꽤 빨라서 다들 당황했다. 전반 몸풀기가 오래 걸린다.",
    trait: "후반 반전", traitIcon: "⚽",
    baseSpeed: (t) => t < 0.5 ? 0.65 : 1.5,
  },
  {
    id: 7, emoji: "🐎", name: "달빛 나이트", color: "#a78bfa",
    story: "낮에는 졸고 밤에만 달리던 야행성 경주마. 경마 대회는 항상 낮에 열려서 인생이 피곤하다. 그래도 마지막 직선 코스에서 갑자기 깨어나는 습관이 있어 역전의 왕이라 불린다.",
    trait: "막판 역전", traitIcon: "🌙",
    baseSpeed: (t) => t < 0.78 ? 0.72 : 2.4,
  },
  {
    id: 8, emoji: "🐎", name: "꾀돌이 여우비", color: "#ec4899",
    story: "원래 여우인데 말 코스튬을 입고 경마장에 들어온 것 같다는 소문이 있다. 코너링이 비정상적으로 좋고, 다른 말들이 자꾸 미끄러지는 구간에서 혼자 속도를 낸다. 출처불명의 기록 보유자.",
    trait: "코너 최강", traitIcon: "🦊",
    baseSpeed: (t) => 0.95 + Math.sin(t * Math.PI * 4) * 0.35,
  },
];

// ── 레이스 설정 ──
const VIEWPORT_W = 340;
const LANE_H = 48;
const TOTAL_DIST = 4000;   // 실제 트랙 거리 (픽셀 단위 논리값)
const START_X = 60;        // 화면 내 출발 표시 위치
const FINISH_DISP = 290;   // 화면 내 결승선 표시 위치 (카메라 따라감)

// 말 속도 계산: baseSpeed + 드라마틱 이벤트 + 노이즈
function calcSpeed(horse, progress, eventBoost) {
  const base = horse.baseSpeed(progress);
  // 전체 속도를 조정해서 레이스가 비슷하게 경쟁하도록
  const normalized = base * 1.0;
  // 랜덤 노이즈 (작게 — 너무 크면 실력 없어짐)
  const noise = (Math.random() - 0.5) * 0.3;
  // 이벤트 부스트 (넘어짐 회복, 역전 스퍼트 등)
  return Math.max(0.2, normalized + noise + (eventBoost || 0));
}

function HorseRace({ horses, participants, onFinish }) {
  const canvasRef = useRef(null);
  const posRef = useRef(horses.map(() => 0)); // 각 말의 논리적 위치 (0~TOTAL_DIST)
  const eventsRef = useRef(horses.map(() => ({ boost: 0, stumble: 0 }))); // 이벤트 상태
  const tickRef = useRef(0);
  const finishedRef = useRef([]); // 완주 순서
  const animRef = useRef(null);
  const cameraRef = useRef(0); // 카메라 위치 (리더 따라감)
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [liveRanks, setLiveRanks] = useState(horses.map((_, i) => i)); // 실시간 순위

  const CANVAS_H = horses.length * LANE_H + 50;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, VIEWPORT_W, CANVAS_H);

    // 배경
    ctx.fillStyle = "#080f1e";
    ctx.fillRect(0, 0, VIEWPORT_W, CANVAS_H);

    const cam = cameraRef.current;

    // ── 트랙 레인 ──
    horses.forEach((horse, i) => {
      const y = 24 + i * LANE_H;
      ctx.fillStyle = i % 2 === 0 ? "#0a1830" : "#091525";
      ctx.fillRect(0, y, VIEWPORT_W, LANE_H - 2);

      // 레인 구분선
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y + LANE_H - 2); ctx.lineTo(VIEWPORT_W, y + LANE_H - 2); ctx.stroke();

      // 진행 바 (하단)
      const progress = posRef.current[i] / TOTAL_DIST;
      const barW = VIEWPORT_W * 0.7;
      const barX = VIEWPORT_W * 0.15;
      const barY = y + LANE_H - 8;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = horse.color;
      ctx.fillRect(barX, barY, barW * progress, 4);
    });

    // ── 결승선 (카메라 기준) ──
    const finishScreenX = FINISH_DISP + (TOTAL_DIST - cam);
    if (finishScreenX > 0 && finishScreenX < VIEWPORT_W) {
      // 체커 패턴
      for (let i = 0; i < CANVAS_H; i += 8) {
        ctx.fillStyle = i % 16 === 0 ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
        ctx.fillRect(finishScreenX, i, 6, 8);
      }
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FINISH", finishScreenX + 3, CANVAS_H - 6);
    }

    // ── 말들 ──
    horses.forEach((horse, i) => {
      const y = 24 + i * LANE_H;
      const screenX = START_X + (posRef.current[i] - cam);
      const midY = y + LANE_H * 0.58;
      const ev = eventsRef.current[i];
      const wobble = Math.sin(tickRef.current * 0.25 + i) * 2;
      const isFinished = finishedRef.current.includes(i);
      const rank = finishedRef.current.indexOf(i);

      // ── 화면 밖인 경우: 엣지에 말 이모지 + 화살표 + 이름 표시 ──
      const offLeft = screenX < 20;
      const offRight = screenX > VIEWPORT_W - 20;

      if (offLeft || offRight) {
        const pillW = 68;
        const pillX = offLeft ? 0 : VIEWPORT_W - pillW;
        const labelX = offLeft ? 8 : VIEWPORT_W - 8;
        const nameAlign = offLeft ? "left" : "right";
        const arrow = offLeft ? "◀" : "▶";

        // 배경 pill (말 색상)
        ctx.fillStyle = `${horse.color}44`;
        ctx.fillRect(pillX, y + 4, pillW, LANE_H - 8);
        ctx.strokeStyle = horse.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pillX, y + 4, pillW, LANE_H - 8);

        // 말 이모지
        ctx.font = `${LANE_H * 0.5}px serif`;
        ctx.textAlign = offLeft ? "left" : "right";
        ctx.fillText("🐎", offLeft ? pillX + 2 : VIEWPORT_W - 2, midY + 6);

        // 화살표 (깜빡임 효과)
        const blink = Math.floor(tickRef.current / 8) % 2 === 0;
        if (blink) {
          ctx.fillStyle = horse.color;
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = offLeft ? "left" : "right";
          ctx.fillText(arrow, labelX, midY - 2);
        }

        // 색상 구별 점
        ctx.beginPath();
        ctx.arc(offLeft ? pillX + pillW - 8 : pillX + 8, y + 10, 5, 0, 2 * Math.PI);
        ctx.fillStyle = horse.color;
        ctx.fill();

        // 이름
        ctx.font = `bold 8px 'Pretendard',sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = nameAlign;
        const nm = participants[i].length > 3 ? participants[i].slice(0, 3) : participants[i];
        ctx.fillText(nm, offLeft ? pillX + 5 : VIEWPORT_W - 5, midY + 10);

        // 완주 뱃지
        if (isFinished && rank >= 0) {
          ctx.font = "bold 8px sans-serif";
          ctx.fillStyle = rank === 0 ? "#fbbf24" : rank === horses.length - 1 ? "#f87171" : "#94a3b8";
          ctx.textAlign = nameAlign;
          ctx.fillText(`${rank + 1}위`, offLeft ? pillX + 5 : VIEWPORT_W - 5, midY - 8);
        }
        return;
      }

      // ── 완주 뱃지 ──
      if (isFinished && rank >= 0) {
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = rank === 0 ? "#fbbf24" : rank === horses.length - 1 ? "#f87171" : "#94a3b8";
        ctx.fillText(`${rank + 1}위`, screenX, y + 12);
      }

      // ── 말 이모지 (흔들림 효과) ──
      ctx.save();
      if (ev.boost > 0) {
        ctx.shadowColor = horse.color;
        ctx.shadowBlur = 16;
      }
      ctx.font = `${LANE_H * 0.6}px serif`;
      ctx.textAlign = "left";
      ctx.fillText("🐎", screenX - 14, midY + wobble);
      ctx.restore();

      // 말 위에 색상 원 (구별용)
      ctx.beginPath();
      ctx.arc(screenX + 4, y + 10, 6, 0, 2 * Math.PI);
      ctx.fillStyle = horse.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 이름 + 참가자
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "bold 9px 'Pretendard',sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(participants[i], 4, y + LANE_H / 2 + 4);

      // 속도 표시 (부스트/스텀블)
      if (ev.boost > 0) {
        ctx.fillStyle = horse.color;
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💨", screenX + 14, y + 8);
      }
      if (ev.stumble > 0) {
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💫", screenX, y + 8);
      }
    });

    // ── 실시간 순위 패널 (우측 상단) ──
    const sortedByPos = [...horses.map((h, i) => ({ h, i, pos: posRef.current[i] }))]
      .sort((a, b) => b.pos - a.pos);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(VIEWPORT_W - 72, 2, 70, horses.length * 14 + 6);
    sortedByPos.forEach((item, rank) => {
      ctx.fillStyle = rank === 0 ? "#fbbf24" : item.h.color;
      ctx.font = `bold 9px 'Pretendard',sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`${rank + 1}. ${participants[item.i]}`, VIEWPORT_W - 68, 14 + rank * 14);
    });
  };

  const update = () => {
    tickRef.current++;
    const allDone = finishedRef.current.length >= horses.length;
    if (allDone) return true;

    // ── 이벤트 시스템 ──
    // 가끔 랜덤 이벤트 발생
    if (tickRef.current % 60 === 0) {
      horses.forEach((_, i) => {
        if (finishedRef.current.includes(i)) return;
        const r = Math.random();
        const progress = posRef.current[i] / TOTAL_DIST;
        // 앞서가는 말에게 약간 불리하게 (드라마를 위해)
        const rank = [...posRef.current].sort((a, b) => b - a).indexOf(posRef.current[i]);
        const isLeading = rank === 0;

        if (r < 0.08) {
          // 스텀블 (짧은 감속)
          eventsRef.current[i].stumble = 30;
          eventsRef.current[i].boost = 0;
        } else if (r < (isLeading ? 0.14 : 0.22)) {
          // 부스트 (추격 또는 도망)
          eventsRef.current[i].boost = 45;
          eventsRef.current[i].stumble = 0;
        }
      });
    }

    // ── 말 이동 ──
    const leader = Math.max(...posRef.current);
    const leaderProgress = leader / TOTAL_DIST;

    horses.forEach((horse, i) => {
      if (finishedRef.current.includes(i)) return;

      const ev = eventsRef.current[i];
      const myProgress = posRef.current[i] / TOTAL_DIST;

      // 이벤트 감쇠
      if (ev.boost > 0) ev.boost--;
      if (ev.stumble > 0) ev.stumble--;

      const boostMod = ev.boost > 0 ? 0.55 : 0;
      const stumbleMod = ev.stumble > 0 ? -0.5 : 0;

      // 격차 줄이기 효과 (뒤처진 말에게 살짝 보정)
      const gap = (leader - posRef.current[i]) / TOTAL_DIST;
      const catchUp = gap > 0.15 ? gap * 0.4 : 0;

      const speed = calcSpeed(horse, myProgress, boostMod + stumbleMod + catchUp);
      posRef.current[i] = Math.min(TOTAL_DIST, posRef.current[i] + speed * 3.2);

      // 완주 체크
      if (posRef.current[i] >= TOTAL_DIST && !finishedRef.current.includes(i)) {
        const newFinished = [...finishedRef.current, i];
        finishedRef.current = newFinished;
        setRankings(newFinished.map((hi, rank) => ({
          rank: rank + 1, horseIdx: hi, horse: horses[hi], participant: participants[hi]
        })));
        if (newFinished.length >= horses.length) return true;
      }
    });

    // ── 카메라: 1위 말을 FINISH_DISP 앞에 유지 ──
    const camTarget = Math.max(0, leader - (FINISH_DISP - START_X));
    cameraRef.current += (camTarget - cameraRef.current) * 0.08;

    return finishedRef.current.length >= horses.length;
  };

  const startRace = () => {
    posRef.current = horses.map(() => 0);
    eventsRef.current = horses.map(() => ({ boost: 0, stumble: 0 }));
    tickRef.current = 0;
    finishedRef.current = [];
    cameraRef.current = 0;
    setRankings([]);
    setDone(false);
    setStarted(true);

    const loop = () => {
      const done = update();
      draw();
      if (!done) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        draw();
        setDone(true);
        onFinish(finishedRef.current.map((hi, rank) => ({
          rank: rank + 1, horseIdx: hi, horse: horses[hi], participant: participants[hi]
        })));
      }
    };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div>
      {/* 트랙 */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 12 }}>
        <canvas ref={canvasRef} width={VIEWPORT_W} height={horses.length * LANE_H + 50} style={{ display: "block", width: "100%" }} />
      </div>

      {/* 완주 순위 */}
      {rankings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {rankings.map((r) => (
            <div key={r.rank} style={{ display: "flex", gap: 8, alignItems: "center", background: `${r.horse.color}18`, border: `1px solid ${r.horse.color}${r.rank === rankings.length ? "88" : "44"}`, borderRadius: 10, padding: "6px 12px", animation: "popIn 0.3s ease" }}>
              <span style={{ fontSize: 14, minWidth: 26 }}>{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `${r.rank}.`}</span>
              <span style={{ fontSize: 20 }}>{r.horse.emoji}</span>
              <span style={{ fontWeight: 700, color: r.horse.color, flex: 1 }}>{r.horse.name}</span>
              <span style={{ fontSize: 12, color: "#666" }}>({r.participant})</span>
              {done && r.rank === rankings.length && <span style={{ fontSize: 12, color: "#f97316", fontWeight: 700 }}>☕</span>}
            </div>
          ))}
        </div>
      )}

      {!started ? (
        <button onClick={startRace} style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 16, padding: "15px", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          🏁 출발!
        </button>
      ) : (
        <button onClick={startRace} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          🔄 다시 레이스
        </button>
      )}
    </div>
  );
}

export default function HorseGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [phase, setPhase] = useState("pick");
  const [selections, setSelections] = useState({});
  const [pickingIdx, setPickingIdx] = useState(0);
  const [showStory, setShowStory] = useState(null);
  const [raceResults, setRaceResults] = useState([]);

  const selectHorse = (horse) => {
    if (Object.values(selections).includes(horse.id)) return;
    const newSel = { ...selections, [pickingIdx]: horse.id };
    setSelections(newSel);
    if (pickingIdx + 1 < n) setPickingIdx(pickingIdx + 1);
    else setPhase("ready");
  };

  const handleFinish = (results) => {
    setRaceResults(results);
    setPhase("result");
  };

  const reset = () => { setPhase("pick"); setSelections({}); setPickingIdx(0); setRaceResults([]); };

  const selectedHorses = Object.keys(selections)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(idx => HORSES.find(h => h.id === selections[parseInt(idx)]));

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 14, cursor: "pointer", padding: 0 }}>← 참가자 변경</button>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#aaa", fontSize: 13, cursor: "pointer" }}>🏠 홈</button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 30, marginBottom: 3 }}>🐎</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>경마 대결</div>
      </div>

      {/* 말 선택 */}
      {phase === "pick" && (
        <>
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "10px 16px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6ee7b7", marginBottom: 2 }}>말 선택 중</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{participants[pickingIdx]}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>({pickingIdx + 1} / {n})</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
            {HORSES.map(horse => {
              const takenEntry = Object.entries(selections).find(([, hid]) => hid === horse.id);
              const isTaken = !!takenEntry;
              const takenName = isTaken ? participants[parseInt(takenEntry[0])] : null;
              return (
                <div key={horse.id}
                  style={{ background: isTaken ? "rgba(255,255,255,0.03)" : `${horse.color}12`, border: `1px solid ${isTaken ? "rgba(255,255,255,0.06)" : horse.color + "44"}`, borderRadius: 16, padding: "11px 14px", cursor: isTaken ? "default" : "pointer", opacity: isTaken ? 0.45 : 1, transition: "all 0.18s" }}
                  onClick={() => !isTaken && selectHorse(horse)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ fontSize: 30, flexShrink: 0 }}>{horse.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: isTaken ? "#444" : horse.color }}>{horse.name}</span>
                        <span style={{ fontSize: 10, background: `${horse.color}22`, color: horse.color, borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>{horse.traitIcon} {horse.trait}</span>
                        {isTaken && <span style={{ fontSize: 11, color: "#555" }}>({takenName})</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>{horse.story.slice(0, 52)}...</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setShowStory(horse); }}
                      style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: "5px 8px", color: "#aaa", fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                      스토리
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 레이스 준비 & 진행 */}
      {(phase === "ready" || phase === "result") && (
        <>
          {phase === "ready" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {Object.entries(selections).map(([idx, hid]) => {
                const horse = HORSES.find(h => h.id === hid);
                return (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", background: `${horse.color}18`, border: `1px solid ${horse.color}44`, borderRadius: 12, padding: "9px 14px" }}>
                    <span style={{ fontSize: 22 }}>{horse.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: horse.color, fontSize: 13 }}>{horse.name}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{horse.traitIcon} {horse.trait}</div>
                    </div>
                    <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>{participants[parseInt(idx)]}</span>
                  </div>
                );
              })}
            </div>
          )}

          <HorseRace
            horses={selectedHorses}
            participants={selectedHorses.map((_, i) => participants[i])}
            onFinish={handleFinish}
          />

          {/* 최종 결과 */}
          {phase === "result" && raceResults.length > 0 && (
            <>
              <div style={{ textAlign: "center", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: 16, padding: "14px", marginTop: 10, animation: "popIn 0.4s ease" }}>
                <div style={{ fontSize: 28, marginBottom: 5 }}>☕</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fb923c" }}>{raceResults[raceResults.length - 1].participant}</div>
                <div style={{ fontSize: 13, color: "#aaa", marginTop: 3 }}>꼴찌 — 커피 한 잔 쏘세요!</div>
              </div>
              <button onClick={reset} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                🔄 다시 하기
              </button>
            </>
          )}
        </>
      )}

      {/* 스토리 모달 */}
      {showStory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={() => setShowStory(null)}>
          <div style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: `1.5px solid ${showStory.color}66`, borderRadius: 24, padding: "28px 24px", maxWidth: 380, width: "100%", animation: "popIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{showStory.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: showStory.color }}>{showStory.name}</div>
              <div style={{ fontSize: 12, background: `${showStory.color}22`, color: showStory.color, borderRadius: 8, padding: "4px 12px", display: "inline-block", marginTop: 6 }}>{showStory.traitIcon} {showStory.trait}</div>
            </div>
            <div style={{ fontSize: 14, color: "#c4c4c4", lineHeight: 1.75, marginBottom: 20 }}>{showStory.story}</div>
            <button onClick={() => { selectHorse(showStory); setShowStory(null); }}
              disabled={Object.values(selections).includes(showStory.id)}
              style={{ width: "100%", background: Object.values(selections).includes(showStory.id) ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg,${showStory.color},${showStory.color}99)`, border: "none", borderRadius: 14, padding: "13px", color: Object.values(selections).includes(showStory.id) ? "#444" : "#fff", fontSize: 15, fontWeight: 800, cursor: Object.values(selections).includes(showStory.id) ? "not-allowed" : "pointer" }}>
              {Object.values(selections).includes(showStory.id) ? "이미 선택됨" : "이 말 선택하기"}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
