async function checkAuth() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        showLogin();
        return;
    }

    console.log('Usuario autenticado:', session.user.id);

    try {
        const profile = await getProfile(session.user.id);
        console.log('Perfil cargado:', profile);

        const groups = await getGroups();
        console.log('Grupos cargados:', groups);

        const groupMembers = [];

    console.log('Miembros cargados:', groupMembers);
    
    window.supabaseData = {
        user: session.user,
        profile,
        groups,
        groupMembers
    };

        render();

    } catch (error) {
        console.error('Error inicializando RUSH SPLIT:', error);
    }
}


let data=loadData(); let currentView='home'; let currentGatheringId=null;
const app=document.getElementById('app');
const personName=id=>data.group.people.find(p=>p.id===id)?.name||'Persona';
const emojiFor=type=>({food:'🥩',pizza:'🍕',drinks:'🍺',wine:'🍷',dessert:'🍰',snacks:'🍿',transport:'🚕',home:'🏠',ticket:'🎟️',gift:'🎁',supermarket:'🛒',other:'✨'}[type]||'✨');
const fmtDate=d=>new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
function setView(v){currentView=v;currentGatheringId=null;render()}

document.addEventListener('click',e=>{const btn=e.target.closest('.nav-item');if(btn){e.preventDefault();setView(btn.dataset.view)}});
function render() {
    document
        .querySelectorAll('.nav-item')
        .forEach(b => {
            b.classList.toggle(
                'active',
                b.dataset.view === currentView
            );
        });

        if (currentView === 'home') {
        renderHome();
    } else if (currentView === 'history') {
        renderHistory();
    } else if (currentView === 'groups') {
        renderGroups();
    } else if (currentView === 'group') {
        renderGroupDashboard();
    } else if (currentView === 'people') {
        renderPeople();
    }
}
function shell(content){app.innerHTML=`<div class="content">${content}</div>`}
function renderHome() {
    const profile = window.supabaseData?.profile;

    const name = profile?.display_name || 'Ahí';

    shell(`
        <section class="hero">
            <div class="eyebrow">
                Todo organizado. Sin quilombo.
            </div>

            <h1>👋 Hola, ${escapeHtml(name)}</h1>

            <p>
                Tus gastos compartidos, todos en un solo lugar.
            </p>
        </section>

        <div class="card">
            <div class="section-title">
                <h2>🚀 Empezá por acá</h2>
            </div>

            <p class="muted">
                Elegí un grupo para ver sus juntadas,
                integrantes y gastos.
            </p>

            <button
                class="big-btn"
                onclick="setView('groups')"
            >
                👥 VER MIS GRUPOS
            </button>
        </div>

        <div class="card">
            <div class="section-title">
                <h2>📜 Actividad reciente</h2>

                <button
                    class="back"
                    onclick="setView('history')"
                >
                    Ver historial →
                </button>
            </div>

            <div class="empty">
                Acá vamos a mostrar tus últimas
                actividades.
            </div>
        </div>
    `);
}
function renderGroups() {
    const groups = window.supabaseData?.groups || [];

    shell(`
        <section class="hero">
            <div class="eyebrow">
                Tus grupos
            </div>

            <h1>👥 Mis grupos</h1>

            <p>
                Elegí dónde querés entrar.
            </p>
        </section>

        <div class="card">

            ${
                groups.length
                    ? groups.map(group => `
                        <div
                            class="history-item"
                            onclick="openGroup('${group.id}')"
                            style="cursor:pointer"
                        >

                            <div class="history-emoji">
                                🍻
                            </div>

                            <div class="history-main">
                                <strong>
                                    ${escapeHtml(group.name)}
                                </strong>

                                <small>
                                    Grupo compartido
                                </small>
                            </div>

                            <div class="history-side">
                                <span style="font-size:24px">
                                    →
                                </span>
                            </div>

                        </div>
                    `).join('')
                    : `
                        <div class="empty">
                            Todavía no pertenecés a ningún grupo.
                        </div>
                    `
            }

        </div>

        <button
            class="big-btn"
            onclick="createGroup()"
        >
            ＋ NUEVO GRUPO
        </button>
    `);
}

function openGroup(groupId) {
    const groups = window.supabaseData?.groups || [];
    const group = groups.find(g => g.id === groupId);

    if (!group) {
        alert('No se encontró el grupo.');
        return;
    }

    window.supabaseData.currentGroup = group;
    window.supabaseData.currentGroupId = group.id;

    console.log('🟢 Grupo seleccionado:', group.name);
    console.log('🆔 currentGroupId:', group.id);

    currentView = 'group';
    render();
}

async function createGroup() {
    const name = prompt('¿Cómo se llama el nuevo grupo?');

    if (!name) return;

    const cleanName = name.trim();

    if (!cleanName) return;

    const user = window.supabaseData?.user;

    if (!user) {
        alert('No se encontró el usuario autenticado.');
        return;
    }

    // Código temporal de invitación.
    // Más adelante podemos reemplazarlo por un sistema
    // de invitaciones más completo.
    const inviteCode =
        'RUSH-' +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    const { data: group, error } = await supabaseClient
        .from('groups')
        .insert({
            name: cleanName,
            created_by: user.id,
            invite_code: inviteCode
        })
        .select()
        .single();

    if (error) {
        console.error('Error creando grupo:', error);
        alert('No se pudo crear el grupo.');
        return;
    }

    console.log('Grupo creado:', group);

    // Agregamos automáticamente al creador
    // como integrante del grupo.
    const { data: member, error: memberError } =
        await supabaseClient
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: user.id,
                display_name:
                    window.supabaseData?.profile?.display_name ||
                    'Usuario'
            })
            .select()
            .single();

    if (memberError) {
        console.error(
            'Error agregando creador al grupo:',
            memberError
        );

        alert(
            'El grupo fue creado, pero no se pudo agregar tu usuario como integrante.'
        );

        return;
    }

    console.log('Creador agregado al grupo:', member);

    // Actualizamos la lista de grupos
    const groups = await getGroups();

    window.supabaseData.groups = groups;

    // Entramos directamente al grupo nuevo
    openGroup(group.id);
}

function recentHistory(){if(!data.gatherings.length)return '<div class="empty">Todavía no hay juntadas.<br>La primera está a un botón. 🍻</div>';return data.gatherings.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(historyRow).join('')}
function historyRow(g){const cats=[...new Set(g.expenses.map(e=>emojiFor(e.type)))].join('');return `<div class="history-item" onclick="openGathering('${g.id}')"><div class="history-emoji">${g.emoji||'🍻'}</div><div class="history-main"><strong>${escapeHtml(g.name)}</strong><small>📅 ${fmtDate(g.date)} · 👥 ${g.participants.length} · ${cats||'✨'}</small></div><div class="history-side"><div class="amount">${formatMoney(g.expenses.reduce((s,e)=>s+e.amount,0))}</div><div class="status ${g.status==='settled'?'green':'yellow'}">${g.status==='settled'?'🟢 SALDADA':'🟡 PENDIENTE'}</div></div></div>`}
function renderHistory(){shell(`<section class="hero"><div class="eyebrow">Todo queda guardado.</div><h1>📜 Historial</h1><p>Juntadas, comidas y cuentas. Sin perder nada.</p></section><div class="card">${data.gatherings.length?data.gatherings.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(historyRow).join(''):'<div class="empty">Todavía no hay historial.</div>'}</div>`)}

async function loadCurrentGroupGatherings() {
    const groupId = window.supabaseData?.currentGroupId;

    if (!groupId) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from('gatherings')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error cargando juntadas:', error);
        return [];
    }

    return data || [];
}

async function renderPeople() {
    const groupId = window.supabaseData?.currentGroupId;

    if (!groupId) {
        console.warn('No hay grupo seleccionado.');
        return;
    }

    const members = await getGroupMembers(groupId);
    window.supabaseData.groupMembers = members;

    shell(`
        <section class="hero">
            <div class="eyebrow">Personas guardadas en el grupo.</div>
            <h1>👥 ${escapeHtml(window.supabaseData?.currentGroup?.name || 'Grupo')}</h1>
            <p>Después elegís quién participa en cada juntada.</p>
        </section>

        <div class="card">
            <div class="form">
                <div class="field">
                    <label>Agregar integrante</label>

                    <input
                        id="newPerson"
                        placeholder="Ej: Fede"
                        onkeydown="if(event.key==='Enter') addPerson()"
                    />

                    <button class="btn" onclick="addPerson()">
                        ＋ Agregar
                    </button>
                </div>
            </div>

            <div style="margin-top:18px">
                ${
                    members.length
                        ? members.map(p => `
                            <div class="expense-row">
                                <div class="history-emoji">👤</div>

                                <div class="grow">
                                    <strong>${escapeHtml(p.display_name)}</strong>
                                </div>

                                <button
                                    class="btn danger"
                                    onclick="removePerson('${p.id}')"
                                >
                                    Eliminar
                                </button>
                            </div>
                        `).join('')
                        : `
                            <div class="empty">
                                Agregá a la banda. 🍻
                            </div>
                        `
                }
            </div>
        </div>

        <button class="big-btn" onclick="setView('home')">
            🏠 LISTO — IR AL INICIO
        </button>
    `);
}
async function addPerson() {
    const input = document.getElementById('newPerson');
    const name = input?.value.trim();

    if (!name) return;

    const groups = window.supabaseData?.groups || [];

    if (!groups.length) {
        alert('No se encontró el grupo.');
        return;
    }

    const groupId = groups[0].id;

    const { data: newMember, error } = await supabaseClient
        .from('group_members')
        .insert({
            group_id: groupId,
            display_name: name
        })
        .select()
        .single();

    if (error) {
        console.error('Error agregando integrante:', error);
        alert('No se pudo agregar el integrante.');
        return;
    }

    console.log('Integrante agregado:', newMember);

    window.supabaseData.groupMembers = await getGroupMembers(groupId);

    renderPeople();
}
async function removePerson(id) {
    const confirmed = confirm('¿Querés eliminar este integrante del grupo?');

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from('group_members')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error eliminando integrante:', error);
        alert('No se pudo eliminar el integrante.');
        return;
    }

    console.log('Integrante eliminado:', id);

    const groups = window.supabaseData?.groups || [];

    if (groups.length) {
        window.supabaseData.groupMembers =
            await getGroupMembers(groups[0].id);
    }

    renderPeople();
}

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

async function renderGroupDashboard() {
    const group = window.supabaseData?.currentGroup;

    if (!group) {
        setView('groups');
        return;
    }

    const members = window.supabaseData?.groupMembers || [];
    const gatherings = await loadCurrentGroupGatherings();

    shell(`
        <section class="hero">
            <div class="eyebrow">Grupo seleccionado</div>

            <h1>🍻 ${escapeHtml(group.name)}</h1>

            <p>
                Organizá las juntadas, gastos y cuentas de este grupo.
            </p>
        </section>

        <div class="card">
            <div class="section-title">
                <h2>💰 Resumen</h2>
            </div>

            <div class="empty">
                Acá vamos a mostrar tu balance y quién debe a quién.
            </div>
        </div>

        <div class="card">
            <div class="section-title">
                <h2>👥 Integrantes</h2>
                <button
                    class="back"
                    onclick="renderPeople()"
                >
                    Administrar →
                </button>
            </div>

            <div class="people-preview">
                ${
                    members.length
                        ? members.map(member => `
                            <span class="tag">
                                👤 ${escapeHtml(member.display_name)}
                            </span>
                        `).join('')
                        : `<div class="empty">Todavía no hay integrantes.</div>`
                }
            </div>
        </div>

        <div class="card">
    <div class="section-title">
        <h2>📅 Juntadas</h2>
    </div>

    ${
        gatherings.length
            ? gatherings.map(gathering => `
                <div
                    class="history-item"
                    onclick="openGathering('${gathering.id}')"
                    style="cursor:pointer"
                >
                    <div class="history-emoji">
                        ${
                            gathering.category === 'Comida'
                                ? '🍕'
                                : gathering.category === 'Bebida'
                                ? '🍻'
                                : '📅'
                        }
                    </div>

                    <div class="history-main">
                        <strong>
                            ${escapeHtml(gathering.name)}
                        </strong>

                        <small>
                            ${escapeHtml(gathering.date)}
                            ·
                            ${escapeHtml(gathering.category)}
                        </small>
                    </div>

                    <div class="history-side">
                        <span>
                            ${
                                gathering.status === 'settled'
                                    ? '🟢 Saldada'
                                    : '🟡 Pendiente'
                            }
                        </span>

                        <span style="font-size:24px">
                            →
                        </span>
                    </div>
                </div>
            `).join('')
            : `
                <div class="empty">
                    Todavía no hay juntadas en este grupo.
                </div>
            `
    }
</div>

        <button
            class="big-btn"
            onclick="createGathering()"
        >
            ＋ NUEVA JUNTADA
        </button>

        <button
            class="back"
            onclick="setView('groups')"
            style="width:100%; margin-top:12px"
        >
            ← Volver a mis grupos
        </button>
    `);
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
