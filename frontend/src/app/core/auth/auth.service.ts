import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, finalize, shareReplay, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = null;
  private refreshInProgress$: Observable<string> | null = null;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.setAccessToken(res.accessToken);
          if (res.user) {
            this.currentUserSubject.next({
              userId: res.user.id,
              sessionId: '',
              role: res.user.role,
              email: res.user.email,
              name: res.user.name,
            });
          }
        }),
      );
  }

  register(data: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/register`,
      data,
    );
  }

  refresh(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true },
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.http
      .post<LoginResponse>(
        `${this.apiUrl}/refresh`,
        {},
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          this.setAccessToken(response.accessToken);
          return response.accessToken;
        }),
        finalize(() => {
          this.refreshInProgress$ = null;
        }),
        shareReplay(1),
        catchError((err) => {
          this.clearAccessToken();
          this.currentUserSubject.next(null);
          throw err;
        }),
      );

    return this.refreshInProgress$;
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.apiUrl}/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this.clearAccessToken();
          this.currentUserSubject.next(null);
        }),
      );
  }

  logoutAll(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.apiUrl}/logout-all`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this.clearAccessToken();
          this.currentUserSubject.next(null);
        }),
      );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.currentUserSubject.next(user)),
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }
}
