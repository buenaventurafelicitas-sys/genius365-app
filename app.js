// Genius365 - MVP estable (2 caminos + cinturones + licencia + admin)
const APP = {
  clientName: "Francisco Aragón",
  storageKey: "genius365_fa_v1"
};

const CONFIG = {
  areas: [
    { id:"collab", name:"Colaboración" },
    { id:"comm",   name:"Comunicación" },
    { id:"prod",   name:"Productividad" },
    { id:"auto",   name:"Automatización" }
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
    usecase:{ idea:"", videoUrl:"", status:"draft" } // draft|submitted|approved|rejected
  },
  licenseRequests: [], // [{id,name,role,why,tasks,impact,status}]
  caseInbox: []        // [{id,userName,area,idea,videoUrl,status}]
};

function load(){
  try { return JSON.parse(localStorage.getItem(APP.storageKey)) ?? structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(APP.storageKey, JSON.stringify(state)); }

let state = load();

const app = document.getElementById("app");

// Header titles
document.getElementById("appTitle").innerText = `Genius365 — ${APP.clientName}`;
document.getElementById("appSubtitle").innerText = `Cinturones (licensed) + Solicitud de licencia (Copilot Chat (Free))`;

// Nav routing
document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

// Reset
document.getElementById("resetBtn").addEventListener("click", ()=>{
  localStorage.removeItem(APP.storageKey);
  state = structuredClone(defaultState);
  render("home");
});

// Start
render("home");

function render(route){
  if(!state.userType){
    return onboarding();
  }
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}

/* =========================
   ✅ NUEVO: helper para cinturones
   ========================= */
function beltLabelHtml(beltId, beltName){
  // genera: <span class="belt-label belt-white">Cinturón Blanco</span>
  return `<span class="belt-label belt-${beltId}">${escapeHtml(beltName)}</span>`;
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
          <div class="actions"><button class="primary" id="goLicense">Ir a Solicitar licencia</button></div>
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
        <div class="badge">Área: <b>${area.name}</b></div>
        <div class="badge">Nivel: ${beltLabelHtml(belt.id, belt.name)}</div>
        <div class="progress"><div style="width:${progressPct()}%"></div></div>
        <p class="note">Siguiente paso: ${nextStepText()}</p>
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
        <h2>Ruta de cinturones</h2>
        ${CONFIG.belts.map(b=>`
          <div class="card" style="margin-top:12px;">
            <div class="badge belt-badge">
              ${beltLabelHtml(b.id, b.name)}
            </div>
            <p class="note">${beltRequirements(b.id)}</p>
          </div>
        `).join("")}
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
        <p class="note">Estado del caso: <b>${e.usecase.status}</b></p>
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
        <h2>Admin (Genius365)</h2>
        <p class="note">MVP local: aprobar/rechazar casos y solicitudes.</p>

        <h3>Casos (cinturón negro)</h3>
        ${renderCasesTable()}

        <hr/>

        <h3>Solicitudes de licencia (Free)</h3>
        ${renderLicenseTable()}
      </section>
    </div>
  `;

  document.querySelectorAll("[data-case-approve]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-case-approve");
      const c = state.caseInbox.find(x=>x.id===id);
      if(!c) return;
      c.status = "approved";
      if((state.me.name || "Usuario") === c.userName){
        state.evidence.usecase.status = "approved";
        state.me.belt = "black";
      }
      save(); render("admin");
    };
  });

  document.querySelectorAll("[data-case-reject]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-case-reject");
      const c = state.caseInbox.find(x=>x.id===id);
      if(!c) return;
      c.status = "rejected";
      if((state.me.name || "Usuario") === c.userName){
        state.evidence.usecase.status = "rejected";
      }
      save(); render("admin");
    };
  });

  document.querySelectorAll("[data-lic-approve]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-lic-approve");
      const r = state.licenseRequests.find(x=>x.id===id);
      if(!r) return;
      r.status = "approved";
      save(); render("admin");
    };
  });

  document.querySelectorAll("[data-lic-reject]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-lic-reject");
      const r = state.licenseRequests.find(x=>x.id===id);
      if(!r) return;
      r.status = "rejected";
      save(); render("admin");
    };
  });
}

// ---------- Helpers ----------
function messageOnly(title, text){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>${title}</h2>
        <p class="note">${text}</p>
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

function beltRequirements(id){
  if(id==="white") return "Inicio. Asiste a una formación para pasar a Amarillo.";
  if(id==="yellow") return "Formación registrada. Completa e-learning + examen para Verde.";
  if(id==="green") return "Envía un caso real (idea + vídeo) para revisión Genius365.";
  if(id==="black") return "Caso aprobado. Eres Champion.";
  return "";
}

function nextStepText(){
  if(state.me.belt==="white") return "Confirmar asistencia a formación.";
  if(state.me.belt==="yellow") return "Completar e-learning y examen.";
  if(state.me.belt==="green" && state.evidence.usecase.status!=="submitted") return "Enviar caso para revisión.";
  if(state.me.belt==="green" && state.evidence.usecase.status==="submitted") return "Esperar validación Genius365.";
  if(state.me.belt==="black") return "Compartir y acompañar a otros.";
  return "";
}

function escapeHtml(str){
  return (str || "").toString()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function makeId(){
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
}

function renderCasesTable(){
  if(state.caseInbox.length===0) return `<p class="note">No hay casos enviados todavía.</p>`;
  const rows = state.caseInbox.map(c=>`
    <tr>
      <td>${escapeHtml(c.userName)}</td>
      <td>${escapeHtml(areaObj(c.area).name)}</td>
      <td>${escapeHtml(c.status)}</td>
      <td><a href="${escapeHtml(c.videoUrl)}" target="_blank">Ver vídeo</a></td>
      <td>
        <button class="secondary" data-case-reject="${c.id}">Reject</button>
        <button class="primary" data-case-approve="${c.id}">Approve</button>
      </td>
    </tr>
  `).join("");
  return `<table><thead><tr><th>Usuario</th><th>Área</th><th>Estado</th><th>Vídeo</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderLicenseTable(){
  if(state.licenseRequests.length===0) return `<p class="note">No hay solicitudes todavía.</p>`;
  const rows = state.licenseRequests.map(r=>`
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.role)}</td>
      <td>${escapeHtml(r.impact || "-")}</td>
      <td>${escapeHtml(r.status)}</td>
      <td>
        <button class="secondary" data-lic-reject="${r.id}">Reject</button>
        <button class="primary" data-lic-approve="${r.id}">Approve</button>
      </td>
    </tr>
  `).join("");
  return `<table><thead><tr><th>Solicitante</th><th>Puesto</th><th>Impacto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
}
