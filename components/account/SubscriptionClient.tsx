"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/lib/use-account";

export function SubscriptionClient() {
  const { account, seatSummary } = useAccount();
  const [billingMessage, setBillingMessage] = useState("");

  async function openCheckout() {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidSeats: Math.max(1, seatSummary.paidSeats) })
    });
    const payload = await response.json();
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setBillingMessage(payload.message ?? "Stripe n'est pas encore configure.");
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <p className="eyebrow">Abonnement</p>
        <h1>Plan {account.planName}</h1>
      </div>
      <div className="billing-grid">
        <section className="glass panel profile-panel billing-hero">
          <h2>Seats inclus</h2>
          <strong>{seatSummary.includedSeats}</strong>
          <p>{seatSummary.freeSeatsLabel}.</p>
        </section>
        <section className="glass panel profile-panel billing-hero">
          <h2>Seats payants</h2>
          <strong>{seatSummary.paidSeats}</strong>
          <p>{account.extraSeatPrice} EUR / mois par seat supplementaire.</p>
        </section>
        <section className="glass panel profile-panel billing-hero">
          <h2>Total seats supplementaires</h2>
          <strong>{seatSummary.monthlySeatTotal} EUR</strong>
          <p>Montant mensuel estime selon l'equipe actuelle.</p>
        </section>
      </div>
      <section className="glass panel profile-panel">
        <div className="panel-heading">
          <div>
            <h2>Detail de l'equipe</h2>
            <p>Ajoutez ou retirez des seats depuis Mon profil. Le calcul se met a jour automatiquement.</p>
          </div>
          <button className="btn btn-primary btn-compact" onClick={openCheckout} type="button">Payer les seats</button>
        </div>
        {billingMessage ? <p className="notice">{billingMessage}</p> : null}
        <div className="team-list">
          {account.team.map((member, index) => (
            <div className="team-row" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <span className="badge">{index < account.includedSeats ? "Inclus" : "Payant"}</span>
            </div>
          ))}
        </div>
      </section>
      <Link className="btn btn-compact" href="/profil">Retour a la gestion des seats</Link>
    </section>
  );
}
