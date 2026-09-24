const SUPABASE_URL = 'https://kjaupxnibbhssxadyfyt.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXVweG5pYmJoc3N4YWR5Znl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjc0OTQsImV4cCI6MjEwNTgwMzQ5NH0.Qy_cmrdQkUYYK-NQtzghcpYw8WHqQtCfxDZS9_sBtnk';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
