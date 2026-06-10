export type TeamMemberRole = "Administrateur" | "Collaborateur" | "Lecture seule";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
};

export type AccountState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agencyName: string;
  agencyAddress: string;
  agencyLogo: string;
  legalName: string;
  legalEmail: string;
  signature: string;
  planName: string;
  includedSeats: number;
  extraSeatPrice: number;
  team: TeamMember[];
};

export const ACCOUNT_STORAGE_KEY = "kasus-account-state";

export const defaultAccountState: AccountState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  agencyName: "",
  agencyAddress: "",
  agencyLogo: "",
  legalName: "",
  legalEmail: "",
  signature: "",
  planName: "Sans abonnement",
  includedSeats: 3,
  extraSeatPrice: 99,
  team: []
};

export function getSeatSummary(account: AccountState) {
  const usedSeats = account.team.length;
  const paidSeats = Math.max(0, usedSeats - account.includedSeats);
  const monthlySeatTotal = paidSeats * account.extraSeatPrice;

  return {
    freeSeatsLabel: account.team.length ? "Seats inclus selon le plan de l'organisation" : "Aucune equipe configuree",
    includedSeats: account.includedSeats,
    monthlySeatTotal,
    paidSeats,
    usedSeats
  };
}
