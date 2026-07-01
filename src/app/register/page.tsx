import Link from "next/link";
import Logo from "@/components/Logo";
import RegisterForm from "./RegisterForm";
import SocialButtons from "@/components/SocialButtons";
import { enabledSocialProviders } from "@/lib/socialProviders";

export default function RegisterPage() {
  const providers = enabledSocialProviders();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-8">
        <Logo href="/" size={28} />
        <h1 className="mt-5 font-display text-3xl font-extrabold">Регистрация</h1>

        <RegisterForm />

        <SocialButtons providers={providers} callbackUrl="/dashboard" />

        <p className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
