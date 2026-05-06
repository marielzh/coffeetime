import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private supabase = inject(SupabaseService);
  private router   = inject(Router);

  email      = signal('');
  password   = signal('');
  confirm    = signal('');
  loading    = signal(false);
  errorMsg   = signal('');
  successMsg = signal('');

  async register() {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (!this.email() || !this.password()) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }
    if (!this.email().includes('@') || !this.email().includes('.')) {
      this.errorMsg.set('Ingresa un correo electrónico válido.');
      return;
    }
    if (this.password() !== this.confirm()) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.password().length < 6) {
      this.errorMsg.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);

    const { data, error } = await this.supabase.signUp(
      this.email(),
      this.password()
    );

    if (error) {
      // Traducir errores comunes de Supabase
      if (error.message.includes('already registered')) {
        this.errorMsg.set('Este correo ya tiene una cuenta. Inicia sesión.');
      } else if (error.message.includes('valid')) {
        this.errorMsg.set('Correo no válido. Usa un correo real (ej: usuario@gmail.com).');
      } else if (error.message.includes('password')) {
        this.errorMsg.set('La contraseña debe tener al menos 6 caracteres.');
      } else {
        this.errorMsg.set('Error al crear cuenta: ' + error.message);
      }
      this.loading.set(false);
      return;
    }

    // Si no necesita confirmar email → redirigir directo
    if (data.session) {
      this.router.navigate(['/']);
    } else {
      this.successMsg.set('¡Cuenta creada! Ya puedes iniciar sesión.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
    this.loading.set(false);
  }
}