import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BetDto, MatchDto, MatchStage } from '../models';
import {environment} from '../../../environments/environment';

export interface MatchPayload {
  gameTime: string;
  team1: string;
  team2: string;
  description: string | null;
  groupId: number | null;
  stage: MatchStage | null;
  bracketPosition: number;
  feederMatch1Id: number | null;
  feederMatch2Id: number | null;
}

export interface CreateMatchBody extends MatchPayload {
  competitionId: number;
}

export interface SetResultBody {
  goal1: number;
  goal2: number;
  resultDescription?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MatchesApi {
  private http = inject(HttpClient);

  listForCompetition(competitionId: number) {
    return this.http.get<MatchDto[]>(`${environment.apiUrl}/api/competitions/${competitionId}/matches`);
  }
  create(body: CreateMatchBody) {
    return this.http.post<MatchDto>(`${environment.apiUrl}/api/matches`, body);
  }
  update(id: number, body: MatchPayload) {
    return this.http.put<MatchDto>(`${environment.apiUrl}/api/matches/${id}`, body);
  }
  setResult(id: number, body: SetResultBody) {
    return this.http.post<MatchDto>(`${environment.apiUrl}/api/matches/${id}/result`, body);
  }
  clearResult(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/api/matches/${id}/result`);
  }
  bets(id: number) {
    return this.http.get<BetDto[]>(`${environment.apiUrl}/api/matches/${id}/bets`);
  }
}
