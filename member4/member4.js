const student = {
  name: "Student Name",
  track: "Selected Track",
  modulesCompleted: 4,
  totalModules: 4,
  assessmentPassed: true
};

window.onload = function () {
  checkCourseCompletion();
};

function checkCourseCompletion() {
  const completionPercentage =
    (student.modulesCompleted / student.totalModules) * 100;

  document.getElementById("studentName").innerText = student.name;
  document.getElementById("trackName").innerText = student.track;
  document.getElementById("modulesCompleted").innerText =
    `${student.modulesCompleted} / ${student.totalModules}`;

  document.getElementById("assessmentStatus").innerText =
    student.assessmentPassed ? "Passed" : "Not Passed";

  document.getElementById("progressFill").style.width =
    completionPercentage + "%";

  if (
    student.modulesCompleted === student.totalModules &&
    student.assessmentPassed === true
  ) {
    document.getElementById("courseStatus").innerText = "Course Completed";
    document.getElementById("generateBtn").disabled = false;
  } else {
    document.getElementById("courseStatus").innerText = "Course In Progress";
    document.getElementById("generateBtn").disabled = true;
  }
}

function generateCertificate() {
  document.getElementById("certStudentName").innerText = student.name;
  document.getElementById("certTrackName").innerText = student.track;

  const today = new Date();
  document.getElementById("issueDate").innerText =
    "Issued on: " + today.toDateString();

  document.getElementById("certificateCard").classList.add("active");

  alert("Certificate generated successfully!");
}