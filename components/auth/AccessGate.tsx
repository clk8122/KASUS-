"use client";

import { ReactNode, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAccount } from "@/lib/use-account";

type AccessGateProps = {
  children: ReactNode;
  requiredModule?: "eligia" | "studio" | "any";
  allowWithoutSubscription?: boolean;
  title?: string;
  subtitle?: string;
};

type Mode = "signin" | "signup";

export function AccessGate({ children, requiredModule = "any", allowWithoutSubscription = false, title = "KASUS", subtitle }: AccessGateProps) {
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
    setMessage("Compte créé. Si aucune session n'est encore active, vérifie tes emails puis reconnecte-toi.");
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
        <div className="access-card glass">
          <Loader2 className="spin" size={24} />
          <p>Chargement de votre accès...</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="access-shell">
        <section className="access-card glass">
          <div className="access-brand">
            <span className="brand-wordmark">{title}</span>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="role-toggle">
            <button className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")} type="button">Connexion</button>
            <button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")} type="button">Inscription</button>
          </div>
          <form className="access-form" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <input className="input" placeholder="Nom de l'agence" value={form.agencyName} onChange={(event) => setForm((current) => ({ ...current, agencyName: event.target.value }))} />
                <div className="split">
                  <input className="input" placeholder="Prénom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                  <input className="input" placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                </div>
              </>
            ) : null}
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <input className="input" placeholder="Mot de passe" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            <button className="btn btn-primary" type="submit">{mode === "signin" ? "Se connecter" : "Créer le compte"}</button>
          </form>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!canUseRequiredModule && !allowWithoutSubscription) {
    return (
      <main className="access-shell">
        <section className="access-card glass">
          <div className="access-brand">
            <span className="brand-wordmark">{title}</span>
            <p>Votre compte est connecté, mais aucun module actif n'est encore disponible.</p>
          </div>
          <div className="billing-grid billing-grid-modules">
            <article className="glass panel profile-panel billing-hero">
              <h2>ELIGIA</h2>
              <strong>99 EUR</strong>
              <p>par mois et par module.</p>
              <button className="btn btn-primary btn-compact" disabled={pending === "eligia"} onClick={() => buy("eligia")} type="button">
                {pending === "eligia" ? "Ouverture..." : "Débloquer ELIGIA"}
              </button>
            </article>
            <article className="glass panel profile-panel billing-hero">
              <h2>STUDIO</h2>
              <strong>99 EUR</strong>
              <p>par mois et par module.</p>
              <button className="btn btn-primary btn-compact" disabled={pending === "studio"} onClick={() => buy("studio")} type="button">
                {pending === "studio" ? "Ouverture..." : "Débloquer STUDIO"}
              </button>
            </article>
          </div>
          {message ? <p className="notice">{message}</p> : null}
          <div className="actions">
            <button className="btn btn-compact" onClick={() => signOut()} type="button">Déconnexion</button>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
