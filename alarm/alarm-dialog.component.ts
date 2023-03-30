import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  Inject,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {IAlarmType} from "../../../../../../models/alarm/i-alarm-type";
import {AlarmService} from "../../../../../../services/alarm/alarm.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ValidateInput} from "../../../../../../core/classes/validators/validate-input";
import {IPOI} from "../../../../../../models/poi/i-poi";
import {IVehicle} from "../../../../../../models/vehicle/i-vehicle";
import {VehicleService} from "../../../../../../services/vehicle/vehicle.service";
import {PoiMapService} from "../../../../../../services/poi/poi-map-service/poi-map.service";
import {AlarmMapService} from "../../../../../../services/alarm/alarm-map-service/alarm-map.service";
import {MiniMapService} from "../../../../../../services/map/mini-map.service";
import {IAlarm} from "../../../../../../models/alarm/i-alarm";
import {MatSnackBar} from "@angular/material/snack-bar";

export enum AlarmTypeEnum {
  MOVING_TO_POI,
  GEO_AREA,
  MAX_SPEED,
  MOVING_STATUS,
}

@Component({
  selector: 'app-alarm-dialog',
  templateUrl: './alarm-dialog.component.html',
  styleUrls: ['./alarm-dialog.component.scss']
})
export class AlarmDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('choiceTemplate', {static: true}) choiceTemplate: TemplateRef<any>;
  @ViewChild('createTemplate', {static: true}) createTemplate: TemplateRef<any>;
  @ViewChild('mini_map', {static: false}) mapElementRef: ElementRef;

  selectedTemplate: TemplateRef<any>;
  selectedAlarmTypeId: number;
  daysOfWeek: any = ['1', '2', '3', '4', '5', '6', '7'];

  poiList: Array<IPOI> = [];
  vehicleList: Array<IVehicle> = [];
  alarmTypes: Array<IAlarmType> = [];
  alarmTypesMap = new Map([
    [1, 'Punto di interesse'],
    [2, 'Area geografica' ],
    [3, 'Velocità massima' ],
    [4, 'Stato movimento']
  ]);

  form = this._formBuilder.group({
    name:  new FormControl('', [Validators.required, ValidateInput.notEmpty, Validators.maxLength(100)]),
    distance:  new FormControl('',  [Validators.required]),
    distanceUnit:  new FormControl('m'),
    poiId:  new FormControl('', [Validators.required]),
    polygon:  new FormControl(this.data.polygon, [Validators.required]),
    vehicleId:  new FormControl('', [Validators.required]),
    maxSpeed:  new FormControl('', [Validators.required, Validators.max(500)]),
    sendType:  new FormControl('email', [Validators.required]),
    email:  new FormControl('', [Validators.required, Validators.email]),
    phone:  new FormControl('+39', [Validators.required, Validators.pattern(/^(\+39)?\d{10}$/)])
  });

  commonFields = ['name', 'vehicleId', 'sendType'];
  requiredFields: {[key: number]: string[]} = {
    1: [...this.commonFields, 'distance', 'distanceUnit', 'poiId'],
    2: [...this.commonFields, 'polygon'],
    3: [...this.commonFields, 'maxSpeed'],
    4: [...this.commonFields],
  };

  // error messages
  requiredFieldMessage: string = 'Campo obbligatorio';
  incorrectNameMessage: string = 'Nome puo contenere al massimo 100 caratteri';
  incorrectEmailMessage: string = 'Email inserito non è corretto';
  incorrectPhoneMessage: string = 'Numero inserito non è corretto';
  incorrectSpeedMessage: string = 'Velocità massima é 500 km/h';
  notFoundVehiclesMessage: string = 'Nessun veicolo trovato';
  notFoundPoisMessage: string = 'Nessun P.O.I. trovato';

  constructor(private dialogRef: MatDialogRef<AlarmDialogComponent>,
              public dialog: MatDialog,
              private _formBuilder: FormBuilder,
              private _alarmMapService: AlarmMapService,
              private _alarmService: AlarmService,
              private vehicleService: VehicleService,
              private _poiMapService: PoiMapService,
              private miniMapService: MiniMapService,
              private _snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.selectedTemplate = this.data.template === 'choiceTemplate' ? this.choiceTemplate : this.createTemplate;
    if (this.data.alarmTypeId) {
      this.selectedAlarmTypeId = this.data.alarmTypeId;
    }
    this.findAllAlarmTypes();
    this.findAllPois();
    this.findVehicleList();
  }

  ngAfterViewInit() {
    if (this.selectedAlarmTypeId === 2) {
      this.miniMapService.setMapHtmlContainer(this.mapElementRef.nativeElement);
      this.miniMapService.mapInit();
      this.miniMapService.placePolygon(this.data.polygon);
    }
  }

  findAllAlarmTypes() {
    const promise = this._alarmService.getAllAlarmTypes();
    promise
      .then((alarmTypes: Array<IAlarmType>) => {
        if (alarmTypes) {
          this.alarmTypes = alarmTypes;
        }
      })
      .catch(e => {
        console.error(e)
      })
      .finally();
  }

  findAllPois() {
    const promise = this._poiMapService.findAll();
    promise
      .then(pois => {
        if (pois) {
          this.poiList = pois;
        }
      })
      .catch(e => {
        console.error(e)
      })
      .finally();
  }

  findVehicleList(): void {
    const promise = this.vehicleService.getUserVehiclesPromise();
    promise
      .then((list: Array<IVehicle>) => {
        this.vehicleList = list;
      })
      .catch((e: any) => {
        console.error(e);
      })
      .finally();
  }

  openModalBySelectedType(alarmTypeId:any) {
    if (alarmTypeId === 2) {
      this.createPolygon();
    }
    this.selectedAlarmTypeId = alarmTypeId;
    this.selectedTemplate = this.createTemplate;
  }

  onBack() {
    this.form.reset();
    // reset default values
    this.form.get('sendType')?.setValue('email');
    this.form.get('distanceUnit')?.setValue('m');
    this.selectedTemplate = this.choiceTemplate;
  }

  isFormValid(): boolean {
    const selectedFields = this.requiredFields[this.selectedAlarmTypeId];
    for (const field of selectedFields) {
      if (field === 'sendType') {
        const sendTypeValue = this.form.get('sendType')?.value;
        if (!(sendTypeValue === 'email' ? this.form.get('email')?.valid : this.form.get('phone')?.valid)) return false;
      } else {
        if (!this.form.get(field)?.valid) return false;
      }
    }
    return true;
  }

  getFormValues(): {} {
    let formData: any = {};
    const selectedFields = this.requiredFields[this.selectedAlarmTypeId];
    selectedFields.forEach(key => {
      if (key === 'polygon') {
        const polygonSequence: any = [];
        const vertices = this.form.get('polygon')?.value.getPath();
        for (let i = 0; i < vertices.getLength(); i++) {
          polygonSequence.push([vertices.getAt(i).lat(), vertices.getAt(i).lng()])
        }
        polygonSequence.pop(); // Remove the last point
        polygonSequence.push([vertices.getAt(0).lat(), vertices.getAt(0).lng()]);
        formData['polygon'] = polygonSequence;
      } else if (key === 'sendType') {
        let sendType = this.form.get('sendType')?.value;
        formData[key] = sendType;
        let contactKey = sendType === 'email' ? 'email': 'phone';
        formData[contactKey] = this.form.get(contactKey)?.value
      } else {formData[key] = this.form.get(key)?.value;}
    });
    formData['alarmTypeId'] = this.selectedAlarmTypeId;
    return formData;
  }

  onSubmit() {
    console.log('form data ', this.getFormValues());
    const promise = this._alarmService.create(this.getFormValues());
    promise
      .then((alarm : IAlarm) => {
        this._snackBar.open('Allarme creato', 'Ok', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
        this.form.reset();
        this.dialogRef.close();
      })
      .catch((e: any) => {
        if (e.error) {
          let errors = e.error.message.split(";");
          let list: [] = errors.filter((e: any) => e)
          console.log(list)
          this._snackBar.open('Errore! ' + list, 'Ok', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
          });
        } else {}
      })
      .finally(() => {})
    return;
  }

  onSelectionChange() {
    this.form.get('email')?.reset('');
    this.form.get('phone')?.reset('+39');
  }

  createPolygon() {
    this.dialogRef.close();
    const polygonSubscription = this._alarmMapService.polygonCreated.subscribe((polygon: any) => {
      this.dialog.open(AlarmDialogComponent, {
        data: {
          template: 'createTemplate',
          alarmTypeId: 2,
          polygon: polygon
        },
      });
      polygonSubscription.unsubscribe();
    });
    this._alarmMapService.create();
  }
}

