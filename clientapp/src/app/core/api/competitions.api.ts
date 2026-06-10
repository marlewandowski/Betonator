import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompetitionDto, ParticipantDto, StandingsRowDto } from '../models';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompetitionsApi {
  private http = inject(HttpClient);

  list() {
    return this.http.get<CompetitionDto[]>(`${environment.apiUrl}/api/competitions`);
  }
  create(body: { name: string; isInternational: boolean }) {
    return this.http.post<CompetitionDto>(`${environment.apiUrl}/api/competitions`, body);
  }
  update(id: number, body: { name: string; isInternational: boolean }) {
    return this.http.put<CompetitionDto>(`${environment.apiUrl}/api/competitions/${id}`, body);
  }
  participants(id: number) {
    return this.http.get<ParticipantDto[]>(`${environment.apiUrl}/api/competitions/${id}/participants`);
  }
  addParticipant(id: number, userId: number, isActive: boolean) {
    return this.http.post<ParticipantDto>(`${environment.apiUrl}/api/competitions/${id}/participants`, { userId, isActive });
  }
  removeParticipant(id: number, userId: number) {
    return this.http.delete<void>(`/api/competitions/${id}/participants/${userId}`);
  }
  standings(id: number) {
    return this.http.get<StandingsRowDto[]>(`/api/competitions/${id}/standings`);
  }
}
