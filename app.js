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
document.getElementById("appSubtitle").innerText = `Cinturones (licensed) · Copilot Chat (Free)`;

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
        <div class="badge">Nivel: <b style="color:${belt.color}">${belt.name}</b></div>
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
