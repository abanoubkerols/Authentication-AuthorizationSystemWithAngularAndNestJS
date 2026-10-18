import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Register</h1>
        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" [(ngModel)]="name" required minlength="2" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="email" required email />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="8"
            />
          </div>
          <div *ngIf="error" class="error">{{ error }}</div>
          <div *ngIf="success" class="success">{{ success }}</div>
          <button type="submit" [disabled]="loading || f.invalid">
            {{ loading ? 'Creating account...' : 'Register' }}
          </button>
        </form>
        <p class="link">
          Already have an account? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      }
      .auth-card {
        background: #fff;
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        margin: 0 0 1.5rem;
        color: #1a1a2e;
        font-size: 1.75rem;
      }
      .form-group {
        margin-bottom: 1.25rem;
      }
      label {
        display: block;
        margin-bottom: 0.4rem;
        font-weight: 500;
        color: #333;
      }
      input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
      }
      input:focus {
        outline: none;
        border-color: #0f3460;
      }
      button {
        width: 100%;
        padding: 0.85rem;
        background: #0f3460;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #e74c3c;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .success {
        color: #27ae60;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .link {
        text-align: center;
        margin-top: 1.25rem;
        color: #666;
      }
      a {
        color: #0f3460;
        text-decoration: none;
        font-weight: 500;
      }
    `,
  ],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  error = '';
  success = '';
  loading = false;

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';
    this.authService
      .register({ name: this.name, email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.success = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.message || 'Registration failed. Please try again.';
        },
      });
  }
}
