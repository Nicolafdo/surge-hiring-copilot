"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("checking...");
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) =>
        setStatus(
          error ? `Supabase error: ${error.message}` : "Supabase connected",
        ),
      );
  }, []);
  return <main className="p-8">{status}</main>;
}
