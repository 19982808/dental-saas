import { supabase } from "./supabase.js";

export async function startSubscription() {
  try {
    // =========================
    // GET AUTH SESSION
    // =========================
    const { data: sessionData } = await supabase.auth.getSession();

    const token = sessionData?.session?.access_token;

    if (!token) {
      alert("Please login first");
      return;
    }

    // =========================
    // GET CLINIC (SAFE METHOD)
    // =========================
    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select("id")
      .eq("owner_id", sessionData.session.user.id)
      .maybeSingle();

    if (clinicError || !clinicData) {
      alert("Clinic not found. Please refresh.");
      return;
    }

    const clinicId = clinicData.id;

    // =========================
    // TIMEOUT WRAPPER
    // =========================
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      "https://gzoodfxfpztfmbybxina.supabase.co/functions/v1/create-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clinicId }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    // =========================
    // SAFE ERROR HANDLING
    // =========================
    let data;

    try {
      data = await res.json();
    } catch {
      const text = await res.text();
      throw new Error(text || "Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data?.message || "Checkout failed");
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL returned");
    }

  } catch (err) {
    console.error("Billing error:", err);

    if (err.name === "AbortError") {
      alert("Request timed out. Please try again.");
      return;
    }

    alert(err.message || "Payment failed");
  }
}
