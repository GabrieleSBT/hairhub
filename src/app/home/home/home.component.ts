import { Component, OnInit, Inject, ViewChild, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { TopsalonComponent } from '../topsalon/topsalon.component';
import { RouterModule } from '@angular/router';
import { SwiperCarouselComponent } from '../carousel/carousel.component';
import { RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../../register/register.component';
import { Dialog, DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';
import { MatDialog, MatDialogModule} from '@angular/material/dialog'; // Import per il dialog
import {jwtDecode} from 'jwt-decode';
import { SidenavComponent } from '../../Sidenav/sidenav/sidenav.component';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { UserService } from '../../model/hometables/userService';
import { AppointmentService } from '../../model/bookingAppointment/appointment.service';
import { AppointmentDetail } from '../../model/hometables/AppointmentDetail';
import { TreatmentDto } from '../../model/hometables/TreatmentDto';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  imports: [
    TopsalonComponent,
    RouterModule,
    SwiperCarouselComponent,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatIconModule,
    LoginComponent,
    RegisterComponent,
    SidenavComponent,
    MatDrawerContainer,
    MatDrawer,
    CommonModule,

  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  
  @ViewChild('drawer') drawer!: MatDrawer; // Riferimento alla sidenav

  futureAppointments : AppointmentDetail[] = [];
  pastAppointments : AppointmentDetail[] = [];
  isLoggedIn = false;
  isAuthenticated: boolean = false;
  showLogin = false; // Variabile per controllare la visibilità del LoginComponent
  showRegister = false; // Variabile per controllare la visibilità del RegisterComponent
  userProfile: any = null;  // Variabile per salvare il profilo dell'utente
  constructor(private dialog: MatDialog, private userService: UserService, private appointmentService: AppointmentService, private cdRef: ChangeDetectorRef, private appRef: ApplicationRef) {}


  ngOnInit(): void {
    this.checkAuthentication();

    this.userService.loggedIn$.subscribe({
      next: s => this.isLoggedIn = s,
      error: err => console.log(err)

    });
    const userIdStr =this.userService.getUserIdFromToken();
    const userId = userIdStr ? parseInt(userIdStr) : null;
    console.log('userId:', userId);
    if (userId != null) {
      this.appointmentService.getFutureAppointments(userId).subscribe({
        next: a => {
          console.log('Array delle future appuntamenti:', a);  // Stampa l'array
          a.forEach((appointment: AppointmentDetail) => {
            if (appointment.status === "Cancelled") {
              this.pastAppointments.push(appointment);
              this.appRef.tick();
            } else {
              this.futureAppointments.push(appointment);
            }
          });
        },
        error: err => console.log(err)
      });
    }
    if(userId != null){
      this.appointmentService.getPastAppointments(userId).subscribe({
        next: a =>{
          console.log('Array dei passati appuntamenti:', a); 
         this.pastAppointments = this.pastAppointments.concat(a);
          console.log('Array dei passati appuntamentissss:', this.pastAppointments);          
        },
        error: err => console.log(err)
      });
    
    }

  }

  // Funzione per aprire il dialog di login
  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
        width: '800px',
        data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log('Dialogo chiuso', result);

        if (result && result.success) {
          console.log('Login riuscito, token:', result.token); // Verifica il token che ritorna
          localStorage.setItem('jwtToken', result.token); // Salva il token
          this.isAuthenticated = true; // Imposta l'autenticazione su true
          this.checkAuthentication();  // Verifica lo stato dell'autenticazione
          console.log('Utente autenticato dopo il login:', this.isAuthenticated);
        } else {
          console.log('Login fallito o dialogo chiuso senza login');
          this.isAuthenticated = false;
          this.checkAuthentication();
        }
      });
    }



  openRegisterDialog(): void {
    const dialogRef = this.dialog.open(RegisterComponent, {
      minWidth: '300px',
      data: {} // Puoi passare dati al dialog se necessario
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialogo registrazione chiuso', result);
    });
  }

  toggleRegister(): void {
    this.showRegister = !this.showRegister;
  }


  toggleLogin(): void {
    this.showLogin = !this.showLogin; // Cambia lo stato della visibilità
    console.log('Login visibility:', this.showLogin);  // Per debug
    console.log(this.isAuthenticated);
  }

  goHome(): void {
    console.log('Go home');
  }

  checkAuthentication() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      this.isAuthenticated = true;
      try {
        // Decodifica il token
        const decodedToken: any = jwtDecode(token);
        console.log('Token decodificato:', decodedToken); // Mostra il contenuto del token
        this.userProfile = decodedToken; // Salva il profilo dell'utente
      } catch (error) {
        console.error('Errore nella decodifica del token', error);
      }
    } else {
      this.isAuthenticated = false;
    }
  }


  logout() {
    console.log('logout in corso...');
    localStorage.removeItem('jwtToken');
    this.isAuthenticated = false; // Rimuove il flag di autenticazione
    this.checkAuthentication();
    console.log('Stato dopo il logout:', this.isAuthenticated);
    
  }

  openSidenav() {
    if (this.drawer) {
      this.drawer.open(); // Apre la sidenav
    } else {
      console.error('Sidenav non trovata!');
    }
  }

  closeSidenav() {
    if (this.drawer) {
      this.drawer.close(); // Chiude la sidenav
    }
  }
  
  calculateTotalPrice(futureAppointment: AppointmentDetail): number {
    // Primo map per ottenere solo i prezzi, poi reduce per sommarli
    return futureAppointment.treatments.map(t => t.price).reduce((total: number, price: number) => total + price, 0);
  }

  deleteAppointment(appointmentId: number): void {
    // Trova l'appuntamento nell'array futureAppointments
    const appointmentToDelete = this.futureAppointments.find(a => a.id === appointmentId);
  
    if (appointmentToDelete) {
      this.appointmentService.deleteAppointment(appointmentId).subscribe({
        next: () => {
          console.log(`Appuntamento con ID ${appointmentId} eliminato con successo.`);
  
          // Rimuove l'appuntamento da futureAppointments creando un nuovo array
          appointmentToDelete.status = "Cancelled";
          this.futureAppointments = this.futureAppointments.filter(a => a.id !== appointmentId);
          
          // Se l'appuntamento è stato annullato, spostalo in pastAppointments creando un nuovo array
          if (appointmentToDelete.status === "Cancelled") {
            this.pastAppointments = [...this.pastAppointments, appointmentToDelete];
          }
          console.log(this.pastAppointments);
          console.log(this.futureAppointments);
          console.log('Stato appuntamento:', appointmentToDelete.status);
          
          
          // Forza l'aggiornamento della vista
          this.appRef.tick();
        },
        error: err => {
          console.error('Errore durante l\'eliminazione dell\'appuntamento:', err);
        }
      });
    } else {
      console.log('Appuntamento non trovato nei futureAppointments');
    }
  }
  
}



