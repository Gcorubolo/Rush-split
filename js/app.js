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


let data=loadData(); let currentView='home'; let currentGatheringId=null; let savingExpense = false;
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
    else if (currentView === 'activity') {
    renderActivity();
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
                    onclick="openActivity('${gathering.id}')"
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

async function renderActivity() {
    const activityId = window.supabaseData?.currentActivityId;

    if (!activityId) {
        setView('group');
        return;
    }

    // =========================
    // CARGAR ACTIVIDAD
    // =========================

    const { data: activity, error } = await supabaseClient
        .from('gatherings')
        .select('*')
        .eq('id', activityId)
        .single();

    if (error) {
        console.error('Error cargando actividad:', error);
        alert('No se pudo cargar la actividad.');
        return;
    }

    // =========================
    // CARGAR DATOS
    // =========================

    const expenses = await getExpenses(activityId);
    const settlements = await getSettlements(activityId);
    const gatheringMembers = await getGatheringMembers(activityId);

    console.log('💸 Liquidaciones:', settlements);
    console.log('💳 Gastos:', expenses);
    console.log('👥 Participantes:', gatheringMembers);

    window.supabaseData.currentActivity = activity;


    // =========================
    // CALCULAR RESUMEN
    // =========================

    const summary = {};

    gatheringMembers.forEach(member => {

        const memberId = member.group_member_id;

        summary[memberId] = {
            id: memberId,
            name: member.display_name || 'Persona',
            paid: 0,
            owed: 0,
            balance: 0
        };

    });


    // =========================
    // PROCESAR GASTOS
    // =========================

    for (const expense of expenses) {

        // Quién pagó
        if (summary[expense.paid_by]) {
            summary[expense.paid_by].paid +=
                expense.amount_cents;
        }

        // Cuánto le correspondió a cada uno
        const participants =
            await getExpenseParticipants(expense.id);

        participants.forEach(participant => {

            if (summary[participant.group_member_id]) {

                summary[
                    participant.group_member_id
                ].owed += participant.amount_cents;

            }

        });

    }


    // =========================
    // CALCULAR BALANCE
    // =========================

    Object.values(summary).forEach(person => {

        person.balance =
            person.paid - person.owed;

    });


    // =========================
    // TOTAL
    // =========================

    const totalSpent =
        expenses.reduce(
            (total, expense) =>
                total + expense.amount_cents,
            0
        );


    // =========================
    // HTML
    // =========================

    shell(`

        <!-- ========================= -->
        <!-- HEADER -->
        <!-- ========================= -->

        <section class="hero">

            <div class="eyebrow">
                ${escapeHtml(activity.category)}
            </div>

            <h1>
                ${escapeHtml(activity.name)}
            </h1>

            <p>
                ${escapeHtml(activity.date)}
                ${
                    activity.location
                        ? ` · ${escapeHtml(activity.location)}`
                        : ''
                }
            </p>

        </section>


        <!-- ========================= -->
        <!-- DEUDAS -->
        <!-- ========================= -->

        <div class="card">

            <div class="section-title">
                <h2>💸 ¿Quién le debe a quién?</h2>
            </div>

            ${
                settlements.length

                    ? settlements.map(settlement => {

                        let statusText = '';

                        if (settlement.status === 'paid') {

                            statusText = '🟢 Pagado';

                        } else if (
                            settlement.status === 'payment_reported'
                        ) {

                            statusText = '🟠 Pago informado';

                        } else {

                            statusText = '🟡 Pendiente';

                        }


                        let settlementActions = '';


                        // PENDIENTE
                        if (
                            settlement.status === 'pending'
                        ) {

                            settlementActions = `
                                <button
                                    class="big-btn"
                                    onclick="reportPayment('${settlement.id}')"
                                    style="margin-top:10px;"
                                >
                                    💸 INFORMAR PAGO
                                </button>
                            `;

                        }


                        // PAGO INFORMADO
                        if (
                            settlement.status ===
                            'payment_reported'
                        ) {

                            settlementActions = `
                                <button
                                    class="big-btn"
                                    onclick="confirmPayment('${settlement.id}')"
                                    style="margin-top:10px;"
                                >
                                    ✅ CONFIRMAR RECEPCIÓN
                                </button>

                                <button
                                    class="big-btn"
                                    onclick="rejectPayment('${settlement.id}')"
                                    style="margin-top:8px;"
                                >
                                    ❌ RECHAZAR PAGO
                                </button>
                            `;

                        }


                        return `

                            <div
                                class="history-item"
                                style="display:block;"
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        align-items:flex-start;
                                        gap:12px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            gap:12px;
                                            align-items:center;
                                        "
                                    >

                                        <div class="history-emoji">
                                            💸
                                        </div>

                                        <div class="history-main">

                                            <strong>
                                                ${escapeHtml(
                                                    settlement.from_member?.display_name
                                                    || 'Persona'
                                                )}
                                                →
                                                ${escapeHtml(
                                                    settlement.to_member?.display_name
                                                    || 'Persona'
                                                )}
                                            </strong>

                                            <small>
                                                ${statusText}
                                            </small>

                                        </div>

                                    </div>


                                    <div class="history-side">

                                        <strong>
                                            $${Number(
                                                settlement.amount_cents / 100
                                            ).toLocaleString('es-AR')}
                                        </strong>

                                    </div>

                                </div>


                                ${settlementActions}

                            </div>

                        `;

                    }).join('')

                    : `

                        <div class="empty">
                            No hay pagos pendientes.
                        </div>

                    `
            }

        </div>


        <!-- ========================= -->
        <!-- RESUMEN -->
        <!-- ========================= -->

    <div class="card">

    <div class="section-title">
        <h2>💰 Resumen</h2>
    </div>

    <!-- TOTAL GASTADO -->

    <div style="
        padding:20px;
        margin-bottom:18px;
        border-radius:16px;
        background:var(--surface-secondary, #f3f4f6);
        text-align:center;
    ">
        <div style="
            font-size:12px;                            
            font-weight:700;
            letter-spacing:1px;
            opacity:0.7;
        ">
            TOTAL GASTADO
        </div>

        <div style="
            font-size:30px;
            font-weight:800;
            margin-top:6px;
        ">
            $${Number(totalSpent / 100).toLocaleString('es-AR')}
        </div>

        <div style="
            font-size:12px;
            opacity:0.65;
            margin-top:4px;
        ">
            ${gatheringMembers.length} participantes · ${expenses.length} gastos
        </div>
    </div>


    <!-- TARJETAS POR PERSONA -->

    <div style="
        display:flex;
        flex-direction:column;
        gap:12px;
    ">

        ${
            Object.values(summary).map(person => {

                const balance = person.balance;

                const balanceColor =
                    balance > 0 ? '#218653'
                    : balance < 0 ? '#C24141'
                    : '#777777';

                const balanceLabel =
                    balance > 0 ? 'A favor'
                    : balance < 0 ? 'Debe'
                    : 'Saldado';

                const formattedBalance =
                    `${balance > 0 ? '+' : balance < 0 ? '−' : ''}$${Math.abs(
                        balance / 100
                    ).toLocaleString('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                    })}`;

                const initial =
                    (person.name || '?').charAt(0).toUpperCase();

                return `

                    <div style="
                        padding:15px;
                        border:1px solid var(--border-color, #e5e7eb);
                        border-radius:14px;
                    ">

                        <!-- PERSONA Y BALANCE -->

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:12px;
                        ">

                            <div style="
                                display:flex;
                                align-items:center;
                                gap:11px;
                                min-width:0;
                            ">

                                <div style="
                                    width:42px;
                                    height:42px;
                                    flex-shrink:0;
                                    border-radius:50%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:18px;
                                    font-weight:800;
                                    background:var(--surface-secondary, #f3f4f6);
                                ">
                                    ${escapeHtml(initial)}
                                </div>

                                <div style="min-width:0;">

                                    <div style="
                                        font-size:15px;
                                        font-weight:700;
                                    ">
                                        ${escapeHtml(person.name)}
                                    </div>

                                    <div style="
                                        font-size:12px;
                                        opacity:0.7;
                                        margin-top:3px;
                                    ">
                                        Puso $${Number(
                                            person.paid / 100
                                        ).toLocaleString('es-AR')}
                                    </div>

                                </div>

                            </div>

                            <div style="
                                text-align:right;
                                flex-shrink:0;
                            ">

                                <div style="
                                    font-size:17px;
                                    font-weight:800;
                                    color:${balanceColor};
                                ">
                                    ${formattedBalance}
                                </div>

                                <div style="
                                    font-size:11px;
                                    color:${balanceColor};
                                    margin-top:3px;
                                ">
                                    ${balanceLabel}
                                </div>

                            </div>

                        </div>


                        <!-- DETALLE DE IMPORTES -->

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:10px;
                            margin-top:14px;
                            padding-top:11px;
                            border-top:1px solid var(--border-color, #e5e7eb);
                        ">

                            <div>

                                <div style="
                                    font-size:11px;
                                    opacity:0.65;
                                ">
                                    Le correspondía
                                </div>

                                <div style="
                                    font-size:13px;
                                    font-weight:600;
                                    margin-top:4px;
                                ">
                                    $${Number(
                                        person.owed / 100
                                    ).toLocaleString('es-AR')}
                                </div>

                            </div>

                            <div style="
                                text-align:right;
                            ">

                                <div style="
                                    font-size:11px;
                                    opacity:0.65;
                                ">
                                    Diferencia
                                </div>

                                <div style="
                                    font-size:13px;
                                    font-weight:700;
                                    color:${balanceColor};
                                    margin-top:4px;
                                ">
                                    ${formattedBalance}
                                </div>

                            </div>

                        </div>

                    </div>

                `;

                }).join('')
            }

        </div>

    </div>


        <!-- ========================= -->
        <!-- GASTOS -->
        <!-- ========================= -->

        <div class="card">

            <div class="section-title">
                <h2>💳 Gastos</h2>
            </div>


            ${
                expenses.length

                    ? expenses.map(expense => `

                        <div class="history-item">

                            <div class="history-emoji">
                                💳
                            </div>

                            <div class="history-main">

                                <strong>
                                    ${escapeHtml(
                                        expense.description
                                    )}
                                </strong>

                                <small>
                                    $${Number(
                                        expense.amount_cents / 100
                                    ).toLocaleString('es-AR')}
                                </small>

                            </div>

                        </div>

                    `).join('')

                    : `

                        <div class="empty">
                            Todavía no hay gastos cargados.
                        </div>

                    `
            }

        </div>


        <!-- ========================= -->
        <!-- AGREGAR GASTO -->
        <!-- ========================= -->

        <button
            class="big-btn"
            onclick="addExpenseToActivity()"
        >
            ＋ AGREGAR GASTO
        </button>


        <!-- ========================= -->
        <!-- VOLVER -->
        <!-- ========================= -->

        <button
            class="back"
            onclick="setView('group')"
            style="
                width:100%;
                margin-top:12px
            "
        >
            ← Volver al grupo
        </button>

    `);
}

    async function addExpenseToActivity() {
    const activityId = window.supabaseData?.currentActivityId;

    if (!activityId) {
        alert('No hay una actividad seleccionada.');
        return;
    }

    const members = await getGatheringMembers(activityId);

    console.log(
    '👥 PARTICIPANTES:',
    JSON.stringify(members, null, 2)    
        );

    shell(`
        <section class="hero">
            <div class="eyebrow">Nuevo gasto</div>
            <h1>➕ Agregar gasto</h1>
            <p>Cargá qué pasó y RUSH SPLIT se encarga del resto.</p>
        </section>

        <div class="card">

            <div class="form-group">
                <label>Descripción</label>
                <input
                    type="text"
                    id="expenseDescription"
                    placeholder="Ej: Pizza"
                />
            </div>

            <div class="form-group">
                <label>Monto</label>
                <input
                    type="text"
                    id="expenseAmount"
                    inputmode="decimal"
                    placeholder="$ 40.000"
                />
            </div>

            <div class="form-group">
                <label>¿Quién pagó?</label>

                <select id="expensePayer">
                    ${
                        members.map(member => `
                            <option value="${member.group_member_id}">
                                ${escapeHtml(member.display_name)}
                            </option>
                        `).join('')
                    }
                </select>
            </div>

            <div class="form-group">
                <label>¿Quiénes participan?</label>

                <div style="margin-top:10px;">
                    ${
                        members.map(member => `
                            <label
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                    margin-bottom:10px;
                                "
                            >
                                <input
                                    type="checkbox"
                                    class="expense-participant"
                                    value="${member.group_member_id}"
                                    checked
                                />

                                ${escapeHtml(member.display_name)}
                            </label>
                        `).join('')
                    }
                </div>
            </div>

        </div>

        <button
        id="saveExpenseBtn"
        class="big-btn"
        onclick="saveExpense()">
        GUARDAR GASTO
    </button>

        <button
            class="back"
            onclick="renderActivity()"
            style="width:100%; margin-top:12px"
        >
            ← Cancelar
        </button>
    `);
}

async function saveExpense() {
    // 🛡️ Evita múltiples clics mientras se está guardando
    if (savingExpense) {
        console.warn('⚠️ Ya hay un gasto siendo guardado.');
        return;
    }

    savingExpense = true;

    const saveButton = document.getElementById('saveExpenseBtn');

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'GUARDANDO...';
    }

    try {
        const activityId =
            window.supabaseData?.currentActivityId;

        if (!activityId) {
            alert('No hay una actividad seleccionada.');
            return;
        }

        // 1. Leer formulario
        const descriptionInput =
            document.getElementById('expenseDescription');

        const amountInput =
            document.getElementById('expenseAmount');

        const payerInput =
            document.getElementById('expensePayer');

        if (!descriptionInput || !amountInput || !payerInput) {
            console.error('❌ No se encontraron todos los campos:', {
                descriptionInput,
                amountInput,
                payerInput
            });

            alert('No se encontraron todos los campos del formulario.');
            return;
        }

        const description =
            descriptionInput.value.trim();

        const amountText =
            amountInput.value.trim();

        const payer =
            payerInput.value;

        const participants = [
            ...document.querySelectorAll(
                '.expense-participant:checked'
            )
        ].map(input => input.value);

        console.log('🧪 DATOS DEL FORMULARIO:', {
            activityId,
            description,
            amountText,
            payer,
            participants
        });

        if (!description) {
            alert('Ingresá una descripción.');
            return;
        }

        if (!amountText) {
            alert('Ingresá un monto.');
            return;
        }

        if (!payer) {
            alert('Seleccioná quién pagó.');
            return;
        }

        if (!participants.length) {
            alert('Seleccioná al menos un participante.');
            return;
        }

        const amount = parseMoney(amountText);

        if (!amount || amount <= 0) {
            alert('Ingresá un monto válido.');
            return;
        }

        console.log('💰 Monto convertido:', amount);
        console.log('💳 Intentando crear gasto...');

        // 2. Crear gasto
        const {
            data: expense,
            error: expenseError
        } = await supabaseClient
            .from('expenses')
            .insert({
                gathering_id: activityId,
                description: description,
                amount_cents: amount,
                paid_by: payer,
                division_type: 'equal'
            })
            .select()
            .single();

        if (expenseError) {
            console.error('🚨 ERROR SUPABASE:', expenseError);

            alert(
                'ERROR SUPABASE:\n\n' +
                'Code: ' + expenseError.code + '\n' +
                'Message: ' + expenseError.message + '\n' +
                'Details: ' + expenseError.details
            );

            return;
        }

        console.log('✅ Gasto creado:', expense);

        // 3. Calcular cuánto corresponde a cada participante
        const baseAmount =
            Math.floor(amount / participants.length);

        let remainder =
            amount - baseAmount * participants.length;

        const participantRows =
            participants.map(memberId => {

                let share = baseAmount;

                if (remainder > 0) {
                    share += 1;
                    remainder--;
                }

                return {
                    expense_id: expense.id,
                    group_member_id: memberId,
                    amount_cents: share
                };
            });

        console.log(
            '👥 Participaciones:',
            participantRows
        );

        // 4. Guardar participantes
        const {
            data: savedParticipants,
            error: participantError
        } = await supabaseClient
            .from('expense_participants')
            .insert(participantRows)
            .select();

        if (participantError) {

            console.error(
                '❌ Error guardando participantes:',
                participantError
            );

            // Rollback manual
            await supabaseClient
                .from('expenses')
                .delete()
                .eq('id', expense.id);

            alert(
                'No se pudieron guardar los participantes.'
            );

            return;
        }

        console.log('✅ Participantes guardados:', savedParticipants);

    console.log('🔄 Recalculando liquidaciones...');
    
    try {
        await recalculateSettlements(activityId);
        console.log('✅ Liquidaciones recalculadas correctamente.');
    } catch (settlementError) {
        console.error(
            '⚠️ El gasto se guardó, pero no se pudieron recalcular las liquidaciones:',
            settlementError
        );
    
        alert(
            'El gasto se guardó correctamente, pero hubo un problema actualizando las liquidaciones.'
        );
    }
    
    alert('¡Gasto guardado! 🎉');
    
    await renderActivity();
    
        } catch (error) {

        console.error(
            '💥 Error inesperado guardando gasto:',
            error
        );

        alert(
            'Ocurrió un error inesperado al guardar el gasto.'
        );

    } finally {

        // 🔓 Liberamos el bloqueo
        savingExpense = false;

        const button =
            document.getElementById('saveExpenseBtn');

        if (button) {
            button.disabled = false;
            button.textContent = 'GUARDAR GASTO';
        }
    }
}



function openActivity(activityId) {
    window.supabaseData.currentActivityId = activityId;

    console.log(
        '📅 Actividad seleccionada:',
        activityId
    );

    currentView = 'activity';
    render();
}


function showResult(){const g=data.gatherings.find(x=>x.id===currentGatheringId);const balances=calculateBalances(g);const transfers=simplifyTransfers(balances);const total=g.expenses.reduce((s,e)=>s+e.amount,0);g.lastTransfers=transfers;g.status=transfers.length?'pending':'settled';saveData(data);app.innerHTML=`<div class="content"><button class="back" onclick="renderGathering()">← Volver</button><section class="hero"><div class="eyebrow">🧮 RUSH SPLIT hizo las cuentas</div><h1>💸 ¿Quién le paga a quién?</h1><p>${formatMoney(total)} · ${transfers.length} ${transfers.length===1?'pago':'pagos'} para saldar.</p></section><div class="card result-box">${transfers.length?transfers.map(t=>`<div class="transfer"><strong>🔴 ${escapeHtml(personName(t.from))} → 🟢 ${escapeHtml(personName(t.to))}</strong><span>${formatMoney(t.amount)}</span></div>`).join(''):'<div class="success" style="font-weight:800">🟢 Todo saldado.</div>'}</div><button class="big-btn whatsapp" onclick="shareWhatsApp()">📲 COMPARTIR EN WHATSAPP</button><div class="section-title"><h2>Estado</h2></div><div class="card">${Object.entries(balances).map(([id,v])=>`<div class="expense-row"><div class="grow"><strong>${escapeHtml(personName(id))}</strong></div><span class="${v>0?'success':v<0?'danger':''}">${v>0?'Recibe ':v<0?'Paga ':'Está saldado '} ${v?formatMoney(Math.abs(v)):''}</span></div>`).join('')}</div></div>`}
function shareWhatsApp(){const g=data.gatherings.find(x=>x.id===currentGatheringId);const transfers=g.lastTransfers||simplifyTransfers(calculateBalances(g));const total=g.expenses.reduce((s,e)=>s+e.amount,0);const cats=[...new Set(g.expenses.map(e=>emojiFor(e.type)))].join('');let text=`🥩 RUSH SPLIT — ${g.name}\n\n💰 Total: ${formatMoney(total)}\n${cats}\n\n💸 Para saldar:\n\n`;text+=transfers.length?transfers.map(t=>`${personName(t.from)} → ${personName(t.to)}: ${formatMoney(t.amount)}`).join('\n'):'🟢 Todo saldado';text+='\n\n🟢 Con estos pagos queda todo saldado.\n\n🥩 RUSH SPLIT';window.location.href='https://wa.me/?text='+encodeURIComponent(text)}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
checkAuth();

// Persistencia adicional: si el navegador soporta service workers, dejamos preparada la PWA.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

async function recalculateSettlements(activityId) {

    console.log(
        '🔄 RECALCULANDO LIQUIDACIONES PARA:',
        activityId
    );

    try {

        // ==========================================
        // 1. OBTENER GASTOS
        // ==========================================

        const expenses =
            await getExpenses(activityId);

        console.log(
            '💳 GASTOS ENCONTRADOS:',
            expenses
        );

        // ==========================================
        // 2. OBTENER PARTICIPANTES
        // ==========================================

        const gatheringMembers =
            await getGatheringMembers(activityId);

        console.log(
            '👥 PARTICIPANTES:',
            gatheringMembers
        );

        if (!gatheringMembers.length) {
            console.warn(
                '⚠️ La actividad no tiene participantes.'
            );
            return;
        }

        // ==========================================
        // 3. INICIALIZAR BALANCES
        // ==========================================

        const participantIds =
            gatheringMembers.map(
                member => member.group_member_id
            );

        const balances =
            Object.fromEntries(
                participantIds.map(
                    id => [id, 0]
                )
            );

        // ==========================================
        // 4. PROCESAR GASTOS
        // ==========================================

        for (const expense of expenses) {

            console.log(
                '💰 PROCESANDO GASTO:',
                expense
            );

            // El que pagó recibe crédito
            balances[expense.paid_by] +=
                expense.amount_cents;

            // Obtener las partes del gasto
            const participants =
                await getExpenseParticipants(
                    expense.id
                );

            for (const participant of participants) {

                balances[
                    participant.group_member_id
                ] -=
                    participant.amount_cents;
            }
        }

        console.log(
            '⚖️ BALANCES DESPUÉS DE GASTOS:',
            balances
        );

        // ==========================================
        // 5. OBTENER PAGOS YA CONFIRMADOS
        // ==========================================

        const {
            data: paidSettlements,
            error: paidError
        } = await supabaseClient
            .from('settlements')
            .select('*')
            .eq('gathering_id', activityId)
            .eq('status', 'paid');

        if (paidError) {

            console.error(
                '❌ ERROR OBTENIENDO PAGOS CONFIRMADOS:',
                paidError
            );

            throw paidError;
        }

        console.log(
            '🟢 PAGOS CONFIRMADOS:',
            paidSettlements
        );

        // ==========================================
        // 6. APLICAR PAGOS CONFIRMADOS
        // ==========================================

        for (const payment of paidSettlements) {

            console.log(
                '💸 APLICANDO PAGO CONFIRMADO:',
                payment
            );

            // El deudor reduce su deuda
            balances[payment.from_member] +=
                payment.amount_cents;

            // El acreedor reduce lo que todavía tiene
            balances[payment.to_member] -=
                payment.amount_cents;
        }

        console.log(
            '⚖️ BALANCES DESPUÉS DE PAGOS CONFIRMADOS:',
            balances
        );

        // ==========================================
        // 7. CALCULAR NUEVAS OBLIGACIONES
        // ==========================================

        const transfers =
            simplifyTransfers(balances);

        console.log(
            '💸 NUEVAS TRANSFERENCIAS:',
            transfers
        );

        // ==========================================
        // 8. BORRAR SOLO PENDING ANTERIORES
        // ==========================================

        const {
            error: deleteError
        } = await supabaseClient
            .from('settlements')
            .delete()
            .eq('gathering_id', activityId)
            .eq('status', 'pending');

        if (deleteError) {

            console.error(
                '❌ ERROR BORRANDO PENDING:',
                deleteError
            );

            throw deleteError;
        }

        console.log(
            '🗑️ PENDING ANTERIORES ELIMINADOS.'
        );

        // ==========================================
        // 9. SI NO QUEDA NADA POR PAGAR
        // ==========================================

        if (!transfers.length) {

            console.log(
                '✅ ACTIVIDAD COMPLETAMENTE EQUILIBRADA.'
            );

            return;
        }

        // ==========================================
        // 10. CREAR NUEVOS PENDING
        // ==========================================

        const settlementRows =
            transfers.map(transfer => ({

                gathering_id: activityId,

                from_member:
                    transfer.from,

                to_member:
                    transfer.to,

                amount_cents:
                    transfer.amount,

                status: 'pending'

            }));

        console.log(
            '💸 NUEVOS PENDING:',
            settlementRows
        );

        const {
            data: savedSettlements,
            error: settlementError
        } = await supabaseClient
            .from('settlements')
            .insert(settlementRows)
            .select();

        if (settlementError) {

            console.error(
                '❌ ERROR CREANDO PENDING:',
                settlementError
            );

            throw settlementError;
        }

        console.log(
            '✅ LIQUIDACIONES ACTUALIZADAS:',
            savedSettlements
        );

    } catch (error) {

        console.error(
            '❌ ERROR GENERAL RECALCULANDO LIQUIDACIONES:',
            error
        );

        throw error;
    }
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


async function reportPayment(settlementId) {

    console.log('💸 INFORMANDO PAGO:', settlementId);

    const { error } = await supabaseClient
        .from('settlements')
        .update({
            status: 'payment_reported',
            payment_reported_at: new Date().toISOString()
        })
        .eq('id', settlementId);

    if (error) {
        console.error('❌ Error informando pago:', error);
        alert('No se pudo informar el pago.');
        return;
    }

    console.log('✅ Pago informado.');

    await renderActivity();
}


async function confirmPayment(settlementId) {

    console.log('✅ CONFIRMANDO RECEPCIÓN:', settlementId);

    const { error } = await supabaseClient
        .from('settlements')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', settlementId);

    if (error) {
        console.error('❌ Error confirmando pago:', error);
        alert('No se pudo confirmar el pago.');
        return;
    }

    console.log('✅ Pago confirmado.');

    const activityId =
        window.supabaseData?.currentActivityId;

    await recalculateSettlements(activityId);

    await renderActivity();
}


async function rejectPayment(settlementId) {

    console.log('❌ RECHAZANDO PAGO:', settlementId);

    const { error } = await supabaseClient
        .from('settlements')
        .update({
            status: 'pending',
            payment_reported_at: null
        })
        .eq('id', settlementId);

    if (error) {
        console.error('❌ Error rechazando pago:', error);
        alert('No se pudo rechazar el pago.');
        return;
    }

    console.log('↩️ Pago devuelto a pendiente.');

    await renderActivity();
}



