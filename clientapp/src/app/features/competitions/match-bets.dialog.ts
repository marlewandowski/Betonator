import {Component, inject, OnInit, signal} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BetDto, MatchDto } from '../../core/models';
import { MatchesApi } from '../../core/api/matches.api';
import { TeamLogoComponent } from '../team-logo/team-logo';

export interface MatchBetsData {
  match: MatchDto;
  isInternational: boolean;
}

@Component({
  selector: 'match-bets-dialog',
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule, TeamLogoComponent],
  template: `
    <h2 mat-dialog-title>Typy na mecz</h2>

    <mat-dialog-content>
      <div class="match">
        <div class="meta">
          {{ data.match.gameTime | date:'MMM d HH:mm' }}
          @if (data.match.description) { <span>- {{ data.match.description }}</span> }
        </div>

        <div class="teams">
          <div class="team">
            <app-team-logo
              [teamName]="data.match.team1"
              [isInternational]="data.isInternational">
            </app-team-logo>
            <span>{{ data.match.team1 }}</span>
          </div>

          <div class="score">
            @if (data.match.goal1 !== null && data.match.goal2 !== null) {
              {{ data.match.goal1 }} : {{ data.match.goal2 }}
            } @else {
              vs
            }
          </div>

          <div class="team right">
            <app-team-logo
              [teamName]="data.match.team2"
              [isInternational]="data.isInternational">
            </app-team-logo>
            <span>{{ data.match.team2 }}</span>
          </div>
        </div>
      </div>

      <div class="bets">
        @if (state().loading) {
          <p class="muted">Ładowanie typów...</p>
        } @else if (state().error) {
          <p class="error">{{ state().error }}</p>
        } @else if (state().bets.length === 0) {
          <p class="muted">Brak typów.</p>
        } @else {
          @for (bet of state().bets; track bet.id) {
            <div class="bet-row">
              <span class="username">{{ bet.username }}</span>
              <strong>{{ bet.betGoal1 }} : {{ bet.betGoal2 }}</strong>
              @if (bet.points != null)
              {
                <span class="bet-points">{{bet.points}} p.</span>
              }
            </div>
          }
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Zamknij</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .match {
      border: 1px solid #e7e7e7;
      border-radius: 14px;
      padding: 14px;
      background: #fafafa;
      margin-bottom: 14px;
    }

    .meta {
      color: #777;
      font-size: 12px;
      margin-bottom: 10px;
    }

    .teams {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 14px;
    }

    .team {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-weight: 600;
    }

    .team span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .team.right {
      flex-direction: row-reverse;
      text-align: right;
    }

    .score {
      color: #1976d2;
      font-weight: 700;
      min-width: 42px;
      text-align: center;
    }

    .bets {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: min(360px, 80vw);
    }

    .bet-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 8px 2px;
      border-bottom: 1px solid #eee;
    }

    .username {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bet-points {
      display: flex;
      justify-content: flex-end;
    }

    .muted {
      color: #777;
      margin: 0;
    }

    .error {
      color: #c62828;
      margin: 0;
    }
  `],
})
export class MatchBetsDialog implements OnInit {
  ref = inject(MatDialogRef<MatchBetsDialog>);
  data = inject<MatchBetsData>(MAT_DIALOG_DATA);
  private matchesApi = inject(MatchesApi);

  state = signal({
    loading: true,
    error: '',
    bets: [] as BetDto[],
  });

  ngOnInit() {
    this.matchesApi.bets(this.data.match.id).subscribe({
      next: bets => {
        this.state.set({
          loading: false,
          error: '',
          bets,
        });
      },
      error: err => {
        this.state.set({
          loading: false,
          error: err?.error?.error ?? 'Nie udało się wczytać typów.',
          bets: [],
        });
      },
    });
  }
}
