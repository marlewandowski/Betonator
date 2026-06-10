import { Injectable } from '@angular/core';
import {COUNTRIES} from '../consts/countries';

@Injectable({
  providedIn: 'root',
})
export class TeamAssetService {
  constructor() {}

  imageFor(teamName: string, isInternational: boolean): string  {
    // @ts-ignore
    let teamCode: string = COUNTRIES[teamName]?.toLowerCase() ?? '';

    if (teamCode == '')
      return `/assets/countries/unknown.png`;
    if (isInternational) {
      return `/assets/countries/${teamCode}.png`;
    } else {
      return `/assets/teams/${teamCode}.png`;
    }
  }
}
