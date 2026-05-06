import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  supabase = inject(SupabaseService);
  cart     = inject(CartService);
  private router = inject(Router);

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/']);
  }
}