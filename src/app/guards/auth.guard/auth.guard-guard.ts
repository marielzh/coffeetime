import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router   = inject(Router);

  if (supabase.isLoggedIn()) return true;
  return router.navigate(['/login']);
};