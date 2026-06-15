/* ============================================================
   EduFlick AI — Supabase client + shared helpers
   Fill in SUPABASE_URL and SUPABASE_ANON_KEY with the values
   from your Supabase project (Settings -> API).
   ============================================================ */

const SUPABASE_URL = "https://lemmkomovepjafhodesi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbW1rb21vdmVwamFmaG9kZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDE2NjEsImV4cCI6MjA5NzA3NzY2MX0.XyYcSOUat81ks5CFneOs9rvZp-sYWAvubLPcR_0aOBo";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Returns the current Supabase session, or null if signed out.
 */
async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

/**
 * Fetches the profiles row for a given user id.
 */
async function getProfile(userId) {
  const { data, error } = await sb
    .from("profiles")
    .select("*, tracks(name, type), mentors(name, specialty)")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("getProfile error:", error.message);
    return null;
  }
  return data;
}

/**
 * Guard for protected pages. Redirects to login.html if the
 * visitor isn't signed in. Returns { session, profile }.
 */
async function requireSession() {
  const session = await getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  const profile = await getProfile(session.user.id);
  return { session, profile };
}

/**
 * Sends the signed-in user to whichever step of onboarding
 * (or the roadmap) they should be on, based on their profile.
 * Pages call this so a returning user always lands in the
 * right place rather than repeating steps.
 */
function routeForProfile(profile) {
  if (!profile) {
    window.location.href = "login.html";
  } else if (profile.onboarding_complete) {
    window.location.href = "../member2/index.html";
  } else if (profile.track_id) {
    window.location.href = "mentor-selection.html";
  } else {
    window.location.href = "track-selection.html";
  }
}

/**
 * Signs the user out and returns to the login screen.
 */
async function logout() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}
