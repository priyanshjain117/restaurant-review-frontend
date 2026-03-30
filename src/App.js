import { useState, useEffect, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════ */
const C = {
  bg:       "#08090A",
  surface:  "#0F1114",
  card:     "#161A1F",
  border:   "#1E242B",
  border2:  "#252C35",
  teal:     "#2DD4BF",
  tealDim:  "#1A8A7C",
  cream:    "#E8EDF2",
  muted:    "#6B7785",
  mutedLt:  "#8E99A6",
  green:    "#4ADE80",
  red:      "#F87171",
  amber:    "#FBBF24",
  xgb:  "#2DD4BF",   
  lr:   "#A78BFA",   
  svm:  "#FB923C",   
};

/* ═══════════════════════════════════════════════════════
   ACTUAL BENCHMARK RESULTS
═══════════════════════════════════════════════════════ */
const BENCHMARK = [
  { model:"XGBoost",             acc:0.9935, prec:0.9935, sens:0.9935, f1:0.9935, spec:0.9984, fpr:0.0016, fnr:0.0065, npv:0.9984, fdr:0.0065, mcc:0.9918 },
  { model:"Logistic Regression", acc:0.9993, prec:0.9993, sens:0.9993, f1:0.9993, spec:0.9998, fpr:0.0002, fnr:0.0007, npv:0.9998, fdr:0.0007, mcc:0.9992 },
  { model:"Linear SVM",          acc:0.9995, prec:0.9995, sens:0.9995, f1:0.9995, spec:0.9999, fpr:0.0001, fnr:0.0005, npv:0.9999, fdr:0.0005, mcc:0.9993 },
];

const PERF_METRICS  = ["acc","prec","sens","f1","spec","npv","mcc"];
const ERR_METRICS   = ["fpr","fnr","fdr"];

const METRIC_LABELS = {
  acc:"Accuracy", prec:"Precision", sens:"Sensitivity", f1:"F1-Score",
  spec:"Specificity", npv:"NPV", mcc:"MCC",
  fpr:"FPR", fnr:"FNR", fdr:"FDR",
};

const METRIC_DESC = {
  acc:"Overall correct predictions", prec:"Precision (macro avg)", sens:"Recall / Sensitivity (macro avg)",
  f1:"Harmonic mean of Prec & Recall", spec:"True Negative Rate (macro avg)", npv:"Negative Predictive Value",
  mcc:"Matthews Correlation Coefficient", fpr:"False Positive Rate ↓", fnr:"False Negative Rate ↓", fdr:"False Discovery Rate ↓",
};

const MODEL_COLOR = { "XGBoost": C.xgb, "Logistic Regression": C.lr, "Linear SVM": C.svm };

const RADAR_DATA = PERF_METRICS.slice(0, 5).map(k => ({
  metric: METRIC_LABELS[k],
  XGBoost:            +(BENCHMARK[0][k] * 100).toFixed(2),
  "Logistic Regression": +(BENCHMARK[1][k] * 100).toFixed(2),
  "Linear SVM":       +(BENCHMARK[2][k] * 100).toFixed(2),
}));

const BAR_PERF_DATA = PERF_METRICS.map(k => ({
  name: METRIC_LABELS[k],
  XGBoost:            +(BENCHMARK[0][k] * 100).toFixed(3),
  "Logistic Regression": +(BENCHMARK[1][k] * 100).toFixed(3),
  "Linear SVM":       +(BENCHMARK[2][k] * 100).toFixed(3),
}));

const BAR_ERR_DATA = ERR_METRICS.map(k => ({
  name: METRIC_LABELS[k],
  XGBoost:            +(BENCHMARK[0][k] * 100).toFixed(3),
  "Logistic Regression": +(BENCHMARK[1][k] * 100).toFixed(3),
  "Linear SVM":       +(BENCHMARK[2][k] * 100).toFixed(3),
}));

const SAMPLES = [
  { label:"Positive ★★★★★", text:"The lamb tagine was extraordinary — layers of spice, tender meat, and a perfectly balanced sauce. Staff remembered our anniversary without being asked. This place has earned a permanent spot in our rotation." },
  { label:"Negative ★☆☆☆☆", text:"Waited 50 minutes for cold, undercooked pasta. The waiter was dismissive when I raised the issue, and the manager never came. Three items on the menu were unavailable. Complete waste of money." },
  { label:"Neutral ★★★☆☆",  text:"Food was fine — nothing special, nothing terrible. The burger was cooked correctly and the fries were decent. Service was a bit slow but not rude. Pricing seems about right for the area." },
];

const PIPELINE = [
  { step:"01", title:"Raw Review",       desc:"User submits free-text restaurant review", icon:"✍" },
  { step:"02", title:"Preprocessing",   desc:"Lowercase → remove non-alpha → NLTK tokenize → stopword removal → WordNet lemmatize", icon:"∿" },
  { step:"03", title:"Sentence Embed",  desc:"all-MiniLM-L6-v2 encodes clean text → 384-dim float32 vector", icon:"⬡" },
  { step:"04", title:"StandardScaler",  desc:"Zero-mean, unit-variance scaling (fitted on training split)", icon:"⧖" },
  { step:"05", title:"Model Inference", desc:"XGBoost / Logistic Regression / Linear SVM classifies scaled vector", icon:"◈" },
  { step:"06", title:"Response",        desc:"Prediction + confidence + class probabilities returned as JSON", icon:"⚡" },
];

/* ═══════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body,#root{background:#08090A;color:#E8EDF2;font-family:'Syne',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:#08090A}
::-webkit-scrollbar-thumb{background:#1E242B;border-radius:2px}
textarea:focus,button:focus,select:focus{outline:none}
button{cursor:pointer;font-family:'Syne',sans-serif}
select{appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232DD4BF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat:no-repeat; background-position:right .7rem top 50%; background-size:.65rem auto;}

.grain{position:fixed;inset:0;pointer-events:none;z-index:200;opacity:.028;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px 200px}

@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fillBar{from{width:0}to{width:var(--w)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.35)}50%{box-shadow:0 0 0 8px rgba(45,212,191,0)}}

.fu{animation:fadeUp .6s ease both}
.fu1{animation:fadeUp .6s .1s ease both}
.fu2{animation:fadeUp .6s .2s ease both}
.fu3{animation:fadeUp .6s .3s ease both}
.bar-fill{height:100%;border-radius:1px;animation:fillBar .9s .3s cubic-bezier(.16,1,.3,1) both}
.live-dot{width:7px;height:7px;border-radius:50%;background:${C.teal};animation:glow 2s infinite}
.navdot{width:5px;height:5px;border-radius:50%;background:#1E242B;transition:all .25s;cursor:pointer}
.navdot.on{background:${C.teal};transform:scale(1.5)}
.mono{font-family:'JetBrains Mono',monospace}
`;

/* ═══════════════════════════════════════════════════════
   SUBCOMPONENTS
═══════════════════════════════════════════════════════ */
const Label = ({ children, style={} }) => (
  <span className="mono" style={{ fontSize:10, letterSpacing:".22em", textTransform:"uppercase", color:C.teal, ...style }}>
    {children}
  </span>
);

const MetricBar = ({ label, value, max=1, color }) => {
  const pct = Math.min(100, (value / max) * 100);
  const display = value < 1 ? `${(value*100).toFixed(2)}%` : value.toFixed(4);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:12, color:C.mutedLt }}>{label}</span>
        <span className="mono" style={{ fontSize:12, color }}>{display}</span>
      </div>
      <div style={{ height:3, background:C.border2, borderRadius:2, overflow:"hidden" }}>
        <div className="bar-fill" style={{ "--w":`${pct}%`, background:color }} />
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:8, padding:"10px 14px" }}>
      <p className="mono" style={{ fontSize:10, color:C.muted, marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className="mono" style={{ fontSize:12, color:p.color, lineHeight:1.9 }}>
          {p.name}: <b>{p.value}%</b>
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [review, setReview]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [result,  setResult]        = useState(null);
  const [error,   setError]         = useState(null);
  const [chartMode, setChartMode]   = useState("bar");
  const [metricTab, setMetricTab]   = useState("perf"); 
  const [activeNav, setActiveNav]   = useState(0);
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState("all"); 
  
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  const heroRef = useRef(null);
  const analyzeRef = useRef(null);
  const compareRef = useRef(null);
  const pipeRef = useRef(null);
  const sections = [heroRef, analyzeRef, compareRef, pipeRef];

 useEffect(() => {
    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight / 2;
      let idx = 0;
      sections.forEach((r, i) => { if (r.current && mid > r.current.offsetTop) idx = i; });
      setActiveNav(idx);
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior:"smooth", block:"start" });

  /* ─── ANALYZE ─── */
  const analyze = async () => {
    if (!review.trim() || loading) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ review, model: selectedModel }), 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(`Could not reach the API at API_BASE. Make sure FastAPI is running.\n${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Helpers ─── */
  const votes = result ? Object.entries(result.results) : [];
  const majority = votes.length
    ? Object.entries(
        votes.reduce((acc,[,v])=>{ acc[v.prediction]=(acc[v.prediction]||0)+1; return acc; }, {})
      ).sort((a,b)=>b[1]-a[1])[0][0]
    : null;

  // UPDATED: Adjust 1-5 logic to 0-4
  const sentColor = (s) =>
    ["4","3","positive"].includes(String(s)) ? C.green :
    ["0","1","negative"].includes(String(s)) ? C.red   : C.amber;

  // UPDATED: Adjust 1-5 logic to 0-4
  const sentLabel = (s) =>
    ["4","positive"].includes(String(s)) ? "Highly Positive" :
    ["3"].includes(String(s)) ? "Positive" :
    ["2","neutral"].includes(String(s)) ? "Neutral" :
    ["1"].includes(String(s)) ? "Negative" : "Highly Negative";

  const buttonLabel = 
    loading ? "Analyzing…" : 
    selectedModel === "all" ? "Run All 3 Models" : 
    selectedModel === "xgboost" ? "Run XGBoost Only" :
    selectedModel === "logistic_regression" ? "Run Logistic Reg" : 
    "Run Linear SVM Only";

  const barData = metricTab === "perf" ? BAR_PERF_DATA : BAR_ERR_DATA;
  const yDomain = metricTab === "perf" ? [98, 100] : [0, 1]; 
  const yFormatter = v => `${v}%`;

  return (
    <>
      <style>{CSS}</style>
      <div className="grain" />

      {/* NAV DOTS */}
      <div style={{ position:"fixed", right:20, top:"50%", transform:"translateY(-50%)", zIndex:100, display:"flex", flexDirection:"column", gap:10 }}>
        {["Hero","Analyze","Compare","Pipeline"].map((t,i)=>(
          <div key={t} className={`navdot${activeNav===i?" on":""}`} title={t} onClick={()=>scrollTo(sections[i])} />
        ))}
      </div>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section ref={heroRef} style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`, backgroundSize:"72px 72px", maskImage:"radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:`radial-gradient(circle, rgba(45,212,191,.05) 0%, transparent 65%)`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />

        <div style={{ textAlign:"center", maxWidth:760, position:"relative", zIndex:1 }}>
          <div className="fu" style={{ marginBottom:28 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(45,212,191,.08)", border:`1px solid rgba(45,212,191,.2)`, borderRadius:100, padding:"6px 18px", marginBottom:20 }}>
              <span className="live-dot" />
              <span className="mono" style={{ fontSize:11, color:C.teal, letterSpacing:".08em" }}>
                all-MiniLM-L6-v2 · XGBoost · LR · Linear SVM
              </span>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(48px,8vw,100px)", fontWeight:800, lineHeight:.95, letterSpacing:"-0.03em", color:C.cream }}>
              REVIEW<br/><span style={{ WebkitTextStroke:`1px ${C.teal}`, color:"transparent" }}>DECODED</span>
            </h1>
            <p className="fu1" style={{ fontFamily:"'Lora',serif", fontSize:17, fontStyle:"italic", color:C.muted, marginTop:22, lineHeight:1.75, maxWidth:520, margin:"22px auto 0" }}>
              Paste any restaurant review. Three trained ML models vote on its sentiment, backed by Sentence Transformer embeddings and 10 evaluation metrics.
            </p>
          </div>
          <div className="fu2" style={{ display:"flex", gap:12, justifyContent:"center", marginTop:40, flexWrap:"wrap" }}>
            <button onClick={()=>scrollTo(analyzeRef)} style={{ background:C.teal, color:"#08090A", border:"none", borderRadius:8, padding:"13px 30px", fontSize:14, fontWeight:700, letterSpacing:".03em", transition:"opacity .2s" }} onMouseOver={e=>e.target.style.opacity=".85"} onMouseOut={e=>e.target.style.opacity="1"}>Analyze a Review</button>
            <button onClick={()=>scrollTo(compareRef)} style={{ background:"transparent", color:C.cream, border:`1px solid ${C.border2}`, borderRadius:8, padding:"13px 30px", fontSize:14, fontWeight:500, transition:"border-color .2s, color .2s" }} onMouseOver={e=>{e.target.style.borderColor=C.teal;e.target.style.color=C.teal}} onMouseOut={e=>{e.target.style.borderColor=C.border2;e.target.style.color=C.cream}}>10 Metrics Comparison →</button>
          </div>
          <div className="fu3" style={{ display:"flex", gap:8, justifyContent:"center", marginTop:36, flexWrap:"wrap" }}>
            {[["50 000","Reviews"],["384‑dim","Embeddings"],["10","Metrics"],["3","Models"]].map(([v,l])=>(
              <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 18px", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <span className="mono" style={{ fontSize:20, fontWeight:500, color:C.teal }}>{v}</span>
                <span style={{ fontSize:11, color:C.muted, marginTop:2 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:36, display:"flex", flexDirection:"column", alignItems:"center", gap:8, opacity:.35 }}>
          <span className="mono" style={{ fontSize:9, letterSpacing:".25em", textTransform:"uppercase", color:C.muted }}>scroll</span>
          <div style={{ width:1, height:36, background:`linear-gradient(to bottom,${C.teal},transparent)` }} />
        </div>
      </section>

      {/* ══════════════════════ ANALYZER ══════════════════════ */}
      <section ref={analyzeRef} style={{ padding:"110px 24px 80px", maxWidth:880, margin:"0 auto" }}>
        <div style={{ marginBottom:52 }}>
          <Label style={{ display:"block", marginBottom:14 }}>01 — Live Inference Engine</Label>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(34px,5vw,52px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-0.025em", color:C.cream }}>Submit a Review</h2>
          <p style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:15, color:C.muted, marginTop:10, lineHeight:1.7 }}>
            Select a specific model or run all three simultaneously to compare votes.
          </p>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, alignItems:"center" }}>
          <span className="mono" style={{ fontSize:10, color:C.muted }}>Load sample →</span>
          {SAMPLES.map(s=>(
            <button key={s.label} onClick={()=>setReview(s.text)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 12px", fontSize:12, color:C.mutedLt, transition:"border-color .2s" }} onMouseOver={e=>e.target.style.borderColor=C.teal} onMouseOut={e=>e.target.style.borderColor=C.border}>{s.label}</button>
          ))}
        </div>

        <div style={{ position:"relative" }}>
          <textarea value={review} onChange={e=>setReview(e.target.value)} rows={6} placeholder="Paste or type a restaurant review here…" style={{ width:"100%", background:C.card, border:`1px solid ${review ? C.teal+"50" : C.border}`, borderRadius:10, padding:"18px 22px", fontSize:15, fontFamily:"'Lora',serif", color:C.cream, lineHeight:1.75, resize:"vertical", transition:"border-color .2s" }} />
        </div>

        {/* CONTROLS */}
        <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:14, flexWrap:"wrap" }}>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ background: C.card, color: C.cream, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 30px 12px 16px", fontSize: 14, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 500, outline: "none" }}
          >
            <option value="all">Compare All 3 Models</option>
            <option value="xgboost">XGBoost</option>
            <option value="logistic_regression">Logistic Regression</option>
            <option value="svm">Linear SVM</option>
          </select>
          <button onClick={analyze} disabled={loading||!review.trim()} style={{ background: loading||!review.trim() ? C.border : C.teal, color: loading||!review.trim() ? C.muted : "#08090A", border:"none", borderRadius:8, padding:"12px 28px", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:9, transition:"all .2s" }}>
            {loading && <div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid rgba(8,9,10,.3)`, borderTopColor:"#08090A", animation:"spin .7s linear infinite" }} />}
            {buttonLabel}
          </button>
          {review && <button onClick={()=>{setReview("");setResult(null);setError(null)}} style={{ background:"none", border:"none", fontSize:13, color:C.muted }}>Clear</button>}
        </div>

        <div style={{ marginTop:12, padding:"10px 16px", background:"rgba(45,212,191,.05)", border:`1px solid rgba(45,212,191,.15)`, borderRadius:7, display:"flex", gap:10 }}>
          <span className="mono" style={{ fontSize:10, color:C.tealDim, flexShrink:0 }}>API →</span>
          <span className="mono" style={{ fontSize:10, color:C.muted }}>Hitting <span style={{color:C.teal}}>POST API_BASE/api/predict</span> — start FastAPI with <span style={{color:C.cream}}>uvicorn main:app --reload</span></span>
        </div>

        {error && (
          <div style={{ marginTop:18, padding:"14px 18px", background:"rgba(248,113,113,.08)", border:`1px solid rgba(248,113,113,.25)`, borderRadius:8, fontSize:13, color:"#FCA5A5", fontFamily:"'JetBrains Mono',monospace", whiteSpace:"pre-wrap" }}>
            {error}
          </div>
        )}

        {/* RESULTS PANEL */}
        {result && (
          <div className="fu" style={{ marginTop:40 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.card, border:`1px solid ${sentColor(majority)}40`, borderRadius:"12px 12px 0 0", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:46, height:46, borderRadius:10, background:`${sentColor(majority)}15`, border:`1px solid ${sentColor(majority)}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:sentColor(majority) }}>
                  {/* UPDATED: Adjust 1-5 logic to 0-4 */}
                  {["4","positive"].includes(String(majority)) ? "↑" : ["0","1","negative"].includes(String(majority)) ? "↓" : "→"}
                </div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:sentColor(majority) }}>{sentLabel(majority)}</div>
                  <div className="mono" style={{ fontSize:11, color:C.muted, marginTop:3 }}>
                    {votes.length > 1 ? "Majority vote" : "Model prediction"} · class {majority} · {result.latency_ms}ms latency
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:`repeat(${votes.length > 1 ? 3 : 1}, 1fr)`, gap:1, background:C.border }}>
              {votes.map(([modelName, v]) => {
                const col = MODEL_COLOR[modelName] || C.teal;
                const probs = v.probabilities || {};
                const topProbs = Object.entries(probs).sort((a,b)=>b[1]-a[1]).slice(0,3);
                return (
                  <div key={modelName} style={{ background:C.card, padding:"22px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:col }} />
                      <span className="mono" style={{ fontSize:11, color:col }}>{modelName}</span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:sentColor(v.prediction), marginBottom:4 }}>{sentLabel(v.prediction)}</div>
                    <div className="mono" style={{ fontSize:11, color:C.muted, marginBottom:16 }}>class {v.prediction}</div>
                    {v.confidence != null && <MetricBar label="Confidence" value={v.confidence} color={col} />}
                    {topProbs.length > 0 && (
                      <div style={{ marginTop:14 }}>
                        <Label style={{ display:"block", marginBottom:10 }}>Class Probs</Label>
                        {topProbs.map(([cls, prob]) => <MetricBar key={cls} label={`Class ${cls}`} value={prob} color={`${col}99`} />)}
                      </div>
                    )}
                    {v.confidence == null && (
                      <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(251,191,36,.07)", border:"1px solid rgba(251,191,36,.2)", borderRadius:6 }}>
                        <span className="mono" style={{ fontSize:10, color:C.amber }}>Retrain SVC with probability=True to enable confidence scores</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"0 0 12px 12px", padding:"16px 22px", borderTop:`1px solid ${C.border}` }}>
              <Label style={{ display:"block", marginBottom:8 }}>Preprocessed Input</Label>
              <p className="mono" style={{ fontSize:12, color:C.mutedLt, lineHeight:1.8 }}>{result.clean_text}</p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════ MODEL COMPARISON ══════════════════════ */}
      <section ref={compareRef} style={{ background:C.surface, padding:"110px 24px 80px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ marginBottom:56 }}>
            <Label style={{ display:"block", marginBottom:14 }}>02 — Benchmark Results</Label>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(34px,5vw,56px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-0.025em", color:C.cream }}>All 10 Evaluation Metrics</h2>
            <p style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:15, color:C.muted, marginTop:10, lineHeight:1.7, maxWidth:540 }}>Macro-averaged across all classes. Evaluated on a held-out 15% test split of the 50 000-review dataset.</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:48 }}>
            {BENCHMARK.map((m,i) => {
              const col = [C.xgb, C.lr, C.svm][i];
              const isTop = m.model === "Linear SVM";
              return (
                <div key={m.model} style={{ background:C.card, border:`1px solid ${isTop ? col+"50" : C.border}`, borderRadius:14, padding:"28px 24px", position:"relative", overflow:"hidden" }}>
                  {isTop && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${col},transparent)` }} />}
                  {isTop && <span className="mono" style={{ position:"absolute", top:14, right:14, fontSize:9, letterSpacing:".1em", color:col, background:`${col}15`, border:`1px solid ${col}30`, borderRadius:4, padding:"2px 7px" }}>TOP MODEL</span>}
                  <div style={{ width:9, height:9, borderRadius:"50%", background:col, marginBottom:14 }} />
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.cream, marginBottom:2 }}>{m.model}</div>
                  <div className="mono" style={{ fontSize:42, fontWeight:400, color:col, lineHeight:1, marginBottom:4 }}>{(m.acc*100).toFixed(2)}<span style={{ fontSize:16, color:C.muted }}>%</span></div>
                  <Label style={{ display:"block", marginBottom:18 }}>Accuracy</Label>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[["Precision",m.prec],["Sensitivity",m.sens],["F1-Score",m.f1],["Specificity",m.spec],["MCC",m.mcc]].map(([l,v])=>( <MetricBar key={l} label={l} value={v} max={1} color={col} /> ))}
                  </div>
                  <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:8 }}>
                    <Label style={{ display:"block" }}>Error Rates</Label>
                    {[["FPR",m.fpr],["FNR",m.fnr],["FDR",m.fdr]].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:12, color:C.muted }}>{l}</span><span className="mono" style={{ fontSize:12, color:C.red }}>{(v*100).toFixed(2)}%</span></div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:12, color:C.muted }}>NPV</span><span className="mono" style={{ fontSize:12, color:col }}>{(m.npv*100).toFixed(2)}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28, alignItems:"center" }}>
            <div style={{ display:"flex", gap:6, marginRight:12 }}>
              {[["bar","Bar Chart"],["radar","Radar Chart"]].map(([k,l])=>(
                <button key={k} onClick={()=>setChartMode(k)} style={{ background: chartMode===k ? C.teal : "transparent", color: chartMode===k ? "#08090A" : C.muted, border:`1px solid ${chartMode===k ? C.teal : C.border}`, borderRadius:6, padding:"7px 16px", fontSize:12, fontWeight:600, transition:"all .2s" }}>{l}</button>
              ))}
            </div>
            {chartMode === "bar" && (
              <div style={{ display:"flex", gap:6 }}>
                {[["perf","Performance Metrics (↑ higher better)"],["err","Error Rates (↓ lower better)"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setMetricTab(k)} style={{ background: metricTab===k ? (k==="err"?"rgba(248,113,113,.15)":"rgba(45,212,191,.12)") : "transparent", color: metricTab===k ? (k==="err" ? C.red : C.teal) : C.muted, border:`1px solid ${metricTab===k ? (k==="err" ? C.red+"50" : C.teal+"50") : C.border}`, borderRadius:6, padding:"7px 16px", fontSize:11, fontWeight:600, transition:"all .2s" }}>{l}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"28px 20px 16px", marginBottom:40 }}>
            {chartMode === "bar" && (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={barData} barGap={3} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border2} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={yDomain} tick={{ fill:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={yFormatter} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, paddingTop:18 }} formatter={v=><span style={{color:C.cream}}>{v}</span>} />
                  <Bar dataKey="XGBoost" fill={C.xgb} radius={[4,4,0,0]} />
                  <Bar dataKey="Logistic Regression" fill={C.lr} radius={[4,4,0,0]} />
                  <Bar dataKey="Linear SVM" fill={C.svm} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {chartMode === "radar" && (
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke={C.border2} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill:C.mutedLt, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }} />
                  <PolarRadiusAxis angle={90} domain={[98,100]} tick={{ fill:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }} />
                  <Radar name="XGBoost" dataKey="XGBoost" stroke={C.xgb} fill={C.xgb} fillOpacity={.1} strokeWidth={2} />
                  <Radar name="Logistic Regression" dataKey="Logistic Regression" stroke={C.lr} fill={C.lr} fillOpacity={.1} strokeWidth={2} />
                  <Radar name="Linear SVM" dataKey="Linear SVM" stroke={C.svm} fill={C.svm} fillOpacity={.1} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, paddingTop:12 }} formatter={v=><span style={{color:C.cream}}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border2}` }}>
                  {["Metric","Description","XGBoost","Logistic Regression","Linear SVM"].map((h,i)=>(
                    <th key={h} style={{ padding:"13px 20px", textAlign: i<2?"left":"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, letterSpacing:".12em", fontWeight:400 }}>
                      {i===2 && <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:C.xgb, marginRight:6 }} />}
                      {i===3 && <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:C.lr, marginRight:6 }} />}
                      {i===4 && <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:C.svm, marginRight:6 }} />}
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={5} style={{ padding:"10px 20px 6px", background:C.surface }}><Label>Performance Metrics (higher is better)</Label></td></tr>
                {PERF_METRICS.map((k,ri)=>{
                  const vals = BENCHMARK.map(m=>m[k]);
                  const maxV = Math.max(...vals);
                  return (
                    <tr key={k} style={{ borderTop:`1px solid ${C.border}`, background: ri%2===0 ? C.card : "#131820" }}>
                      <td style={{ padding:"11px 20px", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:C.cream }}>{METRIC_LABELS[k]}</td>
                      <td style={{ padding:"11px 20px", fontSize:12, color:C.muted, fontFamily:"'Lora',serif", fontStyle:"italic" }}>{METRIC_DESC[k]}</td>
                      {vals.map((v,ci)=>(
                        <td key={ci} style={{ padding:"11px 20px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:13, color: v===maxV ? [C.xgb,C.lr,C.svm][ci] : C.muted, fontWeight: v===maxV ? 600 : 400 }}>
                          {(v*100).toFixed(2)}%{v===maxV && " ✓"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr><td colSpan={5} style={{ padding:"10px 20px 6px", background:C.surface }}><Label style={{ color:C.red }}>Error Rates (lower is better)</Label></td></tr>
                {ERR_METRICS.map((k,ri)=>{
                  const vals = BENCHMARK.map(m=>m[k]);
                  const minV = Math.min(...vals);
                  return (
                    <tr key={k} style={{ borderTop:`1px solid ${C.border}`, background: ri%2===0 ? C.card : "#131820" }}>
                      <td style={{ padding:"11px 20px", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:C.cream }}>{METRIC_LABELS[k]}</td>
                      <td style={{ padding:"11px 20px", fontSize:12, color:C.muted, fontFamily:"'Lora',serif", fontStyle:"italic" }}>{METRIC_DESC[k]}</td>
                      {vals.map((v,ci)=>(
                        <td key={ci} style={{ padding:"11px 20px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:13, color: v===minV ? [C.xgb,C.lr,C.svm][ci] : C.red+"99", fontWeight: v===minV ? 600 : 400 }}>
                          {(v*100).toFixed(2)}%{v===minV && " ✓"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════ PIPELINE ══════════════════════ */}
      <section ref={pipeRef} style={{ padding:"110px 24px 80px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ marginBottom:56 }}>
            <Label style={{ display:"block", marginBottom:14 }}>03 — ML Pipeline</Label>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(34px,5vw,52px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-0.025em", color:C.cream }}>End-to-End Architecture</h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:C.border, borderRadius:14, overflow:"hidden", marginBottom:56 }}>
            {PIPELINE.map((p,i)=>(
              <div key={p.step} style={{ background:C.card, padding:"28px 24px" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, color:C.teal, marginBottom:14, opacity:.7 }}>{p.icon}</div>
                <div className="mono" style={{ fontSize:10, color:C.teal, letterSpacing:".15em", marginBottom:8 }}>{p.step}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:C.cream, marginBottom:8 }}>{p.title}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:48 }}>
            <div>
              <div className="mono" style={{ fontSize:10, color:C.teal, letterSpacing:".18em", textTransform:"uppercase", marginBottom:14 }}>POST /api/predict — Request</div>
              <pre style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px", fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:C.cream, lineHeight:1.75, overflow:"auto" }}>{`{
  "review": "The truffle risotto was
             absolutely divine…",
  "model": "all"
  // "all" | "xgboost" |
  // "logistic_regression" | "svm"
}`}</pre>
            </div>
            <div>
              <div className="mono" style={{ fontSize:10, color:C.green, letterSpacing:".18em", textTransform:"uppercase", marginBottom:14 }}>200 OK — Response</div>
              {/* UPDATED: Adjust 1-5 logic to 0-4 in mock JSON */}
              <pre style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px", fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:C.cream, lineHeight:1.75, overflow:"auto" }}>{`{
  "clean_text": "truffle risotto
                 absolutely divine…",
  "model_used": "all",
  "results": {
    "XGBoost": {
      "prediction": "4",
      "confidence": 0.8821,
      "probabilities": { "0":0.02,… }
    },
    "Logistic Regression": {…},
    "Linear SVM": {…}
  },
  "latency_ms": 47.3
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"36px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, letterSpacing:"-0.02em", color:C.cream }}>REVIEW DECODED</div>
          <div className="mono" style={{ fontSize:10, color:C.muted, marginTop:4 }}>XGBoost · Logistic Regression · Linear SVM · all-MiniLM-L6-v2</div>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          {["Analyzer","Comparison","Pipeline"].map((l,i)=>(
            <button key={l} onClick={()=>scrollTo([analyzeRef,compareRef,pipeRef][i])} style={{ background:"none", border:"none", fontSize:12, color:C.muted, fontFamily:"'Syne',sans-serif", transition:"color .2s" }} onMouseOver={e=>e.target.style.color=C.teal} onMouseOut={e=>e.target.style.color=C.muted}>{l}</button>
          ))}
        </div>
      </footer>
    </>
  );
}