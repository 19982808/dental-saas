import { supabase } from "./supabase.js";

export async function startSubscription() {
  const { data } = await supabase.auth.getUser();

  const clinicId = localStorage.getItem("clinicId");

  const res = await fetch(
    "https://gzoodfxfpztfmbybxina.supabase.co/functions/v1/create-checkout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clinicId }),
    }
  );

  const dataRes = await res.json();

  if (dataRes.url) {
    window.location.href = dataRes.url;
  } else {
    alert("Payment failed");
  }
}