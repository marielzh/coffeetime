import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { SupabaseService, Profile, Review, Order } from '../../services/supabase.service';

type Tab = 'perfil' | 'pedidos' | 'resenas';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  supabase = inject(SupabaseService);

  activeTab  = signal<Tab>('perfil');
  loading    = signal(false);
  saving     = signal(false);
  successMsg = signal('');
  errorMsg   = signal('');

  // Perfil
  fullName = signal('');
  phone    = signal('');
  address  = signal('');

  // Pedidos
  orders  = signal<Order[]>([]);
  loadingOrders = signal(false);

  // Reseñas
  reviews = signal<Review[]>([]);
  loadingReviews = signal(false);

  async ngOnInit() {
    await this.loadProfile();
    await this.loadOrders();
    await this.loadReviews();
  }

  async loadProfile() {
    this.loading.set(true);
    const { data } = await this.supabase.getProfile();
    if (data) {
      this.fullName.set(data.full_name ?? '');
      this.phone.set(data.phone ?? '');
      this.address.set(data.address ?? '');
    }
    this.loading.set(false);
  }

  async loadOrders() {
    this.loadingOrders.set(true);
    const { data } = await this.supabase.getMyOrders();
    this.orders.set(data ?? []);
    this.loadingOrders.set(false);
  }

  async loadReviews() {
    this.loadingReviews.set(true);
    const { data } = await this.supabase.getMyReviews();
    this.reviews.set((data as Review[]) ?? []);
    this.loadingReviews.set(false);
  }

  async saveProfile() {
    if (!this.fullName()) {
      this.errorMsg.set('El nombre es obligatorio.');
      return;
    }
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const { error } = await this.supabase.upsertProfile({
      full_name: this.fullName(),
      phone:     this.phone(),
      address:   this.address()
    });

    if (error) {
      this.errorMsg.set('Error al guardar. Intenta de nuevo.');
    } else {
      this.successMsg.set('¡Perfil actualizado correctamente!');
      setTimeout(() => this.successMsg.set(''), 3000);
    }
    this.saving.set(false);
  }

  async deleteReview(reviewId: string) {
    const { error } = await this.supabase.deleteReview(reviewId);
    if (!error) {
      this.reviews.set(this.reviews().filter(r => r.id !== reviewId));
    }
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending:    'Pendiente',
      preparing:  'Preparando',
      delivered:  'Entregado',
      cancelled:  'Cancelado'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'status-pending',
      preparing: 'status-preparing',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return map[status] ?? '';
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getRatingIcon(star: number, rating: number): string {
    return star <= rating ? 'bi-star-fill' : 'bi-star';
  }
}