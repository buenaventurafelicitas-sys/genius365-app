alert("APP.JS SE ESTA EJECUTANDO");

/***********************
 * GENIUS365 — APP.JS
 * 2 caminos:
 *  - licensed: cinturones + evidencias + casos
 *  - free: solicitud de licencia (Copilot Chat Free)
 ************************/

const APP = {
  clientName: "Francisco Aragón",      // cámbialo si querés
  storageKey: "genius365_v2_fa"        // clave para localStorage
};

// ===== Config =====
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

// ===== Estado (memoria) =====
const defaultState = {
  userType: "", // "" | "licensed" | "free"

  me: { name:"", role:"", area:"collab", belt:"white" },

  // Evidencias para licensed
  evidence: {
    trainingDone: false,    // blanco -> amarillo
    elearningDone: false,   // amarillo -> verde
    examPassed: false,      // amarillo -> verde
    usecase: {              // verde -> negro (requiere aprobación)
      idea: "",
      videoUrl: "",
      status: "draft"       // draft | submitted | approved | rejected
    }
  },

  // Solicitudes de licencia (para users free)
  licenseRequests: [],      // [{id, name, role, why, tasks, impact, status}]

  // Bandeja Admin (MVP local)
  caseInbox: []             // [{id, userName, area, idea, videoUrl, status}]
};

function load(){
  try { return JSON.parse(localStorage.getItem(APP.storageKey)) ?? structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function save(s){ localStorage.setItem(APP.storageKey, JSON.stringify(s)); }

let state = load();

// ===== Helpers =====
const app = document.getElementById("app");

function beltObj(id){ return CONFIG.belts.find(b=>b.id===id); }
function areaObj(id){ return CONFIG.areas.find(a=>a.id===id); }

function beltIndex(id){
  return CONFIG.belts.findIndex(b=>b.id===id);
}

function progressPct(){
  const idx = beltIndex(state.me.belt);
  if(idx < 0) return 0;
  return Math.min(100, idx * 33);
}

function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

// ===== Router =====
document.querySelectorAll("[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=>render(btn.dataset.route));
});

document.getElementById("resetBtn").addEventListener("click", ()=>{
  localStorage.removeItem(APP.storageKey);
  state = structuredClone(defaultState);
  render("home");
});

// Título cliente
document.getElementById("appTitle").innerText = `Genius365 — ${APP.clientName}`;
document.getElementById("appSubtitle").innerText = `Adopción de M365 Copilot (cinturones) + Solicitud de licencia (Copilot Chat Free)`;

// Render inicial
render("home");

// ===== Render principal =====
function render(route){
  // Si no eligió tipo de usuario, mostramos onboarding SIEMPRE
  if(!state.userType){
    return onboarding();
  }

  // Mapa de pantallas
  const views = { home, belts, evidence, license, admin };
  (views[route] || home)();
}

// ===== Pantallas =====

function onboarding(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Bienvenido/a 👋</h2>
        <p class="note">Elige tu situación para mostrarte el recorrido correcto.</p>
        <div class="actions">
          <button class="primary" id="btnLicensed">Tengo licencia de M365 Copilot</button>
          <button class="secondary" id="btnFree">Uso Copilot Chat (Free) y quiero solicitar licencia</button>
        </div>
        <hr/>
        <p class="note">
          Tip: si alguna vez “no ves cambios”, pulsa <b>Reset</b> arriba para borrar la memoria de la app.
        </p>
      </section>
    </div>
  `;

  document.getElementById("btnLicensed").onclick = ()=>{
    state.userType = "licensed";
    save(state);
    render("home");
  };

  document.getElementById("btnFree").onclick = ()=>{
    state.userType = "free";
    save(state);
    render("license");
  };
}

function home(){
  // Si es FREE, lo mandamos a la pantalla de solicitud (no cinturones)
  if(state.userType === "free"){
    app.innerHTML = `
      <div class="grid">
        <section class="card col12">
          <h2>Copilot Chat (Free)</h2>
          <p class="note">Tu camino aquí es la <b>Solicitud de licencia</b>.</p>
          <div class="actions">
            <button class="primary" id="goLicense">Ir a Solicitar licencia</button>
          </div>
          <p class="note">Si más adelante te aprueban la licencia, podrás pasar al viaje de cinturones.</p>
        </section>
      </div>
    `;
    document.getElementById("goLicense").onclick = ()=>render("license");
    return;
  }

  // Licensed
  const belt = beltObj(state.me.belt);
  const area = areaObj(state.me.area);

  app.innerHTML = `
    <div class="grid">
      <section class="card col8">
        <h2>Mi progreso</h2>
        <div class="badge">Área: <b>${area?.name || "-"}</b></div>
        <div class="badge">Nivel: <b style="color:${belt.color}">${belt.name}</b></div>
        <div class="progress"><div style="width:${progressPct()}%"></div></div>
        <p class="note">Siguiente paso: ${nextStepText()}</p>
        <div class="actions">
          <button class="primary" id="goEvidence">Subir evidencias</button>
          <button class="secondary" id="goBelts">Ver cinturones</button>
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
    save(state);
    render("home");
  };
}

function belts(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Ruta de cinturones</h2>
        <p class="note">Blanco → Amarillo → Verde → Negro (Champion)</p>

        ${CONFIG.belts.map(b=>{
          const current = state.me.belt === b.id;
          return `
            <div class="card" style="margin-top:12px;">
              <div class="badge" style="border-color:${b.color};color:${b.color}">
                ${current ? "★ " : ""}${b.name}
              </div>
              <p class="note">${beltRequirements(b.id)}</p>
            </div>
          `;
        }).join("")}

      </section>
    </div>
  `;
}

function evidence(){
  if(state.userType !== "licensed"){
    app.innerHTML = `
      <div class="grid">
        <section class="card col12">
          <h2>Evidencias</h2>
          <p class="note">Esta sección es solo para usuarios con licencia (viaje de cinturones).</p>
        </section>
      </div>`;
    return;
  }

  const e = state.evidence;

  app.innerHTML = `
    <div class="grid">
      <section class="card col6">
        <h2>Amarillo (Formación)</h2>
        <p class="note">Para pasar de Blanco → Amarillo: registra que asististe a la formación.</p>
        <div class="actions">
          <button class="primary" id="btnTraining" ${state.me.belt==="white" ? "" : "disabled"}>
            Confirmar asistencia (Blanco → Amarillo)
          </button>
        </div>
        <p class="note">Estado: ${e.trainingDone ? "✅ Registrado" : "⏳ Pendiente"}</p>
      </section>

      <section class="card col6">
        <h2>Verde (E-learning + Examen)</h2>
        <p class="note">Para pasar de Amarillo → Verde: completa e-learning y aprueba examen.</p>

        <label><input type="checkbox" id="elearn" ${e.elearningDone?"checked":""}/> He completado el e-learning</label>
        <label><input type="checkbox" id="exam" ${e.examPassed?"checked":""}/> He aprobado el examen</label>

        <div class="actions">
          <button class="primary" id="btnGreen" ${state.me.belt==="yellow" ? "" : "disabled"}>
            Validar y subir a Verde
          </button>
        </div>
      </section>

      <section class="card col12">
        <h2>Negro (Caso real + validación Genius365)</h2>
        <p class="note">Solo desde Verde. Envía tu caso y quedará “Pendiente de revisión”.</p>

        <label>Idea del caso de uso</label>
        <textarea id="idea">${escapeHtml(e.usecase.idea)}</textarea>

        <label>Link del vídeo</label>
        <input id="video" value="${escapeHtml(e.usecase.videoUrl)}" placeholder="https://..."/>

        <div class="actions">
          <button class="secondary" id="btnSubmitCase" ${state.me.belt==="green" ? "" : "disabled"}>
            Enviar para revisión
          </button>
        </div>

        <p class="note">Estado del caso: <b>${e.usecase.status}</b></p>
      </section>
    </div>
  `;

  // Blanco -> Amarillo
  document.getElementById("btnTraining").onclick = ()=>{
    state.evidence.trainingDone = true;
    state.me.belt = "yellow";
    save(state);
    render("evidence");
  };

  // Amarillo -> Verde
  document.getElementById("btnGreen").onclick = ()=>{
    state.evidence.elearningDone = document.getElementById("elearn").checked;
    state.evidence.examPassed = document.getElementById("exam").checked;

    if(state.evidence.elearningDone && state.evidence.examPassed){
      state.me.belt = "green";
      save(state);
      render("evidence");
    } else {
      alert("Necesitas marcar e-learning + examen para pasar a Verde.");
    }
  };

  // Verde -> Negro (enviar caso)
  document.getElementById("btnSubmitCase").onclick = ()=>{
    state.evidence.usecase.idea = document.getElementById("idea").value.trim();
    state.evidence.usecase.videoUrl = document.getElementById("video").value.trim();

    if(!state.evidence.usecase.idea || !state.evidence.usecase.videoUrl){
      alert("Completa idea + link del vídeo antes de enviar.");
      return;
    }

    state.evidence.usecase.status = "submitted";

    // Lo mandamos a bandeja (Admin)
    state.caseInbox.unshift({
      id: crypto.randomUUID(),
      userName: state.me.name || "Usuario",
      area: state.me.area,
      idea: state.evidence.usecase.idea,
      videoUrl: state.evidence.usecase.videoUrl,
      status: "submitted"
    });

    save(state);
    alert("Caso enviado. Queda pendiente de revisión Genius365.");
    render("evidence");
  };
}

function license(){
  // Solo para FREE
  if(state.userType !== "free"){
    app.innerHTML = `
      <div class="grid">
        <section class="card col12">
          <h2>Solicitud de licencia</h2>
          <p class="note">Esta sección es para usuarios que actualmente usan Copilot Chat (Free).</p>
        </section>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Solicitar licencia de M365 Copilot</h2>
        <p class="note">
          Estás usando Copilot Chat (Free). Para solicitar una licencia completa, explica el porqué.
        </p>

        <label>Nombre</label>
        <input id="n" placeholder="Nombre Apellido"/>

        <label>Puesto</label>
        <input id="r" placeholder="Puesto"/>

        <label>¿Por qué necesitas la licencia? (justificación)</label>
        <textarea id="why"></textarea>

        <label>¿Qué tareas mejorarías?</label>
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
      id: crypto.randomUUID(),
      name: document.getElementById("n").value.trim(),
      role: document.getElementById("r").value.trim(),
      why: document.getElementById("why").value.trim(),
      tasks: document.getElementById("tasks").value.trim(),
      impact: document.getElementById("impact").value,
      status: "pending"
    };

    if(!req.name || !req.role || !req.why){
      alert("Completa al menos Nombre, Puesto y Justificación.");
      return;
    }

    state.licenseRequests.unshift(req);
    save(state);
    alert("Solicitud enviada. El equipo Genius365 la revisará.");
    render("license");
  };
}

function admin(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Admin (Genius365)</h2>
        <p class="note">MVP local: aprueba/rechaza casos y revisa solicitudes.</p>

        <h3>Casos (para Cinturón Negro)</h3>
        ${renderCasesTable()}

        <hr/>

        <h3>Solicitudes de licencia (Copilot Chat Free)</h3>
        ${renderLicenseTable()}
      </section>
    </div>
  `;

  // Botones casos
  document.querySelectorAll("[data-case-approve]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-case-approve");
      const c = state.caseInbox.find(x=>x.id===id);
      if(c){
        c.status = "approved";
        // MVP: si el caso aprobado es del "usuario actual", subimos cinturón
        if((state.me.name || "Usuario") === c.userName){
          state.evidence.usecase.status = "approved";
          state.me.belt = "black";
        }
        save(state);
        render("admin");
      }
    };
  });

  document.querySelectorAll("[data-case-reject]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-case-reject");
      const c = state.caseInbox.find(x=>x.id===id);
      if(c){
        c.status = "rejected";
        if((state.me.name || "Usuario") === c.userName){
          state.evidence.usecase.status = "rejected";
        }
        save(state);
        render("admin");
      }
    };
  });

  // Botones licencias
  document.querySelectorAll("[data-lic-approve]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-lic-approve");
      const r = state.licenseRequests.find(x=>x.id===id);
      if(r){ r.status = "approved"; save(state); render("admin"); }
    };
  });

  document.querySelectorAll("[data-lic-reject]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-lic-reject");
      const r = state.licenseRequests.find(x=>x.id===id);
      if(r){ r.status = "rejected"; save(state); render("admin"); }
    };
  });
}

// ===== UI helpers =====
function renderCasesTable(){
  if(state.caseInbox.length === 0){
    return `<p class="note">No hay casos enviados todavía.</p>`;
  }
  const rows = state.caseInbox.map(c=>`
    <tr>
      <td>${escapeHtml(c.userName)}</td>
      <td>${escapeHtml(areaObj(c.area)?.name || c.area)}</td>
      <td>${escapeHtml(c.status)}</td>
      <td>
        <a href="${escapeHtml(c.videoUrl)}" target="_blank">Ver vídeo</a>
      </td>
      <td>
        <button class="secondary" data-case-reject="${c.id}">Reject</button>
        <button class="primary" data-case-approve="${c.id}">Approve</button>
      </td>
    </tr>
  `).join("");

  return `
    <table>
      <thead><tr><th>Usuario</th><th>Área</th><th>Estado</th><th>Vídeo</th><th>Acciones</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderLicenseTable(){
  if(state.licenseRequests.length === 0){
    return `<p class="note">No hay solicitudes todavía.</p>`;
  }

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

  return `
    <table>
      <thead><tr><th>Solicitante</th><th>Puesto</th><th>Impacto</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function beltRequirements(id){
  if(id==="white") return "Inicio. Completa perfil y asiste a formación para avanzar.";
  if(id==="yellow") return "Requisito: formación registrada.";
  if(id==="green") return "Requisito: e-learning completado + examen aprobado.";
  if(id==="black") return "Requisito: caso real + vídeo + aprobación Genius365.";
  return "";
}

function nextStepText(){
  const b = state.me.belt;
  const u = state.evidence.usecase.status;

  if(b==="white") return "Asiste a la formación y confirma asistencia para obtener Amarillo.";
  if(b==="yellow") return "Completa e-learning y examen para obtener Verde.";
  if(b==="green" && u!=="submitted") return "Envía un caso real (idea + vídeo) para revisión Genius365.";
  if(b==="green" && u==="submitted") return "Tu caso está pendiente de revisión Genius365.";
  if(b==="black") return "¡Ya eres Champion! Comparte y acompaña a otros usuarios.";
  return "";
}
// ===== FIXES MINIMOS PARA QUE LA APP NO SE ROMPA =====

function escapeHtml(str){
  return (str || "").toString();
}

function nextStepText(){
  if(state.me.belt === "white") return "Asiste a una formación para avanzar a Amarillo.";
  if(state.me.belt === "yellow") return "Completa el e-learning y el examen.";
  if(state.me.belt === "green") return "Entrega un caso real para validación.";
  return "¡Ya eres Champion!";
}

function questsForArea(area){
  if(area === "collab") return ["Crear documento", "Compartir carpeta", "Resumen con Copilot"];
  if(area === "comm") return ["Resumen de reunión", "Correo con Copilot"];
  if(area === "prod") return ["Buscar insights", "Analizar datos"];
  if(area === "auto") return ["Agent demo", "Automatizar proceso"];
  return [];
}

function renderBeltCard(b){
  return `
    <div class="card" style="margin-top:10px;">
      <div class="badge" style="color:${b.color}">
        ${b.name}
      </div>
      <p class="note">${(b.req || []).join(" · ")}</p>
    </div>
  `;
}
``
