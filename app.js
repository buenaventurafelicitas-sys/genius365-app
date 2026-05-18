// Genius365 - MVP estable (2 caminos + cinturones + licencia + admin)

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
  userType: "",
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

// Header
const titleEl = document.getElementById("appTitle");
const subEl = document.getElementById("appSubtitle");
if(titleEl) titleEl.innerText = `Genius365 — ${APP.clientName}`;
if(subEl) subEl.innerText = `Cinturones (licensed) + Solicitud de licencia (Copilot Chat Free)`;

// Routing
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

function onboarding(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Bienvenido/a 👋</h2>
        <p class="note">Elige tu situación para ver el recorrido correcto.</p>
        <div class="actions">
          <button class="primary" id="btnLicensed">Tengo licencia de M365 Copilot</button>
          <button class="secondary" id="btnFree">Uso Copilot Chat (Free)</button>
        </div>
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
          <button class="primary" id="goLicense">Solicitar licencia</button>
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

        <div class="badge">
          Nivel:
          <span class="progress-level belt-${belt.id}">
            <span class="belt-dot"></span>
            <span class="belt-title">${belt.name}</span>
          </span>
        </div>

        <div class="progress"><div style="width:${progressPct()}%"></div></div>
        <p class="note">Siguiente paso: ${nextStepText()}</p>

        <div class="actions">
          <button class="primary" id="goEvidence">Evidencias</button>
          <button class="secondary" id="goBelts">Cinturones</button>
        </div>
      </section>

      <section class="card col4">
        <h2>Mi perfil</h2>
        <input id="name" value="${state.me.name}" placeholder="Nombre"/>
        <input id="role" value="${state.me.role}" placeholder="Puesto"/>
        <select id="area">
          ${CONFIG.areas.map(a=>`<option value="${a.id}" ${a.id===state.me.area?"selected":""}>${a.name}</option>`).join("")}
        </select>
        <button class="primary" id="saveMe">Guardar</button>
      </section>
    </div>
  `;

  document.getElementById("goEvidence").onclick = ()=>render("evidence");
  document.getElementById("goBelts").onclick = ()=>render("belts");
  document.getElementById("saveMe").onclick = ()=>{
    state.me.name = document.getElementById("name").value;
    state.me.role = document.getElementById("role").value;
    state.me.area = document.getElementById("area").value;
    save(); render("home");
  };
}

function belts(){
  app.innerHTML = `<div class="card col12"><h2>Cinturones</h2></div>`;
}

function evidence(){
  app.innerHTML = `<div class="card col12"><h2>Evidencias</h2></div>`;
}

function license(){
  app.innerHTML = `<div class="card col12"><h2>Solicitud de licencia</h2></div>`;
}

function admin(){
  app.innerHTML = `<div class="card col12"><h2>Admin</h2></div>`;
}

function areaObj(id){ return CONFIG.areas.find(a=>a.id===id); }
function beltObj(id){ return CONFIG.belts.find(b=>b.id===id); }

function progressPct(){
  const order = ["white","yellow","green","black"];
  return order.indexOf(state.me.belt) * 33;
}

function nextStepText(){
  return "Completa tu siguiente paso";
}
