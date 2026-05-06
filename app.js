import { supabase } from "./supabase.js";
import { startSubscription } from "./billing.js";

/* =========================
   STATE
========================= */
let clinicId = null;
let currentUser = null;
let chartInstance = null;
let userRole = "staff";
let isBooting = false;

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", boot);

/* =========================
   BOOT (FIXED - NO LOOPS)
========================= */
async function boot() {
  try {
    const { data, error } = await supabase.auth.getSession();

    document.getElementById("loading")?.remove();

    if (error || !data?.session) {
      showAuth();
      return;
    }

    currentUser = data.session.user;

    await initClinic();
    await loadRole();

    const active = await checkSubscription();
    if (!active) return;

    showDashboard();
    await loadAll();

  } catch (err) {
    console.error("BOOT ERROR:", err);
    document.getElementById("loading")?.remove();
    showAuth();
  }
}
/* =========================
   UI SAFE TOGGLES
========================= */
function showDashboard() {
  const authBox = document.getElementById("authBox");
  const dashboard = document.getElementById("dashboard");

  if (authBox) authBox.style.display = "none";
  if (dashboard) dashboard.classList.remove("hidden");
}

function showAuth() {
  const authBox = document.getElementById("authBox");
  const dashboard = document.getElementById("dashboard");

  if (authBox) authBox.style.display = "block";
  if (dashboard) dashboard.classList.add("hidden");
}

/* =========================
   AUTH
========================= */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return alert(error.message);

  boot();
};

window.register = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return alert(error.message);

  alert("Check your email to confirm account");
};

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

/* =========================
   CLINIC INIT (SAFE SINGLE)
========================= */
async function initClinic() {
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("owner_id", currentUser.id)
    .maybeSingle();

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
   ROLE
========================= */
async function loadRole() {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  userRole = data?.role || "staff";
}

/* =========================
   SUBSCRIPTION (FIXED UI)
========================= */
async function checkSubscription() {
  const { data } = await supabase
    .from("clinics")
    .select("subscription_status")
    .eq("id", clinicId)
    .single();

  if (data?.subscription_status === "active") return true;

  const dashboard = document.getElementById("dashboard");

  if (dashboard) {
    dashboard.innerHTML = `
      <div style="text-align:center;margin-top:100px;">
        <h1>🚫 Subscription Required</h1>
        <button onclick="openBilling()">Upgrade</button>
      </div>
    `;
  }

  return false;
}

/* =========================
   LOAD ALL
========================= */
async function loadAll() {
  await Promise.all([
    loadPatients(),
    loadAppointments(),
    loadStats()
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

  loadPatients();
  loadStats();
};

async function loadPatients() {
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  const list = document.getElementById("patientList");
  if (!list) return;

  list.innerHTML = "";

  data?.forEach(p => {
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
  loadPatients();
  loadStats();
};

/* =========================
   APPOINTMENTS
========================= */
async function loadAppointments() {
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId);

  const list = document.getElementById("appointmentsList");
  if (!list) return;

  list.innerHTML = "";

  data?.forEach(a => {
    list.innerHTML += `<li>${a.patient_name}</li>`;
  });
}

/* =========================
   STATS (FIXED SCOPING)
========================= */
async function loadStats() {
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId);

  const p = document.getElementById("statPatients");
  const a = document.getElementById("statAppointments");

  if (p) p.textContent = patients?.length || 0;
  if (a) a.textContent = appointments?.length || 0;
}

/* =========================
   NOTIFY
========================= */
function notify(msg) {
  const box = document.createElement("div");
  box.innerText = msg;
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.background = "#22c55e";
  box.style.padding = "10px";
  box.style.borderRadius = "8px";

  document.body.appendChild(box);

  setTimeout(() => box.remove(), 3000);
}

/* =========================
   BILLING
========================= */
window.openBilling = () => startSubscription();

/* =========================
   AUTH LISTENER (FIXED LOOP)
========================= */
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") boot();
});

