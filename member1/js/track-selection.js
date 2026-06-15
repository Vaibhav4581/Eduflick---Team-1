/* ============================================================
   EduFlick AI — track-selection.html logic
   Requirement #1: student selects a learning track ->
   track becomes the active learning path.
   ============================================================ */

const container = document.getElementById("tracks-container");
const continueBtn = document.getElementById("continue-btn");
const message = document.getElementById("form-message");

let selectedTrackId = null;
let currentUserId = null;

function showMessage(text, kind) {
  message.textContent = text;
  message.className = "form-message" + (kind ? ` form-message--${kind}` : "");
}

function renderTracks(tracks, preselectedId) {
  const courses = tracks.filter((t) => t.type === "course");
  const bootcamps = tracks.filter((t) => t.type === "bootcamp");

  function cardHtml(track) {
    const selected = track.id === preselectedId ? " option-card--selected" : "";
    return `
      <button class="option-card${selected}" data-track-id="${track.id}" type="button">
        <span class="option-card__badge">${track.type}</span>
        <h3>${track.name}</h3>
        <p>${track.description ?? ""}</p>
      </button>
    `;
  }

  container.innerHTML = `
    <div class="section-label">Main Courses</div>
    <div class="option-grid">${courses.map(cardHtml).join("")}</div>

    <div class="section-label">Bootcamp Programs</div>
    <div class="option-grid">${bootcamps.map(cardHtml).join("")}</div>
  `;

  container.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      container.querySelectorAll(".option-card").forEach((c) => c.classList.remove("option-card--selected"));
      card.classList.add("option-card--selected");
      selectedTrackId = Number(card.dataset.trackId);
      continueBtn.disabled = false;
    });
  });
}

async function init() {
  const result = await requireSession();
  if (!result) return;

  const { session, profile } = result;
  currentUserId = session.user.id;

  // Already finished onboarding -> nothing to do here
  if (profile?.onboarding_complete) {
    window.location.href = "roadmap.html";
    return;
  }

  const { data: tracks, error } = await sb
    .from("tracks")
    .select("id, name, type, description")
    .order("id");

  if (error) {
    container.innerHTML = "";
    showMessage("Couldn't load tracks: " + error.message, "error");
    return;
  }

  selectedTrackId = profile?.track_id ?? null;
  if (selectedTrackId) continueBtn.disabled = false;

  renderTracks(tracks, selectedTrackId);
}

continueBtn.addEventListener("click", async () => {
  if (!selectedTrackId) return;
  continueBtn.disabled = true;
  showMessage("Saving your track…", null);

  const { error } = await sb
    .from("profiles")
    .update({ track_id: selectedTrackId })
    .eq("id", currentUserId);

  if (error) {
    showMessage("Couldn't save your track: " + error.message, "error");
    continueBtn.disabled = false;
    return;
  }

  window.location.href = "mentor-selection.html";
});

init();
