// Genius365 - MVP estable (2 caminos + cinturones + licencia + admin)
// + Cinturones con bolita de color delante
// + Bolita también en "Mi progreso" (Nivel)

const APP = {
  clientName: "Francisco Aragón",
  storageKey: "genius365_fa_v1"
};

const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración", examples:"Documentos, resúmenes, comparación" },
    { id:"comm",   name:"Comunicación", examples:"Meetings, correo, Teams, traducción" },
    { id:"prod",   name:"Productividad", examples:"Búsquedas, análisis" },
    { id:"auto",   name:"Automatización", examples:"Agentes y Copilot Studio" }
  ],
  belts: [
    { id:"white",  name:"Cinturón Blanco",  color:"#e5e7eb" },
    { id:"yellow", name:"Cinturón Amarillo",color:"#fbbf24" },
    { id:"green",  name:"Cinturón Verde",   color:"#34d399" },
    { id:"black",  name:"Cinturón Negro (Champion)", color:"#111827" }
  ]
};

const defaultState = {
  userType: "", // "" | "licensed" | "free"
  me: { name:"", role:"", area:"collab", belt:"white" },
  evidence: {
    trainingDone:false,
    elearningDone:false,
    examPassed:false,
    usecase:{ idea:"", videoUrl:"", status:"draft" }
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
const subEl = document.getElementById("appSubtitle");
if(titleEl) titleEl.innerText = `Genius365 — ${APP.clientName}`;
if(subEl) subEl.innerText = `Cinturones (licensed) + Solicitud de licencia (Copilot Chat Free)`;

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
  if(!state.userType){
    return onboarding();
  }
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
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
  document.getElementById("btnLicensed").onclick = ()=>{
    state.userType = "licensed"; save(); render("home");
  };
  document.getElementById("btnFree").onclick = ()=>{
    state.userType = "free"; save(); render("license");
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

  const belt = beltObj(state.me.belt);
  const area = areaObj(state.me.area);

  app.innerHTML = `
    <div class="grid">
      <section class="card col8">
        <h2>Mi progreso</h2>

        <div class="badge">Área: <b>${escapeHtml(area.name)}</b></div>

        <div class="badge">
          Nivel:
          <span class="progress-level belt-${belt.id}">
            <span class="belt-dot"></span>
            <span class="belt-title">${escapeHtml(belt.name)}</span>
          </span>
        </div>

        <div class="progress"><div style="width:${progressPct()}%"></div></div>
        <p class="note">Siguiente paso: ${escapeHtml(nextStepText())}</p>

        <div class="actions">
          <button class="primary" id="goEvidence">Evidencias</button>
          <button class="secondary" id="goBelts">Cinturones</button>
        </div>
      </section>

      <section class="card col4">
        <h2>Mi perfil</h2>
        <label>Nombre</label>
        <input id="name" value="${escapeHtml(state.me.name)}" placeholder="Nombre Apellido"/>
        <label>Puesto</label>
        <input id="role" value="${escapeHtml(state.me.role)}" placeholder="Puesto"/>
        <label>Área</label>
        <select id="area">
          ${CONFIG.areas.map(a=>`<option value="${a.id}" ${a.id===state.me.area?"selected":""}>${a.name}</option>`).join("")}
        </select>
        <div class="actions">
          <button class="primary" id="saveMe">Guardar</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goBelts").onclick = ()=>render("belts");
  document.getElementById("saveMe").onclick = ()=>{
    state.me.name = document.getElementById("name").value.trim();
    state.me.role = document.getElementById("role").value.trim();
    state.me.area = document.getElementById("area").value;
    save(); render("home");
  };
}

function belts(){
  if(state.userType !== "licensed"){
    return messageOnly("Cinturones", "Solo para usuarios con licencia (licensed).");
  }

  app.innerHTML = `
    <div class="grid">
      <section class="card col12">

        <style>
          @keyframes pulse-white  { 0%,100%{opacity:.5} 50%{opacity:1} }
          @keyframes pulse-yellow { 0%,100%{opacity:.4} 50%{opacity:.9} }
          @keyframes pulse-green  { 0%,100%{opacity:.4} 50%{opacity:.9} }
          @keyframes pulse-black  { 0%,100%{opacity:.3} 50%{opacity:.7} }
          .dot-w { animation: pulse-white  1.8s ease-in-out infinite; }
          .dot-y { animation: pulse-yellow 2.1s ease-in-out infinite; }
          .dot-g { animation: pulse-green  2.4s ease-in-out infinite; }
          .dot-b { animation: pulse-black  2.8s ease-in-out infinite; }
          .belt-row-ft {
            display: grid;
            grid-template-columns: 56px 1fr;
            align-items: center;
            gap: 0 20px;
            padding: 18px 0;
            border-bottom: 0.5px solid rgba(0,0,0,0.1);
          }
          .belt-row-ft:last-child { border-bottom: none; }
          .belt-icon-ft {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          .belt-connector {
            width: 1px;
            height: 20px;
            background: rgba(0,0,0,0.15);
          }
          .belt-row-ft:last-child .belt-connector { display: none; }
          .belt-step-num {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.08em;
            color: #888;
            margin-bottom: 2px;
          }
          .belt-title-ft {
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 3px;
          }
          .belt-desc-ft {
            font-size: 13px;
            color: #666;
            margin-bottom: 0;
          }
          .belt-tag-ft {
            display: inline-block;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 999px;
            border: 0.5px solid;
            margin-top: 6px;
          }
          .belts-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 0.5px solid rgba(0,0,0,0.1);
          }
          .belts-header-label {
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #999;
            font-weight: 500;
          }
        </style>

        <div class="belts-header">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polygon points="9,1 11.5,6.5 17.5,7.2 13,11.5 14.3,17.5 9,14.5 3.7,17.5 5,11.5 0.5,7.2 6.5,6.5"
              fill="none" stroke="#aaa" stroke-width="0.8"/>
          </svg>
          <span class="belts-header-label">Ruta de certificación — Genius365</span>
        </div>

        <!-- BLANCO -->
        <div class="belt-row-ft">
          <div class="belt-icon-ft">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="none" stroke="#B4B2A9" stroke-width="1"/>
              <polygon points="22,10 33,16.5 33,27.5 22,34 11,27.5 11,16.5" fill="#F1EFE8" stroke="#B4B2A9" stroke-width="0.5"/>
              <circle cx="22" cy="22" r="4" fill="#B4B2A9" class="dot-w"/>
            </svg>
            <div class="belt-connector"></div>
          </div>
          <div>
            <div class="belt-step-num">NIVEL 01</div>
            <div class="belt-title-ft">Cinturón Blanco</div>
            <div class="belt-desc-ft">Punto de entrada. Asiste a una sesión formativa presencial para avanzar.</div>
            <span class="belt-tag-ft" style="color:#888780; border-color:#B4B2A9; background:#F1EFE8;">Asistencia QR</span>
          </div>
        </div>

        <!-- AMARILLO -->
        <div class="belt-row-ft">
          <div class="belt-icon-ft">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="none" stroke="#EF9F27" stroke-width="1"/>
              <polygon points="22,10 33,16.5 33,27.5 22,34 11,27.5 11,16.5" fill="#FAEEDA" stroke="#EF9F27" stroke-width="0.5"/>
              <circle cx="22" cy="22" r="4" fill="#EF9F27" class="dot-y"/>
            </svg>
            <div class="belt-connector"></div>
          </div>
          <div>
            <div class="belt-step-num">NIVEL 02</div>
            <div class="belt-title-ft">Cinturón Amarillo</div>
            <div class="belt-desc-ft">Formación registrada. Completa el e-learning y supera el examen para continuar.</div>
            <span class="belt-tag-ft" style="color:#854F0B; border-color:#EF9F27; background:#FAEEDA;">E-learning + examen</span>
          </div>
        </div>

        <!-- VERDE -->
        <div class="belt-row-ft">
          <div class="belt-icon-ft">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="none" stroke="#34d399" stroke-width="1"/>
              <polygon points="22,10 33,16.5 33,27.5 22,34 11,27.5 11,16.5" fill="#EAF3DE" stroke="#34d399" stroke-width="0.5"/>
              <circle cx="22" cy="22" r="4" fill="#34d399" class="dot-g"/>
            </svg>
            <div class="belt-connector"></div>
          </div>
          <div>
            <div class="belt-step-num">NIVEL 03</div>
            <div class="belt-title-ft">Cinturón Verde</div>
            <div class="belt-desc-ft">Envía un caso real documentado con idea y vídeo para revisión del equipo Genius365.</div>
            <span class="belt-tag-ft" style="color:#3B6D11; border-color:#34d399; background:#EAF3DE;">Caso real + vídeo</span>
          </div>
        </div>

        <!-- NEGRO -->
        <div class="belt-row-ft">
          <div class="belt-icon-ft">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="none" stroke="#444441" stroke-width="1"/>
              <polygon points="22,10 33,16.5 33,27.5 22,34 11,27.5 11,16.5" fill="#2C2C2A" stroke="#444441" stroke-width="0.5"/>
              <circle cx="22" cy="22" r="4" fill="#888780" class="dot-b"/>
            </svg>
          </div>
          <div>
            <div class="belt-step-num">NIVEL 04</div>
            <div class="belt-title-ft">Cinturón Negro <span style="color:#aaa; font-weight:400; font-size:13px;">— Champion</span></div>
            <div class="belt-desc-ft">Caso validado por Genius365. Eres referente interno y acompañas a otros en el recorrido.</div>
            <span class="belt-tag-ft" style="color:#D3D1C7; border-color:#444441; background:#2C2C2A;">Validación Genius365</span>
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

  const e = state.evidence;

  app.innerHTML = `
    <div class="grid">
      <section class="card col6">
        <h2>Amarillo (Formación)</h2>
        <p class="note">Blanco → Amarillo: confirma asistencia.</p>
        <div class="actions">
          <button class="primary" id="btnTraining" ${state.me.belt==="white" ? "" : "disabled"}>Confirmar asistencia</button>
        </div>
        <p class="note">Estado: ${e.trainingDone ? "✅ Registrado" : "⏳ Pendiente"}</p>
      </section>

      <section class="card col6">
        <h2>Verde (E-learning + Examen)</h2>
        <p class="note">Amarillo → Verde: e-learning + examen.</p>
        <label><input type="checkbox" id="elearn" ${e.elearningDone?"checked":""}/> E-learning completado</label>
        <label><input type="checkbox" id="exam" ${e.examPassed?"checked":""}/> Examen aprobado</label>
        <div class="actions">
          <button class="primary" id="btnGreen" ${state.me.belt==="yellow" ? "" : "disabled"}>Subir a Verde</button>
        </div>
      </section>

      <section class="card col12">
        <h2>Negro (Caso + validación Genius365)</h2>
        <p class="note">Solo desde Verde. Envía idea + vídeo y queda en revisión.</p>
        <label>Idea</label>
        <textarea id="idea">${escapeHtml(e.usecase.idea)}</textarea>
        <label>Link vídeo</label>
        <input id="video" value="${escapeHtml(e.usecase.videoUrl)}" placeholder="https://..."/>
        <div class="actions">
          <button class="secondary" id="btnSubmit" ${state.me.belt==="green" ? "" : "disabled"}>Enviar a revisión</button>
        </div>
        <p class="note">Estado del caso: <b>${escapeHtml(e.usecase.status)}</b></p>
      </section>
    </div>
  `;

  document.getElementById("btnTraining").onclick = ()=>{
    state.evidence.trainingDone = true;
    state.me.belt = "yellow";
    save(); render("evidence");
  };

  document.getElementById("btnGreen").onclick = ()=>{
    state.evidence.elearningDone = document.getElementById("elearn").checked;
    state.evidence.examPassed = document.getElementById("exam").checked;
    if(state.evidence.elearningDone && state.evidence.examPassed){
      state.me.belt = "green";
      save(); render("evidence");
    } else {
      alert("Marca e-learning + examen para pasar a Verde.");
    }
  };

  document.getElementById("btnSubmit").onclick = ()=>{
    const idea = document.getElementById("idea").value.trim();
    const videoUrl = document.getElementById("video").value.trim();
    if(!idea || !videoUrl) return alert("Completa idea + vídeo.");

    state.evidence.usecase.idea = idea;
    state.evidence.usecase.videoUrl = videoUrl;
    state.evidence.usecase.status = "submitted";

    state.caseInbox.unshift({
      id: makeId(),
      userName: state.me.name || "Usuario",
      area: state.me.area,
      idea, videoUrl,
      status: "submitted"
    });

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
    save(); alert("Solicitud enviada."); render("license");
  };
}

function admin(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Admin</h2>
        <p class="note">MVP local (pendiente de reactivar tablas con calma).</p>
        <p class="note">Casos enviados: <b>${state.caseInbox.length}</b> · Solicitudes: <b>${state.licenseRequests.length}</b></p>
      </section>
    </div>
  `;
}

// ---------- Helpers ----------
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

function areaObj(id){ return CONFIG.areas.find(a=>a.id===id) || CONFIG.areas[0]; }
function beltObj(id){ return CONFIG.belts.find(b=>b.id===id) || CONFIG.belts[0]; }

function progressPct(){
  const order = ["white","yellow","green","black"];
  const idx = order.indexOf(state.me.belt);
  return Math.max(0, Math.min(100, idx * 33));
}

function nextStepText(){
  if(state.me.belt==="white") return "Registrar asistencia (QR) para pasar a Amarillo.";
  if(state.me.belt==="yellow") return "Completar e-learning y examen para pasar a Verde.";
  if(state.me.belt==="green" && state.evidence.usecase.status!=="submitted") return "Enviar caso para revisión.";
  if(state.me.belt==="green" && state.evidence.usecase.status==="submitted") return "Esperar validación Genius365.";
  if(state.me.belt==="black") return "Compartir y acompañar a otros.";
  return "-";
}

function escapeHtml(str){
  return (str || "").toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function makeId(){
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
}
