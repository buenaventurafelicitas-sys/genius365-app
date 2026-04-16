// ===== Config (alineado a cinturones y áreas) =====
const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración", examples:"Documentos, resúmenes, comparación" },
    { id:"comm",   name:"Comunicación", examples:"Meetings, correo, Teams, traducción" },
    { id:"prod",   name:"Productividad", examples:"Búsquedas, análisis" },
    { id:"auto",   name:"Automatización", examples:"Agentes y Copilot Studio" }
  ],
  belts: [
    { id:"white",  name:"Cinturón Blanco",  color:"#e5e7eb", next:"yellow" },
    { id:"yellow", name:"Cinturón Amarillo",color:"#fbbf24", next:"green",
      req:["Asistencia a formación","Escaneo/registro vía QR"] },
    { id:"green",  name:"Cinturón Verde",   color:"#34d399", next:"black",
      req:["Completar e-learning del área","Aprobar examen final"] },
    { id:"black",  name:"Cinturón Negro (Champion/Super User)", color:"#111827", next:null,
      req:["Idea de caso validada por Genius365","Vídeo explicativo","Revisión y publicación"] }
  ]
};

// ===== Estado (localStorage para MVP) =====
const KEY = "genius365_demo_v1";
const defaultState = {
  me: { name:"", role:"", area:"collab", belt:"white" },
  evidence: { trainingQR:false, elearning:false, exam:false, usecase:{ idea:"", videoUrl:"", status:"draft", publishedUrl:"" } },
  licenseRequests: [],
  adminInbox: [] // en demo, es lo mismo que licenseRequests
};

function load(){ return JSON.parse(localStorage.getItem(KEY) || "null") ?? structuredClone(defaultState); }
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
let state = load();

function beltIndex(id){ return CONFIG.belts.findIndex(b=>b.id===id); }
function beltObj(id){ return CONFIG.belts.find(b=>b.id===id); }
function areaObj(id){ return CONFIG.areas.find(a=>a.id===id); }

function computeProgress(){
  // progreso simple: white=0, yellow=33, green=66, black=100
  return Math.max(0, Math.min(100, beltIndex(state.me.belt) * 33));
}

// ===== Router =====
const app = document.getElementById("app");
document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

function render(route){
  if(!state.me.name) route = "home"; // forzar onboarding
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}
render("home");

// ===== Views =====
function home(){
  const b = beltObj(state.me.belt);
  const area = areaObj(state.me.area);
  const pct = computeProgress();
  app.innerHTML = `
  <div class="grid">
    <section class="card col8">
      <h2>Mi progreso</h2>
      <div class="badge">Área: <b>${area?.name || "-"}</b></div>
      <div class="badge">Nivel: <b style="color:${b.color}">${b.name}</b></div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <p class="note">Siguiente paso: ${nextStepText()}</p>
      <div class="actions">
        <button class="primary" id="goEvidence">Subir evidencia</button>
        <button class="secondary" id="goLicense">Solicitar licencia</button>
      </div>
    </section>

    <section class="card col4">
      <h2>Tu perfil</h2>
      <label>Nombre y puesto</label>
      <input id="name" placeholder="Nombre Apellido" value="${escapeHtml(state.me.name)}"/>
      <input id="role" placeholder="Puesto" value="${escapeHtml(state.me.role)}" style="margin-top:8px"/>
      <label>Área de especialización</label>
      <select id="area">
        ${CONFIG.areas.map(a=>`<option value="${a.id}" ${a.id===state.me.area?"selected":""}>${a.name}</option>`).join("")}
      </select>
      <div class="actions">
        <button class="primary" id="saveMe">Guardar</button>
        <button class="secondary" id="reset">Reset demo</button>
      </div>
      <p class="note">Tip: en un despliegue real, este perfil puede venir de directorio y permisos.</p>
    </section>

    <section class="card col12">
      <h2>Retos (quests) sugeridos</h2>
      <p class="note">Inspirados en tu área: <b>${area?.examples}</b></p>
      ${questsForArea(state.me.area).map(q=>`<div class="badge">${q}</div>`).join(" ")}
      <p class="note" style="margin-top:10px;">(En producción, estos retos pueden enlazar a contenidos e‑learning o píldoras.)</p>
    </section>
  </div>`;

  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goLicense").onclick = ()=>render("license");
  document.getElementById("saveMe").onclick = ()=>{
    state.me.name = document.getElementById("name").value.trim();
    state.me.role = document.getElementById("role").value.trim();
    state.me.area = document.getElementById("area").value;
    save(state); render("home");
  };
  document.getElementById("reset").onclick = ()=>{
    state = structuredClone(defaultState); save(state); render("home");
  };
}

function belts(){
  app.innerHTML = `
  <div class="grid">
    <section class="card col12">
      <h2>Ruta de cinturones</h2>
      <p class="note">Blanco → Amarillo → Verde → Negro (Champion/Super User)</p>
      ${CONFIG.belts.map(b=>renderBeltCard(b)).join("")}
      <p class="note">La subida de nivel se desbloquea cuando completas evidencias (QR, e‑learning+test, caso real).</p>
    </section>
  </div>`;
}

function evidence(){
  const b = state.me.belt;
  const canYellow = (b==="white");
  const canGreen  = (b==="yellow");
  const canBlack  = (b==="green");
  const e = state.evidence;

  app.innerHTML = `
  <div class="grid">
    <section class="card col6">
      <h2>Amarillo (Formación + QR)</h2>
      <p class="note">Marca tu asistencia registrando el código del QR mostrado en la sesión.</p>
      <label>Código QR (token)</label>
      <input id="qrToken" placeholder="Ej: GENIUS-2026-ABERTIS" />
      <div class="actions">
        <button class="primary" id="qrBtn" ${canYellow?"":"disabled"}>Validar y obtener Amarillo</button>
      </div>
      <p class="note">Estado: ${e.trainingQR ? "✅ Registrado" : "⏳ Pendiente"}</p>
    </section>

    <section class="card col6">
      <h2>Verde (E-learning + Examen)</h2>
      <label>Confirmo e-learning completado</label>
      <input type="checkbox" id="elearn" ${e.elearning?"checked":""}/> 
      <label>Confirmo examen aprobado</label>
      <input type="checkbox" id="exam" ${e.exam?"checked":""}/>
      <div class="actions">
        <button class="primary" id="greenBtn" ${canGreen?"":"disabled"}>Obtener Verde</button>
      </div>
