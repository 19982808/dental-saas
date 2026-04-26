import { supabase } from "./supabase.js";
import { startSubscription } from "./billing.js";

/* =========================
   GLOBAL STATE
========================= */
let clinicId = null;
let currentUser = null;
let chartInstance = null;
let userRole = "staff";

/* =========================
   START APP SAFELY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  boot();
});

/* =========================
   BOOT APP
========================= */
async function boot() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!data.session) return;

    currentUser = data.session.user;

    await initClinic();
    await loadRole();

    const isActive = await checkSubscription();
    if (!isActive) return;

    // SAFE UI SWITCH
    const authBox = document.getElementById("authBox");
    const dashboard = document.getElementById("dashboard");

    if (authBox) authBox.style.display = "none";
    if (dashboard) dashboard.classList.remove("hidden");

    await loadAll();

    notify("Welcome back 👋");

  } catch (err) {
    console.error(err);
    alert("App failed to start: " + err.message);
  }
}

/* =========================
   AUTH
========================= */
window.login = async () => {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    boot();

  } catch (err) {
    alert(err.message);
  }
};

window.register = async () => {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    alert("Check your email to confirm account");

  } catch (err) {
    alert(err.message);
  }
};

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

/* =========================
   CLINIC INIT
========================= */
async function initClinic() {
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("owner_id", currentUser.id)
    .single();

  if (data) {
    clinicId = data.id;
    return;
  }

  const { data: newClinic, error } = await supabase
    .from("clinics")
    .insert([{ name: "My Clinic", owner_id: currentUser.id }])
    .select()
    .single();

  if (error) throw error;

  clinicId = newClinic.id;
}

/* =========================
   ROLE SYSTEM
========================= */
async function loadRole() {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (data) userRole = data.role || "staff";

  applyRoleUI();
}

function applyRoleUI() {
  if (userRole !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "none";
    });
  }
}

/* =========================
   PAYWALL (SAFE)
========================= */
async function checkSubscription() {
  const { data } = await supabase
    .from("clinics")
    .select("subscription_status")
    .eq("id", clinicId)
    .single();

  if (!data || data.subscription_status !== "active") {
    const dashboard = document.getElementById("dashboard");

    if (dashboard) {
      dashboard.classList.remove("hidden");
      dashboard.innerHTML = `
        <div style="text-align:center;margin-top:100px;">
          <h1>🚫 Subscription Required</h1>
          <button onclick="openBilling()">Upgrade</button>
        </div>
      `;
    }

    return false;
  }

  return true;
}

/* =========================
   LOAD ALL DATA
========================= */
async function loadAll() {
  await Promise.all([
    loadPatients(),
    loadAppointments(),
    loadStats(),
    loadAnalytics()
  ]);
}

/* =========================
   PATIENTS
========================= */
window.addPatient = async () => {
  const input = document.getElementById("patientName");
  const name = input.value;

  if (!name) return notify("Enter patient name");

  const { error } = await supabase.from("patients").insert([
    { name, clinic_id: clinicId }
  ]);

  if (error) return notify(error.message);

  input.value = "";

  notify("Patient added");

  loadPatients();
  loadStats();
  loadAnalytics();
};

async function loadPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) return notify(error.message);

  const list = document.getElementById("patientList");
  if (!list) return;

  list.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.name}
      <button onclick="deletePatient('${p.id}')">Delete</button>
    `;
    list.appendChild(li);
  });
}

window.deletePatient = async (id) => {
  await supabase.from("patients").delete().eq("id", id);
  notify("Patient removed");
  loadPatients();
};

/* =========================
   APPOINTMENTS
========================= */
async function loadAppointments() {
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("date", { ascending: true });

  const list = document.getElementById("appointmentsList");
  if (!list) return;

  list.innerHTML = "";

  data.forEach(a => {
    list.innerHTML += `
      <li>${a.patient_name} - ${new Date(a.date).toLocaleString()}</li>
    `;
  });
}

/* =========================
   STATS
========================= */
async function loadStats() {
  const { data: patients } = await supabase.from("patients").select("*");
  const { data: appointments } = await supabase.from("appointments").select("*");

  const p = document.getElementById("statPatients");
  const a = document.getElementById("statAppointments");

  if (p) p.innerHTML = `<h3>${patients?.length || 0}</h3><p>Patients</p>`;
  if (a) a.innerHTML = `<h3>${appointments?.length || 0}</h3><p>Appointments</p>`;
}

/* =========================
   ANALYTICS (SAFE)
========================= */
async function loadAnalytics() {
  const { data } = await supabase
    .from("patients")
    .select("created_at")
    .eq("clinic_id", clinicId);

  const counts = {};

  data?.forEach(p => {
    const d = new Date(p.created_at).toLocaleDateString();
    counts[d] = (counts[d] || 0) + 1;
  });

  const ctx = document.getElementById("chart");
  if (!ctx || typeof Chart === "undefined") return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Patients Growth",
        data: Object.values(counts)
      }]
    }
  });
}

/* =========================
   NOTIFICATIONS
========================= */
function notify(msg) {
  const box = document.createElement("div");
  box.className = "toast";
  box.innerText = msg;

  document.body.appendChild(box);

  setTimeout(() => box.remove(), 3000);
}

/* =========================
   BILLING
========================= */
window.openBilling = () => startSubscription();

/* =========================
   SESSION LISTENER
========================= */
supabase.auth.onAuthStateChange((event, session) => {
  if (session) boot();
});

/* =========================
   PWA
========================= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
