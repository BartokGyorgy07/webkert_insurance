import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Insurance } from '../../shared/models/Insurance';
import { InsuranceService } from '../../shared/services/insurance.service';
import { Subscription, combineLatest } from 'rxjs';
import { PriceFormatterPipe } from '../../shared/pipes/price-formatter.pipe';

@Component({
  selector: 'app-insurances',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PriceFormatterPipe
  ],
  templateUrl: './insurances.component.html',
  styleUrl: './insurances.component.scss',
  standalone: true
})
export class InsurancesComponent implements OnInit, OnDestroy {
  title: string = 'New Insurance';
  displayedColumns: string[] = ['name', 'price', 'dueDate', 'actions'];
  specialDisplayedColumns: string[] = ['name', 'price', 'dueDate', 'actions', 'description'];
  insuranceForm!: FormGroup;
  insurances: Insurance[] = [];
  isLoading = false;
  private subscriptions: Subscription[] = [];
  editingInsurance: Insurance | null = null;

  constructor(private fb: FormBuilder, private insuranceService: InsuranceService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllInsuranceData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  initializeForm(): void {
    this.insuranceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [5000, [Validators.required, Validators.pattern("^[0-9]*$")]],
      dueDate: [new Date(), Validators.required],
      description: ['', Validators.maxLength(200)]
    });
  }

  loadAllInsuranceData(): void {
    this.isLoading = true;

    const allInsurances$ = this.insuranceService.getAllInsurances();

    const combined$ = combineLatest([allInsurances$]);
    const subscription = combined$.subscribe({
      next: ([allInsurances]) => {
        this.insurances = allInsurances;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Error loading insurances', 'error');
      }
    });

    this.subscriptions.push(subscription);
  }

  addInsurance(): void {
    if (this.insuranceForm.valid) {
      this.isLoading = true;
      const formValue = this.insuranceForm.value;
      const insuranceData: Omit<Insurance, 'id'> = {
        name: formValue.name,
        price: formValue.price,
        dueDate: formValue.dueDate,
        description: formValue.description,
        active: true
      };

      if (this.editingInsurance) {
        this.insuranceService.updateInsurance(this.editingInsurance.id, insuranceData)
          .then(() => {
            this.loadAllInsuranceData();
            this.showNotification('Insurance updated successfully', 'success');
            this.cancelEdit();
          })
          .catch(() => {
            this.showNotification('Error updating insurance', 'error');
          })
          .finally(() => {
            this.isLoading = false;
          });
      } else {
        this.insuranceService.addInsurance(insuranceData)
          .then(() => {
            this.loadAllInsuranceData();
            this.showNotification('Insurance added successfully', 'success');
            this.insuranceForm.reset({
              dueDate: new Date()
            });
          })
          .catch(() => {
            this.showNotification('Error adding insurance', 'error');
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    } else {
      Object.keys(this.insuranceForm.controls).forEach(key => {
        const control = this.insuranceForm.get(key);
        control?.markAsTouched();
      });
      this.showNotification('Please fill in all required fields', 'error');
    }
  }

  startEdit(insurance: Insurance): void {
    this.editingInsurance = insurance;
    this.insuranceForm.patchValue({
      name: insurance.name,
      price: insurance.price,
      dueDate: insurance.dueDate,
      description: insurance.description || ''
    });
  }

  cancelEdit(): void {
    this.editingInsurance = null;
    this.insuranceForm.reset({
      dueDate: new Date()
    });
  }

  toggleInsuranceStatus(insurance: Insurance): void {
    this.isLoading = true;
    this.insuranceService.toggleInsuranceStatus(insurance.id, !insurance.active)
      .then(() => {
        this.loadAllInsuranceData();
        this.showNotification('Insurance status updated successfully', 'success');
      })
      .catch((error) => {
        this.showNotification('Error updating insurance status', 'error');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  deleteInsurance(insuranceId: string): void {
    if (confirm('Are you sure you want to delete this insurance?')) {
      this.isLoading = true;
      this.insuranceService.deleteInsurance(insuranceId)
        .then(() => {
          this.loadAllInsuranceData();
          this.showNotification('Insurance deleted successfully', 'success');
        })
        .catch((error) => {
          this.showNotification('Error deleting insurance', 'error');
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`]
    });
  }
}