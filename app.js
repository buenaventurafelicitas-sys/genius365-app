// ===== Config (alineado a cinturones y áreas) =====
const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración", examples:"Documentos, resúmenes, comparación" },
    { id:"comm",   name:"Comunicación", examples:"Meetings, correo, Teams, traducción" },
    { id:"prod",   name:"Productividad", examples:"Búsquedas, análisis" },
    { id:"auto",   name:"Automatización", examples:"Agentes y Copilot Studio" }
  ],
  belts: [
    { id:"white",  name:"Cinturón Blanco" },
    { id:"yellow", name:"Cinturón Amarillo" },
    { id:"green",  name:"Cinturón Verde" },
    { id:"black",  name:"Cinturón Negro (Champion)" }
  ]
};

// ===== Estado (localStorage para MVP) =====
const KEY = "genius365_demo_v1";

const defaultState = {
  me: { name:"", role:"", area:"collab", belt:"white" },
  evidence: {
    trainingQR:false,
    elearning:false,
    exam:false,
    usecase:{ idea:"", videoUrl:"", status:"draft", publishedUrl:"" }
  },
  licenseRequests: [],
  adminInbox: []
};

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultState);
  }catch{
    return structuredClone(defaultState);
  }
}
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }

let state = load();

// ===== Router =====
const app = document.getElementById("app");

document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

document.getElementById("resetBtn").addEventListener("click", ()=>{
  localStorage.removeItem(KEY);
  state = structuredClone(defaultState);
  render("home");
});

function render(route){
  // Onboarding suave: si no hay nombre, te deja igual navegar pero te anima a completar perfil
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}

render("home");

// ===== Views =====
function home(){
  const area = areaObj(state.me.area);
  const pct = computeProgress();

  app.innerHTML = `
    <div class="grid">
      <section class="card col8">
        <h2>Mi progreso</h2>
        <div class="badge">Área: <b>${area?.name || "-"}</b></div>
        <div class="badge">Nivel: <b>${beltName(state.me.belt)}</b></div>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <p class="note">Siguiente paso: ${nextStepText()}</p>

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
        <p class="note">Tip: en producción este perfil puede venir del directorio.</p>
      </section>
    </div>
  `;

  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goBelts").onclick = ()=>render("belts");
  document.getElementById("saveMe").onclick = ()=>{
    state.me.name = document.getElementById("name").value.trim();
    state.me.role = document.getElementById("role").value.trim();
    state.me.area = document.getElementById("area").value;
    save(state);
    render("home");
  };
}

function belts(){
  // EXACTO como el screenshot: lista con dot + título + bullet requirement
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
            <div class="belt-item belt-${x.id}">
              <p class="belt-title">
                <span class="belt-dot"></span>
                ${x.title}
              </p>
              <p class="belt-req">${x.req}</p>
            </div>
          `).join("")}
        </div>

      </section>
    </div>
  `;
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
    save(state);
    render("evidence");
  };

  document.getElementById("greenBtn").onclick = ()=>{
    state.evidence.elearning = document.getElementById("elearn").checked;
    state.evidence.exam = document.getElementById("exam").checked;
    if(state.evidence.elearning && state.evidence.exam){
      state.me.belt = "green";
      save(state);
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
    save(state);
    alert("Caso enviado. Pendiente de revisión.");
    render("evidence");
  };
}

/* views no usados hoy (se dejan por compatibilidad) */
function license(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Solicitud de licencia</h2>
        <p class="note">Esta sección se activará si decides usar el camino Free.</p>
      </section>
    </div>
  `;
}
function admin(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Admin</h2>
        <p class="note">MVP local. (No se usa en el snapshot “feliz”).</p>
      </section>
    </div>
  `;
}

/* ===== Helpers ===== */
function beltName(id){
  const b = CONFIG.belts.find(x=>x.id===id);
  return b ? b.name : "-";
}
function areaObj(id){
  return CONFIG.areas.find(a=>a.id===id);
}
function beltIndex(id){
  return ["white","yellow","green","black"].indexOf(id);
}
function computeProgress(){
  const idx = beltIndex(state.me.belt);
  return Math.max(0, Math.min(100, idx * 33));
}
function nextStepText(){
  if(state.me.belt==="white") return "Registrar asistencia (QR) para pasar a Amarillo.";
  if(state.me.belt==="yellow") return "Completar e-learning + examen para pasar a Verde.";
  if(state.me.belt==="green") return "Enviar caso real (idea + vídeo) para revisión.";
  if(state.me.belt==="black") return "Eres Champion. Acompaña a otros.";
  return "-";
}
function escapeHtml(str){
  return (str || "").toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
``
