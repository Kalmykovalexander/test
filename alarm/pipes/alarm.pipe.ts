import { Pipe, PipeTransform } from '@angular/core';
import {IAlarm} from "../../../../../../models/alarm/i-alarm";

@Pipe({
  name: 'alarmFilter'
})
export class AlarmPipe implements PipeTransform {

  constructor() {
  }

  transform(triggeredAlarms: Array<IAlarm>, searchTerm: string): any {
    if (triggeredAlarms === null || triggeredAlarms === undefined) {
      return triggeredAlarms;
    }

    if (searchTerm === null || searchTerm === undefined) {
      return triggeredAlarms;
    }
    
    let result = triggeredAlarms;
    if (searchTerm.length > 0) {
      result = triggeredAlarms.filter(function(alarm) {
        return alarm.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
      })
    }

    return result;
  }

}
