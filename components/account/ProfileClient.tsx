"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { TeamMemberRole } from "@/lib/account-store";

const roles: TeamMemberRole[] = ["Collaborateur", "Administrateur", "Lecture seule"];

export function ProfileClient() {
  const {
    account,
    addTeamMember,
    removeTeamMember,
    seatSummary,
    updateAccount,
    updateTeamMember
  } = useAccount();
  const [passwordStatus, setPasswordStatus] = useState("");
  const [invite, setInvite] = useState({ email: "", name: "", role: "Collaborateur" as TeamMemberRole });

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus("Mot de passe mis a jour.");
    event.currentTarget.reset();
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invite.email.trim()) {
      return;
    }

    addTeamMember({
      email: invite.email.trim(),
      name: invite.name.trim() || invite.email.trim(),
      role: invite.role
    });
    setInvite({ email: "", name: "", role: "Collaborateur" });
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <p className="eyebrow">Compte</p>
        <h1>Mon profil</h1>
      </div>

      <div className="profile-layout">
        <aside className="profile-summary glass">
          <div className="profile-avatar">
            {account.firstName.charAt(0)}
            {account.lastName.charAt(0)}
          </div>
          <div>
            <h2>
              {account.firstName} {account.lastName}
            </h2>
            <p>Administrateur</p>
          </div>
          <div className="seat-meter">
            <span>Seats utilises</span>
            <strong>
              {seatSummary.usedSeats} / {seatSummary.includedSeats} inclus
            </strong>
            <div className="progress">
              <span style={{ width: `${Math.min(100, (seatSummary.usedSeats / seatSummary.includedSeats) * 100)}%` }} />
            </div>
            <p className="microcopy">{seatSummary.freeSeatsLabel}</p>
          </div>
        </aside>

        <div className="profile-stack">
          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Informations personnelles</h2>
                <p>Ces informations sont sauvegardees localement et reprises dans l'espace de travail.</p>
              </div>
            </div>
            <div className="split">
              <label className="field">
                Nom
                <input className="input" value={account.lastName} onChange={(event) => updateAccount({ lastName: event.target.value })} />
              </label>
              <label className="field">
                Prenom
                <input className="input" value={account.firstName} onChange={(event) => updateAccount({ firstName: event.target.value })} />
              </label>
              <label className="field">
                Email
                <input className="input" type="email" value={account.email} onChange={(event) => updateAccount({ email: event.target.value })} />
              </label>
              <label className="field">
                Telephone
                <input className="input" value={account.phone} onChange={(event) => updateAccount({ phone: event.target.value })} />
              </label>
              <label className="field">
                Nom de l'agence
                <input className="input" value={account.agencyName} onChange={(event) => updateAccount({ agencyName: event.target.value })} />
              </label>
              <label className="field">
                Adresse agence
                <input className="input" value={account.agencyAddress} onChange={(event) => updateAccount({ agencyAddress: event.target.value })} />
              </label>
            </div>
          </section>

          <form className="glass panel profile-panel" onSubmit={handlePasswordSubmit}>
            <div className="panel-heading">
              <div>
                <h2>Securite</h2>
                <p>Modifiez votre mot de passe.</p>
              </div>
              <button className="btn btn-compact" type="submit">Modifier</button>
            </div>
            <div className="split">
              <label className="field">
                Mot de passe actuel
                <input className="input" required type="password" />
              </label>
              <label className="field">
                Nouveau mot de passe
                <input className="input" minLength={8} required type="password" />
              </label>
              <label className="field">
                Confirmer le mot de passe
                <input className="input" minLength={8} required type="password" />
              </label>
            </div>
            {passwordStatus ? <p className="success-text">{passwordStatus}</p> : null}
          </form>

          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Equipe et seats</h2>
                <p>1 administrateur et 2 seats supplementaires sont gratuits. Le reste est payant.</p>
              </div>
              <Link className="btn btn-primary btn-compact" href="/abonnement">Voir l'abonnement</Link>
            </div>
            <form className="invite-row" onSubmit={handleInvite}>
              <input
                className="input"
                placeholder="Nom de l'employe"
                value={invite.name}
                onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                className="input"
                placeholder="email@agence.fr"
                type="email"
                value={invite.email}
                onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))}
              />
              <select
                className="input"
                value={invite.role}
                onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value as TeamMemberRole }))}
              >
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
              <button className="btn btn-compact" type="submit">Ajouter</button>
            </form>
            <div className="team-list">
              {account.team.map((employee) => (
                <div className="team-row" key={employee.id}>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.email}</span>
                  </div>
                  <select
                    className="input input-small"
                    disabled={employee.role === "Administrateur"}
                    value={employee.role}
                    onChange={(event) => updateTeamMember(employee.id, { role: event.target.value as TeamMemberRole })}
                  >
                    {roles.map((role) => <option key={role}>{role}</option>)}
                  </select>
                  <button className="btn btn-compact" disabled={employee.role === "Administrateur"} onClick={() => removeTeamMember(employee.id)} type="button">
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-secondary-grid">
            <div className="glass panel profile-panel">
              <h2>Abonnement</h2>
              <p className="muted">
                {seatSummary.paidSeats} seat payant, {seatSummary.monthlySeatTotal} EUR / mois.
              </p>
              <Link className="btn btn-compact" href="/abonnement">Gerer la facturation</Link>
            </div>
            <div className="glass panel profile-panel">
              <h2>Organisation</h2>
              <p className="muted">Logo, mentions legales, signature agence et preferences metier.</p>
              <Link className="btn btn-compact" href="/organisation">Configurer</Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
