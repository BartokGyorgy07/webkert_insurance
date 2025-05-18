import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../shared/models/User';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signUpForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rePassword: new FormControl('', [Validators.required]),
    name: new FormGroup({
      firstname: new FormControl('', [Validators.required, Validators.minLength(2)]),
      lastname: new FormControl('', [Validators.required, Validators.minLength(2)])
    })
  });
  
  isLoading = false;
  showForm = true;
  signUpError = '';

  constructor(private router: Router, private authService: AuthService) {}

  signup(): void {
    if (this.signUpForm.invalid) {
      this.signUpError = 'Please correct the form errors before submitting.';
      return;
    }

    const password = this.signUpForm.get('password');
    const rePassword = this.signUpForm.get('rePassword');

    if (password?.value !== rePassword?.value) {
      this.signUpError = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.showForm = false;

    const userData: Partial<User> = {
      name: {
        firstname: this.signUpForm.value.name?.firstname || '',
        lastname: this.signUpForm.value.name?.lastname || ''
      },
      email: this.signUpForm.value.email || '',
      insurances: [],
      expired_insurances: []
    };

    const email = this.signUpForm.value.email || '';
    const passwordValue = this.signUpForm.value.password || '';

    this.authService.signUp(email, passwordValue, userData)
      .then(userCredential => {
        this.authService.updateLoginStatus(true);
        this.router.navigateByUrl('/home');
      })
      .catch(error => {
        this.isLoading = false;
        this.showForm = true;

        switch(error.code) {
          case 'auth/email-already-in-use':
            this.signUpError = 'Email already in use. Please use a different email.';
            break;
          case 'auth/invalid-email':
            this.signUpError = 'Invalid email address.';
            break;
          case 'auth/weak-password':
            this.signUpError = 'Password is too weak. Use at least 6 characters.';
            break;
          default:
            this.signUpError = 'An error occurred during signup. Please try again.';
        }
      });
  }
}