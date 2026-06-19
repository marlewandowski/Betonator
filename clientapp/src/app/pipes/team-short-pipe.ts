import { Pipe, PipeTransform } from '@angular/core';
import {TEAM_ALIASES, TeamName} from '../consts/team_aliases';

@Pipe({
  name: 'teamShort',
  standalone: true,
  pure: true,
})
export class TeamShortPipe implements PipeTransform {

  transform(team: string): string {
      return TEAM_ALIASES[team as TeamName] ?? team;
  }
}
