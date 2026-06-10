export interface UserDto {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  isDisabled: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface CompetitionDto {
  id: number;
  name: string;
  isInternational: boolean;
  createdAt: string;
  matchCount: number;
  participantCount: number;
}

export interface ParticipantDto {
  userId: number;
  username: string;
  isActive: boolean;
}

export interface BetDto {
  id: number;
  matchId: number;
  userId: number;
  username: string;
  betGoal1: number;
  betGoal2: number;
  outcome: 'Gosp' | 'Remis' | 'Goście';
  points: number | null;
  placedAt: string;
  updatedAt: string;
}

export type MatchStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const MatchStage = {
  Group: 0 as const,
  R32: 1 as const,
  R16: 2 as const,
  QuarterFinal: 3 as const,
  SemiFinal: 4 as const,
  ThirdPlace: 5 as const,
  Final: 6 as const,
};

export function stageLabel(s: MatchStage | null | undefined): string {
  switch (s) {
    case 0: return 'Grupa';
    case 1: return '1/32 finału';
    case 2: return '1/16 finału';
    case 3: return 'Ćwierćfinał';
    case 4: return 'Półfinał';
    case 5: return 'Mecz o 3. miejsce';
    case 6: return 'Finał';
    default: return '';
  }
}

export interface MatchDto {
  id: number;
  competitionId: number;
  gameTime: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  description: string | null;
  resultDescription: string | null;
  isLocked: boolean;
  groupId: number | null;
  stage: MatchStage | null;
  bracketPosition: number;
  feederMatch1Id: number | null;
  feederMatch2Id: number | null;
  myBet: BetDto | null;
}

export interface StandingsRowDto {
  userId: number;
  username: string;
  points: number;
  betsPlaced: number;
  exactScores: number;
  correctOutcomes: number;
}

export interface GroupDto {
  id: number;
  competitionId: number;
  name: string;
  displayOrder: number;
}

export interface GroupStandingRowDto {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStandingsDto {
  groupId: number;
  name: string;
  rows: GroupStandingRowDto[];
}
