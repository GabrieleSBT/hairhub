import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-review-dialog',
  imports: [],
  templateUrl: './review-dialog.component.html',
  styleUrl: './review-dialog.component.css'
})
export class ReviewDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // Inizializzazione del FormGroup con i relativi controlli
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Metodo per inviare il modulo
  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form submitted', this.form.value);
    } else {
      console.log('Form non valido');
    }
  }

  // Metodo per controllare se un campo è stato toccato
  get isTouched() {
    return (controlName: string) => this.form.controls[controlName].touched;
  }

  // Metodo per controllare se un campo è valido
  get isValid() {
    return (controlName: string) => this.form.controls[controlName].valid;
  }

  // Metodo per recuperare i messaggi di errore di ciascun controllo
  getErrorMessage(controlName: string): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) {
      return 'Questo campo è obbligatorio';
    }
    if (control.hasError('minlength')) {
      return `Minimo ${control.errors?.['minlength']?.requiredLength || 0} caratteri richiesti`;
    }
    if (control.hasError('email')) {
      return 'Indirizzo email non valido';
    }
    return '';
  }
}
