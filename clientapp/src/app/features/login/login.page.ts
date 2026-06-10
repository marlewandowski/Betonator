import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <mat-card class="login-card">
      <mat-card-title>Zaloguj się</mat-card-title>
      <mat-card-content>
        <form (ngSubmit)="submit()" #f="ngForm">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nazwa użytkownika</mat-label>
            <input matInput name="username" [(ngModel)]="username" required autocomplete="username" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Hasło</mat-label>
            <input matInput type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
          </mat-form-field>
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button mat-flat-button color="primary" type="submit" [disabled]="loading() || !f.valid">
            {{ loading() ? 'Logowanie…' : 'Zaloguj' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .login-card { max-width: 380px; margin: 4rem auto; padding: 1rem; }
    .full { width: 100%; }
    .error { color: #c62828; margin: 0 0 0.5rem; }
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/competitions');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nieprawidłowa nazwa użytkownika lub hasło.');
      },
    });
  }
}
