import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: "webkertinsurance",
        appId: "1:186969428768:web:03d74ded3d502eb7443d45",
        storageBucket: "webkertinsurance.firebasestorage.app",
        apiKey: "AIzaSyDoZx130dU4N2POKJ61CnNKMXlsYRWdkh8",
        authDomain: "webkertinsurance.firebaseapp.com",
        messagingSenderId: "186969428768"
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
