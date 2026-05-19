// Genius365 — Francisco Aragón

const APP = {
  clientName: "Francisco Aragón",
  storageKey: "genius365_fa_v2"
};

const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración",    icon:"🤝" },
    { id:"comm",   name:"Comunicación",    icon:"💬" },
    { id:"prod",   name:"Productividad",   icon:"⚡" },
    { id:"auto",   name:"Automatización",  icon:"🤖" }
  ],
  belts: [
    { id:"white",  name:"Cinturón Blanco"          },
    { id:"yellow", name:"Cinturón Amarillo"         },
    { id:"green",  name:"Cinturón Verde"            },
    { id:"black",  name:"Cinturón Negro (Champion)" }
  ],
  departments: ["Comercial","Marketing","Operaciones","Finanzas","RRHH","IT","Legal","Dirección","Otro"],
  roles: ["Analista","Consultor/a","Manager","Director/a","Técnico/a","Coordinador/a","Especialista","Otro"]
};

const RANKING_DATA = {
  collab: [
    { name:"Ana Martínez",    belt:"black",  beltName:"Negro"    },
    { name:"Carlos López",    belt:"green",  beltName:"Verde"    },
    { name:"Marta Ruiz",      belt:"yellow", beltName:"Amarillo" },
    { name:"Pedro Sanz",      belt:"white",  beltName:"Blanco"   },
    { name:"Laura García",    belt:"white",  beltName:"Blanco"   }
  ],
  comm: [
    { name:"Sofía Herrera",   belt:"black",  beltName:"Negro"    },
    { name:"Javier Moreno",   belt:"green",  beltName:"Verde"    },
    { name:"Elena Castro",    belt:"yellow", beltName:"Amarillo" },
    { name:"Tomás Vega",      belt:"white",  beltName:"Blanco"   },
    { name:"Isabel Pardo",    belt:"white",  beltName:"Blanco"   }
  ],
  prod: [
    { name:"Miguel Ángel",    belt:"black",  beltName:"Negro"    },
    { name:"Patricia Nieto",  belt:"green",  beltName:"Verde"    },
    { name:"Roberto Calvo",   belt:"yellow", beltName:"Amarillo" },
    { name:"Nuria Blanco",    belt:"white",  beltName:"Blanco"   },
    { name:"Diego Romero",    belt:"white",  beltName:"Blanco"   }
  ],
  auto: [
    { name:"Lucía Fernández", belt:"black",  beltName:"Negro"    },
    { name:"Andrés Gil",      belt:"green",  beltName:"Verde"    },
    { name:"Carmen Rubio",    belt:"yellow", beltName:"Amarillo" },
    { name:"Víctor Ortega",   belt:"white",  beltName:"Blanco"   },
    { name:"Raquel Peña",     belt:"white",  beltName:"Blanco"   }
  ]
};

const BELT_COLORS = {
  white:"#e5e7eb", yellow:"#fbbf24", green:"#34d399", black:"#374151"
};

// Estado por área
function defaultAreaState(){
  return { belt:"white", trainingDone:false, elearningDone:false, examPassed:false, usecase:{ idea:"", videoUrl:"", status:"draft" } };
}

const defaultState = {
  userType: "",
  registered: false,
  me: { name:"", surname:"", department:"", role:"" },
  activeArea: "collab",
  areas: {
    collab: defaultAreaState(),
    comm:   defaultAreaState(),
    prod:   defaultAreaState(),
    auto:   defaultAreaState()
  },
  licenseRequests: [],
  caseInbox: []
};

function load(){
  try { return JSON.parse(localStorage.getItem(APP.storageKey)) ?? structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(APP.storageKey, JSON.stringify(state)); }

let state = load();
const app = document.getElementById("app");

const titleEl = document.getElementById("appTitle");
const subEl   = document.getElementById("appSubtitle");
if(titleEl) titleEl.innerText = `Genius365 — ${APP.clientName}`;
if(subEl)   subEl.innerText   = `Cinturones (licensed) + Solicitud de licencia (Copilot Chat Free)`;

document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

const resetBtn = document.getElementById("resetBtn");
if(resetBtn){
  resetBtn.addEventListener("click", ()=>{
    localStorage.removeItem(APP.storageKey);
    state = structuredClone(defaultState);
    render("home");
  });
}

render("home");

function render(route){
  if(!state.userType)   return onboarding();
  if(!state.registered) return registration();
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}

// ---------- Helpers ----------

function areaData(id){ return state.areas[id] || defaultAreaState(); }
function areaObj(id){ return CONFIG.areas.find(a=>a.id===id) || CONFIG.areas[0]; }
function beltObj(id){ return CONFIG.belts.find(b=>b.id===id) || CONFIG.belts[0]; }

function progressPct(belt){
  const order = ["white","yellow","green","black"];
  return Math.max(0, Math.min(100, order.indexOf(belt) * 33));
}

function nextStepText(areaId){
  const ad = areaData(areaId);
  if(ad.belt==="white")  return "Registrar asistencia (QR) para pasar a Amarillo.";
  if(ad.belt==="yellow") return "Completar e-learning y examen para pasar a Verde.";
  if(ad.belt==="green" && ad.usecase.status!=="submitted") return "Enviar caso para revisión.";
  if(ad.belt==="green" && ad.usecase.status==="submitted") return "Esperar validación Genius365.";
  if(ad.belt==="black")  return "Compartir y acompañar a otros. ⭐";
  return "-";
}

function getUserRankPos(areaId, belt){
  const beltOrder = { black:4, green:3, yellow:2, white:1 };
  const list = RANKING_DATA[areaId] || [];
  return list.filter(p=>(beltOrder[p.belt]||0) > (beltOrder[belt]||0)).length + 1;
}

function getRankingRows(areaId, userName, belt, userPos){
  const list = RANKING_DATA[areaId] || [];
  const medals = ["🥇","🥈","🥉"];
  const userEntry = {
    name: userName || APP.clientName,
    belt, beltName: CONFIG.belts.find(b=>b.id===belt)?.name || "Blanco", isMe:true
  };
  const full = [...list];
  full.splice(userPos-1, 0, userEntry);
  let display = full.slice(0,5);
  if(!display.find(p=>p.isMe)) display = [...full.slice(0,4), userEntry];

  return display.map(p=>{
    const pos  = full.indexOf(p)+1;
    const isMe = !!p.isMe;
    const medal = pos<=3 ? medals[pos-1] : pos;
    const dotColor = BELT_COLORS[p.belt]||"#e5e7eb";
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;
        background:${isMe?"rgba(0,230,118,0.08)":"rgba(255,255,255,0.04)"};
        border:1px solid ${isMe?"rgba(0,230,118,0.25)":"rgba(255,255,255,0.07)"};margin-bottom:6px;">
        <span style="width:22px;text-align:center;font-size:13px;font-weight:700;${pos<=3?"":"opacity:0.45;"}">${medal}</span>
        <span style="flex:1;font-size:13px;font-weight:${isMe?"700":"500"};color:${isMe?"#00e676":"inherit"};">
          ${escapeHtml(p.name)}${isMe?' <span style="font-size:11px;opacity:0.6;font-weight:400;">— Tú</span>':""}
        </span>
        <span style="width:9px;height:9px;border-radius:50%;background:${dotColor};display:inline-block;flex-shrink:0;${p.belt==="black"?"border:1px solid #555;":""}"></span>
        <span style="font-size:11px;opacity:0.5;">${escapeHtml(p.beltName)}</span>
      </div>`;
  }).join("");
}

function escapeHtml(str){
  return (str||"").toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function makeId(){
  return Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
}

// ---------- Screens ----------

function onboarding(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Bienvenido/a 👋</h2>
        <p class="note">Elige tu situación para ver el recorrido correcto.</p>
        <div class="actions">
          <button class="primary" id="btnLicensed">Tengo licencia de M365 Copilot</button>
          <button class="secondary" id="btnFree">Uso Copilot Chat (Free) y quiero solicitar licencia</button>
        </div>
        <hr/>
        <p class="note">Si no ves cambios, pulsa <b>Reset</b> arriba (borra la memoria del navegador).</p>
      </section>
    </div>
  `;
  document.getElementById("btnLicensed").onclick = ()=>{ state.userType="licensed"; save(); render("home"); };
  document.getElementById("btnFree").onclick     = ()=>{ state.userType="free";     save(); render("license"); };
}

function registration(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12" style="max-width:520px; margin:0 auto;">
        <h2>Completa tu perfil</h2>
        <p class="note" style="margin-bottom:20px;">Antes de empezar, cuéntanos quién eres.</p>

        <label>Nombre</label>
        <input id="reg-name" value="${escapeHtml(state.me.name)}" placeholder="Nombre"/>

        <label>Apellido</label>
        <input id="reg-surname" value="${escapeHtml(state.me.surname||"")}" placeholder="Apellido"/>

        <label>Departamento</label>
        <select id="reg-dept">
          <option value="">Selecciona…</option>
          ${CONFIG.departments.map(d=>`<option value="${d}" ${state.me.department===d?"selected":""}>${d}</option>`).join("")}
        </select>

        <label>Rol</label>
        <select id="reg-role">
          <option value="">Selecciona…</option>
          ${CONFIG.roles.map(r=>`<option value="${r}" ${state.me.role===r?"selected":""}>${r}</option>`).join("")}
        </select>

        <div class="actions" style="margin-top:20px;">
          <button class="primary" id="btnRegister">Empezar →</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("btnRegister").onclick = ()=>{
    const name    = document.getElementById("reg-name").value.trim();
    const surname = document.getElementById("reg-surname").value.trim();
    const dept    = document.getElementById("reg-dept").value;
    const role    = document.getElementById("reg-role").value;
    if(!name || !surname || !dept || !role) return alert("Completa todos los campos para continuar.");
    state.me.name       = name;
    state.me.surname    = surname;
    state.me.department = dept;
    state.me.role       = role;
    state.registered    = true;
    save(); render("home");
  };
}

function home(){
  if(state.userType === "free"){
    app.innerHTML = `
      <div class="grid">
        <section class="card col12">
          <h2>Copilot Chat (Free)</h2>
          <p class="note">Tu camino aquí es <b>Solicitar licencia</b>.</p>
          <div class="actions">
            <button class="primary" id="goLicense">Ir a Solicitar licencia</button>
          </div>
        </section>
      </div>
    `;
    document.getElementById("goLicense").onclick = ()=>render("license");
    return;
  }

  const activeId  = state.activeArea || "collab";
  const ad        = areaData(activeId);
  const area      = areaObj(activeId);
  const belt      = beltObj(ad.belt);
  const userPos   = getUserRankPos(activeId, ad.belt);
  const rankRows  = getRankingRows(activeId, `${state.me.name} ${state.me.surname}`, ad.belt, userPos);
  const beltOrder = ["white","yellow","green","black"];
  const beltIdx   = beltOrder.indexOf(ad.belt);
  const dotColors = { white:"#e5e7eb", yellow:"#fbbf24", green:"#34d399", black:"#374151" };

  const barDots = beltOrder.map((b,i)=>{
    let s = "";
    if(i < beltIdx)       s = `background:#00e676;border-color:#00e676;box-shadow:0 0 6px rgba(0,230,118,0.6);`;
    else if(i===beltIdx)  s = `background:#fff;border-color:#fff;box-shadow:0 0 8px rgba(255,255,255,0.5);`;
    else                  s = `background:transparent;border-color:rgba(255,255,255,0.2);`;
    return `<div style="width:8px;height:8px;border-radius:50%;border:1.5px solid;${s}"></div>`;
  }).join("");

  const areaSelector = CONFIG.areas.map(a=>`
    <option value="${a.id}" ${a.id===activeId?"selected":""}>${a.icon} ${a.name}</option>
  `).join("");

  const fullName = escapeHtml(`${state.me.name} ${state.me.surname}`);

  app.innerHTML = `
    <div class="grid">

      <!-- PERFIL — izquierda -->
      <section class="card col4">
        <h2>Mi perfil</h2>
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:700;margin-bottom:2px;">${fullName}</div>
          <div style="font-size:13px;opacity:0.55;">${escapeHtml(state.me.role)} · ${escapeHtml(state.me.department)}</div>
        </div>
        <hr style="border-color:rgba(255,255,255,0.08);margin-bottom:14px;"/>
        <label>Nombre</label>
        <input id="name" value="${escapeHtml(state.me.name)}" placeholder="Nombre"/>
        <label>Apellido</label>
        <input id="surname" value="${escapeHtml(state.me.surname||"")}" placeholder="Apellido"/>
        <label>Departamento</label>
        <select id="dept">
          ${CONFIG.departments.map(d=>`<option value="${d}" ${state.me.department===d?"selected":""}>${d}</option>`).join("")}
        </select>
        <label>Rol</label>
        <select id="role">
          ${CONFIG.roles.map(r=>`<option value="${r}" ${state.me.role===r?"selected":""}>${r}</option>`).join("")}
        </select>
        <div class="actions">
          <button class="primary" id="saveMe">Guardar</button>
        </div>
      </section>

      <!-- MI PROGRESO — derecha -->
      <section class="card col8">

        <!-- Selector de área -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <h2 style="margin:0;">Mi progreso</h2>
          <select id="areaSelector" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:8px 14px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;">
            ${areaSelector}
          </select>
        </div>

        <!-- Chips nivel -->
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);border-radius:10px;padding:8px 14px;">
            <div>
              <span style="font-size:10px;opacity:0.45;letter-spacing:0.08em;display:block;margin-bottom:1px;">ÁREA</span>
              <span style="font-weight:700;font-size:14px;">${escapeHtml(area.name)}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);border-radius:10px;padding:8px 14px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${dotColors[ad.belt]||"#e5e7eb"};display:inline-block;flex-shrink:0;"></span>
            <div>
              <span style="font-size:10px;opacity:0.45;letter-spacing:0.08em;display:block;margin-bottom:1px;">NIVEL</span>
              <span style="font-weight:700;font-size:14px;">${escapeHtml(belt.name)}</span>
            </div>
          </div>
        </div>

        <!-- Barra -->
        <div style="margin-bottom:18px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;opacity:0.4;margin-bottom:6px;letter-spacing:0.06em;">
            <span>BLANCO</span><span>AMARILLO</span><span>VERDE</span><span>NEGRO</span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${progressPct(ad.belt)}%;border-radius:99px;background:linear-gradient(90deg,#00e676,#00bfa5);box-shadow:0 0 10px rgba(0,230,118,0.5);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;">${barDots}</div>
        </div>

        <!-- Siguiente paso -->
        <div style="display:flex;align-items:center;gap:10px;background:rgba(0,207,255,0.07);border:1px solid rgba(0,207,255,0.2);border-radius:10px;padding:10px 14px;margin-bottom:18px;">
          <span style="font-size:16px;flex-shrink:0;">→</span>
          <div>
            <span style="font-size:10px;opacity:0.45;letter-spacing:0.08em;display:block;margin-bottom:1px;">SIGUIENTE PASO</span>
            <span style="font-size:13px;font-weight:600;color:#7dd3fc;">${escapeHtml(nextStepText(activeId))}</span>
          </div>
        </div>

        <!-- Botones -->
        <div class="actions">
          <button class="primary" id="goEvidence">Evidencias</button>
          <button class="secondary" id="goBelts">Cinturones</button>
        </div>
      </section>

      <!-- RANKING -->
      <section class="card col12">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <h2 style="margin:0;">Ranking</h2>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.1em;padding:3px 10px;border-radius:999px;background:rgba(0,207,255,0.1);color:#7dd3fc;border:1px solid rgba(0,207,255,0.25);">${escapeHtml(area.name.toUpperCase())}</span>
        </div>
        <div style="display:flex;align-items:center;gap:16px;background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.2);border-radius:12px;padding:12px 18px;margin-bottom:16px;">
          <div>
            <div style="font-size:10px;opacity:0.5;margin-bottom:2px;letter-spacing:0.08em;">TU POSICIÓN</div>
            <div style="font-size:30px;font-weight:800;color:#00e676;line-height:1;">#${userPos}</div>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.1);"></div>
          <div>
            <div style="font-size:10px;opacity:0.5;margin-bottom:4px;letter-spacing:0.08em;">NIVEL ACTUAL</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;">
              <span style="width:9px;height:9px;border-radius:50%;background:${BELT_COLORS[ad.belt]};display:inline-block;"></span>
              ${escapeHtml(belt.name)}
            </div>
          </div>
        </div>
        ${rankRows}
      </section>

    </div>
  `;

  document.getElementById("areaSelector").onchange = (e)=>{
    state.activeArea = e.target.value;
    save(); render("home");
  };
  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goBelts").onclick    = ()=>render("belts");
  document.getElementById("saveMe").onclick     = ()=>{
    state.me.name       = document.getElementById("name").value.trim();
    state.me.surname    = document.getElementById("surname").value.trim();
    state.me.department = document.getElementById("dept").value;
    state.me.role       = document.getElementById("role").value;
    save(); render("home");
  };
}

function belts(){
  if(state.userType !== "licensed"){
    return messageOnly("Cinturones", "Solo para usuarios con licencia (licensed).");
  }
  app.innerHTML = `
    <div class="grid">
      <section class="card col12" style="padding:0;overflow:hidden;">
        <style>
          @keyframes pw{0%,100%{opacity:.6}50%{opacity:1}}
          @keyframes py{0%,100%{opacity:.5}50%{opacity:1}}
          @keyframes pg{0%,100%{opacity:.5}50%{opacity:1}}
          @keyframes pb{0%,100%{opacity:.6}50%{opacity:1}}
          .dw{animation:pw 1.8s ease-in-out infinite}
          .dy{animation:py 2.1s ease-in-out infinite}
          .dg{animation:pg 2.4s ease-in-out infinite}
          .db{animation:pb 2.8s ease-in-out infinite}
          .brow{display:grid;grid-template-columns:64px 1fr;align-items:center;gap:0 20px;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.06)}
          .brow:last-child{border-bottom:none}
          .bicon{display:flex;flex-direction:column;align-items:center;gap:4px}
          .bline{width:1px;height:20px;background:rgba(255,255,255,0.1)}
          .brow:last-child .bline{display:none}
          .blvl{font-size:10px;font-weight:700;letter-spacing:0.12em;margin-bottom:3px}
          .bname{font-size:16px;font-weight:600;margin-bottom:4px}
          .bdesc{font-size:13px;opacity:0.6;margin-bottom:0}
          .btag{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;margin-top:7px;letter-spacing:0.04em}
          .bhead{display:flex;align-items:center;gap:10px;padding:22px 28px 16px;border-bottom:1px solid rgba(255,255,255,0.08)}
          .bhead-lbl{font-size:10px;letter-spacing:0.16em;font-weight:700;opacity:0.4;color:#fff}
        </style>
        <div style="background:#020b2e;border-radius:inherit;color:#fff;">
          <div class="bhead">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><polygon points="9,1 11.5,6.5 17.5,7.2 13,11.5 14.3,17.5 9,14.5 3.7,17.5 5,11.5 0.5,7.2 6.5,6.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/></svg>
            <span class="bhead-lbl">RUTA DE CERTIFICACIÓN — GENIUS365</span>
          </div>
          <div class="brow">
            <div class="bicon">
              <svg width="56" height="32" viewBox="0 0 56 32"><rect x="1" y="8" width="54" height="16" rx="3" fill="rgba(224,224,255,0.08)" stroke="#e0e0ff" stroke-width="1.2"/><rect x="22" y="1" width="12" height="30" rx="2" fill="rgba(224,224,255,0.12)" stroke="#e0e0ff" stroke-width="1.2"/><rect x="24" y="11" width="8" height="10" rx="1.5" fill="none" stroke="#e0e0ff" stroke-width="1" class="dw"/></svg>
              <div class="bline"></div>
            </div>
            <div>
              <div class="blvl" style="color:#a0a0ff;">NIVEL 01</div>
              <div class="bname" style="color:#e0e0ff;">Cinturón Blanco</div>
              <div class="bdesc">Punto de entrada. Asiste a una sesión formativa presencial para avanzar.</div>
              <span class="btag" style="background:rgba(224,224,255,0.12);color:#e0e0ff;border:1px solid rgba(224,224,255,0.3);">Asistencia QR</span>
            </div>
          </div>
          <div class="brow">
            <div class="bicon">
              <svg width="56" height="32" viewBox="0 0 56 32"><rect x="1" y="8" width="54" height="16" rx="3" fill="rgba(255,230,0,0.1)" stroke="#ffe600" stroke-width="1.2"/><rect x="22" y="1" width="12" height="30" rx="2" fill="rgba(255,230,0,0.15)" stroke="#ffe600" stroke-width="1.2"/><rect x="24" y="11" width="8" height="10" rx="1.5" fill="none" stroke="#ffe600" stroke-width="1" class="dy"/></svg>
              <div class="bline"></div>
            </div>
            <div>
              <div class="blvl" style="color:#ffe600;">NIVEL 02</div>
              <div class="bname" style="color:#fff176;">Cinturón Amarillo</div>
              <div class="bdesc">Formación registrada. Completa el e-learning y supera el examen para continuar.</div>
              <span class="btag" style="background:rgba(255,230,0,0.12);color:#ffe600;border:1px solid rgba(255,230,0,0.4);">E-learning + examen</span>
            </div>
          </div>
          <div class="brow">
            <div class="bicon">
              <svg width="56" height="32" viewBox="0 0 56 32"><rect x="1" y="8" width="54" height="16" rx="3" fill="rgba(57,255,20,0.08)" stroke="#39ff14" stroke-width="1.2"/><rect x="22" y="1" width="12" height="30" rx="2" fill="rgba(57,255,20,0.12)" stroke="#39ff14" stroke-width="1.2"/><rect x="24" y="11" width="8" height="10" rx="1.5" fill="none" stroke="#39ff14" stroke-width="1" class="dg"/></svg>
              <div class="bline"></div>
            </div>
            <div>
              <div class="blvl" style="color:#39ff14;">NIVEL 03</div>
              <div class="bname" style="color:#a8ff80;">Cinturón Verde</div>
              <div class="bdesc">Envía un caso real documentado con idea y vídeo para revisión del equipo Genius365.</div>
              <span class="btag" style="background:rgba(57,255,20,0.1);color:#39ff14;border:1px solid rgba(57,255,20,0.35);">Caso real + vídeo</span>
            </div>
          </div>
          <div class="brow">
            <div class="bicon">
              <svg width="56" height="32" viewBox="0 0 56 32"><rect x="1" y="8" width="54" height="16" rx="3" fill="rgba(255,255,255,0.95)" stroke="#fff" stroke-width="1.2"/><rect x="22" y="1" width="12" height="30" rx="2" fill="rgba(255,255,255,0.95)" stroke="#fff" stroke-width="1.2"/><rect x="24" y="11" width="8" height="10" rx="1.5" fill="rgba(10,10,30,0.9)" stroke="#1a1a3e" stroke-width="1.5" class="db"/></svg>
            </div>
            <div>
              <div class="blvl" style="color:rgba(255,255,255,0.5);">NIVEL 04</div>
              <div class="bname" style="color:#ffffff;text-shadow:0 0 12px rgba(80,120,255,0.8),0 0 3px rgba(80,120,255,0.6);">Cinturón Negro <span style="color:rgba(255,255,255,0.35);font-weight:400;font-size:13px;text-shadow:none;">— Champion</span></div>
              <div class="bdesc">Caso validado por Genius365. Eres referente interno y acompañas a otros en el recorrido.</div>
              <span class="btag" style="background:rgba(255,255,255,0.08);color:#ffffff;border:1px solid rgba(255,255,255,0.25);">Validación Genius365</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function evidence(){
  if(state.userType !== "licensed"){
    return messageOnly("Evidencias", "Solo para usuarios con licencia (licensed).");
  }

  const activeId = state.activeArea || "collab";
  const ad       = areaData(activeId);
  const area     = areaObj(activeId);

  const areaSelector = CONFIG.areas.map(a=>`
    <option value="${a.id}" ${a.id===activeId?"selected":""}>${a.icon} ${a.name}</option>
  `).join("");

  app.innerHTML = `
    <div class="grid">
      <section class="card col12" style="padding:0;overflow:hidden;">
        <style>
          .ev-wrap{background:#020b2e;border-radius:inherit;color:#fff;padding:28px}
          .ev-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;gap:10px}
          .ev-head-left{display:flex;align-items:center;gap:10px}
          .ev-head-lbl{font-size:10px;letter-spacing:0.16em;font-weight:700;opacity:0.4}
          .ev-step{display:grid;grid-template-columns:48px 1fr;gap:0 20px;margin-bottom:8px}
          .ev-left{display:flex;flex-direction:column;align-items:center}
          .ev-dot{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
          .ev-vline{width:1px;flex:1;min-height:24px;margin:4px 0}
          .ev-step:last-child .ev-vline{display:none}
          .ev-card{border-radius:12px;padding:18px 20px;margin-bottom:20px;border:1px solid}
          .ev-card h3{font-size:14px;font-weight:700;margin:0 0 4px;letter-spacing:0.04em}
          .ev-sub{font-size:12px;opacity:0.5;margin-bottom:14px}
          .ev-status{font-size:12px;margin-top:12px;opacity:0.6}
          .ev-status b{opacity:1}
          .ev-check{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;opacity:0.8}
          .ev-check input{accent-color:#00e676;width:15px;height:15px}
          .ev-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 12px;color:#fff;font-size:13px;margin-bottom:10px;box-sizing:border-box}
          textarea.ev-input{min-height:80px;resize:vertical}
          .ev-label{font-size:12px;opacity:0.5;display:block;margin-bottom:4px}
        </style>
        <div class="ev-wrap">
          <div class="ev-head">
            <div class="ev-head-left">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><polygon points="9,1 11.5,6.5 17.5,7.2 13,11.5 14.3,17.5 9,14.5 3.7,17.5 5,11.5 0.5,7.2 6.5,6.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/></svg>
              <span class="ev-head-lbl">EVIDENCIAS — ${escapeHtml(area.name.toUpperCase())}</span>
            </div>
            <select id="evAreaSelector" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:7px 12px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">
              ${areaSelector}
            </select>
          </div>

          <div class="ev-step">
            <div class="ev-left">
              <div class="ev-dot" style="background:rgba(255,230,0,0.15);color:#ffe600;border:1.5px solid #ffe600;">01</div>
              <div class="ev-vline" style="background:rgba(255,230,0,0.2);"></div>
            </div>
            <div class="ev-card" style="border-color:rgba(255,230,0,0.25);background:rgba(255,230,0,0.04);">
              <h3 style="color:#ffe600;">Cinturón Amarillo — Formación</h3>
              <div class="ev-sub">Blanco → Amarillo: confirma tu asistencia a la sesión formativa</div>
              <button class="primary" id="btnTraining" ${ad.belt==="white"?"":"disabled"}>Confirmar asistencia</button>
              <div class="ev-status">Estado: ${ad.trainingDone?"✅ Registrado":"⏳ Pendiente"}</div>
            </div>
          </div>

          <div class="ev-step">
            <div class="ev-left">
              <div class="ev-dot" style="background:rgba(57,255,20,0.1);color:#39ff14;border:1.5px solid rgba(57,255,20,0.4);">02</div>
              <div class="ev-vline" style="background:rgba(57,255,20,0.2);"></div>
            </div>
            <div class="ev-card" style="border-color:rgba(57,255,20,0.2);background:rgba(57,255,20,0.03);">
              <h3 style="color:#39ff14;">Cinturón Verde — E-learning + Examen</h3>
              <div class="ev-sub">Amarillo → Verde: completa el e-learning y supera el examen</div>
              <div class="ev-check"><input type="checkbox" id="elearn" ${ad.elearningDone?"checked":""}/> E-learning completado</div>
              <div class="ev-check"><input type="checkbox" id="exam" ${ad.examPassed?"checked":""}/> Examen aprobado</div>
              <button class="primary" id="btnGreen" ${ad.belt==="yellow"?"":"disabled"}>Subir a Verde</button>
            </div>
          </div>

          <div class="ev-step">
            <div class="ev-left">
              <div class="ev-dot" style="background:rgba(255,255,255,0.08);color:#fff;border:1.5px solid rgba(255,255,255,0.2);">03</div>
            </div>
            <div class="ev-card" style="border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);">
              <h3 style="color:#fff;text-shadow:0 0 12px rgba(80,120,255,0.8);">Cinturón Negro — Caso real</h3>
              <div class="ev-sub">Verde → Negro: envía tu idea y vídeo para validación Genius365</div>
              <label class="ev-label">Idea</label>
              <textarea class="ev-input" id="idea">${escapeHtml(ad.usecase.idea)}</textarea>
              <label class="ev-label">Link vídeo</label>
              <input class="ev-input" id="video" value="${escapeHtml(ad.usecase.videoUrl)}" placeholder="https://..."/>
              <br/>
              <button class="secondary" id="btnSubmit" ${ad.belt==="green"?"":"disabled"}>Enviar a revisión</button>
              <div class="ev-status">Estado del caso: <b>${escapeHtml(ad.usecase.status)}</b></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById("evAreaSelector").onchange = (e)=>{
    state.activeArea = e.target.value;
    save(); render("evidence");
  };

  document.getElementById("btnTraining").onclick = ()=>{
    state.areas[activeId].trainingDone = true;
    state.areas[activeId].belt = "yellow";
    save(); render("evidence");
  };
  document.getElementById("btnGreen").onclick = ()=>{
    state.areas[activeId].elearningDone = document.getElementById("elearn").checked;
    state.areas[activeId].examPassed    = document.getElementById("exam").checked;
    if(state.areas[activeId].elearningDone && state.areas[activeId].examPassed){
      state.areas[activeId].belt = "green";
      save(); render("evidence");
    } else {
      alert("Marca e-learning + examen para pasar a Verde.");
    }
  };
  document.getElementById("btnSubmit").onclick = ()=>{
    const idea     = document.getElementById("idea").value.trim();
    const videoUrl = document.getElementById("video").value.trim();
    if(!idea || !videoUrl) return alert("Completa idea + vídeo.");
    state.areas[activeId].usecase.idea     = idea;
    state.areas[activeId].usecase.videoUrl = videoUrl;
    state.areas[activeId].usecase.status   = "submitted";
    state.caseInbox.unshift({ id:makeId(), userName:`${state.me.name} ${state.me.surname}`, area:activeId, idea, videoUrl, status:"submitted" });
    save(); alert("Caso enviado. Pendiente de revisión."); render("evidence");
  };
}

function license(){
  if(state.userType !== "free"){
    return messageOnly("Solicitud de licencia", "Esta sección es para usuarios de Copilot Chat (Free).");
  }
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Solicitar licencia de M365 Copilot</h2>
        <p class="note">Describe por qué la necesitas (vienes de Copilot Chat Free).</p>
        <label>Nombre</label><input id="n" placeholder="Nombre Apellido"/>
        <label>Puesto</label><input id="r" placeholder="Puesto"/>
        <label>Justificación</label><textarea id="why"></textarea>
        <label>Tareas a mejorar</label><textarea id="tasks"></textarea>
        <label>Impacto esperado</label>
        <select id="impact">
          <option value="">Selecciona…</option>
          <option>Ahorro de tiempo</option><option>Mejora de calidad</option>
          <option>Reducción de errores</option><option>Automatización / estandarización</option>
        </select>
        <div class="actions"><button class="primary" id="sendReq">Enviar solicitud</button></div>
        <p class="note">Solicitudes enviadas: <b>${state.licenseRequests.length}</b></p>
      </section>
    </div>
  `;
  document.getElementById("sendReq").onclick = ()=>{
    const req = {
      id:makeId(), name:document.getElementById("n").value.trim(),
      role:document.getElementById("r").value.trim(), why:document.getElementById("why").value.trim(),
      tasks:document.getElementById("tasks").value.trim(), impact:document.getElementById("impact").value, status:"pending"
    };
    if(!req.name||!req.role||!req.why) return alert("Completa Nombre, Puesto y Justificación.");
    state.licenseRequests.unshift(req);
    save(); alert("Solicitud enviada."); render("license");
  };
}

function admin(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Admin</h2>
        <p class="note">MVP local.</p>
        <p class="note">Casos enviados: <b>${state.caseInbox.length}</b> · Solicitudes: <b>${state.licenseRequests.length}</b></p>
      </section>
    </div>
  `;
}

function messageOnly(title, text){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>${escapeHtml(title)}</h2>
        <p class="note">${escapeHtml(text)}</p>
      </section>
    </div>
  `;
}
