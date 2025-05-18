import { Injectable } from "@angular/core";
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, getDoc, where } from "@angular/fire/firestore";
import { Observable, from, switchMap, map, of, take, firstValueFrom } from "rxjs";
import { Insurance } from "../../shared/models/Insurance";
import { AuthService } from "../../shared/services/auth.service";
import { User } from "../../shared/models/User";

@Injectable({
  providedIn: 'root'
})

export class InsuranceService {
  private readonly INSURANCES_COLLECTION = 'Insurances';
  private readonly USERS_COLLECTION = 'Users';

  constructor(private firestore: Firestore, private authService: AuthService) {}

  private formatDateToString(date: Date | string): string {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.includes('T') ? date.split('T')[0] : date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  async addInsurance(insurance: Omit<Insurance, 'id'>): Promise<Insurance> {
    try {
      const user = await firstValueFrom(this.authService.currentUser.pipe(take(1)));
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const insurancesCollection = collection(this.firestore, this.INSURANCES_COLLECTION);

      const insuranceToSave = {
        ...insurance,
        dueDate: this.formatDateToString(insurance.dueDate as string),
      };

      const docRef = await addDoc(insurancesCollection, insuranceToSave);
      const insuranceId = docRef.id;

      await updateDoc(docRef, { id: insuranceId });

      const newInsurance = {
        ...insuranceToSave,
        id: insuranceId,
      } as Insurance;

      const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const insurances = userData.insurances || [];
        insurances.push({ ...insurance, id: insuranceId } as Insurance);
        await updateDoc(userDocRef, { insurances });
      }

      return newInsurance;
    } catch (error) {
      console.error('Error adding insurance:', error);
      throw error;
    }
  }

  getAllInsurances(): Observable<Insurance[]> {
    return this.authService.currentUser.pipe(
      switchMap(async user => {
        if (!user) {
          return of([]);
        }
        try {
          const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            return of([]);
          }
          const userData = userDoc.data() as User;
const insuranceIds = (userData.insurances || []).map((i: any) => typeof i === 'string' ? i : i.id);
          if (insuranceIds.length === 0) {
            return of([]);
          }

          const insurancesCollection = collection(this.firestore, this.INSURANCES_COLLECTION);
          const insurances: Insurance[] = [];
          const batchSize = 10;

          for (let i = 0; i < insuranceIds.length; i += batchSize) {
            const batch = insuranceIds.slice(i, i + batchSize);
            const q = query(insurancesCollection, where('__name__', 'in', batch));
            const querSnapshot = await getDocs(q);
            querSnapshot.forEach(doc => {
              insurances.push({ ...doc.data(), id: doc.id } as Insurance);
            });
          }

          return of(insurances.sort((a, b) => {
            return a.dueDate.localeCompare(b.dueDate);
          }));
        } catch (error) {
          console.error('Error fetching insurances:', error);
          return of([]);
        }
      }),
      switchMap(insurances => insurances)
    );
  }

  getActiveInsurances(): Observable<Insurance[]> {
    return this.getAllInsurances().pipe(
      map(insurances => insurances.filter(insurance => insurance.active))
    );
  }

  async getInsuranceById(id: string): Promise<Insurance | null> {
    try {
      const user = await firstValueFrom(this.authService.currentUser.pipe(take(1)));
      if (!user) {
        return null;
      }
      const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return null;
      }
      const userData = userDoc.data() as User;
      if (!userData.insurances || !userData.insurances.some((insurance: Insurance) => insurance.id === id)) {
        return null;
      }

      const insuranceDocRef = doc(this.firestore, this.INSURANCES_COLLECTION, id);
      const insuranceSnapshot = await getDoc(insuranceDocRef);
      if (insuranceSnapshot.exists()) {
        return { ...insuranceSnapshot.data(), id: insuranceSnapshot.id } as Insurance;
      }
      return null;
    } catch (error) {
      console.error('Error fetching insurance by ID:', error);
      return null;
    }
  }

  async updateInsurance(id: string, updateData: Partial<Insurance>): Promise<void> {
    try {
      const user = await firstValueFrom(this.authService.currentUser.pipe(take(1)));
      if (!user) {
        throw new Error('No authenticated user found');
      }
      const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data() as User;
      if (!userData.insurances || !userData.insurances.some((insurance: Insurance) => insurance.id === id)) {
        throw new Error('Insurance not found in user data');
      }

      const dataToUpdate:any = { ...updateData };
      if (updateData.dueDate) { 
        dataToUpdate.dueDate = this.formatDateToString(updateData.dueDate as any);
      }

      const insuranceDocRef = doc(this.firestore, this.INSURANCES_COLLECTION, id);
      return updateDoc(insuranceDocRef, dataToUpdate);
    } catch (error) {
      console.error('Error updating insurance:', error);
      throw error;
    }
  }

  toggleInsuranceStatus(id: string, status: boolean): Promise<void> {
    return this.updateInsurance(id, { active: status });
  }

  async deleteInsurance(id: string): Promise<void> {
    try {
      const user = await firstValueFrom(this.authService.currentUser.pipe(take(1)));
      if (!user) {
        throw new Error('No authenticated user found');
      }
      const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data() as User;
      if (!userData.insurances || !userData.insurances.some((insurance: Insurance) => insurance.id === id)) {
        throw new Error('Insurance not found in user data');
      }

      const insuranceDocRef = doc(this.firestore, this.INSURANCES_COLLECTION, id);
      await deleteDoc(insuranceDocRef);

      const updatedInsurances = userData.insurances.filter((insurance: Insurance) => insurance.id !== id);
      return updateDoc(userDocRef, { insurances: updatedInsurances });
    } catch (error) {
      console.error('Error deleting insurance:', error);
      throw error;
    }
  }

  async clearInactiveInsurances(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authService.currentUser.pipe(take(1)));
      if (!user) {
        throw new Error('No authenticated user found');
      }
      const userDocRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data() as User;
      const insurances = await firstValueFrom(this.getAllInsurances());
      const inactiveInsurances = insurances.filter((insurance: Insurance) => !insurance.active);

      if (inactiveInsurances.length === 0) {
        return;
      }

      const inactiveInsuranceIds = inactiveInsurances.map((insurance: Insurance) => insurance.id);
      const updatedInsuraces = userData.insurances.filter((insurance: Insurance) => !inactiveInsuranceIds.includes(insurance.id));
      await updateDoc(userDocRef, { insurances: updatedInsuraces });

      const deletedPromises = inactiveInsurances.map(insurance => {
        const insuranceDocRef = doc(this.firestore, this.INSURANCES_COLLECTION, insurance.id);
        return deleteDoc(insuranceDocRef);
      });

      return Promise.all(deletedPromises).then(() => {});
    } catch (error) {
      console.error('Error clearing inactive insurances:', error);
    }
  }
}