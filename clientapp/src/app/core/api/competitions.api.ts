import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompetitionDto, ParticipantDto, StandingsRowDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CompetitionsApi {
  private http = inject(HttpClient);

  list() {
    return this.http.get<CompetitionDto[]>('/api/competitions');
  }
  create(body: { name: string; isInternational: boolean }) {
    return this.http.post<CompetitionDto>('/api/competitions', body);
  }
  update(id: number, body: { name: string; isInternational: boolean }) {
    return this.http.put<CompetitionDto>(`/api/competitions/${id}`, body);
  }
  participants(id: number) {
    return this.http.get<ParticipantDto[]>(`/api/competitions/${id}/participants`);
  }
  addParticipant(id: number, userId: number, isActive: boolean) {
    return this.http.post<ParticipantDto>(`/api/competitions/${id}/participants`, { userId, isActive });
  }
  removeParticipant(id: number, userId: number) {
    return this.http.delete<void>(`/api/competitions/${id}/participants/${userId}`);
  }
  standings(id: number) {
    return this.http.get<StandingsRowDto[]>(`/api/competitions/${id}/standings`);
  }
}
