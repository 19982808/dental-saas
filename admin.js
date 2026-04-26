import { supabase } from "./supabase.js";

/* =========================
   ADMIN STATE GUARD
========================= */
let isLoading = false;

/* =========================
   LOAD ADMIN PANEL
========================= */
window.loadAdmin = async function () {
  if (isLoading) return;
  isLoading = true;

  try {
    const adminPanel = document.getElementById("adminPanel");

    if (!adminPanel) {
      console.warn("adminPanel not found in DOM");
      return;
    }

    adminPanel.innerHTML = "<p>Loading clinics...</p>";

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      adminPanel.innerHTML = "<p>No clinics found</p>";
      return;
    }

    adminPanel.innerHTML = data
      .map(
        (c) => `
        <div class="card">
          <h3>🏥 ${c.name}</h3>
          <p>Status: <b>${c.subscription_status || "unknown"}</b></p>
          <p>Owner: ${c.owner_id}</p>

          <button onclick="activateClinic('${c.id}')">Activate</button>
          <button onclick="deactivateClinic('${c.id}')">Deactivate</button>
        </div>
      `
      )
      .join("");

  } catch (err) {
    console.error(err);
    alert("Failed to load admin panel: " + err.message);
  } finally {
    isLoading = false;
  }
};

/* =========================
   ACTIVATE CLINIC
========================= */
window.activateClinic = async function (id) {
  try {
    const { error } = await supabase
      .from("clinics")
      .update({ subscription_status: "active" })
      .eq("id", id);

    if (error) throw error;

    await loadAdmin();

  } catch (err) {
    alert("Activation failed: " + err.message);
  }
};

/* =========================
   DEACTIVATE CLINIC
========================= */
window.deactivateClinic = async function (id) {
  try {
    const { error } = await supabase
      .from("clinics")
      .update({ subscription_status: "inactive" })
      .eq("id", id);

    if (error) throw error;

    await loadAdmin();

  } catch (err) {
    alert("Deactivation failed: " + err.message);
  }
};
