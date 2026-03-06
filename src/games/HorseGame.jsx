import { useState, useRef, useEffect } from "react";

const HORSES = [
  {
    id: 1, emoji: "🐎", name: "선셋 라이더", color: "#f97316",
    story: "미국 서부 텍사스 평원을 누비던 전설의 경주마. 전성기엔 무패 행진을 이어갔지만, 나이가 들어 은퇴 통보를 받고 하루아침에 경매장에 나왔다. 지금도 석양만 보면 전력질주하는 버릇이 있다.",
    trait: "초반 폭발력", traitIcon: "⚡",
    speedProfile: (t) => t < 0.3 ? 1.4 : t < 0.7 ? 0.85 : 0.9,
  },
  {
    id: 2, emoji: "🦄", name: "적토마 Jr.", color: "#ef4444",
    story: "삼국지 여포가 타던 그 적토마의 45대손. 혈통서에 적혀있는 말이 사실인지 아무도 확인 못 했지만, 본인은 굳게 믿고 있다. 위기 상황에서 폭발적인 후반 스퍼트를 자랑한다.",
    trait: "후반 폭발력", traitIcon: "🔥",
    speedProfile: (t) => t < 0.4 ? 0.8 : t < 0.75 ? 1.0 : 1.55,
  },
  {
    id: 3, emoji: "🐴", name: "뚝심 한라봉", color: "#eab308",
    story: "제주도 감귤 농장에서 일하다 어느 날 우연히 경마장 근처를 지나치며 '나도 할 수 있겠다'고 생각했다. 느리지만 절대 멈추지 않는 뚝심으로 베테랑 기수들의 존경을 받는다.",
    trait: "안정적 페이스", traitIcon: "🛡️",
    speedProfile: (t) => 0.95 + Math.sin(t * Math.PI) * 0.1,
  },
  {
    id: 4, emoji: "🐆", name: "도심 탈주마", color: "#8b5cf6",
    story: "서울 도심 촬영 현장에서 탈출해 강변북로를 질주한 그 말. 3시간 동안 경찰차를 따돌렸다. 경마장으로 오게 된 건 어차피 달리기를 좋아하니까. 페이스가 예측 불허다.",
    trait: "랜덤 페이스", traitIcon: "🎲",
    speedProfile: (t) => 0.7 + Math.random() * 0.8,
  },
  {
    id: 5, emoji: "🦌", name: "설원의 바람", color: "#06b6d4",
    story: "시베리아 동토에서 썰매를 끌다 글로벌 스카우터 눈에 띄어 한국에 왔다. 영하 40도에서도 멀쩡히 달리던 체력이 장기인데, 한국 여름 더위에 적응 중이다. 중반부터 가속이 붙는다.",
    trait: "중반 가속", traitIcon: "❄️",
    speedProfile: (t) => t < 0.2 ? 0.75 : t < 0.6 ? 1.2 : 1.1,
  },
  {
    id: 6, emoji: "🐂", name: "황소 플래비", color: "#22c55e",
    story: "플랩풋볼 운동장 옆 목장 출신. 축구공을 보면 흥분해서 무조건 돌진하는 버릇이 있다. 경마장에 우연히 섞여 들어왔는데 생각보다 꽤 빨라서 다들 당황했다. 전반 몸풀기가 오래 걸린다.",
    trait: "후반 반전", traitIcon: "⚽",
    speedProfile: (t) => t < 0.5 ? 0.7 : 1.35,
  },
  {
    id: 7, emoji: "🌙", name: "달빛 나이트", color: "#a78bfa",
    story: "낮에는 졸고 밤에만 달리던 야행성 경주마. 경마 대회는 항상 낮에 열려서 인생이 피곤하다. 그래도 마지막 직선 코스에서 갑자기 깨어나는 습관이 있어 역전의 왕이라 불린다.",
    trait: "막판 역전", traitIcon: "🌙",
    speedProfile: (t) => t < 0.8 ? 0.78 : 1.8,
  },
  {
    id: 8, emoji: "🦊", name: "꾀돌이 여우비", color: "#ec4899",
    story: "원래 여우인데 말 코스튬을 입고 경마장에 들어온 것 같다는 소문이 있다. 코너링이 비정상적으로 좋고, 다른 말들이 자꾸 미끄러지는 구간에서 혼자 속도를 낸다. 출처불명의 기록 보유자.",
    trait: "코너 최강", traitIcon: "🦊",
    speedProfile: (t) => 1.0 + Math.sin(t * Math.PI * 3) * 0.25,
  },
];

const TRACK_W = 340;
const TRACK_H = 400;
const LANE_H = 44;
const START_X = 60;
const END_X = TRACK_W - 30;
const FINISH_X = END_X - 10;

function HorseRace({ horses, participants, onFinish }) {
  const canvasRef = useRef(null);
  const posRef = useRef(horses.map(() => START_X));
  const velRef = useRef(horses.map(() => 1.2));
  const tickRef = useRef(0);
  const animRef = useRef(null);
  const finishedRef = useRef([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rankings, setRankings] = useState([]);
  const rankingsRef = useRef([]);

  const totalTrack = FINISH_X - START_X;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, TRACK_W, TRACK_H);

    // Background
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, TRACK_W, TRACK_H);

    // Track
    const topY = 24;
    horses.forEach((_, i) => {
      const y = topY + i * LANE_H;
      ctx.fillStyle = i % 2 === 0 ? "#0d2040" : "#0b1a35";
      ctx.fillRect(START_X - 5, y, END_X - START_X + 10, LANE_H - 2);
      // Grass edge
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, y, START_X - 5, LANE_H - 2);
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(END_X + 5, y, TRACK_W - END_X - 5, LANE_H - 2);
    });

    // Finish line
    for (let i = 0; i < TRACK_H; i += 8) {
      ctx.fillStyle = i % 16 === 0 ? "#fff" : "#000";
      ctx.fillRect(FINISH_X, i, 6, 8);
    }
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FINISH", FINISH_X + 3, TRACK_H - 6);

    // Horses
    horses.forEach((horse, i) => {
      const x = posRef.current[i];
      const y = topY + i * LANE_H + LANE_H / 2;
      const isFinished = finishedRef.current.includes(i);
      const rank = rankingsRef.current.findIndex(r => r.horseIdx === i);

      // Rank badge if finished
      if (rank >= 0) {
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = rank === 0 ? "#fbbf24" : rank === horses.length - 1 ? "#f87171" : "#94a3b8";
        ctx.fillText(`${rank + 1}위`, x + 18, y - 14);
      }

      // Horse emoji
      ctx.font = `${LANE_H * 0.65}px serif`;
      ctx.textAlign = "left";
      ctx.fillText(horse.emoji, x - 14, y + 10);

      // Name label
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 9px 'Pretendard',sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(participants[i], 4, y + 4);

      // Progress bar
      const progress = (x - START_X) / totalTrack;
      ctx.fillStyle = `${horse.color}33`;
      ctx.fillRect(START_X - 5, topY + i * LANE_H, totalTrack + 10, 3);
      ctx.fillStyle = horse.color;
      ctx.fillRect(START_X - 5, topY + i * LANE_H, Math.min(progress * (totalTrack + 10), totalTrack + 10), 3);
    });
  };

  const update = () => {
    tickRef.current++;
    const t = Math.min(tickRef.current / 300, 1);
    let allDone = true;

    horses.forEach((horse, i) => {
      if (finishedRef.current.includes(i)) return;
      allDone = false;
      const baseSpeed = horse.speedProfile(t);
      const noise = (Math.random() - 0.5) * 0.4;
      velRef.current[i] = Math.max(0.3, (baseSpeed + noise) * 1.8);
      posRef.current[i] = Math.min(FINISH_X + 5, posRef.current[i] + velRef.current[i]);
      if (posRef.current[i] >= FINISH_X) {
        finishedRef.current = [...finishedRef.current, i];
        const newR = [...rankingsRef.current, { horseIdx: i, horse: horses[i], participant: participants[i] }];
        rankingsRef.current = newR;
        setRankings([...newR]);
      }
    });
    return finishedRef.current.length >= horses.length;
  };

  const startRace = () => {
    setStarted(true);
    posRef.current = horses.map(() => START_X);
    velRef.current = horses.map(() => 1.2);
    tickRef.current = 0;
    finishedRef.current = [];
    rankingsRef.current = [];
    setRankings([]);
    setFinished(false);

    const loop = () => {
      const done = update();
      draw();
      if (!done) animRef.current = requestAnimationFrame(loop);
      else { setFinished(true); onFinish(rankingsRef.current); }
    };
    animRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => { draw(); return () => { if (animRef.current) cancelAnimationFrame(animRef.current); }; }, []);

  return (
    <div>
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 12 }}>
        <canvas ref={canvasRef} width={TRACK_W} height={Math.max(TRACK_H, horses.length * LANE_H + 40)} style={{ display: "block", width: "100%" }} />
      </div>

      {rankings.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {rankings.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", background: `${r.horse.color}18`, border: `1px solid ${r.horse.color}44`, borderRadius: 10, padding: "6px 12px", animation: "popIn 0.3s ease" }}>
              <span style={{ fontSize: 14 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <span style={{ fontSize: 18 }}>{r.horse.emoji}</span>
              <span style={{ fontWeight: 700, color: r.horse.color, flex: 1 }}>{r.horse.name}</span>
              <span style={{ fontSize: 12, color: "#777" }}>({r.participant})</span>
              {finished && i === rankings.length - 1 && <span style={{ fontSize: 12, color: "#f97316", fontWeight: 700 }}>☕</span>}
            </div>
          ))}
        </div>
      )}

      {!started ? (
        <button onClick={startRace} style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 16, padding: "15px", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          🏁 출발!
        </button>
      ) : (
        <button onClick={startRace} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "14px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          🔄 다시 레이스
        </button>
      )}
    </div>
  );
}

export default function HorseGame({ participants, bet, onBack, onHome }) {
  const n = participants.length;
  const [phase, setPhase] = useState("pick"); // pick | race | result
  const [selections, setSelections] = useState({}); // {participantIdx: horseId}
  const [pickingIdx, setPickingIdx] = useState(0);
  const [showStory, setShowStory] = useState(null);
  const [raceResults, setRaceResults] = useState([]);

  const availableHorses = HORSES.filter(h => !Object.values(selections).includes(h.id));
  const pickedHorse = selections[pickingIdx] != null ? HORSES.find(h => h.id === selections[pickingIdx]) : null;

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

  // Selected horses in participant order
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

      {/* Horse picking */}
      {(phase === "pick") && (
        <>
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "10px 16px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6ee7b7", marginBottom: 2 }}>말 선택 중</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{participants[pickingIdx]}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>({pickingIdx + 1} / {n})</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {HORSES.map(horse => {
              const takenBy = Object.entries(selections).find(([, hid]) => hid === horse.id);
              const isTaken = !!takenBy;
              const takenName = isTaken ? participants[parseInt(takenBy[0])] : null;
              return (
                <div key={horse.id}
                  style={{ background: isTaken ? "rgba(255,255,255,0.03)" : `${horse.color}12`, border: `1px solid ${isTaken ? "rgba(255,255,255,0.06)" : horse.color + "44"}`, borderRadius: 16, padding: "12px 14px", cursor: isTaken ? "default" : "pointer", opacity: isTaken ? 0.45 : 1, transition: "all 0.18s" }}
                  onClick={() => !isTaken && selectHorse(horse)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 32, flexShrink: 0 }}>{horse.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: isTaken ? "#444" : horse.color }}>{horse.name}</span>
                        <span style={{ fontSize: 11, background: `${horse.color}22`, color: horse.color, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>{horse.traitIcon} {horse.trait}</span>
                        {isTaken && <span style={{ fontSize: 11, color: "#555" }}>({takenName})</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{horse.story.slice(0, 55)}...</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setShowStory(horse); }}
                      style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: "5px 9px", color: "#aaa", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                      스토리
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Ready to race */}
      {phase === "ready" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {Object.entries(selections).map(([idx, hid]) => {
              const horse = HORSES.find(h => h.id === hid);
              return (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", background: `${horse.color}18`, border: `1px solid ${horse.color}44`, borderRadius: 12, padding: "10px 14px" }}>
                  <span style={{ fontSize: 24 }}>{horse.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: horse.color, fontSize: 13 }}>{horse.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{horse.traitIcon} {horse.trait}</div>
                  </div>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>{participants[parseInt(idx)]}</span>
                </div>
              );
            })}
          </div>
          <HorseRace horses={selectedHorses} participants={selectedHorses.map((_, i) => participants[i])} onFinish={handleFinish} />
        </>
      )}

      {/* Race phase - show race */}
      {phase === "race" && (
        <HorseRace horses={selectedHorses} participants={selectedHorses.map((_, i) => participants[i])} onFinish={handleFinish} />
      )}

      {/* Result */}
      {phase === "result" && raceResults.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {raceResults.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: `${r.horse.color}18`, border: `1px solid ${r.horse.color}${i === raceResults.length - 1 ? "88" : "44"}`, borderRadius: 12, padding: "10px 14px" }}>
                <span style={{ fontSize: 14, minWidth: 26 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                <span style={{ fontSize: 24 }}>{r.horse.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: r.horse.color }}>{r.horse.name}</div>
                  <div style={{ fontSize: 12, color: "#777" }}>{r.participant}</div>
                </div>
                {i === raceResults.length - 1 && <span style={{ fontSize: 13, color: "#f97316", fontWeight: 700 }}>☕ 커피!</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: 16, padding: "14px", marginBottom: 14, animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 5 }}>☕</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fb923c" }}>{raceResults[raceResults.length - 1].participant}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 3 }}>꼴찌 — 커피 한 잔 쏘세요!</div>
          </div>
          <button onClick={reset} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "13px", color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            🔄 다시 하기
          </button>
        </>
      )}

      {/* Story modal */}
      {showStory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={() => setShowStory(null)}>
          <div style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: `1.5px solid ${showStory.color}66`, borderRadius: 24, padding: "28px 24px", maxWidth: 380, width: "100%", animation: "popIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{showStory.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: showStory.color }}>{showStory.name}</div>
              <div style={{ fontSize: 12, background: `${showStory.color}22`, color: showStory.color, borderRadius: 8, padding: "4px 12px", display: "inline-block", marginTop: 6 }}>{showStory.traitIcon} {showStory.trait}</div>
            </div>
            <div style={{ fontSize: 14, color: "#c4c4c4", lineHeight: 1.75, marginBottom: 20 }}>{showStory.story}</div>
            <button onClick={() => setShowStory(null)} style={{ width: "100%", background: `linear-gradient(135deg,${showStory.color},${showStory.color}99)`, border: "none", borderRadius: 14, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              이 말 선택하기
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
