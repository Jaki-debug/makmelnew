import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
selector: 'app-sidebar',
standalone: false,
styleUrl: './sidebar.css',
templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit {

utilisateur: any = null;

constructor(
private auth: Auth,
private router: Router
) {}

ngOnInit(): void {

if (!this.auth.getToken()) {
  return;
}

this.chargerUtilisateur();

}

chargerUtilisateur(): void {

if (!this.auth.getToken()) {
  return;
}

this.auth.me().subscribe({

  next: (response) => {

    console.log(
      'Réponse /me :',
      response
    );

    this.utilisateur =
      response?.data || response;

    this.auth.setUtilisateur(
      this.utilisateur
    );
  },

  error: (error) => {

    console.error(
      'Erreur /me :',
      error
    );

    if (error.status === 401) {

      this.auth.clearSession();

      this.router.navigate([
        '/login'
      ]);
    }
  }

});

}

hasPermission(
permission: string
): boolean {

return this.auth.hasPermission(
  permission
);

}

seDeconnecter(): void {

console.log(
  'Déconnexion'
);

this.auth.logout().subscribe({

  next: () => {

    this.auth.clearSession();

    this.router.navigate([
      '/login'
    ]);
  },

  error: (error) => {

    console.error(
      'Erreur logout :',
      error
    );

    this.auth.clearSession();

    this.router.navigate([
      '/login'
    ]);
  }

});

}
}