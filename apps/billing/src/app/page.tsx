import { hasSession } from "@/src/services/auth.service";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect((await hasSession()) ? "/account" : "/start");
}
