import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/auth/auth.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="layout">
      <nav class="navbar">
        <span class="brand">Secure Auth</span>
        <div class="nav-right">
          <span *ngIf="user" class="user-info">
            {{ user.name }} ({{ user.role }})
          </span>
          <a *ngIf="user?.role === 'admin'" routerLink="/admin" class="nav-link">Admin</a>
          <button (click)="logout()" class="btn-outline">Logout</button>
          <button (click)="logoutAll()" class="btn-danger">Logout All</button>
        </div>
      </nav>
      <main class="content">
        <h1>Dashboard</h1>
        <div class="card" *ngIf="user">
          <h2>Welcome, {{ user.name }}!</h2>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Role:</strong> {{ user.role }}</p>
          <p><strong>Session ID:</strong> {{ user.sessionId }}</p>
        </div>
        <div class="card">
          <h3>Security Features Active</h3>
          <ul>
            <li>JWT Access Token (15 min, in memory)</li>
            <li>Refresh Token (HttpOnly Cookie + Rotation)</li>
            <li>Token Reuse Detection</li>
            <li>RBAC (Role-Based Access Control)</li>
            <li>CSRF Protection</li>
            <li>Rate Limiting (Redis)</li>
            <li>Multi-device Sessions</li>
          </ul>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .layout {
        min-height: 100vh;
        background: #f5f7fa;
      }
      .navbar {
        background: #1a1a2e;
        color: #fff;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .brand {
        font-weight: 700;
        font-size: 1.25rem;
      }
      .nav-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .user-info {
        font-size: 0.9rem;
        opacity: 0.9;
      }
      .nav-link {
        color: #a0d2ff;
        text-decoration: none;
      }
      .btn-outline,
      .btn-danger {
        padding: 0.4rem 0.9rem;
        border-radius: 6px;
        border: 1px solid #fff;
        background: transparent;
        color: #fff;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-danger {
        border-color: #e74c3c;
        color: #e74c3c;
      }
      .content {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      h1 {
        color: #1a1a2e;
      }
      .card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
      }
      ul {
        padding-left: 1.25rem;
        line-height: 1.8;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: User | null = null;

  ngOnInit() {
    this.authService.me().subscribe({
      next: (u) => (this.user = u),
      error: () => this.router.navigate(['/login']),
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  logoutAll() {
    this.authService.logoutAll().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
