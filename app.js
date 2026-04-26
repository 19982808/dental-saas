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
    await checkSubscription();

    document.getElementById("authBox").style.display = "none";
    showSection("dashboard");

    await loadAll();
    notify("Welcome back 👋");

  } catch (err) {
    console.error(err);
    alert("App failed to start: " + err.message);
  }
}

boot();

/* =========================
   AUTH
========================= */

window.login = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    boot();

  } catch (err) {
    alert(err.message);
  }
};

window.register = async () => {
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
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
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("owner_id", currentUser.id)
    .single();

  if (data) {
    clinicId = data.id;
    return;
  }

  const { data: newClinic, error: insertError } = await supabase
    .from("clinics")
    .insert([{ name: "My Clinic", owner_id: currentUser.id }])
    .select()
    .single();

  if (insertError) throw insertError;

  clinicId = newClinic.id;
}

/* =========================
   ROLE SYSTEM
========================= */

async function loadRole() {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (!error && data) {
    userRole = data.role || "staff";
  }

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
   PAYWALL
========================= */

async function checkSubscription() {
  const { data } = await supabase
    .from("clinics")
    .select("subscription_status")
    .eq("id", clinicId)
    .single();

  if (!data || data.subscription_status !== "active") {
    document.body.innerHTML = `
      <div style="text-align:center;margin-top:100px;color:white;">
        <h1>🚫 Subscription Required</h1>
        <button onclick="openBilling()">Upgrade</button>
      </div>
    `;
  }
}

/* =========================
   NAVIGATION
========================= */

window.showSection = (id) => {
  document.querySelectorAll(".section").forEach(s => {
    s.style.display = "none";
  });

  const el = document.getElementById(id);
  if (el) el.style.display = "block";
};

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
  const name = patientName.value;

  if (!name) return notify("Enter patient name");

  const { error } = await supabase.from("patients").insert([
    { name, clinic_id: clinicId }
  ]);

  if (error) return notify(error.message);

  patientName.value = "";

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

  patientList.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.name}
      <button onclick="deletePatient('${p.id}')">Delete</button>
    `;
    patientList.appendChild(li);
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

window.addAppointment = async () => {
  const name = prompt("Patient name:");
  const date = prompt("Date (YYYY-MM-DD HH:MM)");

  if (!name || !date) return;

  const { error } = await supabase.from("appointments").insert([
    { patient_name: name, date, clinic_id: clinicId }
  ]);

  if (error) return notify(error.message);

  notify("Appointment added");
  loadAppointments();
};

async function loadAppointments() {
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("date", { ascending: true });

  appointmentsList.innerHTML = "";

  data.forEach(a => {
    appointmentsList.innerHTML += `
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

  statPatients.innerHTML = `<h3>${patients?.length || 0}</h3><p>Patients</p>`;
  statAppointments.innerHTML = `<h3>${appointments?.length || 0}</h3><p>Appointments</p>`;
}

/* =========================
   ANALYTICS (CHART)
========================= */

async function loadAnalytics() {
  const { data } = await supabase
    .from("patients")
    .select("created_at")
    .eq("clinic_id", clinicId);

  const counts = {};

  data.forEach(p => {
    const d = new Date(p.created_at).toLocaleDateString();
    counts[d] = (counts[d] || 0) + 1;
  });

  const ctx = document.getElementById("chart");

  if (!ctx) return;

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