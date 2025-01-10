import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BarberDetails } from '../../../model/hometables/barberDetails';
import { SalonService } from '../../../model/hometables/SalonService';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AvailableDates } from '../../../model/bookingAppointment/availableDates';
import { AppointmentService } from '../../../model/bookingAppointment/appointment.service';
import { TreatmentsPriceDetails } from '../../../model/hometables/TreatmentsPricesDetails';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatMenu } from '@angular/material/menu';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import  moment  from 'moment-timezone';
import { FormControl} from '@angular/forms';
import { UserService } from '../../../model/hometables/userService';
import { AppointmentDetail } from '../../../model/hometables/AppointmentDetail';
import { AppointmentDto } from '../../../model/hometables/appointmentDto';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCard } from '@angular/material/card';
import { MatCardModule } from '@angular/material/card';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-booking',
  providers: [provideNativeDateAdapter()],
  imports: [MatCardModule,MatCard,MatDialogModule, MatFormFieldModule, MatInputModule,
           MatDatepickerModule, ReactiveFormsModule, MatTimepickerModule, FormsModule, MatSelectModule,
           MatMenuModule,MatInputModule,MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  bookingConfirmed: boolean= false;
  barbers!: BarberDetails[];
  barber!: BarberDetails;
  id!: number;
  salonId!: number;
  barberId!: number;
  bookingMonths = 1;
  selectedTreatments!: TreatmentsPriceDetails[];
  selectedDate!: Date;
  bookingForm!: FormGroup;
  barberChoice!: number;
  value!: string;
  availableDates!: Date[];
  availableTimes: string[] = [];
  timeOptions: { value: string, viewValue: string }[] = []; // Array per le opzioni del select
  isLoggedIn = false;
  userId!:string | null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { id: number, selectedTreatments: TreatmentsPriceDetails[] }, private salonService: SalonService,
               private route: ActivatedRoute, private appointmentService: AppointmentService,
              private fb: FormBuilder,private userService: UserService,private snackBar: MatSnackBar, private dialogRef: MatDialogRef<BookingComponent>, private cdr: ChangeDetectorRef) {
    this.bookingForm = this.fb.group({
      barberId: [''],
      date: [''],
      time: ['',Validators.required],
      treatmentSummary:['']
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.selectedTreatments) {
      this.selectedTreatments = this.data.selectedTreatments;
      console.log('Trattamenti ricevuti dal componente genitore:', this.selectedTreatments);
    }
    this.id = this.data.id;

    this.salonService.getBarbersBySalonId(this.id).subscribe({
      next: barbers => { this.barbers = barbers, console.log(barbers), console.log(this.id) },
      error: err => console.log(err)
    });

    this.bookingForm.get('barberId')?.valueChanges.subscribe({
      next: (barberId: number) => {
        this.barberId = barberId;
        this.fetchAvailableDates(barberId);
        console.log('Barbiere selezionato:', barberId);

      },
      error: err => console.log(err)
    });

    this.userService.loggedIn$.subscribe({
      next: s => this.isLoggedIn = s,
      error: err => console.log(err)
    });

    this.userId = this.userService.getUserIdFromToken();

  }

  fetchAvailableDates(barberId: number): void {

    if (this.barberId && this.selectedTreatments.length > 0) {
      this.appointmentService.getAvailableDates(this.barberId, this.bookingMonths, this.selectedTreatments.length).subscribe({
        next: (response) => {
          console.log('Risposta API:', response);
          if (response && response.dates) {
            this.availableDates = response.dates.map((dateString: string) => {
              // Converti ogni stringa di data in un oggetto Date
              console.log(dateString);
              return new Date(dateString);

            });
            console.log('Date disponibili:', this.availableDates);
          } else {
            console.log('Nessuna data disponibile');
          }
        },
        error: err => console.log(err),

      });
    } else {
      console.log('Errore: uno o più parametri non sono definiti correttamente');
    }
  }

  fetchAvailableTimes(barberId: number, date: Date): void {
    console.log("Data", date);
    if (barberId && date) {
      const localDate = moment(date).tz("Europe/Rome", true).startOf('day');
      const dateString = localDate.format("YYYY-MM-DD");
      console.log("Data locale (formattata)", dateString);
  
      this.appointmentService.getAvailableTimes(barberId, dateString, this.bookingMonths).subscribe({
        next: (times) => {
          console.log("Orari Disponibili", times, typeof times);
          this.availableTimes = times.times;
          //this.availableTimes = times;
           // Mappa gli orari per il mat-select
          this.timeOptions = this.availableTimes.map(time => ({ value: time, viewValue: time }) );
          this.bookingForm.get('time')?.enable(); // Abilita il campo orario
        },
        error: (err) => {
          console.log("Errore durante il recupero degli orari disponibili", err);
        }
      });
    } else {
      console.log("Data o Barbiere non validi");
    } // Missing closing curly brace added here
  }

  isDateAvailable = (date: Date | null): boolean => {
    if (!date || !this.availableDates || this.availableDates.length === 0) {
      return false;
    }
  
    const isAvailable = this.availableDates.some(availableDate => {
      if(typeof availableDate === 'string'){
        availableDate = new Date(availableDate);
      }

      if(!(availableDate instanceof Date) || isNaN(availableDate.getTime())) {
        console.error('availableDate non è un oggetto Date valido:', availableDate);
        return false;
      }
      
      return availableDate.getFullYear() === date.getFullYear() &&
              availableDate.getMonth() === date.getMonth() &&
             availableDate.getDate() === date.getDate();
    });
    return isAvailable;
  }

  onSubmitBarberSelection(): void {
    console.log('Barbiere selezionato:', this.barberId);
    console.log('Data selezionata:', this.selectedDate);
  }

  onDateSelected(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if(date){
    this.selectedDate = date;
    this.fetchAvailableTimes(this.barberId, date);
    console.log('Data selezionata:', date);
    } else{
      console.log("Data non valida");
    }
  }

  onSubmit() {
    this.barberChoice = this.bookingForm.value.barberId;
    console.log(this.barberChoice);
    const treatmentDtos = this.selectedTreatments.map(treatment => ({
      id: treatment.id,
      name: treatment.name,
      price: treatment.price
    }));
 
  // Ottieni l'orario selezionato dal form
  const selectedTime = this.bookingForm.value.time;

  // Definisci la data dell'appuntamento
  const appointmentDate = this.selectedDate;
  const startTime = moment(selectedTime, 'HH:mm').format('HH:mm');

  // Calcola la durata totale in minuti
  const totalDurationInMinutes = this.selectedTreatments.length * 30; // 30 minuti per ogni servizio

  // Calcola l'orario di fine aggiungendo la durata totale
  const endTime = moment(startTime, 'HH:mm').add(totalDurationInMinutes, 'minutes').format('HH:mm'); // Orario di fine come stringa HH:mm
    const treatmentIds = this.selectedTreatments.map(treatment => treatment.id);

   //costruisci l'oggetto AppointmentDto
   const appointmentDto: AppointmentDto = {
    id:0,
    userId: this.userId ? parseInt(this.userId, 10) : 0,
    barberId:this.barberChoice,
    barberName: this.barbers.find(barber => barber.id === this.barberChoice)?.name || '',
    date:moment(appointmentDate).format('YYYY-MM-DD'),
    startTime: startTime,
    endTime: endTime,
    status: 'confirmed',
    treatments: treatmentIds
   };

   console.log('Dettagli dell appuntamento', appointmentDto);

   this.appointmentService.createAppointment(appointmentDto).subscribe({
    next:(response) => {
      console.log('Appuntamento creato con successo', response);
      this.bookingConfirmed = true;
      console.log(this.bookingConfirmed);
      this.snackBar.open('Prenotazione effettuata con successo!','Chiudi',{ duration: 3000 }); // Mostra un messaggio di successo})
      this.cdr.detectChanges();
    },
    error: (err)  => {
      console.log('Errore durante la creazione dell appuntamento', err);
      this.snackBar.open('Errore durante la prenotazione. Riprova più tardi.', 'Chiudi', { // Mostra un messaggio di errore
        duration: 5000,
        panelClass: ['error-snackbar']
    });
    this.bookingConfirmed = false;
  }
   });
}

onClose(){
  this.bookingConfirmed = false; //resetta lo stato di conferma
  this.bookingForm.reset(); // resetta il modulo
  this.dialogRef.close(FormData);
}

  get total(): number {
    return this.selectedTreatments.reduce((sum, treatment) => sum + treatment.price, 0);
    
  }
}

