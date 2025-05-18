import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);
  isLoading: boolean = false;
  loginError: string = '';
  showLoginForm: boolean = true;
  authSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (this.email.invalid) { 
      this.loginError = 'Please enter a valid email address';
      return;
    }

    if (this.password.invalid) {
      this.loginError = 'Please enter a valid password';
      return;
    }

    const emailValue = this.email.value || '';
    const passwordValue = this.password.value || '';

    this.isLoading = true;
    this.showLoginForm = false;
    this.loginError = '';

    this.authService.signIn(emailValue, passwordValue)
    .then(userCredential => {
      this.authService.updateLoginStatus(true);
      this.router.navigateByUrl('/home');
    })
    .catch(error => {
      this.isLoading = false;
      this.showLoginForm = true;
      console.log(error.code)
      switch (error.code) {
        case 'auth/user-not-found':
          this.loginError = 'User not found. Please check your email and try again.';
          break;
        case 'auth/wrong-password':
          this.loginError = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-credential':
          this.loginError = 'Please check your email and password.';
          break;
        default:
          this.loginError = 'An error occurred. Please try again later.';
          break;
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }
}