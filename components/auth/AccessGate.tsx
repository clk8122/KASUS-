"use client";

import { ReactNode, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ModuleVault } from "@/components/account/ModuleVault";
import { useAccount } from "@/lib/use-account";
import { TopBar } from "@/components/layout/TopBar";

type AccessGateProps = {
  children: ReactNode;
  requiredModule?: "eligia" | "studio" | "any";
  allowWithoutSubscription?: boolean;
  title?: string;
};

type Mode = "signin" | "signup";

export function AccessGate({ children, requiredModule = "any", allowWithoutSubscription = false, title = "KASUS" }: AccessGateProps) {
  const {
    activeModules,
    authenticated,
    loading,
    signIn,
    signOut,
    signUp,
    startCheckout
  } = useAccount();
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<"eligia" | "studio" | "">("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    agencyName: "",
    firstName: "",
    lastName: ""
  });

  const canUseAnyModule = activeModules.length > 0;
  const canUseRequiredModule = useMemo(() => {
    if (requiredModule === "any") return canUseAnyModule;
    return activeModules.includes(requiredModule);
  }, [activeModules, canUseAnyModule, requiredModule]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mode === "signin") {
      const result = await signIn(form.email.trim(), form.password);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      return;
    }

    const result = await signUp({
      email: form.email.trim(),
      password: form.password,
      agencyName: form.agencyName.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim()
    });
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Compte créé.");
  }

  async function buy(moduleKey: "eligia" | "studio") {
    setPending(moduleKey);
    setMessage("");
    const result = await startCheckout(moduleKey);
    if (result?.error) {
      setMessage(result.error);
    }
    setPending("");
  }

  if (loading) {
    return (
      <main className="access-shell">
        <div className="access-card glass access-card-loading">
          <Loader2 className="spin" size={28} />
          <p>Chargement...</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="auth-shell">
        <div className="auth-shell-topbar">
          <TopBar showProfileMenu={false} />
        </div>
        <section className="auth-hero glass">
          <div className="auth-hero-copy">
            <h1 className="auth-wordmark">{title}</h1>
          </div>
        </section>

        <section className="auth-card glass">
          <div className="auth-card-top">
            <div className="role-toggle">
              <button className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")} type="button">Connexion</button>
              <button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")} type="button">Inscription</button>
            </div>
          </div>
          <form className="access-form" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <div className="split">
                  <input className="input" placeholder="Nom de l'agence" value={form.agencyName} onChange={(event) => setForm((current) => ({ ...current, agencyName: event.target.value }))} />
                  <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="split">
                  <input className="input" placeholder="Prénom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                  <input className="input" placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                </div>
              </>
            ) : (
              <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            )}
            <input className="input" placeholder="Mot de passe" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            <button className="btn btn-primary btn-wide" type="submit">{mode === "signin" ? "Se connecter" : "Créer le compte"}</button>
          </form>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!canUseRequiredModule && !allowWithoutSubscription) {
    return <ModuleVault mode="locked" showChrome />;
  }

  return <>{children}</>;
}
