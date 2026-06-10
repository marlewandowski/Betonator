import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GroupDto, GroupStandingsDto } from '../models';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupsApi {
  private http = inject(HttpClient);

  list(competitionId: number) {
    return this.http.get<GroupDto[]>(`${environment.apiUrl}/api/competitions/${competitionId}/groups`);
  }
  create(competitionId: number, body: { name: string; displayOrder: number }) {
    return this.http.post<GroupDto>(`${environment.apiUrl}/api/competitions/${competitionId}/groups`, body);
  }
  update(id: number, body: { name: string; displayOrder: number }) {
    return this.http.put<GroupDto>(`${environment.apiUrl}/api/groups/${id}`, body);
  }
  remove(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/api/groups/${id}`);
  }
  standings(competitionId: number) {
    return this.http.get<GroupStandingsDto[]>(`${environment.apiUrl}/api/competitions/${competitionId}/group-standings`);
  }
}
