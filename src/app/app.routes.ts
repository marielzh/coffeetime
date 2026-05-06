import { Routes } from '@angular/router';
import { authGuard }  from './guards/auth.guard/auth.guard-guard';
import { adminGuard } from './guards/auth.guard/admin.guard';
import { Home }     from './pages/home/home';
import { Catalogo } from './pages/catalogo/catalogo';
import { Checkout } from './pages/checkout/checkout';
import { Login }    from './pages/login/login';
import { Register } from './pages/register/register';
import { Perfil }   from './pages/perfil/perfil';
import { Admin }    from './pages/admin/admin';

export const routes: Routes = [
  { path: '',         component: Home     },
  { path: 'catalogo', component: Catalogo },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  { path: 'login',    component: Login    },
  { path: 'register', component: Register },
  { path: 'perfil',   component: Perfil,  canActivate: [authGuard]  },
  { path: 'admin',    component: Admin,   canActivate: [adminGuard] },
  { path: '**',       redirectTo: ''      }
];