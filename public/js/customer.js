let formMode = "search"; // Tracks the current mode of the form

// Fetch all customer IDs and populate the dropdown
document.addEventListener("DOMContentLoaded", () => {
  setFormForSearch();
  initCustomerDropdown();
  addCustomerDropdownListener();

});

//SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
  clearCustomerForm();
  setFormForSearch();
  initCustomerDropdown();
});


//ADD
document.getElementById("addBtn").addEventListener("click", async () => {
  setFormForAdd();
  try {
    const res = await fetch("/api/customer/getNextId");
    const { nextId } = await res.json();
    document.getElementById("customerIdText").value = nextId;
  } catch (e) {
    alert("❌ Error getting next id: " + e.message);
  }
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  if (formMode === "add") {
    try {
      const idRes = await fetch("/api/customer/getNextId"); // <-- lowercase
      if (!idRes.ok) throw new Error(`GetNextId failed: HTTP ${idRes.status}`);
      const { nextId } = await idRes.json();
      document.getElementById("customerIdText").value = nextId;

      const form = document.getElementById("customerForm");
      const customerData = {
        customerId: nextId,
        firstname: form.firstname.value.trim(),
        lastname: form.lastname.value.trim(),
        address: form.address.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        preferredContact: form.pref[0].checked ? "Phone" : "Email",
      };

      if (!customerData.firstname || !customerData.lastname || !customerData.email || !customerData.phone) {
        alert("Please fill in customer information");
        return;
      }

      const res = await fetch("/api/customer/add", { // <-- lowercase to match server
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add customer");

      alert(`✅ Customer ${customerData.customerId} added successfully!`);
      form.reset();
      setFormForSearch();
      initCustomerDropdown();
    } catch (e) {
      alert("❌ " + e.message);
    }
  }
});


//DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const select = document.getElementById("customerIdSelect");
  const customerId = (select.value || "").split(":")[0];

  if (!customerId) {
    alert("Select a customer to delete.");
    return;
  }

  try {
    const response = await fetch(
      `/api/customer/deleteCustomer?customerId=${encodeURIComponent(customerId)}`,
      { method: "DELETE" }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "Customer delete failed");

    alert(`Customer with id ${customerId} successfully deleted`);
    clearCustomerForm();
    initCustomerDropdown();
  } catch (e) {
    alert("❌ " + e.message);
  }

});

async function initCustomerDropdown() {
  const select = document.getElementById("customerIdSelect");
  try {
    const response = await fetch("/api/customer/getCustomerIds");
    const customerIds = await response.json();

    customerIds.forEach((cust) => {
      const option = document.createElement("option");
      option.value = cust.customerId;
      option.textContent = `${cust.customerId}:${cust.firstname} ${cust.lastname}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load customer IDs: ", err);
  }
}

async function addCustomerDropdownListener() {
  const form = document.getElementById("customerForm");
  const select = document.getElementById("customerIdSelect");
  
  if (!select)
  {
    alert("No customer selector");
    return; 
  }


  select.addEventListener("change", async () => {
    var customerId = select.value.split(":")[0];
    console.log(customerId);
    try {
      const res = await fetch(
        `/api/customer/getCustomer?customerId=${customerId}`
      );
      if (!res.ok) throw new Error("customer search failed");

      const data = await res.json();
      console.log(data);
      if (!data || Object.keys(data).length === 0) {
        alert("No customer found");
        return;
      }

      //Fill form with data
      form.firstname.value = data.firstname || "";
      form.lastname.value = data.lastname || "";
      form.address.value = data.address || "";
      form.phone.value = data.phone || "";
      form.email.value = data.email || "";

      if (data.preferredContact === "Phone") {
        form.pref[0].checked = true;
      } else form.pref[1].checked = true;
    } catch (err) {
      alert(`Error searching customer: ${customerId} - ${err.message}`);
    }
  });
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset(); // Clears all inputs including text, textarea, and unchecks radio buttons
  document.getElementById("customerIdSelect").innerHTML = "";
}

function setFormForSearch() {
  formMode = "search";
  //toggle back to search mode
  document.getElementById("customerIdLabel").style.display = "block"; // Show dropdown
  document.getElementById("customerIdTextLabel").style.display = "none"; // Hide text input
  document.getElementById("customerIdText").value = "";
  document.getElementById("customerForm").reset();
}

function setFormForAdd() {
  formMode = "add";
    //hide the customer id drop down and label
  document.getElementById("customerIdLabel").style.display = "none";
  document.getElementById("customerIdTextLabel").style.display = "block";
  document.getElementById("customerIdText").value = "";
  document.getElementById("customerForm").reset();
}