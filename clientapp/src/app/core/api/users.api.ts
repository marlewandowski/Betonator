import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDto } from '../models';

export interface CreateUserBody {
  username: string;
  password: string;
  email: string | null;
  isAdmin: boolean;
}

export interface UpdateUserBody {
  email?: string | null;
  isAdmin?: boolean;
  isDisabled?: boolean;
  newPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private http = inject(HttpClient);

  list() {
    return this.http.get<UserDto[]>('/api/users');
  }
  create(body: CreateUserBody) {
    return this.http.post<UserDto>('/api/users', body);
  }
  update(id: number, body: UpdateUserBody) {
    return this.http.put<UserDto>(`/api/users/${id}`, body);
  }
}
