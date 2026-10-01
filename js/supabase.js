const SUPABASE_URL = 'https://kjaupxnibbhssxadyfyt.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXVweG5pYmJoc3N4YWR5Znl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjc0OTQsImV4cCI6MjEwNTgwMzQ5NH0.Qy_cmrdQkUYYK-NQtzghcpYw8WHqQtCfxDZS9_sBtnk';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ================================
// RUSH SPLIT - SUPABASE DATA LAYER
// ================================

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error('Error obteniendo usuario:', error);
        throw error;
    }

    return user;
}


async function getProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error obteniendo perfil:', error);
        throw error;
    }

    return data;
}


async function getGroups() {
    const { data, error } = await supabaseClient
        .from('groups')
        .select('*');

    if (error) {
        console.error('Error obteniendo grupos:', error);
        throw error;
    }

    return data;
}


async function getGroupMembers(groupId) {
    const { data, error } = await supabaseClient
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

    if (error) {
        console.error('Error obteniendo miembros:', error);
        throw error;
    }

    return data;
}


async function getGatherings(groupId) {
    const { data, error } = await supabaseClient
        .from('gatherings')
        .select('*')
        .eq('group_id', groupId);

    if (error) {
        console.error('Error obteniendo juntadas:', error);
        throw error;
    }

    return data;
}


async function getGatheringMembers(gatheringId) {
    const { data, error } = await supabaseClient
        .from('gathering_members')
        .select(`
            id,
            gathering_id,
            group_member_id,
            group_member:group_members (
                id,
                display_name
            )
        `)
        .eq('gathering_id', gatheringId);

    if (error) {
        console.error('Error obteniendo participantes:', error);
        throw error;
    }

    return data || [];
}


async function getExpenses(gatheringId) {
    const { data, error } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('gathering_id', gatheringId);

    if (error) {
        console.error('Error obteniendo gastos:', error);
        throw error;
    }

    return data;
}


async function getExpenseParticipants(expenseId) {
    const { data, error } = await supabaseClient
        .from('expense_participants')
        .select('*')
        .eq('expense_id', expenseId);

    if (error) {
        console.error('Error obteniendo participantes del gasto:', error);
        throw error;
    }

    return data;
}


async function getSettlements(gatheringId) {
    const { data, error } = await supabaseClient
        .from('settlements')
        .select(`
            id,
            gathering_id,
            amount_cents,
            status,
            paid_at,
            from_member:group_members!settlements_from_member_fkey (
                id,
                display_name
            ),
            to_member:group_members!settlements_to_member_fkey (
                id,
                display_name
            )
        `)
        .eq('gathering_id', gatheringId);

    if (error) {
        console.error('Error obteniendo settlements:', error);
        throw error;
    }

    return data;
}
