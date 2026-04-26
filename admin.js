
import { supabase } from "./supabase.js";

window.loadAdmin = async function () {
  const { data, error } = await supabase.from("clinics").select("*");

  if (error) return alert(error.message);

  const adminPanel = document.getElementById("adminPanel");

  adminPanel.innerHTML = data
    .map(
      (c) => `
      <div class="card">
        <h3>🏥 ${c.name}</h3>
        <p>Status: ${c.subscription_status}</p>
        <p>Owner: ${c.owner_id}</p>

        <button onclick="activateClinic('${c.id}')">Activate</button>
        <button onclick="deactivateClinic('${c.id}')">Deactivate</button>
      </div>
    `
    )
    .join("");
};

window.activateClinic = async function (id) {
  await supabase
    .from("clinics")
    .update({ subscription_status: "active" })
    .eq("id", id);

  loadAdmin();
};

window.deactivateClinic = async function (id) {
  await supabase
    .from("clinics")
    .update({ subscription_status: "inactive" })
    .eq("id", id);

  loadAdmin();
};