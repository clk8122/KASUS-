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
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@agencedupont.fr",
  phone: "06 12 34 56 78",
  agencyName: "Agence Dupont Immobilier",
  agencyAddress: "12 avenue Victor Hugo, Paris",
  agencyLogo: "",
  legalName: "Agence Dupont Immobilier SAS",
  legalEmail: "contact@agencedupont.fr",
  signature: "Agence Dupont Immobilier - Votre partenaire location",
  planName: "Pro",
  includedSeats: 3,
  extraSeatPrice: 19,
  team: [
    {
      id: "admin-1",
      name: "Jean Dupont",
      email: "jean@agencedupont.fr",
      role: "Administrateur"
    },
    {
      id: "seat-1",
      name: "Camille Martin",
      email: "camille@agencedupont.fr",
      role: "Collaborateur"
    },
    {
      id: "seat-2",
      name: "Thomas Leroy",
      email: "thomas@agencedupont.fr",
      role: "Collaborateur"
    }
  ]
};

export function getSeatSummary(account: AccountState) {
  const usedSeats = account.team.length;
  const paidSeats = Math.max(0, usedSeats - account.includedSeats);
  const monthlySeatTotal = paidSeats * account.extraSeatPrice;

  return {
    freeSeatsLabel: "1 administrateur + 2 seats supplementaires gratuits",
    includedSeats: account.includedSeats,
    monthlySeatTotal,
    paidSeats,
    usedSeats
  };
}
