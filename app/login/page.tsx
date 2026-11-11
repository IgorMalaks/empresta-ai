import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <section className="panel login-panel" aria-labelledby="login-title">
      <p className="eyebrow">Seu próximo empréstimo começa aqui</p>
      <h1 id="login-title">Entre no Empresta Aí</h1>
      <p className="muted">Use o e-mail e a senha da sua conta cadastrada.</p>
      <LoginForm />
      <p className="muted">
        Não tem acesso? Procure o responsável pelo projeto. Não há cadastro
        público.
      </p>
    </section>
  );
}
