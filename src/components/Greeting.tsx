"use client";

import { useAuth } from "./AuthProvider";

export default function Greeting() {
  const { name, session } = useAuth();
  return <>{session && name ? `Hi ${name}! 👋` : "Maths Practice"}</>;
}
