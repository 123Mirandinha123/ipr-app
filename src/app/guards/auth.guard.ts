import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Observable, filter, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.loading$.pipe(
      filter(loading => !loading),
      take(1),
      map(() => {
        if (this.authService.isLoggedIn) return true;
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
