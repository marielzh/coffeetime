import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private supabase = inject(SupabaseService);
  private router   = inject(Router);

  email    = signal('');
  password = signal('');
  loading  = signal(false);
  errorMsg = signal('');

  async login() {
    if (!this.email() || !this.password()) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    const { error } = await this.supabase.signIn(this.email(), this.password());

    if (error) {
      this.errorMsg.set(error.message);
      this.loading.set(false);
    } else {
      this.router.navigate(['/']);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}