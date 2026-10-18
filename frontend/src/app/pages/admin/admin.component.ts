import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="layout">
      <nav class="navbar">
        <span class="brand">Admin Panel</span>
        <a routerLink="/dashboard" class="nav-link">← Back to Dashboard</a>
      </nav>
      <main class="content">
        <h1>All Users</h1>
        <div *ngIf="error" class="error">{{ error }}</div>
        <table *ngIf="users.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" [class.admin]="u.role === 'admin'">{{
                  u.role
                }}</span>
              </td>
              <td>{{ u.emailVerified ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
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
      .nav-link {
        color: #a0d2ff;
        text-decoration: none;
      }
      .content {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      table {
        width: 100%;
        background: #fff;
        border-radius: 10px;
        border-collapse: collapse;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      th,
      td {
        padding: 0.9rem 1.2rem;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      th {
        background: #f8f9fa;
        font-weight: 600;
      }
      .badge {
        background: #e8f0fe;
        color: #1a73e8;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      .badge.admin {
        background: #fce8e6;
        color: #d93025;
      }
      .error {
        color: #e74c3c;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  users: any[] = [];
  error = '';

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/auth/users`).subscribe({
      next: (data) => (this.users = data),
      error: (err) =>
        (this.error =
          err?.error?.message || 'Failed to load users (need ADMIN role)'),
    });
  }
}
