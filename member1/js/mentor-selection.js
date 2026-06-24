/* ============================================================
   EduFlick AI — mentor-selection.html logic
   Requirement #1: student chooses a mentor from the available
   list -> onboarding completes, which sets the active learning
   path and triggers the automated roadmap (requirement #2) and
   initial lesson unlock (requirement #3) via DB triggers.
   ============================================================ */

const container = document.getElementById("mentors-container");
const continueBtn = document.getElementById("continue-btn");
const message = document.getElementById("form-message");

let selectedMentorId = null;
let currentUserId = null;

function showMessage(text, kind) {
  message.textContent = text;
  message.className = "form-message" + (kind ? ` form-message--${kind}` : "");
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderMentors(mentors, preselectedId) {
  container.innerHTML = `
    <div class="option-grid">
      ${mentors
        .map((mentor) => {
          const selected = mentor.id === preselectedId ? " option-card--selected" : "";
          return `
            <button class="option-card${selected}" data-mentor-id="${mentor.id}" type="button">
              <div class="mentor-card">
                <div class="mentor-avatar">${initials(mentor.name)}</div>
                <div>
                  <span class="option-card__badge">${mentor.specialty ?? "Mentor"}</span>
                  <h3>${mentor.name}</h3>
                  <p>${mentor.bio ?? ""}</p>
                </div>
              </div>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  container.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      container.querySelectorAll(".option-card").forEach((c) => c.classList.remove("option-card--selected"));
      card.classList.add("option-card--selected");
      selectedMentorId = card.dataset.mentorId;
      continueBtn.disabled = false;
    });
  });
}

async function init() {
  const result = await requireSession();
  if (!result) return;

  const { session, profile } = result;
  currentUserId = session.user.id;

  if (profile?.onboarding_complete) {
    window.location.href = "../member2/index.html";
    return;
  }

  if (!profile?.track_id) {
    window.location.href = "track-selection.html";
    return;
  }

  const { data: mentors, error } = await sb
    .from("mentors")
    .select("id, name, specialty, bio")
    .order("name");

  if (error) {
    container.innerHTML = "";
    showMessage("Couldn't load mentors: " + error.message, "error");
    return;
  }

  selectedMentorId = profile?.mentor_id ?? null;
  if (selectedMentorId) continueBtn.disabled = false;

  renderMentors(mentors, selectedMentorId);
}

continueBtn.addEventListener("click", async () => {
  if (!selectedMentorId) return;
  continueBtn.disabled = true;
  showMessage("Setting up your learning path…", null);

  // Setting onboarding_complete = true here is the trigger that
  // fires fn_generate_roadmap() in Postgres, which builds the
  // student's lesson_progress rows and unlocks the first lesson.
  const { error } = await sb
    .from("profiles")
    .update({ mentor_id: selectedMentorId, onboarding_complete: true })
    .eq("id", currentUserId);

  if (error) {
    showMessage("Couldn't save your mentor: " + error.message, "error");
    continueBtn.disabled = false;
    return;
  }

  window.location.href = "../member2/index.html";
});

init();
