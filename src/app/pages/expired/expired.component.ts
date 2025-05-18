import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DateFormatterPipe } from '../../shared/pipes/date.pipe';
import { InsuranceService } from '../../shared/services/insurance.service';
import { Insurance } from '../../shared/models/Insurance';
import { Subscription } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expired',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    DateFormatterPipe
],
  templateUrl: './expired.component.html',
  styleUrl: './expired.component.scss'
})
export class ExpiredComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['name', 'date', 'actions'];
  activeInsurances: Insurance[] = [];
  isLoading = false;
  private subscription?: Subscription;

  constructor(private insuranceService: InsuranceService) {}

  ngOnInit(): void {
    this.loadActiveInsurances();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadActiveInsurances(): void {
    this.isLoading = true;
    this.subscription = this.insuranceService.getActiveInsurances().subscribe({
      next: (insurances) => {
        this.activeInsurances = insurances;
        this.isLoading = false;
      },
      error: () => {
        this.activeInsurances = [];
        this.isLoading = false;
      }
    });
  }

  deleteInsurance(index: number): void {
    const insurance = this.activeInsurances[index];
    if (insurance && confirm('Are you sure you want to delete this insurance?')) {
      this.isLoading = true;
      this.insuranceService.deleteInsurance(insurance.id)
        .then(() => this.loadActiveInsurances())
        .finally(() => this.isLoading = false);
    }
  }

  clearAllInsurances(): void {
    if (this.activeInsurances.length === 0) return;
    if (confirm('Are you sure you want to delete all active insurances?')) {
      this.isLoading = true;
      Promise.all(this.activeInsurances.map(i => this.insuranceService.deleteInsurance(i.id)))
        .then(() => this.loadActiveInsurances())
        .finally(() => this.isLoading = false);
    }
  }
}