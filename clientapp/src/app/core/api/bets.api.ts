import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BetDto } from '../models';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BetsApi {
  private http = inject(HttpClient);

  upsert(matchId: number, goal1: number, goal2: number) {
    return this.http.put<BetDto>(`${environment.apiUrl}/api/matches/${matchId}/bet`, { goal1, goal2 });
  }
  myBets(competitionId?: number) {
    const url = competitionId
      ? `${environment.apiUrl}/api/me/bets?competitionId=${competitionId}`
      : `${environment.apiUrl}/api/me/bets`;
    return this.http.get<BetDto[]>(url);
  }
}
