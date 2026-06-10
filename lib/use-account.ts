"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACCOUNT_STORAGE_KEY,
  AccountState,
  TeamMember,
  defaultAccountState,
  getSeatSummary
} from "@/lib/account-store";

function readStoredAccount(): AccountState {
  if (typeof window === "undefined") {
    return defaultAccountState;
  }

  const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!stored) {
    return defaultAccountState;
  }

  try {
    return { ...defaultAccountState, ...JSON.parse(stored) } as AccountState;
  } catch {
    return defaultAccountState;
  }
}

export function useAccount() {
  const [account, setAccount] = useState<AccountState>(() => readStoredAccount());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
    }
  }, [account]);

  const seatSummary = useMemo(() => getSeatSummary(account), [account]);

  function updateAccount(updates: Partial<AccountState>) {
    setAccount((current) => ({ ...current, ...updates }));
  }

  function addTeamMember(member: Omit<TeamMember, "id">) {
    setAccount((current) => ({
      ...current,
      team: [
        ...current.team,
        {
          ...member,
          id: `seat-${Date.now()}`
        }
      ]
    }));
  }

  function updateTeamMember(id: string, updates: Partial<TeamMember>) {
    setAccount((current) => ({
      ...current,
      team: current.team.map((member) => (member.id === id ? { ...member, ...updates } : member))
    }));
  }

  function removeTeamMember(id: string) {
    setAccount((current) => ({
      ...current,
      team: current.team.filter((member) => member.id !== id || member.role === "Administrateur")
    }));
  }

  function resetAccount() {
    setAccount(defaultAccountState);
  }

  return {
    account,
    addTeamMember,
    removeTeamMember,
    resetAccount,
    seatSummary,
    updateAccount,
    updateTeamMember
  };
}
