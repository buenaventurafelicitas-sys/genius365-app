// Genius365 — Snapshot estable (neón + belts con bolitas)
// Basado en la estructura de tu app actual (áreas/cinturones/rutas) [1](https://insightonlineeur-my.sharepoint.com/personal/felicitas_buenaventuratami_insight_com/Documents/Desktop/Genius%20365%20app/app.js?web=1)

const APP = {
  clientName: "Francisco Aragón",
  storageKey: "genius365_demo_v1"
};

const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración", examples:"Documentos, resúmenes, comparación" },
    { id:"comm",   name:"Comunicación", examples:"Meetings, correo, Teams, traducción" },
    { id:"prod",   name:"Productividad", examples:"Búsquedas, análisis" },
    { id:"auto",   name:"Automatización", examples:"Agentes y Copilot Studio" }
  ],
  belts: [
    { id:"white",  name:"Cinturón Blanco",  color:"#e5e7eb", next:"yellow" },
    { id:"yellow", name:"Cinturón Amarillo",color:"#fbbf24", next:"green" },
    { id:"green",  name:"Cinturón Verde",   color:"#34d399", next:"black" },
    { id:"black",  name:"Cinturón Negro (Champion)", color:"#111827", next:null }
  ]
};

const defaultState = {
  // “modo” demo (para que no te bloquee)
  userType: "", // "" | "licensed" | "free"
  me: { name:"", role:"", area:"collab", belt:"white" },

  evidence: {
    trainingQR:false,     // amarillo
    elearning:false,      // verde
    exam:false,           // verde
    usecase:{ idea:"", videoUrl:"", status:"draft" } // draft|submitted
  },

  licenseRequests: [],   // [{id,name,role,why,tasks,impact,status}]
  caseInbox: []          // [{id,userName,area,idea,videoUrl,status}]
};

function load(){
  try{
    const raw = localStorage.getItem(APP.storageKey);
    return raw ? JSON.parse(raw) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}
function save(){
  localStorage.setItem(APP.storageKey, JSON.stringify(state));
}

let state = load();

// DOM
const app = document.getElementById("app");

// Header (si existen los IDs)
const t = document.getElementById("appTitle");
const st = document.getElementById("appSubtitle");
if(t) t.innerText = `Genius365 — ${APP.clientName}`;
if(st) st.innerText = `Viaje de adopción de M365 Copilot — sistema de cinturones`;

// Nav routing
document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

// Reset
const resetBtn = document.getElementById("resetBtn");
if(resetBtn){
  resetBtn.addEventListener("click", ()=>{
    localStorage.removeItem(APP.storageKey);
    state = structuredClone(defaultState);
    render("home");
  });
}

// Start
render("home");

function render(route){
  // onboarding: si no eligió tipo, lo mando a onboarding
  if(!state.userType){
    return onboarding();
  }

  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}

/* =========================
   VIEWS
   ========================= */

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

  document.getElementById("btnLicensed").onclick = ()=>{
    state.userType = "licensed";
    save();
    render("home");
  };

  document.getElementById("btnFree").onclick = ()=>{
    state.userType = "free";
    save();
    render("license");
  };
}

function home(){
  // Si es Free, le mando a la sección de licencia
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

  const area = areaObj(state.me.area);
  const belt = beltObj(state.me.belt);
  const pct = computeProgressPct();

  app.innerHTML = `
    <div class="grid">
      <section class="card col8">
        <h2>Mi progreso</h2>
        <div class="badge">Área: <b>${escapeHtml(area.name)}</b></div>
        <div class="badge">Nivel: <b style="color:${belt.color}">${escapeHtml(belt.name)}</b></div>

        <div class="progress"><div style="width:${pct}%"></div></div>

        <p class="note">Siguiente paso: ${escapeHtml(nextStepText())}</p>

        <div class="actions">
          <button class="primary" id="goEvidence">Evidencias</button>
          <button class="secondary" id="goBelts">Cinturones</button>
        </div>
      </section>

      <section class="card col4">
        <h2>Tu perfil</h2>
        <label>Nombre</label>
        <input id="name" placeholder="Nombre Apellido" value="${escapeHtml(state.me.name)}" />
        <label>Puesto</label>
        <input id="role" placeholder="Puesto" value="${escapeHtml(state.me.role)}" />
        <label>Área de especialización</label>
        <select id="area">
          ${CONFIG.areas.map(a=>`<option value="${a.id}" ${a.id===state.me.area?"selected":""}>${a.name}</option>`).join("")}
        </select>
        <div class="actions">
          <button class="primary" id="saveMe">Guardar</button>
        </div>
      </section>

      <section class="card col12">
        <h2>Retos (quests) sugeridos</h2>
        <p class="note">Inspirados en tu área: <b>${escapeHtml(area.examples)}</b></p>
        ${questsForArea(state.me.area).map(q=>`<div class="badge">${escapeHtml(q)}</div>`).join(" ")}
      </section>
    </div>
  `;

  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goBelts").onclick = ()=>render("belts");
  document.getElementById("saveMe").onclick = ()=>{
    state.me.name = document.getElementById("name").value.trim();
    state.me.role = document.getElementById("role").value.trim();
    state.me.area = document.getElementById("area").value;
    save();
    render("home");
  };
}

/* ✅ ESTA ES LA CLAVE: cinturones como tu screenshot */
function belts(){
  // Solo para licensed
  if(state.userType !== "licensed"){
    return messageOnly("Cinturones", "Solo para usuarios con licencia (licensed).");
  }

  const items = [
    { id:"white",  title:"Cinturón Blanco",  req:"Inicio. Asiste a una formación para pasar a Amarillo." },
    { id:"yellow", title:"Cinturón Amarillo",req:"Formación registrada. Completa e-learning + examen para Verde." },
    { id:"green",  title:"Cinturón Verde",   req:"Envía un caso real (idea + vídeo) para revisión Genius365." },
    { id:"black",  title:"Cinturón Negro (Champion)", req:"Caso aprobado. Eres Champion." }
  ];

  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Ruta de cinturones</h2>

        <div class="belts-list">
          ${items.map(x=>`
            <div class="belt-row belt-${x.id}">
              <div class="belt-header">
                <span class="belt-dot"></span>
                <span class="belt-title">${escapeHtml(x.title)}</span>
              </div>
              <p class="belt-text">${escapeHtml(x.req)}</p>
            </div>
          `).join("")}
        </div>

      </section>
    </div>
  `;
}

function evidence(){
  if(state.userType !== "licensed"){
    return messageOnly("Evidencias", "Solo para usuarios con licencia (licensed).");
  }

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
        <p class="note">Amarillo → Verde: e-learning + examen.</p>
        <label><input type="checkbox" id="elearn" ${e.elearning?"checked":""}/> Confirmo e-learning completado</label>
        <label><input type="checkbox" id="exam" ${e.exam?"checked":""}/> Confirmo examen aprobado</label>
        <div class="actions">
          <button class="primary" id="greenBtn" ${canGreen?"":"disabled"}>Obtener Verde</button>
        </div>
      </section>

      <section class="card col12">
        <h2>Negro (Caso real)</h2>
        <p class="note">Solo desde Verde. Envía idea + vídeo para revisión.</p>
        <label>Idea</label>
        <textarea id="idea">${escapeHtml(e.usecase.idea)}</textarea>
        <label>Link vídeo</label>
        <input id="video" value="${escapeHtml(e.usecase.videoUrl)}" placeholder="https://..." />
        <div class="actions">
          <button class="secondary" id="submitBtn" ${canBlack?"":"disabled"}>Enviar a revisión</button>
        </div>
        <p class="note">Estado del caso: <b>${escapeHtml(e.usecase.status)}</b></p>
      </section>
    </div>
  `;

  document.getElementById("qrBtn").onclick = ()=>{
    const token = document.getElementById("qrToken").value.trim();
    if(!token) return alert("Introduce un token de QR.");
    state.evidence.trainingQR = true;
    state.me.belt = "yellow";
    save();
    render("evidence");
  };

  document.getElementById("greenBtn").onclick = ()=>{
    state.evidence.elearning = document.getElementById("elearn").checked;
    state.evidence.exam = document.getElementById("exam").checked;
    if(state.evidence.elearning && state.evidence.exam){
      state.me.belt = "green";
      save();
      render("evidence");
    } else {
      alert("Marca e-learning + examen para pasar a Verde.");
    }
  };

  document.getElementById("submitBtn").onclick = ()=>{
    const idea = document.getElementById("idea").value.trim();
    const videoUrl = document.getElementById("video").value.trim();
    if(!idea || !videoUrl) return alert("Completa idea + vídeo.");

    state.evidence.usecase.idea = idea;
    state.evidence.usecase.videoUrl = videoUrl;
    state.evidence.usecase.status = "submitted";

    // deja registro en bandeja (MVP)
    state.caseInbox.unshift({
      id: makeId(),
      userName: state.me.name || "Usuario",
      area: state.me.area,
      idea,
      videoUrl,
      status: "submitted"
    });

    save();
    alert("Caso enviado. Pendiente de revisión.");
    render("evidence");
  };
}

function license(){
  // Para Free: muestra formulario. Para Licensed: mensaje.
  if(state.userType !== "free"){
    return messageOnly("Solicitud de licencia", "Esta sección es para usuarios de Copilot Chat (Free).");
  }

  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Solicitar licencia de M365 Copilot</h2>
        <p class="note">Describe por qué la necesitas (vienes de Copilot Chat Free).</p>

        <label>Nombre</label>
        <input id="n" placeholder="Nombre Apellido"/>

        <label>Puesto</label>
        <input id="r" placeholder="Puesto"/>

        <label>Justificación</label>
        <textarea id="why"></textarea>

        <label>Tareas a mejorar</label>
        <textarea id="tasks"></textarea>

        <label>Impacto esperado</label>
        <select id="impact">
          <option value="">Selecciona…</option>
          <option>Ahorro de tiempo</option>
          <option>Mejora de calidad</option>
          <option>Reducción de errores</option>
          <option>Automatización / estandarización</option>
        </select>

        <div class="actions">
          <button class="primary" id="sendReq">Enviar solicitud</button>
        </div>

        <p class="note">Solicitudes enviadas (en este navegador): <b>${state.licenseRequests.length}</b></p>
      </section>
    </div>
  `;

  document.getElementById("sendReq").onclick = ()=>{
    const req = {
      id: makeId(),
      name: document.getElementById("n").value.trim(),
      role: document.getElementById("r").value.trim(),
      why: document.getElementById("why").value.trim(),
      tasks: document.getElementById("tasks").value.trim(),
      impact: document.getElementById("impact").value,
      status: "pending"
    };
    if(!req.name || !req.role || !req.why) return alert("Completa Nombre, Puesto y Justificación.");
    state.licenseRequests.unshift(req);
    save();
    alert("Solicitud enviada.");
    render("license");
  };
}

function admin(){
  // Lo dejamos minimal para no romper nada hoy
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Admin</h2>
        <p class="note">MVP local. (Si quieres tablas mañana lo reactivamos con calma).</p>
      </section>
    </div>
  `;
}

/* =========================
   HELPERS
   ========================= */

function areaObj(id){
  return CONFIG.areas.find(a=>a.id===id) || CONFIG.areas[0];
}
function beltObj(id){
  return CONFIG.belts.find(b=>b.id===id) || CONFIG.belts[0];
}
function computeProgressPct(){
  const order = ["white","yellow","green","black"];
  const idx = order.indexOf(state.me.belt);
  return Math.max(0, Math.min(100, idx * 33));
}

function nextStepText(){
  if(state.me.belt==="white") return "Registrar asistencia (QR) para pasar a Amarillo.";
  if(state.me.belt==="yellow") return "Completar e-learning + examen para pasar a Verde.";
  if(state.me.belt==="green") return "Enviar caso real (idea + vídeo) para revisión.";
  if(state.me.belt==="black") return "Eres Champion. Acompaña a otros.";
  return "-";
}

function questsForArea(areaId){
  const map = {
    collab: ["Comparar dos documentos", "Resumir un documento largo", "Crear plantilla de propuesta"],
    comm:   ["Resumen de reunión", "Redactar correo ejecutivo", "Traducir comunicado"],
    prod:   ["Análisis de tabla", "Lista de acciones", "Plan semanal"],
    auto:   ["Automatizar reporte", "Idea de agente", "Checklist validación"]
  };
  return map[areaId] || ["Definir tu primer caso real"];
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

function escapeHtml(str){
  return (str || "").toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function makeId(){
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
}
