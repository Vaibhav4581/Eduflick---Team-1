const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hoqzqlamzspiagjrrswg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvcXpxbGFtenNwaWFnanJyc3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDM3MDYsImV4cCI6MjA5Nzg3OTcwNn0.FlfmPzq0uesABOHNPLOzz4ldj28DUFowAySwbWrsFng';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'rohan@example.com',
    password: '12345678'
  });

  if (error) {
    console.error('Login error:', error);
    return;
  }

  const { data: profile, error: pError } = await sb
    .from("profiles")
    .select("*, tracks(name, type), mentors(name, specialty)")
    .eq("id", data.user.id)
    .single();

  console.log('Profile error:', pError);
  console.log('Profile data:', profile);
}

test();
