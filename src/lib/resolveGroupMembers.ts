import type { RosterPlayer } from '../types/game';

export function resolveGroupMembers(playerIds: string[], roster: RosterPlayer[]): RosterPlayer[] {
  return playerIds
    .map((pid) => roster.find((r) => r.id === pid))
    .filter(Boolean) as RosterPlayer[];
}
