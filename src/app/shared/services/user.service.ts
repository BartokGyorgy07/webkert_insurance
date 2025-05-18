import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/User';
import { Insurance } from '../models/Insurance';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore, private authService: AuthService) { }

  getUserProfile(): Observable<{
    user: User | null;
    insurances: Insurance[];
    stats: {
      total: number;
      active: number;
      inactive: number;
      completionRate: number;
    };
  }> {
    return this.authService.currentUser.pipe(
      switchMap(authUser => {
        if (!authUser) {
          return of({
            user: null,
            insurances: [],
            stats: {
              total: 0,
              active: 0,
              inactive: 0,
              completionRate: 0
            }
          });
        }

        return from(this.fetchUserWithInsurances(authUser.uid));
      })
    );
  }

  private async fetchUserWithInsurances(userId: string): Promise<{
    user: User | null;
    insurances: Insurance[];
    stats: {
      total: number;
      active: number;
      inactive: number;
      completionRate: number;
    };
  }> {
    try {
      const userDocRef = doc(this.firestore, 'Users', userId);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        return {
          user: null,
          insurances: [],
          stats: {
            total: 0,
            active: 0,
            inactive: 0,
            completionRate: 0
          }
        };
      }

      const userData = userSnapshot.data() as User;
      const user = { ...userData, id: userId };

      if (!user.insurances || user.insurances.length === 0) {
        return {
          user,
          insurances: [],
          stats: {
            total: 0,
            active: 0,
            inactive: 0,
            completionRate: 0
          }
        }
      }

      const insuranceIds = user.insurances.map((item: any) => typeof item === 'string' ? item : item.id);
      const insuranceCollection = collection(this.firestore, 'Insurances');
      const q = query(insuranceCollection, where('__name__', 'in', insuranceIds));      
      const insuranceSnapshot = await getDocs(q);

      const insurances: Insurance[] = [];
      insuranceSnapshot.forEach(doc => {
        insurances.push({ ...doc.data(), id: doc.id } as Insurance);
      });
      console.log('insurances array:', insurances);

      const total = insurances.length;
      const active = insurances.filter(insurance => insurance.active).length;
      const inactive = total - active;
      const completionRate = total > 0 ? (active / total) * 100 : 0;

      return {
        user,
        insurances,
        stats: {
          total,
          active,
          inactive,
          completionRate
        }
      }
    } catch(error) {
      console.error('Error fetching user data:', error);
      return {
        user: null,
        insurances: [],
        stats: {
          total: 0,
          active: 0,
          inactive: 0,
          completionRate: 0
        }
      }
    }
  }
}
