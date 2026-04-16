const STORAGE_KEY = "genius365-stable-v1";

const defaultState = {
  userType:"",
  me:{ name:"", role:"" }
};

let state = load();
const app = document.getElementById("app");

document.querySelectorAll("[data-route]").forEach(b=>{
  b.onclick = ()=>render(b.dataset.route);
});

document.getElementById("resetBtn").onclick = ()=>{
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  render("home");
};

render("home");

function render(route){
  if(!state.userType){
    onboarding();
    return;
  }
  if(route==="belts") belts();
  else if(route==="evidence") evidence();
  else home();
}

function onboarding(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Bienvenido/a 👋</h2>
        <p class="note">Selecciona cómo usas Copilot.</p>
        <div class="actions">
          <button class="primary" id="licensed">Tengo Copilot con licencia</button>
          <button class="secondary" id="free">Uso Copilot Chat (Free)</button>
        </div>
      </section>
    </div>
  `;
  document.getElementById("licensed").onclick = ()=>{
    state.userType="licensed"; save(); render("home");
  };
  document.getElementById("free").onclick = ()=>{
    state.userType="free"; save(); license();
  };
}

function home(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col8">
        <h2>Mi progreso</h2>
        <p class="note">Demo de recorrido Genius365.</p>
      </section>

      <section class="card col4">
        <h2>Mi perfil</h2>
        <label>Nombre</label>
        <input id="name" value="${state.me.name}" />
        <label>Puesto</label>
        <input id="role" value="${state.me.role}" />
        <div class="actions">
          <button class="primary" id="save">Guardar</button>
        </div>
      </section>
    </div>
  `;
  document.getElementById("save").onclick = ()=>{
    state.me.name=document.getElementById("name").value;
    state.me.role=document.getElementById("role").value;
    save();
    alert("Perfil guardado");
  };
}

function belts(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Cinturones</h2>
        <p class="note">Blanco → Amarillo → Verde → Negro</p>
      </section>
    </div>
  `;
}

function evidence(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Evidencias</h2>
        <p class="note">Aquí irían las evidencias del usuario.</p>
      </section>
    </div>
  `;
}

function license(){
  app.innerHTML = `
    <div class="grid">
      <section class="card col12">
        <h2>Solicitud de licencia</h2>
        <p class="note">Formulario de petición para usuarios Free.</p>
      </section>
    </div>
  `;
}

function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function load(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultState); }
  catch{ return structuredClone(defaultState); }
}
