let formMode = "search";

// Small helper to bind safely and log if element missing
function on(id, type, handler) {
  const el = document.getElementById(id);
  if (!el) { console.warn(`[bind] element #${id} not found`); return; }
  el.addEventListener(type, handler);
}

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initInstructorDropdown();

  on("checkBtn", "click", handleCheck);
  on("addBtn",   "click", () => setFormForAdd());
  on("saveBtn",  "click", handleSave);
  on("clearBtn", "click", clearClassForm);
});

// ---- Handlers ----
async function handleCheck() {
  const form = document.getElementById("classForm");
  const day  = form.day.value;
  const time = form.time.value;

  if (!day || !time) { alert("Pick a day and time"); return; }

  try {
    const res  = await fetch(`/api/Class/conflicts?day=${encodeURIComponent(day)}&time=${encodeURIComponent(time)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Conflict check failed");

    if (data.conflict) {
      const list = (data.suggestions || []).map(s => `${s.day} ${s.time}`).join("\n• ");
      alert(`There is already a class at that time.\n\nTry:\n• ${list || "(no suggestions)"}`);
    } else {
      alert("No conflict. You're good to schedule.");
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

async function handleSave() {
  if (formMode !== "add") return;

  const form = document.getElementById("classForm");
  const classData = {
    instructorId: form.instructorId.value.trim(),
    day:          form.day.value,
    time:         form.time.value,
    payRate:      Number(form.payRate.value),
    classType:    form.ctype.value
  };

  if (!classData.instructorId || !classData.day || !classData.time ||
      !classData.classType || Number.isNaN(classData.payRate)) {
    alert("Please fill in all fields (pay rate must be a number).");
    return;
  }

  try {
    let res = await fetch("/api/Class/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(classData)
    });
    let result = await res.json().catch(() => ({}));

    if (res.status === 409 && result.code === "SCHEDULE_CONFLICT") {
      const opts = (result.suggestions || []).map(s => `${s.day} ${s.time}`).join("\n• ");
      const ok = confirm(
        `There is already a class at that time.\n\n` +
        (opts ? `Suggested times:\n• ${opts}\n\n` : "") +
        `Press OK to publish anyway.`
      );
      if (!ok) return;

      res = await fetch("/api/Class/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...classData, confirm: true })
      });
      result = await res.json().catch(() => ({}));
    }

    if (!res.ok) throw new Error(result.message || "Failed to add class");

    alert(`✅ Class ${result.class.classId} on ${result.class.day} ${result.class.time} added successfully!`);
    form.reset();
    setFormForSearch();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// ---- Helpers ----
async function initInstructorDropdown() {
  const select = document.getElementById("instructorIdSelect");
  select.innerHTML = `<option value=""> -- Select Instructor Id --</option>`;
  try {
    const res = await fetch("/api/instructor/getInstructorIds");
    const ids = await res.json();
    for (const instr of ids) {
      const opt = document.createElement("option");
      opt.value = instr.instructorId;
      opt.textContent = `${instr.instructorId}:${instr.firstname} ${instr.lastname}`;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error("Failed to load instructor IDs:", err);
  }
}

function clearClassForm() {
  document.getElementById("classForm").reset();
}

function setFormForSearch() {
  formMode = "search";
  document.getElementById("classForm").reset();
}

function setFormForAdd() {
  formMode = "add";
  document.getElementById("classForm").reset();
}
