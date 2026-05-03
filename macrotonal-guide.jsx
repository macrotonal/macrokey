import { useState, useRef } from "react";

const BASE = 261.63;

const DEGREES = [
  { n:1,  cents:0,    name:"Unison",          tag:null,      just:"1/1",    justC:0,    dev:0,    desc:"Root — the anchor. All other intervals are measured from here. The system opens on C3." },
  { n:2,  cents:125,  name:"Macro 2nd",        tag:null,      just:"≈16/15", justC:112,  dev:+13,  desc:"25¢ wider than a standard semitone. Restless, curious — neither here nor there." },
  { n:3,  cents:250,  name:"Macro 3rd",        tag:null,      just:"≈8/7",   justC:231,  dev:+19,  desc:"Between major 2nd and minor 3rd. A spectral shimmer — the interval that doesn't belong to either world." },
  { n:4,  cents:375,  name:"Neutral 3rd",      tag:null,      just:"≈5/4",   justC:386,  dev:-11,  desc:"11¢ below a pure major third. Floating, not quite landing. Heard in maqam music and natural harmonics." },
  { n:5,  cents:500,  name:"Pure 4th",         tag:"fourth",  just:"4/3",    justC:498,  dev:+2,   desc:"Only 2¢ from just intonation — near-acoustic purity. Feels stable and inevitable. The first axis of the system." },
  { n:6,  cents:625,  name:"Wide Tritone",     tag:null,      just:"≈10/7",  justC:617,  dev:+8,   desc:"8¢ above 10/7. Luminous rather than tense — the tritone stretched into openness. Not the restless tritone of Western harmony." },
  { n:7,  cents:750,  name:"Macro 6th",        tag:null,      just:"≈14/9",  justC:765,  dev:-15,  desc:"Hovering between tritone and minor 6th. Deeply ambiguous — a colour without a name in standard theory." },
  { n:8,  cents:875,  name:"Near Maj. 6th",    tag:null,      just:"≈5/3",   justC:884,  dev:-9,   desc:"9¢ below pure major 6th. Warm and recognisable but slightly adrift — familiar seen through mist." },
  { n:9,  cents:1000, name:"Pure Min. 7th",    tag:"seventh", just:"16/9",   justC:996,  dev:+4,   desc:"4¢ from pure 16/9. Stacking two pure fourths arrives here exactly. The second axis — the system's other point of stability." },
  { n:10, cents:1125, name:"Wide Maj. 7th",    tag:null,      just:"≈15/8",  justC:1088, dev:+37,  desc:"Wide, straining. The cycle boundary approaching. Neither resolved nor dissonant — suspended." },
  { n:11, cents:1250, name:"Macro 9th",        tag:"macro",   just:"—",      justC:null, dev:null, desc:"50¢ above standard octave. No equivalent in any conventional tuning. Purely macrotonal territory begins here." },
  { n:12, cents:1375, name:"Macro 10th",       tag:"macro",   just:"—",      justC:null, dev:null, desc:"175¢ above octave. The outermost reach before the cycle closes at 1500¢ — a minor third above the standard octave." },
];

const hz = c => BASE * Math.pow(2, c / 1200);

const TAG_STYLE = {
  fourth:  { bg: "rgba(29,158,117,0.15)", border: "#1D9E75", text: "#5DCAA5", badge: "near-pure 4th ★" },
  seventh: { bg: "rgba(15,110,86,0.15)",  border: "#0F6E56", text: "#9FE1CB", badge: "near-pure min. 7th ★" },
  macro:   { bg: "rgba(83,74,183,0.12)",  border: "#534AB7", text: "#AFA9EC", badge: "↑ above the octave" },
};

const NODE_FILL = { fourth: "#1D9E75", seventh: "#0F6E56", macro: "#534AB7" };
const NODE_TEXT = { fourth: "#E1F5EE", seventh: "#9FE1CB", macro: "#EEEDFE" };

export default function MacrotonalGuide() {
  const [sel, setSel] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [seqState, setSeqState] = useState(null);
  const ctxRef = useRef(null);
  const nodes = useRef([]);

  const ctx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const c = ctxRef.current;
    if (c.state === "suspended") c.resume();
    return c;
  };

  const stopAll = () => { nodes.current.forEach(n => { try { n.stop(); } catch(e){} }); nodes.current = []; };

  const tone = (cents, startAt, dur, vol = 0.22) => {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = hz(cents);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(vol, startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(startAt); osc.stop(startAt + dur + 0.06);
    nodes.current.push(osc);
    return osc;
  };

  const playDeg = (deg) => {
    stopAll();
    setSel(deg);
    setPlaying(deg.n);
    const c = ctx();
    const t = c.currentTime;
    tone(0, t, 3.2);
    if (deg.cents > 0) tone(deg.cents, t, 3.2);
    setTimeout(() => setPlaying(null), 3400);
  };

  const playChain = () => {
    stopAll(); setSeqState("chain");
    const c = ctx(); const t = c.currentTime;
    [0, 500, 1000].forEach((cents, i) => {
      tone(0, t + i*1.4, 1.6, 0.18);
      if (cents > 0) tone(cents, t + i*1.4, 1.6, 0.18);
    });
    setTimeout(() => setSeqState(null), 5000);
  };

  const playCompare = (a, b) => {
    stopAll(); setSeqState("compare");
    const c = ctx(); const t = c.currentTime;
    tone(0, t, 1.4, 0.2); tone(a, t, 1.4, 0.2);
    tone(0, t + 1.8, 1.4, 0.2); tone(b, t + 1.8, 1.4, 0.2);
    setTimeout(() => setSeqState(null), 3500);
  };

  // SVG geometry
  const CX = 175, CY = 175, R = 130, NR = 21;
  const pos = n => {
    const a = (-90 + (n-1)*30) * Math.PI/180;
    return { x: CX + R*Math.cos(a), y: CY + R*Math.sin(a) };
  };
  const tri = [1,5,9].map(n => pos(n));
  const triStr = tri.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const s = sel;
  const tagStyle = s?.tag ? TAG_STYLE[s.tag] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080d0a",
      color: "#c8e8d0",
      fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 30% 60%, rgba(20,60,35,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(15,45,28,0.12) 0%, transparent 55%)"
      }} />
      <div style={{ position: "fixed", inset: "10px", border: "1px solid rgba(90,170,120,0.1)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: "840px", margin: "0 auto", padding: "44px 28px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "7px", textTransform: "uppercase", color: "rgba(90,170,120,0.45)", marginBottom: "14px" }}>
            Illustrated Interval Guide
          </div>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: "normal", color: "#d8f2e0", margin: "0 0 8px", letterSpacing: "1px" }}>
            Macrotonal Tuning System
          </h1>
          <div style={{ fontSize: "12px", color: "rgba(200,232,208,0.38)", letterSpacing: "1px" }}>
            125¢ per degree · 12 degrees · 1500¢ per cycle · root: C3 Ableton = 261.63 Hz
          </div>
          <div style={{ width: "48px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(90,170,120,0.4), transparent)", margin: "16px auto" }} />
          <p style={{ fontSize: "12px", color: "rgba(200,232,208,0.28)", lineHeight: 1.7, maxWidth: "440px", margin: "0 auto" }}>
            Tap any degree to hear it sounding with the root. Coloured nodes mark intervals with unique harmonic properties.
          </p>
        </div>

        {/* Main layout */}
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "32px" }}>

          {/* Circle */}
          <div style={{ flex: "0 0 350px" }}>
            <svg width="350" height="350" viewBox="0 0 350 350" style={{ display: "block" }}>
              {/* Outer decorative ring */}
              <circle cx={CX} cy={CY} r={R+22} fill="none" stroke="rgba(90,170,120,0.08)" strokeWidth="1" />
              <circle cx={CX} cy={CY} r={R+14} fill="none" stroke="rgba(90,170,120,0.06)" strokeWidth="0.5" />

              {/* Spoke lines */}
              {DEGREES.map(d => {
                const p = pos(d.n);
                return <line key={d.n} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(90,170,120,0.1)" strokeWidth="0.5" />;
              })}

              {/* Fourth triangle */}
              <polygon points={triStr} fill="rgba(29,158,117,0.05)" stroke="#1D9E75" strokeWidth="0.8" strokeDasharray="5,3" />

              {/* Cent arc rings */}
              {[0.25, 0.5, 0.75].map(f => (
                <circle key={f} cx={CX} cy={CY} r={R*f} fill="none" stroke="rgba(90,170,120,0.06)" strokeWidth="0.5" />
              ))}

              {/* Degree nodes */}
              {DEGREES.map(d => {
                const p = pos(d.n);
                const isPlaying = playing === d.n;
                const isSel = sel?.n === d.n;
                const fill = d.tag ? (isSel ? NODE_FILL[d.tag] : "rgba(10,16,12,0.95)") : (isSel ? "rgba(90,170,120,0.2)" : "rgba(10,16,12,0.95)");
                const stroke = d.tag ? (NODE_FILL[d.tag]) : (isSel ? "#c8e8d0" : "rgba(90,170,120,0.3)");
                const tcolor = d.tag ? (isSel ? NODE_TEXT[d.tag] : NODE_FILL[d.tag]) : (isSel ? "#d8f2e0" : "rgba(200,232,208,0.6)");
                const strokeW = isSel ? 1.5 : 0.8;
                return (
                  <g key={d.n} onClick={() => playDeg(d)} style={{ cursor: "pointer" }}>
                    <circle cx={p.x} cy={p.y} r={NR} fill={fill} stroke={stroke} strokeWidth={strokeW}
                      opacity={isPlaying ? 0.6 : 1}
                    />
                    <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="12" fontWeight="500" fill={tcolor} fontFamily="'Palatino Linotype',Palatino,serif">
                      {d.n}
                    </text>
                    <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="7.5" fill={d.tag ? (isSel ? NODE_TEXT[d.tag] : NODE_FILL[d.tag]) : "rgba(200,232,208,0.35)"}>
                      {d.cents}¢
                    </text>
                  </g>
                );
              })}

              {/* Center */}
              <circle cx={CX} cy={CY} r={30} fill="#080d0a" stroke="rgba(90,170,120,0.25)" strokeWidth="0.8" />
              <text x={CX} y={CY-8} textAnchor="middle" fontSize="12" fontWeight="500" fill="#c8e8d0" fontFamily="'Palatino Linotype',Palatino,serif">C3</text>
              <text x={CX} y={CY+4} textAnchor="middle" fontSize="9" fill="rgba(200,232,208,0.5)">root</text>
              <text x={CX} y={CY+15} textAnchor="middle" fontSize="8" fill="rgba(200,232,208,0.28)">261.6 Hz</text>
            </svg>
            <p style={{ fontSize: "10px", color: "rgba(200,232,208,0.22)", textAlign: "center", lineHeight: 1.6, marginTop: "4px" }}>
              Dashed triangle: degrees 1 → 5 → 9. Three pure fourths. Equilateral in the cycle.
            </p>
          </div>

          {/* Right: detail + legend */}
          <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Detail card */}
            <div style={{
              background: "rgba(10,18,13,0.85)",
              border: `1px solid ${s?.tag ? TAG_STYLE[s.tag].border : "rgba(90,170,120,0.18)"}`,
              borderRadius: "4px", padding: "20px 22px",
              minHeight: "220px",
              transition: "border-color 0.3s",
            }}>
              {s ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "32px", fontWeight: "normal", color: s.tag ? TAG_STYLE[s.tag].text : "#c8e8d0", lineHeight: 1 }}>
                      {s.n}
                    </span>
                    {s.tag && (
                      <span style={{
                        fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
                        padding: "3px 10px", borderRadius: "2px",
                        background: TAG_STYLE[s.tag].bg,
                        border: `1px solid ${TAG_STYLE[s.tag].border}`,
                        color: TAG_STYLE[s.tag].text,
                      }}>{TAG_STYLE[s.tag].badge}</span>
                    )}
                  </div>

                  <p style={{ fontSize: "16px", color: "#d8f2e0", margin: "0 0 6px", fontWeight: "normal" }}>{s.name}</p>
                  <p style={{ fontSize: "12px", color: "rgba(200,232,208,0.55)", lineHeight: 1.7, margin: "0 0 16px" }}>{s.desc}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    {[
                      ["Interval", `${s.cents}¢`],
                      ["Frequency", `${hz(s.cents).toFixed(2)} Hz`],
                      ["Nearest just", s.just],
                      ["Deviation", s.dev !== null ? `${s.dev >= 0 ? "+" : ""}${s.dev}¢` : "—"],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background: "rgba(90,170,120,0.06)", borderRadius: "3px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase", color: "rgba(200,232,208,0.3)", marginBottom: "3px" }}>{l}</div>
                        <div style={{ fontSize: "13px", color: "rgba(200,232,208,0.85)" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => playDeg(s)}
                    style={{
                      width: "100%", background: "transparent",
                      border: `1px solid ${s.tag ? TAG_STYLE[s.tag].border : "rgba(90,170,120,0.3)"}`,
                      color: s.tag ? TAG_STYLE[s.tag].text : "#c8e8d0",
                      padding: "7px", borderRadius: "3px", cursor: "pointer",
                      fontSize: "11px", letterSpacing: "2px", fontFamily: "inherit",
                    }}
                  >
                    {playing === s.n ? "Sounding…" : "Play again"}
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px" }}>
                  <p style={{ fontSize: "12px", color: "rgba(200,232,208,0.2)", textAlign: "center", lineHeight: 1.7 }}>
                    Select a degree<br/>from the circle
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ background: "rgba(10,18,13,0.85)", border: "1px solid rgba(90,170,120,0.12)", borderRadius: "4px", padding: "16px 18px" }}>
              <p style={{ fontSize: "8px", letterSpacing: "4px", textTransform: "uppercase", color: "rgba(200,232,208,0.25)", margin: "0 0 12px" }}>Key</p>
              {[
                { color: "#1D9E75", label: "Degree 5 — Pure 4th", sub: "+2¢ from 4/3 just intonation" },
                { color: "#0F6E56", label: "Degree 9 — Pure Min. 7th", sub: "+4¢ from 16/9 · two fourths stacked" },
                { color: "#534AB7", label: "Degrees 11–12 — Macrotonal", sub: "above the standard octave" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(200,232,208,0.7)" }}>{item.label}</div>
                    <div style={{ fontSize: "10px", color: "rgba(200,232,208,0.33)" }}>{item.sub}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                <div style={{ width: "24px", height: "8px", border: "1px dashed #1D9E75", borderRadius: "1px", flexShrink: 0 }} />
                <div style={{ fontSize: "10px", color: "rgba(200,232,208,0.33)" }}>Fourth triangle — 1 → 5 → 9 → cycle</div>
              </div>
            </div>
          </div>
        </div>

        {/* All degrees table */}
        <div style={{ background: "rgba(10,18,13,0.85)", border: "1px solid rgba(90,170,120,0.1)", borderRadius: "4px", marginBottom: "28px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(90,170,120,0.1)" }}>
            <span style={{ fontSize: "8px", letterSpacing: "5px", textTransform: "uppercase", color: "rgba(200,232,208,0.3)" }}>All degrees at a glance</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr>
                  {["Deg.", "Cents", "Frequency", "Name", "Nearest just", "Deviation"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "rgba(200,232,208,0.3)", fontWeight: "normal", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid rgba(90,170,120,0.1)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEGREES.map((d, i) => {
                  const highlight = d.tag;
                  const tcolor = highlight ? TAG_STYLE[d.tag].text : "rgba(200,232,208,0.65)";
                  return (
                    <tr key={d.n}
                      onClick={() => playDeg(d)}
                      style={{
                        cursor: "pointer",
                        background: sel?.n === d.n ? "rgba(90,170,120,0.07)" : i%2===0 ? "transparent" : "rgba(90,170,120,0.02)",
                      }}
                    >
                      <td style={{ padding: "7px 14px", color: highlight ? TAG_STYLE[d.tag].text : "#c8e8d0", fontWeight: "500" }}>
                        {d.n}{d.tag && " ★"}
                      </td>
                      <td style={{ padding: "7px 14px", color: tcolor }}>{d.cents}¢</td>
                      <td style={{ padding: "7px 14px", color: tcolor }}>{hz(d.cents).toFixed(2)} Hz</td>
                      <td style={{ padding: "7px 14px", color: tcolor }}>{d.name}</td>
                      <td style={{ padding: "7px 14px", color: "rgba(200,232,208,0.4)" }}>{d.just}</td>
                      <td style={{ padding: "7px 14px", color: d.dev !== null ? (Math.abs(d.dev) <= 5 ? "#1D9E75" : Math.abs(d.dev) <= 15 ? "#9FE1CB" : "rgba(200,232,208,0.4)") : "rgba(200,232,208,0.2)" }}>
                        {d.dev !== null ? `${d.dev >= 0 ? "+" : ""}${d.dev}¢` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(90,170,120,0.06)" }}>
            <span style={{ fontSize: "9px", color: "rgba(200,232,208,0.2)" }}>Click any row to hear interval with root · Deviation column: green ≤ 5¢ from pure · teal ≤ 15¢</span>
          </div>
        </div>

        {/* Harmonic relationships */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "8px", letterSpacing: "6px", textTransform: "uppercase", color: "rgba(200,232,208,0.25)", marginBottom: "14px" }}>
            Unique harmonic relationships
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>

            <div style={{ background: "rgba(10,18,13,0.85)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: "4px", padding: "18px" }}>
              <p style={{ fontSize: "13px", color: "#9FE1CB", margin: "0 0 6px" }}>Three pure fourths = one cycle</p>
              <p style={{ fontSize: "11px", color: "rgba(200,232,208,0.45)", lineHeight: 1.7, margin: "0 0 14px" }}>
                Degrees 1 → 5 → 9 → cycle. Three stacked near-pure fourths close the 1500¢ cycle exactly. In standard tuning, twelve fifths are needed.
              </p>
              <button onClick={playChain} disabled={seqState==="chain"}
                style={{ width: "100%", background: "transparent", border: "1px solid rgba(29,158,117,0.4)", color: "#9FE1CB", padding: "7px", borderRadius: "3px", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", fontFamily: "inherit" }}>
                {seqState === "chain" ? "Sounding…" : "Play 1 → 5 → 9"}
              </button>
            </div>

            <div style={{ background: "rgba(10,18,13,0.85)", border: "1px solid rgba(90,170,120,0.15)", borderRadius: "4px", padding: "18px" }}>
              <p style={{ fontSize: "13px", color: "#c8e8d0", margin: "0 0 6px" }}>No good fifth</p>
              <p style={{ fontSize: "11px", color: "rgba(200,232,208,0.45)", lineHeight: 1.7, margin: "0 0 14px" }}>
                Nearest steps to a pure fifth (702¢) land at 625¢ and 750¢. The system has no usable fifth — its harmonic logic is quartal, not quintal. Compare: deg. 6 vs standard fifth.
              </p>
              <button onClick={() => playCompare(625, 700)} disabled={seqState==="compare"}
                style={{ width: "100%", background: "transparent", border: "1px solid rgba(90,170,120,0.25)", color: "#c8e8d0", padding: "7px", borderRadius: "3px", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", fontFamily: "inherit" }}>
                {seqState === "compare" ? "Sounding…" : "625¢ then 700¢"}
              </button>
            </div>

            <div style={{ background: "rgba(10,18,13,0.85)", border: "1px solid rgba(83,74,183,0.25)", borderRadius: "4px", padding: "18px" }}>
              <p style={{ fontSize: "13px", color: "#AFA9EC", margin: "0 0 6px" }}>Above the octave</p>
              <p style={{ fontSize: "11px", color: "rgba(200,232,208,0.45)", lineHeight: 1.7, margin: "0 0 14px" }}>
                Degrees 11 and 12 exist 50¢ and 175¢ above the standard octave. No equivalent in any conventional system. The cycle closes at 1500¢ — a minor third above the octave.
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {[{cents:1250,label:"Deg. 11"},{cents:1375,label:"Deg. 12"}].map(item => (
                  <button key={item.cents}
                    onClick={() => { stopAll(); const c = ctx(); const t = c.currentTime; tone(0,t,2.5); tone(item.cents,t,2.5); }}
                    style={{ flex:1, background: "transparent", border: "1px solid rgba(83,74,183,0.35)", color: "#AFA9EC", padding: "7px 4px", borderRadius: "3px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", fontFamily: "inherit" }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div style={{ marginTop: "44px", paddingTop: "16px", borderTop: "1px solid rgba(90,170,120,0.07)", fontSize: "9px", color: "rgba(200,232,208,0.15)", letterSpacing: "3px", textTransform: "uppercase", textAlign: "center" }}>
          Root: C3 Ableton = C4 Musescore · 1500¢ per cycle · cycle = minor third above standard octave
        </div>
      </div>
    </div>
  );
}
