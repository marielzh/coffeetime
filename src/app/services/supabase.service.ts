import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  items: any[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  role?: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
  products?: { name: string };
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  private _session = signal<Session | null>(null);
  private _profile = signal<Profile | null>(null);   // ← NUEVO

  readonly session    = this._session.asReadonly();
  readonly user       = computed(() => this._session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly profile    = this._profile.asReadonly();  // ← NUEVO
  readonly isAdmin    = computed(                    // ← NUEVO
    () => this._profile()?.role === 'admin'
  );

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
      if (data.session) this._loadProfile(); // ← NUEVO
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      if (session) {
        this._loadProfile();  // ← NUEVO
      } else {
        this._profile.set(null); // ← NUEVO: limpiar al cerrar sesión
      }
    });
  }

  // ── PRIVADO: carga perfil al iniciar sesión ── // ← NUEVO
private async _loadProfile() {
  try {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.user()!.id)
      .single();
    
    if (error) {
      console.error('Error cargando perfil:', error);
      // ← TEMPORAL: forzar admin para diagnóstico
      // this._profile.set({ id: this.user()!.id, role: 'admin' } as any);
      return;
    }
    this._profile.set(data ?? null);
    console.log('Perfil cargado:', data); // ← para ver en consola
  } catch(e) {
    console.error('Exception en _loadProfile:', e);
  }
}

  // ── AUTH ──────────────────────────────────────
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }
  signOut() {
    return this.supabase.auth.signOut();
  }

  // ── PRODUCTOS ─────────────────────────────────
  getProducts() {
    return this.supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('name');
  }

  // ── PEDIDOS ───────────────────────────────────
  createOrder(
    total: number,
    items: any[],
    notes?: string,
    name?: string,
    phone?: string,
    address?: string,
    paymentMethod?: string
  ) {
    return this.supabase
      .from('orders')
      .insert({
        user_id:        this.user()!.id,
        total,
        items,
        notes:          notes          ?? null,
        name:           name           ?? null,
        phone:          phone          ?? null,
        address:        address        ?? null,
        payment_method: paymentMethod  ?? 'efectivo',
        status:         'pending'
      })
      .select()
      .single();
  }

  getMyOrders() {
    return this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', this.user()!.id)
      .order('created_at', { ascending: false });
  }

  // ── PERFIL ────────────────────────────────────
  getProfile() {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.user()!.id)
      .single();
  }

  upsertProfile(profile: Partial<Profile>) {
    return this.supabase
      .from('profiles')
      .upsert({ ...profile, id: this.user()!.id })
      .select()
      .single();
  }

  // ── RESEÑAS ───────────────────────────────────
  getReviewsByProduct(productId: string) {
    return this.supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
  }

  getMyReviews() {
    return this.supabase
      .from('reviews')
      .select('*, products(name)')
      .eq('user_id', this.user()!.id)
      .order('created_at', { ascending: false });
  }

  createReview(productId: string, rating: number, comment: string) {
    return this.supabase
      .from('reviews')
      .insert({
        user_id:    this.user()!.id,
        product_id: productId,
        rating,
        comment
      })
      .select()
      .single();
  }

  deleteReview(reviewId: string) {
    return this.supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', this.user()!.id);
  }

  // ── ADMIN STATS ───────────────────────────────
  getAllOrders() {
    return this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
  }

  getAllProfiles() {
    return this.supabase
      .from('profiles')
      .select('id, full_name, phone, created_at, role')
      .order('created_at', { ascending: false });
  }

  
  getMyStats() {
    return this.supabase
      .from('orders')
      .select('total, created_at, status, items')
      .eq('user_id', this.user()!.id)
      .order('created_at', { ascending: false });
  }

  updateOrderStatus(orderId: string, newStatus: string) {
  return this.supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  }

  deleteOrder(orderId: string) {
    return this.supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
  }

  
}