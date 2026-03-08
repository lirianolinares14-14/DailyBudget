import { useState, useEffect, useRef } from "react";

const SK = {
  expenses:"db_expenses", income:"db_income", budget:"db_budget",
  cards:"db_cards", journal:"db_journal", fixed:"db_fixed",
  reminders:"db_reminders", categories:"db_categories", receipts:"db_receipts"
};

const load = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const Icon = ({ name, size=20 }) => {
  const icons = {
    home:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    plus:"M12 5v14M5 12h14", minus:"M5 12h14",
    credit:"M1 4h22v16H1z M1 10h22",
    trend:"M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
    check:"M20 6L9 17l-5-5",
    trash:"M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
    sun:"M12 17A5 5 0 1012 7a5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
    moon:"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    x:"M18 6L6 18 M6 6l12 12",
    edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
    download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    repeat:"M17 1l4 4-4 4 M3 11V9a4 4 0 014-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 01-4 4H3",
    camera:"M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
    tag:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
    receipt:"M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3 M9 7V5a2 2 0 014 0v2 M9 12h6 M9 16h4",
    scan:"M3 9V5a2 2 0 012-2h4 M15 3h4a2 2 0 012 2v4 M21 15v4a2 2 0 01-2 2h-4 M9 21H5a2 2 0 01-2-2v-4 M7 12h10",
  };
  const d = icons[name]; if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg,i) => <path key={i} d={i===0?seg:"M"+seg}/>)}
    </svg>
  );
};

const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n||0);
const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("es-ES",{month:"short",day:"numeric"});
const todayStr = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().toISOString().slice(0,7);

const DEFAULT_CATEGORIES = [
  {id:"food",emoji:"🍔",name:"Food",color:"#f59e0b"},
  {id:"transport",emoji:"🚗",name:"Transport",color:"#3b82f6"},
  {id:"housing",emoji:"🏠",name:"Housing",color:"#8b5cf6"},
  {id:"health",emoji:"💊",name:"Health",color:"#ef4444"},
  {id:"entertainment",emoji:"🎮",name:"Entertainment",color:"#06b6d4"},
  {id:"shopping",emoji:"👗",name:"Shopping",color:"#ec4899"},
  {id:"education",emoji:"📚",name:"Education",color:"#10b981"},
  {id:"travel",emoji:"✈️",name:"Travel",color:"#f97316"},
  {id:"utilities",emoji:"💡",name:"Utilities",color:"#eab308"},
  {id:"coffee",emoji:"☕",name:"Coffee",color:"#92400e"},
  {id:"tech",emoji:"📱",name:"Tech",color:"#6366f1"},
  {id:"other",emoji:"🌿",name:"Other",color:"#64748b"},
];

const INCOME_TYPES = ["💼 Salary","💻 Freelance","📈 Investment","🎁 Gift","💰 Other"];
const FIXED_FREQ = ["Weekly","Bi-weekly","Monthly","Yearly"];
const FIXED_CATS = ["🏠 Rent/Mortgage","🚗 Car Payment","📱 Phone","💡 Utilities","🌐 Internet","📺 Streaming","💪 Gym","🛡️ Insurance","📦 Subscriptions","🔧 Other"];
const CARD_GRADS = ["linear-gradient(135deg,#1a1a2e,#16213e)","linear-gradient(135deg,#0f3460,#533483)","linear-gradient(135deg,#1b1b2f,#2c2c54)","linear-gradient(135deg,#162447,#1f4068)","linear-gradient(135deg,#2d132c,#c72c41)"];
const REMINDER_TYPES = ["🧾 Bill Due","📊 Budget Review","💸 Savings Transfer","📈 Investment","🎯 Custom"];
const EMOJI_OPTIONS = ["🍔","🚗","🏠","💊","🎮","👗","📚","✈️","💡","☕","📱","🛒","🎵","🏋️","💇","🔧","🎁","🐾","🍺","🌿","💼","🎬","🍕","🧴","💰","🏦","🎯","⚡","🌊","🍜"];
const COLOR_OPTIONS = ["#ef4444","#f97316","#f59e0b","#eab308","#22c55e","#10b981","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#ec4899","#64748b","#92400e","#0ea5e9"];

export default function DailyBudget() {
  const [tab, setTab] = useState("home");
  const [dark, setDark] = useState(true);
  const [expenses, setExpenses] = useState(()=>load("db_expenses")||[]);
  const [income, setIncome] = useState(()=>load("db_income")||[]);
  const [budget, setBudget] = useState(()=>load("db_budget")||{monthly:3000});
  const [cards, setCards] = useState(()=>load("db_cards")||[]);
  const [journal, setJournal] = useState(()=>load("db_journal")||[]);
  const [fixedExpenses, setFixedExpenses] = useState(()=>load("db_fixed")||[]);
  const [reminders, setReminders] = useState(()=>load("db_reminders")||[]);
  const [categories, setCategories] = useState(()=>load("db_categories")||DEFAULT_CATEGORIES);
  const [receipts, setReceipts] = useState(()=>load("db_receipts")||[]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [subTab, setSubTab] = useState(null);

  useEffect(()=>save("db_expenses",expenses),[expenses]);
  useEffect(()=>save("db_income",income),[income]);
  useEffect(()=>save("db_budget",budget),[budget]);
  useEffect(()=>save("db_cards",cards),[cards]);
  useEffect(()=>save("db_journal",journal),[journal]);
  useEffect(()=>save("db_fixed",fixedExpenses),[fixedExpenses]);
  useEffect(()=>save("db_reminders",reminders),[reminders]);
  useEffect(()=>save("db_categories",categories),[categories]);
  useEffect(()=>save("db_receipts",receipts),[receipts]);

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const today = todayStr(); const month = thisMonth();
  const mExp = expenses.filter(e=>e.date.startsWith(month));
  const todayExp = expenses.filter(e=>e.date===today);
  const mInc = income.filter(i=>i.date.startsWith(month));
  const totalSpent = mExp.reduce((s,e)=>s+e.amount,0);
  const totalIncome = mInc.reduce((s,i)=>s+i.amount,0);
  const balance = totalIncome - totalSpent;
  const budgetPct = budget.monthly>0?Math.min((totalSpent/budget.monthly)*100,100):0;
  const monthlyFixed = fixedExpenses.reduce((s,x)=>{
    if(x.frequency==="Weekly") return s+x.amount*4.33;
    if(x.frequency==="Bi-weekly") return s+x.amount*2.17;
    if(x.frequency==="Yearly") return s+x.amount/12;
    return s+x.amount;
  },0);
  const weeklyNeeded = monthlyFixed/4.33;
  const biweeklyNeeded = monthlyFixed/2.17;

  const bg=dark?"#080c14":"#f0f4f8", surface=dark?"#0f1623":"#ffffff",
    surface2=dark?"#161e2e":"#f8fafc", border=dark?"#1e2d45":"#e2e8f0",
    text=dark?"#e8edf5":"#0f172a", muted=dark?"#4a5a72":"#94a3b8",
    accent="#3b82f6", green="#22c55e", red="#ef4444", yellow="#f59e0b";

  const s = {
    app:{background:bg,minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",color:text,maxWidth:430,margin:"0 auto",position:"relative"},
    header:{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
    title:{fontSize:22,fontWeight:800,letterSpacing:"-0.5px"},
    subtitle:{fontSize:12,color:muted,marginTop:2},
    iconBtn:{background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:8,cursor:"pointer",color:text,display:"flex",alignItems:"center",justifyContent:"center"},
    card:{background:surface,border:`1px solid ${border}`,borderRadius:20,padding:20,margin:"0 20px 12px"},
    label:{fontSize:11,fontWeight:700,letterSpacing:1,color:muted,textTransform:"uppercase",marginBottom:8},
    row:{display:"flex",alignItems:"center",gap:10},
    pill:(c)=>({background:c+"22",color:c,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}),
    input:{background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:"12px 14px",color:text,fontSize:15,width:"100%",outline:"none",WebkitAppearance:"none"},
    btn:(c=accent)=>({background:c,color:"#fff",border:"none",borderRadius:14,padding:"14px 20px",fontSize:15,fontWeight:700,cursor:"pointer",flex:1}),
    ghost:{background:"transparent",border:`1px solid ${border}`,borderRadius:14,padding:"14px 20px",fontSize:15,fontWeight:700,cursor:"pointer",color:text,flex:1},
    tabBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:surface,borderTop:`1px solid ${border}`,display:"flex",padding:"8px 0 16px",zIndex:100},
    tabItem:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",cursor:"pointer",color:a?accent:muted,fontSize:10,fontWeight:a?700:500,background:"none",border:"none"}),
    fab:{position:"fixed",bottom:90,right:"calc(50% - 195px)",background:accent,color:"#fff",border:"none",borderRadius:20,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 20px ${accent}66`,zIndex:99},
    modal:{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{background:surface,borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto"},
    sheetTitle:{fontSize:20,fontWeight:800,marginBottom:20},
    prog:(o)=>({height:8,borderRadius:4,background:border,overflow:"hidden",marginTop:8}),
    progFill:(p,o)=>({height:"100%",width:p+"%",background:o?red:p>80?yellow:green,borderRadius:4,transition:"width 0.5s ease"}),
  };

  const addExpense=()=>{ if(!form.amount||!form.category)return; setExpenses(p=>[{id:Date.now(),amount:parseFloat(form.amount),category:form.category,note:form.note||"",date:form.date||today},...p]); setModal(null);setForm({});showToast("Gasto guardado ✓"); };
  const addIncome=()=>{ if(!form.amount||!form.type)return; setIncome(p=>[{id:Date.now(),amount:parseFloat(form.amount),type:form.type,note:form.note||"",date:form.date||today},...p]); setModal(null);setForm({});showToast("Ingreso guardado ✓"); };
  const addCard=()=>{ if(!form.name||!form.limit)return; setCards(p=>[...p,{id:Date.now(),name:form.name,limit:parseFloat(form.limit),balance:parseFloat(form.balance||0),dueDate:form.dueDate||"",gradient:CARD_GRADS[p.length%CARD_GRADS.length]}]); setModal(null);setForm({});showToast("Tarjeta agregada ✓"); };
  const addJournal=()=>{ if(!form.title)return; setJournal(p=>[{id:Date.now(),title:form.title,amount:parseFloat(form.amount||0),type:form.type||"note",note:form.note||"",date:today},...p]); setModal(null);setForm({});showToast("Entrada guardada ✓"); };
  const addFixed=()=>{ if(!form.name||!form.amount)return; setFixedExpenses(p=>[...p,{id:Date.now(),name:form.name,amount:parseFloat(form.amount),frequency:form.frequency||"Monthly",category:form.category||"",dueDay:form.dueDay||""}]); setModal(null);setForm({});showToast("Gasto fijo agregado ✓"); };
  const addReminder=()=>{ if(!form.title||!form.date)return; setReminders(p=>[...p,{id:Date.now(),title:form.title,date:form.date,type:form.type||"Custom",note:form.note||"",dismissed:false}]); setModal(null);setForm({});showToast("Recordatorio creado 🔔"); };
  const dismissReminder=id=>setReminders(p=>p.map(r=>r.id===id?{...r,dismissed:true}:r));
  const del=(setter,id)=>setter(p=>p.filter(x=>x.id!==id));
  const saveCategory=(emoji,name,color,editId)=>{ if(!name)return; if(editId){setCategories(p=>p.map(c=>c.id===editId?{...c,emoji,name,color}:c));showToast("Categoría actualizada ✓");}else{setCategories(p=>[...p,{id:Date.now().toString(),emoji,name,color}]);showToast("Categoría creada ✓");} setModal(null);setForm({}); };
  const saveReceipt=(rd)=>{ if(!rd.amount)return; const r={id:Date.now(),amount:parseFloat(rd.amount),merchant:rd.merchant||"Sin nombre",category:rd.category||"",note:rd.note||"",date:rd.date||today,image:rd.image||null}; setReceipts(p=>[r,...p]); if(r.category&&rd.addExpense){setExpenses(p=>[{id:Date.now()+1,amount:r.amount,category:r.category,note:`📄 ${r.merchant}`,date:r.date},...p]);} setModal(null);setForm({});showToast("Factura guardada ✓"); };

  // ── HOME ──
  const HomeTab=()=>{
    const upcoming=reminders.filter(r=>{ if(r.dismissed)return false; const d=new Date(r.date+"T12:00:00");d.setHours(0,0,0,0);const t=new Date();t.setHours(0,0,0,0);return(d-t)/(1000*60*60*24)<=7&&(d-t)/(1000*60*60*24)>=0; });
    return(<div style={{paddingBottom:100}}>
      <div style={s.header}>
        <div><div style={s.title}>DailyBudget</div><div style={s.subtitle}>{new Date().toLocaleDateString("es-ES",{weekday:"long",month:"long",day:"numeric"})}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button style={s.iconBtn} onClick={()=>setDark(!dark)}><Icon name={dark?"sun":"moon"} size={18}/></button>
          <button style={s.iconBtn} onClick={()=>setModal("report")}><Icon name="download" size={18}/></button>
        </div>
      </div>
      <div style={{margin:"0 20px 12px",background:`linear-gradient(135deg,${accent},#6366f1)`,borderRadius:24,padding:24,color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"#ffffff10"}}/>
        <div style={{fontSize:11,opacity:0.8,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Balance Neto</div>
        <div style={{fontSize:34,fontWeight:800,letterSpacing:"-1px"}}>{fmt(balance)}</div>
        <div style={{display:"flex",gap:20,marginTop:14}}>
          <div><div style={{fontSize:11,opacity:0.7}}>Ingresos</div><div style={{fontWeight:700,fontSize:15}}>{fmt(totalIncome)}</div></div>
          <div style={{width:1,background:"#ffffff30"}}/>
          <div><div style={{fontSize:11,opacity:0.7}}>Gastos</div><div style={{fontWeight:700,fontSize:15}}>{fmt(totalSpent)}</div></div>
          <div style={{width:1,background:"#ffffff30"}}/>
          <div><div style={{fontSize:11,opacity:0.7}}>Fijos/mes</div><div style={{fontWeight:700,fontSize:15}}>{fmt(monthlyFixed)}</div></div>
        </div>
      </div>
      <div style={s.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={s.label}>Presupuesto Mensual</div>
          <button onClick={()=>{setForm({monthly:budget.monthly});setModal("budget");}} style={{...s.iconBtn,padding:"4px 8px"}}><Icon name="edit" size={14}/></button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontWeight:700,fontSize:18}}>{fmt(totalSpent)}</span>
          <span style={{color:muted,fontSize:14}}>de {fmt(budget.monthly)}</span>
        </div>
        <div style={s.prog(totalSpent>budget.monthly)}><div style={s.progFill(budgetPct,totalSpent>budget.monthly)}/></div>
        <div style={{fontSize:12,color:muted,marginTop:6}}>{budgetPct.toFixed(0)}% usado — {fmt(budget.monthly-totalSpent)} restante</div>
      </div>
      {upcoming.length>0&&<div style={{padding:"0 20px",marginBottom:12}}>
        <div style={s.label}>Recordatorios Próximos</div>
        {upcoming.map(r=><div key={r.id} style={{background:yellow+"15",border:`1px solid ${yellow}30`,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,fontSize:14}}>{r.title}</div><div style={{fontSize:12,color:muted}}>{fmtDate(r.date)} · {r.type}</div></div>
          <button onClick={()=>dismissReminder(r.id)} style={{background:"none",border:"none",color:muted,cursor:"pointer",fontSize:18}}>✕</button>
        </div>)}
      </div>}
      <div style={{padding:"0 20px",marginBottom:16}}>
        <div style={s.label}>Acciones Rápidas</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{label:"Gasto",icon:"minus",color:red,action:"expense"},{label:"Ingreso",icon:"plus",color:green,action:"income"},{label:"Factura",icon:"scan",color:"#8b5cf6",action:"receipt"},{label:"Recordatorio",icon:"bell",color:accent,action:"reminder"}].map(({label,icon,color,action})=>(
            <button key={action} onClick={()=>{setForm({});setModal(action);}} style={{background:color+"15",border:`1px solid ${color}30`,borderRadius:16,padding:"14px 10px",cursor:"pointer",color:text,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Icon name={icon} size={22}/><div style={{fontSize:13,fontWeight:700}}>{label}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"0 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <div style={s.label}>Hoy</div>
          <span style={s.pill(red)}>{fmt(todayExp.reduce((s,e)=>s+e.amount,0))}</span>
        </div>
        {todayExp.length===0?<div style={{textAlign:"center",color:muted,padding:"24px 0",fontSize:14}}>Sin gastos hoy 🎉</div>
          :todayExp.slice(0,5).map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${border}`}}>
            <div style={s.row}><span style={{fontSize:20}}>{e.category.split(" ")[0]}</span>
              <div><div style={{fontSize:14,fontWeight:600}}>{e.category.split(" ").slice(1).join(" ")}</div>{e.note&&<div style={{fontSize:12,color:muted}}>{e.note}</div>}</div>
            </div>
            <span style={{fontWeight:700,color:red}}>{fmt(e.amount)}</span>
          </div>)
        }
      </div>
    </div>);
  };

  // ── EXPENSES ──
  const ExpensesTab=()=>{
    const [filter,setFilter]=useState(month);
    const filtered=filter==="all"?expenses:expenses.filter(e=>e.date.startsWith(filter));
    const grouped={};filtered.forEach(e=>{(grouped[e.date]=grouped[e.date]||[]).push(e);});
    return(<div style={{paddingBottom:100}}>
      <div style={{...s.header,marginBottom:16}}>
        <div style={s.title}>Gastos</div>
        <div style={{display:"flex",gap:6}}>
          {[["all","Todo"],[month,"Mes"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?accent:surface2,border:`1px solid ${border}`,borderRadius:10,padding:"6px 14px",cursor:"pointer",color:filter===v?"#fff":text,fontSize:13,fontWeight:600}}>{l}</button>)}
        </div>
      </div>
      <div style={{padding:"0 20px"}}>
        {Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).slice(0,15).map(date=><div key={date} style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:muted}}>{fmtDate(date)}</div>
            <div style={{fontSize:13,fontWeight:700,color:red}}>{fmt(grouped[date].reduce((s,e)=>s+e.amount,0))}</div>
          </div>
          {grouped[date].map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",background:surface,borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${border}`}}>
            <div style={s.row}><span style={{fontSize:22}}>{e.category.split(" ")[0]}</span>
              <div><div style={{fontSize:14,fontWeight:600}}>{e.category.split(" ").slice(1).join(" ")}</div>{e.note&&<div style={{fontSize:12,color:muted}}>{e.note}</div>}</div>
            </div>
            <div style={{...s.row,gap:8}}>
              <span style={{fontWeight:800,color:red}}>{fmt(e.amount)}</span>
              <button onClick={()=>del(setExpenses,e.id)} style={{background:"none",border:"none",color:muted,cursor:"pointer"}}><Icon name="trash" size={15}/></button>
            </div>
          </div>)}
        </div>)}
        {filtered.length===0&&<div style={{textAlign:"center",color:muted,padding:40}}>Sin gastos aún</div>}
      </div>
    </div>);
  };

  // ── RECEIPTS ──
  const ReceiptsTab=()=>{
    const [viewR,setViewR]=useState(null);
    const mRec=receipts.filter(r=>r.date.startsWith(month));
    if(viewR)return(<div style={{paddingBottom:100}}>
      <div style={{...s.header,marginBottom:16}}>
        <button style={s.iconBtn} onClick={()=>setViewR(null)}>← Volver</button>
        <button onClick={()=>{del(setReceipts,viewR.id);setViewR(null);showToast("Eliminada");}} style={{...s.iconBtn,color:red}}><Icon name="trash" size={16}/></button>
      </div>
      <div style={{padding:"0 20px"}}>
        {viewR.image?<div style={{borderRadius:20,overflow:"hidden",marginBottom:16,border:`1px solid ${border}`}}><img src={viewR.image} alt="" style={{width:"100%",display:"block",maxHeight:300,objectFit:"cover"}}/></div>
          :<div style={{background:surface2,borderRadius:20,padding:40,marginBottom:16,textAlign:"center"}}><div style={{fontSize:48}}>🧾</div><div style={{color:muted}}>Sin imagen</div></div>}
        <div style={{background:surface,border:`1px solid ${border}`,borderRadius:20,padding:20}}>
          <div style={{fontSize:32,fontWeight:800,color:red,marginBottom:4}}>{fmt(viewR.amount)}</div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>{viewR.merchant}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:surface2,borderRadius:12,padding:12}}><div style={{fontSize:11,color:muted,marginBottom:2}}>Fecha</div><div style={{fontWeight:600}}>{fmtDate(viewR.date)}</div></div>
            <div style={{background:surface2,borderRadius:12,padding:12}}><div style={{fontSize:11,color:muted,marginBottom:2}}>Categoría</div><div style={{fontWeight:600}}>{viewR.category||"—"}</div></div>
          </div>
          {viewR.note&&<div style={{marginTop:12,fontSize:14,color:muted}}>{viewR.note}</div>}
        </div>
      </div>
    </div>);
    return(<div style={{paddingBottom:100}}>
      <div style={{...s.header,marginBottom:8}}>
        <div><div style={s.title}>Facturas</div><div style={s.subtitle}>{receipts.length} guardadas</div></div>
        <button style={{...s.iconBtn,background:"#8b5cf6",color:"#fff",border:"none"}} onClick={()=>{setForm({});setModal("receipt");}}><Icon name="scan" size={18}/></button>
      </div>
      <div style={{margin:"0 20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:16}}><div style={{fontSize:11,color:muted,marginBottom:4}}>Este mes</div><div style={{fontSize:22,fontWeight:800,color:red}}>{fmt(mRec.reduce((s,r)=>s+r.amount,0))}</div><div style={{fontSize:12,color:muted}}>{mRec.length} facturas</div></div>
        <div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:16}}><div style={{fontSize:11,color:muted,marginBottom:4}}>Total acumulado</div><div style={{fontSize:22,fontWeight:800,color:"#8b5cf6"}}>{fmt(receipts.reduce((s,r)=>s+r.amount,0))}</div><div style={{fontSize:12,color:muted}}>{receipts.length} en total</div></div>
      </div>
      <div style={{padding:"0 20px"}}>
        <div style={s.label}>Almacén de Facturas</div>
        {receipts.length===0?<div style={{textAlign:"center",padding:50}}><div style={{fontSize:48,marginBottom:12}}>🧾</div><div style={{color:muted}}>Sin facturas guardadas</div></div>
          :receipts.map(r=><button key={r.id} onClick={()=>setViewR(r)} style={{width:"100%",background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,cursor:"pointer",color:text,textAlign:"left"}}>
            <div style={{width:52,height:52,borderRadius:12,overflow:"hidden",background:"#8b5cf622",border:`1px solid #8b5cf633`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {r.image?<img src={r.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:24}}>🧾</span>}
            </div>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{r.merchant}</div><div style={{fontSize:12,color:muted}}>{fmtDate(r.date)}{r.category?` · ${r.category}`:""}</div></div>
            <div style={{fontWeight:800,fontSize:16,color:red,flexShrink:0}}>{fmt(r.amount)}</div>
          </button>)}
      </div>
    </div>);
  };

  // ── CATEGORIES ──
  const CategoriesTab=()=>(<div style={{paddingBottom:100}}>
    <div style={{...s.header,marginBottom:8}}>
      <div><div style={s.title}>Categorías</div><div style={s.subtitle}>{categories.length} activas</div></div>
      <button style={{...s.iconBtn,background:accent,color:"#fff",border:"none"}} onClick={()=>{setForm({});setModal("category");}}><Icon name="plus" size={18}/></button>
    </div>
    <div style={{margin:"0 20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:16}}><div style={{fontSize:11,color:muted,marginBottom:4}}>Total</div><div style={{fontSize:24,fontWeight:800,color:accent}}>{categories.length}</div></div>
      <div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:16}}><div style={{fontSize:11,color:muted,marginBottom:4}}>Usadas este mes</div><div style={{fontSize:24,fontWeight:800,color:green}}>{new Set(mExp.map(e=>e.category)).size}</div></div>
    </div>
    <div style={{padding:"0 20px"}}>
      {categories.map(cat=>{
        const label=`${cat.emoji} ${cat.name}`;
        const total=mExp.filter(e=>e.category===label).reduce((s,e)=>s+e.amount,0);
        const count=mExp.filter(e=>e.category===label).length;
        return(<div key={cat.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:14,background:cat.color+"22",border:`2px solid ${cat.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.emoji}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15}}>{cat.name}</div>
            <div style={{fontSize:12,color:muted}}>{count>0?`${count} gasto${count>1?"s":""} · ${fmt(total)} este mes`:"Sin gastos este mes"}</div>
            {total>0&&<div style={{marginTop:4,height:3,borderRadius:2,background:border,overflow:"hidden"}}><div style={{height:"100%",width:Math.min((total/Math.max(totalSpent,1))*100,100)+"%",background:cat.color,borderRadius:2}}/></div>}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>{setForm({catEmoji:cat.emoji,catName:cat.name,catColor:cat.color,editingCatId:cat.id});setModal("category");}} style={{...s.iconBtn,padding:6}}><Icon name="edit" size={14}/></button>
            <button onClick={()=>{setCategories(p=>p.filter(c=>c.id!==cat.id));showToast("Eliminada");}} style={{...s.iconBtn,padding:6,color:red}}><Icon name="trash" size={14}/></button>
          </div>
        </div>);
      })}
    </div>
  </div>);

  // ── FIXED ──
  const FixedTab=()=>(<div style={{paddingBottom:100}}>
    <div style={{...s.header,marginBottom:16}}>
      <div><div style={s.title}>Gastos Fijos</div><div style={s.subtitle}>Planificador de pagos</div></div>
      <button style={s.iconBtn} onClick={()=>{setForm({frequency:"Monthly"});setModal("fixed");}}><Icon name="plus" size={18}/></button>
    </div>
    <div style={{margin:"0 20px 16px",background:`linear-gradient(135deg,#1e2d45,#0f1e35)`,borderRadius:20,padding:20,color:"#fff"}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:"#6b8aad",textTransform:"uppercase",marginBottom:12}}>Cobertura de Pago</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:"#ffffff08",borderRadius:12,padding:14}}><div style={{fontSize:11,color:"#6b8aad",marginBottom:4}}>Semanal</div><div style={{fontSize:22,fontWeight:800,color:yellow}}>{fmt(weeklyNeeded)}</div><div style={{fontSize:11,color:"#6b8aad",marginTop:2}}>necesario</div></div>
        <div style={{background:"#ffffff08",borderRadius:12,padding:14}}><div style={{fontSize:11,color:"#6b8aad",marginBottom:4}}>Quincenal</div><div style={{fontSize:22,fontWeight:800,color:yellow}}>{fmt(biweeklyNeeded)}</div><div style={{fontSize:11,color:"#6b8aad",marginTop:2}}>necesario</div></div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",background:"#ffffff08",borderRadius:10,padding:"10px 14px"}}>
        <span style={{fontSize:13,color:"#6b8aad"}}>Total Mensual Fijo</span>
        <span style={{fontWeight:800,fontSize:15,color:red}}>{fmt(monthlyFixed)}</span>
      </div>
    </div>
    <div style={{padding:"0 20px"}}>
      {fixedExpenses.length===0?<div style={{textAlign:"center",padding:50}}><div style={{fontSize:40,marginBottom:12}}>🔁</div><div style={{color:muted,fontSize:14}}>Agrega tus gastos recurrentes</div></div>
        :fixedExpenses.map(x=>{
          let monthly=x.amount;
          if(x.frequency==="Weekly")monthly=x.amount*4.33;
          else if(x.frequency==="Bi-weekly")monthly=x.amount*2.17;
          else if(x.frequency==="Yearly")monthly=x.amount/12;
          return(<div key={x.id} style={{background:surface,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={s.row}><span style={{fontSize:22}}>{x.category?.split(" ")[0]||"📦"}</span>
              <div><div style={{fontWeight:700,fontSize:14}}>{x.name}</div><div style={{fontSize:12,color:muted}}>{x.frequency}{x.dueDay?` · Día ${x.dueDay}`:""}</div></div>
            </div>
            <div style={{...s.row,gap:10}}>
              <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:15}}>{fmt(x.amount)}</div>{x.frequency!=="Monthly"&&<div style={{fontSize:11,color:muted}}>{fmt(monthly)}/mes</div>}</div>
              <button onClick={()=>del(setFixedExpenses,x.id)} style={{background:"none",border:"none",color:muted,cursor:"pointer"}}><Icon name="trash" size={15}/></button>
            </div>
          </div>);
        })}
    </div>
  </div>);

  // ── CARDS ──
  const CardsTab=()=>(<div style={{paddingBottom:100}}>
    <div style={{...s.header,marginBottom:20}}>
      <div style={s.title}>Tarjetas</div>
      <button style={s.iconBtn} onClick={()=>{setForm({});setModal("card");}}><Icon name="plus" size={18}/></button>
    </div>
    <div style={{padding:"0 20px"}}>
      {cards.map(card=>{
        const util=(card.balance/card.limit)*100;
        return(<div key={card.id} style={{marginBottom:16}}>
          <div style={{background:card.gradient,borderRadius:20,padding:22,color:"#fff",marginBottom:10,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"#ffffff10"}}/>
            <div style={{fontSize:11,opacity:0.7,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Tarjeta de Crédito</div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:16}}>{card.name}</div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><div style={{fontSize:10,opacity:0.7}}>Saldo</div><div style={{fontWeight:700,fontSize:16}}>{fmt(card.balance)}</div></div>
              <div><div style={{fontSize:10,opacity:0.7}}>Límite</div><div style={{fontWeight:700,fontSize:16}}>{fmt(card.limit)}</div></div>
              {card.dueDate&&<div><div style={{fontSize:10,opacity:0.7}}>Corte</div><div style={{fontWeight:700,fontSize:16}}>{card.dueDate}</div></div>}
            </div>
          </div>
          <div style={{background:surface2,borderRadius:14,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:muted}}>Utilización</span>
              <span style={{fontSize:12,fontWeight:700,color:util>70?red:util>30?yellow:green}}>{util.toFixed(0)}%</span>
            </div>
            <div style={s.prog(util>90)}><div style={s.progFill(Math.min(util,100),util>90)}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
              <span style={{fontSize:12,color:muted}}>Disponible: <strong style={{color:green}}>{fmt(card.limit-card.balance)}</strong></span>
              <button onClick={()=>del(setCards,card.id)} style={{background:"none",border:"none",color:muted,cursor:"pointer",fontSize:12}}>Eliminar</button>
            </div>
          </div>
        </div>);
      })}
      {cards.length===0&&<div style={{textAlign:"center",padding:50}}><div style={{fontSize:40,marginBottom:12}}>💳</div><div style={{color:muted}}>Sin tarjetas agregadas</div></div>}
    </div>
  </div>);

  // ── INVEST ──
  const InvestTab=()=>{
    const total=journal.filter(j=>j.type!=="note").reduce((s,j)=>s+(j.amount||0),0);
    return(<div style={{paddingBottom:100}}>
      <div style={{...s.header,marginBottom:16}}>
        <div style={s.title}>Inversiones</div>
        <div style={{display:"flex",gap:8}}>
          <button style={s.iconBtn} onClick={()=>{setForm({});setModal("reminder");}}><Icon name="bell" size={18}/></button>
          <button style={s.iconBtn} onClick={()=>{setForm({type:"buy"});setModal("journal");}}><Icon name="plus" size={18}/></button>
        </div>
      </div>
      {total>0&&<div style={s.card}><div style={s.label}>Total Rastreado</div><div style={{fontSize:28,fontWeight:800,color:green}}>{fmt(total)}</div></div>}
      <div style={{padding:"0 20px"}}>
        {journal.map(entry=><div key={entry.id} style={{background:surface2,borderRadius:16,padding:16,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={s.row}>
              <span style={{fontSize:18}}>{entry.type==="buy"?"📈":entry.type==="sell"?"📉":"📝"}</span>
              <div><div style={{fontWeight:700,fontSize:15}}>{entry.title}</div><div style={{fontSize:12,color:muted}}>{fmtDate(entry.date)} · {entry.type}</div></div>
            </div>
            <div style={{...s.row,gap:8}}>
              {entry.amount>0&&<span style={{fontWeight:800,color:entry.type==="sell"?red:green}}>{fmt(entry.amount)}</span>}
              <button onClick={()=>del(setJournal,entry.id)} style={{background:"none",border:"none",color:muted,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
            </div>
          </div>
          {entry.note&&<div style={{fontSize:13,color:muted,marginTop:6,lineHeight:1.5}}>{entry.note}</div>}
        </div>)}
        {journal.length===0&&<div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>📈</div><div style={{color:muted}}>Registra tus inversiones</div></div>}
      </div>
      <div style={{...s.card,background:accent+"12",border:`1px solid ${accent}30`}}>
        <div style={{fontWeight:700,marginBottom:8}}>💡 Hábitos de Inversión</div>
        {["Invierte consistentemente","Diversifica tus activos","Revisa tu portafolio trimestralmente","El tiempo en el mercado siempre gana"].map(tip=><div key={tip} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${border}`}}><Icon name="check" size={14}/><span style={{fontSize:13,color:muted}}>{tip}</span></div>)}
      </div>
    </div>);
  };

  // ── MORE MENU ──
  const MoreMenu=()=>(<div style={{position:"fixed",inset:0,zIndex:150}} onClick={()=>setSubTab(null)}>
    <div style={{position:"absolute",bottom:80,right:"calc(50% - 210px)",background:surface,border:`1px solid ${border}`,borderRadius:16,padding:8,minWidth:160,boxShadow:"0 8px 32px #00000044"}} onClick={e=>e.stopPropagation()}>
      {[{id:"cards",icon:"credit",label:"Tarjetas"},{id:"invest",icon:"trend",label:"Inversiones"}].map(({id,icon,label})=>(
        <button key={id} onClick={()=>{setTab(id);setSubTab(null);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",background:"none",border:"none",color:text,cursor:"pointer",borderRadius:10,fontSize:14,fontWeight:600}}>
          <Icon name={icon} size={16}/>{label}
        </button>
      ))}
    </div>
  </div>);

  // ── CATEGORY MODAL ──
  const CategoryModal=()=>{
    const [em,setEm]=useState(form.catEmoji||"🏷️");
    const [col,setCol]=useState(form.catColor||"#3b82f6");
    const [nm,setNm]=useState(form.catName||"");
    const [showE,setShowE]=useState(false);
    return(<div style={s.sheet}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{...s.sheetTitle,margin:0}}>{form.editingCatId?"Editar":"Nueva"} Categoría</div>
        <button style={s.iconBtn} onClick={()=>setModal(null)}><Icon name="x" size={18}/></button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,background:surface2,borderRadius:16,padding:16,marginBottom:20}}>
        <div style={{width:56,height:56,borderRadius:16,background:col+"22",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{em}</div>
        <div><div style={{fontWeight:800,fontSize:18}}>{nm||"Nombre"}</div><div style={{fontSize:13,color:muted}}>Vista previa</div></div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>NOMBRE</div>
        <input style={s.input} placeholder="ej. Restaurantes..." value={nm} onChange={e=>setNm(e.target.value)}/>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>EMOJI</div>
        <button onClick={()=>setShowE(!showE)} style={{...s.input,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:surface2,border:`1px solid ${border}`}}>
          <span style={{fontSize:24}}>{em}</span><span style={{color:muted,fontSize:14}}>Elegir emoji</span>
        </button>
        {showE&&<div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6,marginTop:8,background:surface2,borderRadius:14,padding:12,border:`1px solid ${border}`}}>
          {EMOJI_OPTIONS.map(e=><button key={e} onClick={()=>{setEm(e);setShowE(false);}} style={{background:em===e?accent+"33":"transparent",border:`1px solid ${em===e?accent:border}`,borderRadius:10,padding:6,fontSize:20,cursor:"pointer"}}>{e}</button>)}
        </div>}
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>COLOR</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {COLOR_OPTIONS.map(c=><button key={c} onClick={()=>setCol(c)} style={{width:"100%",aspectRatio:"1",borderRadius:10,background:c,border:`3px solid ${col===c?"#fff":"transparent"}`,cursor:"pointer",boxShadow:col===c?`0 0 0 2px ${c}`:"none"}}/>)}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button style={s.ghost} onClick={()=>setModal(null)}>Cancelar</button>
        <button style={s.btn(col)} onClick={()=>saveCategory(em,nm,col,form.editingCatId)}>{form.editingCatId?"Guardar":"Crear"}</button>
      </div>
    </div>);
  };

  // ── RECEIPT MODAL ──
  const ReceiptModal=()=>{
    const [rd,setRd]=useState({amount:"",merchant:"",category:"",note:"",date:today,image:null,addExpense:true});
    const fileRef=useRef(null);
    const upd=(k,v)=>setRd(p=>({...p,[k]:v}));
    return(<div style={s.sheet}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{...s.sheetTitle,margin:0}}>📄 Agregar Factura</div>
        <button style={s.iconBtn} onClick={()=>setModal(null)}><Icon name="x" size={18}/></button>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>IMAGEN</div>
        {rd.image?<div style={{position:"relative",borderRadius:16,overflow:"hidden",border:`1px solid ${border}`}}>
          <img src={rd.image} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",display:"block"}}/>
          <button onClick={()=>upd("image",null)} style={{position:"absolute",top:8,right:8,background:"#00000088",border:"none",borderRadius:8,color:"#fff",padding:"4px 10px",cursor:"pointer",fontSize:12}}>Cambiar</button>
        </div>:<button onClick={()=>fileRef.current?.click()} style={{width:"100%",background:surface2,border:`2px dashed ${border}`,borderRadius:16,padding:"24px 20px",cursor:"pointer",color:muted,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{width:48,height:48,borderRadius:14,background:"#8b5cf622",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="camera" size={24}/></div>
          <div style={{fontSize:14,fontWeight:600,color:text}}>Tomar foto o subir imagen</div>
          <div style={{fontSize:12}}>Toca para abrir cámara</div>
        </button>}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>upd("image",ev.target.result);r.readAsDataURL(f);}}/>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>MONTO *</div>
        <input style={{...s.input,fontSize:24,fontWeight:800,color:red,textAlign:"center"}} type="number" placeholder="$0.00" value={rd.amount} onChange={e=>upd("amount",e.target.value)}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>COMERCIO</div>
        <input style={s.input} placeholder="ej. Supermercado, Farmacia..." value={rd.merchant} onChange={e=>upd("merchant",e.target.value)}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>FECHA</div>
          <input style={s.input} type="date" value={rd.date} onChange={e=>upd("date",e.target.value)}/>
        </div>
        <div>
          <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>CATEGORÍA</div>
          <select style={s.input} value={rd.category} onChange={e=>upd("category",e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map(c=><option key={c.id} value={`${c.emoji} ${c.name}`}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:muted,marginBottom:6,fontWeight:600}}>NOTA</div>
        <input style={s.input} placeholder="Descripción..." value={rd.note} onChange={e=>upd("note",e.target.value)}/>
      </div>
      {rd.category&&<div style={{background:green+"12",border:`1px solid ${green}30`,borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>upd("addExpense",!rd.addExpense)} style={{width:44,height:24,borderRadius:12,background:rd.addExpense?green:surface2,border:`1px solid ${border}`,cursor:"pointer",position:"relative",flexShrink:0}}>
          <div style={{position:"absolute",top:2,left:rd.addExpense?20:2,width:20,height:20,borderRadius:10,background:"#fff",transition:"left 0.2s"}}/>
        </button>
        <span style={{fontSize:13,color:muted}}>Registrar también como gasto</span>
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button style={s.ghost} onClick={()=>setModal(null)}>Cancelar</button>
        <button style={s.btn("#8b5cf6")} onClick={()=>saveReceipt(rd)}>Guardar Factura</button>
      </div>
    </div>);
  };

  // ── REPORT MODAL ──
  const ReportModal=()=>{
    const byCategory={};mExp.forEach(e=>{byCategory[e.category]=(byCategory[e.category]||0)+e.amount;});
    return(<div style={s.sheet}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={s.sheetTitle}>📊 Reporte Mensual</div>
        <button style={s.iconBtn} onClick={()=>setModal(null)}><Icon name="x" size={18}/></button>
      </div>
      <div style={{fontSize:13,color:muted,marginBottom:16}}>{new Date(month+"-01").toLocaleDateString("es-ES",{year:"numeric",month:"long"})}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[[fmt(totalIncome),"Ingresos",green],[fmt(totalSpent),"Gastos",red],[fmt(balance),"Balance",balance>=0?green:red],[budgetPct.toFixed(0)+"%","Presupuesto",budgetPct>90?red:accent]].map(([v,l,c])=>(
          <div key={l} style={{background:surface2,borderRadius:14,padding:14}}><div style={{fontSize:11,color:muted,marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div></div>
        ))}
      </div>
      {Object.keys(byCategory).length>0&&<>
        <div style={s.label}>Por Categoría</div>
        {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${border}`}}>
          <span style={{fontSize:14}}>{cat}</span><span style={{fontWeight:700,color:red}}>{fmt(amt)}</span>
        </div>)}
      </>}
      <div style={{marginTop:20,display:"flex",gap:10}}>
        <button style={s.ghost} onClick={()=>setModal(null)}>Cerrar</button>
        <button style={s.btn()} onClick={()=>{setModal(null);showToast("Reporte listo ✓");}}><span style={{display:"flex",alignItems:"center",gap:8}}><Icon name="download" size={16}/>Descargar</span></button>
      </div>
    </div>);
  };

  // ── GENERIC MODALS ──
  const MODAL_CONFIGS={
    expense:{title:"Agregar Gasto",color:red,fields:[{key:"amount",type:"number",placeholder:"Monto ($)"},{key:"category",type:"catselect",placeholder:"Categoría"},{key:"note",type:"text",placeholder:"Nota (opcional)"},{key:"date",type:"date",default:today}],action:addExpense,label:"Guardar Gasto"},
    income:{title:"Agregar Ingreso",color:green,fields:[{key:"amount",type:"number",placeholder:"Monto ($)"},{key:"type",type:"select",options:INCOME_TYPES,placeholder:"Tipo"},{key:"note",type:"text",placeholder:"Nota (opcional)"},{key:"date",type:"date",default:today}],action:addIncome,label:"Guardar Ingreso"},
    fixed:{title:"Gasto Fijo",color:yellow,fields:[{key:"name",type:"text",placeholder:"Nombre (ej. Netflix)"},{key:"amount",type:"number",placeholder:"Monto ($)"},{key:"frequency",type:"select",options:FIXED_FREQ,placeholder:"Frecuencia"},{key:"category",type:"select",options:FIXED_CATS,placeholder:"Categoría"},{key:"dueDay",type:"number",placeholder:"Día de vencimiento"}],action:addFixed,label:"Guardar"},
    card:{title:"Agregar Tarjeta",color:accent,fields:[{key:"name",type:"text",placeholder:"Nombre de tarjeta"},{key:"limit",type:"number",placeholder:"Límite ($)"},{key:"balance",type:"number",placeholder:"Saldo actual ($)"},{key:"dueDate",type:"text",placeholder:"Fecha de corte"}],action:addCard,label:"Guardar Tarjeta"},
    journal:{title:"Nueva Entrada",color:green,fields:[{key:"title",type:"text",placeholder:"Activo (ej. AAPL, BTC)"},{key:"type",type:"select",options:["buy","sell","note"],placeholder:"Tipo"},{key:"amount",type:"number",placeholder:"Monto ($)"},{key:"note",type:"text",placeholder:"Notas..."}],action:addJournal,label:"Guardar"},
    reminder:{title:"Recordatorio",color:yellow,fields:[{key:"title",type:"text",placeholder:"Título"},{key:"type",type:"select",options:REMINDER_TYPES,placeholder:"Tipo"},{key:"date",type:"date"},{key:"note",type:"text",placeholder:"Notas"}],action:addReminder,label:"Crear"},
    budget:{title:"Presupuesto",color:accent,fields:[{key:"monthly",type:"number",placeholder:"Presupuesto mensual ($)"}],action:()=>{setBudget(p=>({...p,monthly:parseFloat(form.monthly)}));setModal(null);setForm({});showToast("Actualizado ✓");}},
  };

  const renderModal=()=>{
    if(!modal)return null;
    if(modal==="report")return<div style={s.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}><ReportModal/></div>;
    if(modal==="category")return<div style={s.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}><CategoryModal/></div>;
    if(modal==="receipt")return<div style={s.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}><ReceiptModal/></div>;
    const cfg=MODAL_CONFIGS[modal];if(!cfg)return null;
    return(<div style={s.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
      <div style={s.sheet}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{...s.sheetTitle,margin:0}}>{cfg.title}</div>
          <button style={s.iconBtn} onClick={()=>setModal(null)}><Icon name="x" size={18}/></button>
        </div>
        {cfg.fields.map(f=><div key={f.key} style={{marginBottom:12}}>
          {f.type==="catselect"?<select style={s.input} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
            <option value="">Seleccionar categoría</option>
            {categories.map(c=><option key={c.id} value={`${c.emoji} ${c.name}`}>{c.emoji} {c.name}</option>)}
          </select>:f.type==="select"?<select style={s.input} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
            <option value="">{f.placeholder}</option>
            {f.options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>:<input style={s.input} type={f.type} placeholder={f.placeholder} defaultValue={form[f.key]||f.default||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>}
        </div>)}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button style={s.ghost} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={s.btn(cfg.color)} onClick={cfg.action}>{cfg.label}</button>
        </div>
      </div>
    </div>);
  };

  const TABS=[{id:"home",icon:"home",label:"Inicio"},{id:"expenses",icon:"minus",label:"Gastos"},{id:"receipts",icon:"receipt",label:"Facturas"},{id:"categories",icon:"tag",label:"Categorías"},{id:"fixed",icon:"repeat",label:"Fijos"}];
  const FAB_MODALS={home:"expense",expenses:"expense",receipts:"receipt",categories:"category",fixed:"fixed",cards:"card",invest:"journal"};
  const CONTENT={home:<HomeTab/>,expenses:<ExpensesTab/>,receipts:<ReceiptsTab/>,categories:<CategoriesTab/>,fixed:<FixedTab/>,cards:<CardsTab/>,invest:<InvestTab/>};

  return(<>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <div style={s.app}>
      {CONTENT[tab]}
      {subTab==="more"&&<MoreMenu/>}
      <button style={s.fab} onClick={()=>{setForm({});setModal(FAB_MODALS[tab]||"expense");}}>
        <Icon name="plus" size={22}/>
      </button>
      <div style={s.tabBar}>
        {TABS.map(({id,icon,label})=><button key={id} style={s.tabItem(tab===id)} onClick={()=>{setTab(id);setSubTab(null);}}>
          <Icon name={icon} size={20}/><span>{label}</span>
        </button>)}
        <button style={s.tabItem(tab==="cards"||tab==="invest")} onClick={()=>setSubTab(subTab==="more"?null:"more")}>
          <span style={{fontSize:20}}>⋯</span><span>Más</span>
        </button>
      </div>
      {toast&&<div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?red:toast.type==="info"?accent:"#1e293b",color:"#fff",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,zIndex:300,whiteSpace:"nowrap",boxShadow:"0 4px 20px #00000044"}}>{toast.msg}</div>}
      {renderModal()}
    </div>
  </>);
}
