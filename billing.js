import { supabase } from "./supabase.js";

export async function startSubscription() {
  try {
    // ✅ Get session (needed for Edge Function auth)
    const { data: sessionData } = await supabase.auth.getSession();

    const token = sessionData?.session?.access_token;

    if (!token) {
      alert("Please login first");
      return;
    }

    // ⚠️ safer clinicId handling
    const clinicId = localStorage.getItem("clinicId");

    if (!clinicId) {
      alert("Clinic not found. Please refresh.");
      return;
    }

    const res = await fetch(
      "https://gzoodfxfpztfmbybxina.supabase.co/functions/v1/create-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clinicId }),
      }
    );

    // ✅ handle server errors properly
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Checkout failed");
    }

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL returned");
    }

  } catch (err) {
    console.error("Billing error:", err);
    alert(err.message || "Payment failed");
  }
}
