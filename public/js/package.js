let formMode = "search";

// helper to bind safely
function on(id, type, handler) {
  const el = document.getElementById(id);
  if (!el) { console.warn(`[bind] #${id} not found`); return; }
  el.addEventListener(type, handler);
}

document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  on("addBtn",  "click", handleAdd);
  on("saveBtn", "click", handleSave);
  on("clearBtn","click", handleClear);
});

function setFormForSearch() { formMode = "search"; }
function setFormForAdd()    { formMode = "add"; }

async function handleAdd() {
  setFormForAdd();
  try {
    const res = await fetch("/api/Package/getNextId"); // capital P to match server
    const { nextId } = await res.json();
    document.getElementById("packageIdText").value = nextId;
  } catch (e) {
    alert("❌ Error getting next id: " + e.message);
  }
}

async function handleSave() {
  if (formMode !== "add") return;

  const form = document.getElementById("packageForm");
  const payload = {
    name:       form.name.value.trim(),
    category:   form.category.value,
    numClasses: form.numClasses.value,           // server normalizes to number or "unlimited"
    classType:  form.ctype.value,
    startDate:  form.startDate.value,
    endDate:    form.endDate.value,
    price:      Number(form.price.value)
  };

  if (!payload.name || !payload.category || !payload.numClasses ||
      !payload.classType || !payload.startDate || !payload.endDate ||
      Number.isNaN(payload.price)) {
    alert("Please complete all fields (price must be a number).");
    return;
  }

  try {
    const res = await fetch("/api/Package/add", {  // capital P to match server
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.message || "Failed to add package");

    alert(`✅ Package ${result.pkg.packageId} added successfully!`);
    form.reset();
    document.getElementById("packageIdText").value = "";
    setFormForSearch();
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
}

function handleClear() {
  const form = document.getElementById("packageForm");
  form.reset();
  document.getElementById("packageIdText").value = "";
  setFormForSearch();
}
