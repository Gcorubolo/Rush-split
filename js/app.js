async function checkAuth() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        showLogin();
        return;
    }

    console.log('Usuario autenticado:', session.user.id);

    render();
}


let data=loadData(); let currentView='home'; let currentGatheringId=null;
const app=document.getElementById('app');
const personName=id=>data.group.people.find(p=>p.id===id)?.name||'Persona';
const emojiFor=type=>({food:'🥩',pizza:'🍕',drinks:'🍺',wine:'🍷',dessert:'🍰',snacks:'🍿',transport:'🚕',home:'🏠',ticket:'🎟️',gift:'🎁',supermarket:'🛒',other:'✨'}[type]||'✨');
const fmtDate=d=>new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
function setView(v){currentView=v;currentGatheringId=null;render()}

document.addEventListener('click',e=>{const btn=e.target.closest('.nav-item');if(btn){e.preventDefault();setView(btn.dataset.view)}});
function render(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView)); if(currentView==='home')renderHome();else if(currentView==='history')renderHistory();else renderPeople()}
function shell(content){app.innerHTML=`<div class="content">${content}</div>`}
function renderHome(){const pending=data.gatherings.filter(g=>g.status!=='settled').length;const settled=data.gatherings.length-pending;shell(`<section class="hero"><div class="eyebrow">Tu grupo, tus cuentas, cero quilombo.</div><h1>🥩 RUSH SPLIT</h1><p>Dividí. Saldá. Listo.</p></section><div class="card group-card"><div><div class="group-title">🍻 ${data.group.name}</div><div class="muted">${data.group.people.length} integrantes</div><div class="stats"><span class="pill yellow">🟡 ${pending} pendientes</span><span class="pill green">🟢 ${settled} saldadas</span></div></div><div style="font-size:42px">💸</div></div><button class="big-btn" onclick="newGathering()">＋ NUEVA JUNTADA</button><div class="section-title"><h2>Últimas juntadas</h2><button class="back" onclick="setView('history')">Ver todas →</button></div><div class="card">${recentHistory()}</div>`)}
function recentHistory(){if(!data.gatherings.length)return '<div class="empty">Todavía no hay juntadas.<br>La primera está a un botón. 🍻</div>';return data.gatherings.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(historyRow).join('')}
function historyRow(g){const cats=[...new Set(g.expenses.map(e=>emojiFor(e.type)))].join('');return `<div class="history-item" onclick="openGathering('${g.id}')"><div class="history-emoji">${g.emoji||'🍻'}</div><div class="history-main"><strong>${escapeHtml(g.name)}</strong><small>📅 ${fmtDate(g.date)} · 👥 ${g.participants.length} · ${cats||'✨'}</small></div><div class="history-side"><div class="amount">${formatMoney(g.expenses.reduce((s,e)=>s+e.amount,0))}</div><div class="status ${g.status==='settled'?'green':'yellow'}">${g.status==='settled'?'🟢 SALDADA':'🟡 PENDIENTE'}</div></div></div>`}
function renderHistory(){shell(`<section class="hero"><div class="eyebrow">Todo queda guardado.</div><h1>📜 Historial</h1><p>Juntadas, comidas y cuentas. Sin perder nada.</p></section><div class="card">${data.gatherings.length?data.gatherings.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(historyRow).join(''):'<div class="empty">Todavía no hay historial.</div>'}</div>`)}
function renderPeople(){shell(`<section class="hero"><div class="eyebrow">Personas guardadas en el grupo.</div><h1>👥 RUSH</h1><p>Después elegís quién participa en cada juntada.</p></section><div class="card"><div class="form"><div class="field"><label>Agregar integrante</label><input id="newPerson" placeholder="Ej: Fede" onkeydown="if(event.key==='Enter')addPerson()"/><button class="btn" onclick="addPerson()">＋ Agregar</button></div></div><div style="margin-top:18px">${data.group.people.map(p=>`<div class="expense-row"><div class="history-emoji">👤</div><div class="grow"><strong>${escapeHtml(p.name)}</strong></div><button class="btn danger" onclick="removePerson('${p.id}')">Eliminar</button></div>`).join('')||'<div class="empty">Agregá a la banda. 🍻</div>'}</div></div><button class="big-btn" onclick="setView('home')">🏠 LISTO — IR AL INICIO</button>`)}
function addPerson(){const input=document.getElementById('newPerson');const name=input?.value.trim();if(!name)return;data.group.people.push({id:uid('p'),name});saveData(data);renderPeople()}
function removePerson(id){if(data.gatherings.some(g=>g.participants.includes(id))){alert('No se puede eliminar porque participa en una juntada guardada.');return}data.group.people=data.group.people.filter(p=>p.id!==id);saveData(data);renderPeople()}
function newGathering(){if(data.group.people.length<2){alert('Primero agregá al menos 2 integrantes al grupo.');setView('people');return}app.innerHTML=`<div class="content"><button class="back" onclick="setView('home')">← Volver</button><section class="hero"><div class="eyebrow">Nueva juntada</div><h1>🍻 Armemos la cuenta</h1><p>Después RUSH SPLIT se ocupa del resto.</p></section><div class="card"><div class="form"><div class="field"><label>Nombre</label><input id="gName" placeholder="Ej: Asado en casa de Gino"/></div><div class="field"><label>Fecha</label><input id="gDate" type="date" value="${new Date().toISOString().slice(0,10)}"/></div><div class="field"><label>¿Quiénes participaron?</label><div class="people-grid" id="gPeople">${data.group.people.map(p=>`<button class="person-chip" data-id="${p.id}" onclick="toggleChip(this)">👤 ${escapeHtml(p.name)}</button>`).join('')}</div></div><button class="big-btn" onclick="createGathering()">CONTINUAR →</button></div></div></div>`}
function toggleChip(el){el.classList.toggle('selected')}
function createGathering(){const name=document.getElementById('gName').value.trim()||'Juntada RUSH';const date=document.getElementById('gDate').value;const participants=[...document.querySelectorAll('#gPeople .selected')].map(x=>x.dataset.id);if(participants.length<2){alert('Elegí al menos 2 participantes.');return}const g={id:uid('g'),name,date,participants,expenses:[],status:'pending',emoji:'🍻'};data.gatherings.push(g);saveData(data);openGathering(g.id)}
function openGathering(id){currentGatheringId=id;renderGathering()}
function renderGathering(){const g=data.gatherings.find(x=>x.id===currentGatheringId);if(!g)return;const total=g.expenses.reduce((s,e)=>s+e.amount,0);app.innerHTML=`<div class="content"><button class="back" onclick="setView('home')">← Volver</button><section class="hero"><div class="eyebrow">${fmtDate(g.date)} · 👥 ${g.participants.length}</div><h1>${g.emoji} ${escapeHtml(g.name)}</h1><p>${g.expenses.length?g.expenses.map(e=>emojiFor(e.type)).join(''):'Todavía no cargaste gastos.'}</p></section><div class="card"><div class="eyebrow">TOTAL</div><div style="font-size:36px;font-weight:900;margin:6px 0 14px">${formatMoney(total)}</div><button class="big-btn" onclick="addExpense()">＋ AGREGAR GASTO</button></div><div class="card">${g.expenses.length?g.expenses.map(e=>`<div class="expense-row"><div class="history-emoji">${emojiFor(e.type)}</div><div class="grow"><strong>${escapeHtml(e.name)}</strong><small class="muted">Pagó ${escapeHtml(personName(e.payer))} · ${e.participants.length} personas</small></div><strong>${formatMoney(e.amount)}</strong></div>`).join(''):'<div class="empty">Cargá carne, bebida, postre... lo que haya. 😎</div>'}</div>${g.expenses.length?`<button class="big-btn" onclick="showResult()">🧮 CALCULAR QUIÉN LE PAGA A QUIÉN</button>`:''}</div>`}
function addExpense(){const g=data.gatherings.find(x=>x.id===currentGatheringId);app.innerHTML=`<div class="content"><button class="back" onclick="renderGathering()">← Volver a la juntada</button><section class="hero"><div class="eyebrow">Nuevo gasto</div><h1>💸 ¿Qué pagaste?</h1><p>Vos cargás los datos. RUSH SPLIT hace las cuentas.</p></section><div class="card"><div class="form"><div class="field"><label>Concepto</label><input id="eName" placeholder="Ej: Carne"/></div><div class="field"><label>Categoría</label><select id="eType"><option value="food">🥩 Comida</option><option value="drinks">🍺 Bebidas</option><option value="wine">🍷 Vino</option><option value="dessert">🍰 Postre</option><option value="snacks">🍿 Picada</option><option value="pizza">🍕 Pizza</option><option value="other">✨ Otro</option></select></div><div class="field"><label>Monto</label><input id="eAmount" inputmode="decimal" placeholder="$ 80.000"/></div><div class="field"><label>¿Quién pagó?</label><select id="ePayer">${g.participants.map(p=>`<option value="${p}">${escapeHtml(personName(p))}</option>`).join('')}</select></div><div class="field"><label>¿Quiénes participan?</label><div class="people-grid" id="ePeople">${g.participants.map(p=>`<button class="person-chip selected" data-id="${p}" onclick="toggleChip(this)">👤 ${escapeHtml(personName(p))}</button>`).join('')}</div></div><div class="field"><label>¿Cómo dividir?</label><div class="split-grid"><button class="split-option active" data-method="equal" onclick="chooseMethod(this)">⚡ Automático</button><button class="split-option" data-method="percent" onclick="chooseMethod(this)">📊 %</button><button class="split-option" data-method="amount" onclick="chooseMethod(this)">💵 Monto</button></div></div><div id="customValues"></div><button class="big-btn" onclick="saveExpense()">AGREGAR GASTO</button></div></div></div>`}
function chooseMethod(el){document.querySelectorAll('.split-option').forEach(x=>x.classList.remove('active'));el.classList.add('active');document.getElementById('customValues').innerHTML='';if(el.dataset.method!=='equal'){const g=data.gatherings.find(x=>x.id===currentGatheringId);document.getElementById('customValues').innerHTML=`<div class="field"><label>Valores por persona (${el.dataset.method==='percent'?'%':'$'})</label>${g.participants.map(p=>`<div style="display:flex;gap:8px;margin:6px 0;align-items:center"><span style="flex:1">${escapeHtml(personName(p))}</span><input class="custom-value" data-person="${p}" inputmode="decimal" placeholder="0"/></div>`).join('')}</div>`}}
function parseMoney(v){
  const raw=String(v??'').trim().replace(/\$/g,'').replace(/\s/g,'');
  if(!raw)return 0;
  // Accept Argentine-style 80.000,50 as well as 80000.50 / 80000.
  let normalized=raw;
  if(normalized.includes(',') && normalized.includes('.')) normalized=normalized.replace(/\./g,'').replace(',','.');
  else if(normalized.includes(',')) normalized=normalized.replace(',','.');
  const n=Number(normalized.replace(/[^0-9.-]/g,''));
  return Number.isFinite(n)?Math.round(n*100):0;
}
function saveExpense(){const g=data.gatherings.find(x=>x.id===currentGatheringId);const name=document.getElementById('eName').value.trim()||'Gasto';const amount=parseMoney(document.getElementById('eAmount').value);const payer=document.getElementById('ePayer').value;const participants=[...document.querySelectorAll('#ePeople .selected')].map(x=>x.dataset.id);const method=document.querySelector('.split-option.active').dataset.method;if(!amount||participants.length<1){alert('Completá monto y participantes.');return}const values={};document.querySelectorAll('.custom-value').forEach(x=>values[x.dataset.person]=method==='percent'?Number(x.value||0):parseMoney(x.value));if(method==='percent'){const total=participants.reduce((s,p)=>s+(values[p]||0),0);if(Math.abs(total-100)>0.01){alert('Los porcentajes deben sumar 100%.');return}}if(method==='amount'){const total=participants.reduce((s,p)=>s+(values[p]||0),0);if(total!==amount){alert(`Los montos deben sumar ${formatMoney(amount)}.`);return}}g.expenses.push({id:uid('e'),name,type:document.getElementById('eType').value,amount,payer,participants,method,values});saveData(data);renderGathering()}
function showResult(){const g=data.gatherings.find(x=>x.id===currentGatheringId);const balances=calculateBalances(g);const transfers=simplifyTransfers(balances);const total=g.expenses.reduce((s,e)=>s+e.amount,0);g.lastTransfers=transfers;g.status=transfers.length?'pending':'settled';saveData(data);app.innerHTML=`<div class="content"><button class="back" onclick="renderGathering()">← Volver</button><section class="hero"><div class="eyebrow">🧮 RUSH SPLIT hizo las cuentas</div><h1>💸 ¿Quién le paga a quién?</h1><p>${formatMoney(total)} · ${transfers.length} ${transfers.length===1?'pago':'pagos'} para saldar.</p></section><div class="card result-box">${transfers.length?transfers.map(t=>`<div class="transfer"><strong>🔴 ${escapeHtml(personName(t.from))} → 🟢 ${escapeHtml(personName(t.to))}</strong><span>${formatMoney(t.amount)}</span></div>`).join(''):'<div class="success" style="font-weight:800">🟢 Todo saldado.</div>'}</div><button class="big-btn whatsapp" onclick="shareWhatsApp()">📲 COMPARTIR EN WHATSAPP</button><div class="section-title"><h2>Estado</h2></div><div class="card">${Object.entries(balances).map(([id,v])=>`<div class="expense-row"><div class="grow"><strong>${escapeHtml(personName(id))}</strong></div><span class="${v>0?'success':v<0?'danger':''}">${v>0?'Recibe ':v<0?'Paga ':'Está saldado '} ${v?formatMoney(Math.abs(v)):''}</span></div>`).join('')}</div></div>`}
function shareWhatsApp(){const g=data.gatherings.find(x=>x.id===currentGatheringId);const transfers=g.lastTransfers||simplifyTransfers(calculateBalances(g));const total=g.expenses.reduce((s,e)=>s+e.amount,0);const cats=[...new Set(g.expenses.map(e=>emojiFor(e.type)))].join('');let text=`🥩 RUSH SPLIT — ${g.name}\n\n💰 Total: ${formatMoney(total)}\n${cats}\n\n💸 Para saldar:\n\n`;text+=transfers.length?transfers.map(t=>`${personName(t.from)} → ${personName(t.to)}: ${formatMoney(t.amount)}`).join('\n'):'🟢 Todo saldado';text+='\n\n🟢 Con estos pagos queda todo saldado.\n\n🥩 RUSH SPLIT';window.location.href='https://wa.me/?text='+encodeURIComponent(text)}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
checkAuth();

// Persistencia adicional: si el navegador soporta service workers, dejamos preparada la PWA.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

function showLogin() {
    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:24px;
        ">
            <div style="
                width:100%;
                max-width:400px;
                padding:30px;
                border-radius:20px;
                background:#1c1c1c;
            ">
                <h1>🏃 RUSH SPLIT</h1>

                <p>Iniciá sesión para continuar</p>

                <input
                    id="loginEmail"
                    type="email"
                    placeholder="Email"
                    style="width:100%;margin-bottom:12px;padding:12px;"
                >

                <input
                    id="loginPassword"
                    type="password"
                    placeholder="Contraseña"
                    style="width:100%;margin-bottom:12px;padding:12px;"
                >

                <button
                    onclick="login()"
                    style="width:100%;padding:14px;"
                >
                    INGRESAR
                </button>

                <p id="loginError" style="color:#ff6b6b;"></p>
            </div>
        </div>
    `;
}


async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        document.getElementById('loginError').textContent =
            error.message;
        return;
    }

    location.reload();
}
