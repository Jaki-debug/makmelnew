import { Component, OnDestroy, OnInit } from '@angular/core';

import {
  PreferencesSon,
  SONS,
  TypeSon,
  creerContexteAudio,
  ecrirePreferencesSon,
  jouerSonNotification,
  lirePreferencesSon
} from '../services/son-notification-parametrage';

@Component({
  selector: 'app-parametres-backoffice',
  standalone: false,
  templateUrl: './parametres-backoffice.html',
  styleUrl: './parametres-backoffice.css'
})
export class ParametresBackoffice implements OnInit, OnDestroy {

  // Apparence
  mode = 'light';
  densite = 'standard';

  // Son des notifications
  readonly sons = SONS;
  sonActif = true;
  sonType: TypeSon = 'carillon';
  sonVolume = 70;

  private contexteAudio: AudioContext | null = null;

  ngOnInit(): void {
    // Charger les préférences d'apparence
    this.mode =
      localStorage.getItem('backoffice-theme') || 'light';

    this.densite =
      localStorage.getItem('backoffice-density') || 'standard';

    // Charger les préférences sonores
    const son = lirePreferencesSon();

    this.sonActif = son.actif;
    this.sonType = son.type;
    this.sonVolume = son.volume;

    // Appliquer les préférences
    this.appliquerApparence();
  }

  ngOnDestroy(): void {
    try {
      this.contexteAudio?.close();
    } catch {
      // Ignorer les erreurs de fermeture audio
    }

    this.contexteAudio = null;
  }

  // ============================================================
  // APPARENCE
  // ============================================================

  enregistrerPreferences(): void {
    localStorage.setItem('backoffice-theme', this.mode);
    localStorage.setItem('backoffice-density', this.densite);

    this.appliquerApparence();
  }

  changerMode(mode: string): void {
    this.mode = mode;
    this.enregistrerPreferences();
  }

  changerDensite(densite: string): void {
    this.densite = densite;
    this.enregistrerPreferences();
  }

  appliquerApparence(): void {
    document.body.classList.toggle(
      'theme-dark',
      this.mode === 'dark'
    );

    document.body.classList.toggle(
      'density-compact',
      this.densite === 'compact'
    );
  }

  // ============================================================
  // SON DES NOTIFICATIONS
  // ============================================================

  enregistrerSon(): void {
    const preferences: PreferencesSon = {
      actif: this.sonActif,
      type: this.sonType,
      volume: Number(this.sonVolume)
    };

    ecrirePreferencesSon(preferences);
  }

  changerSonActif(actif: boolean): void {
    this.sonActif = actif;
    this.enregistrerSon();

    if (actif) {
      this.ecouterSon();
    }
  }

  changerTypeSon(): void {
    this.enregistrerSon();

    if (this.sonActif) {
      this.ecouterSon();
    }
  }

  // Appelé lorsque l'utilisateur relâche le curseur de volume.
  changerVolume(): void {
    this.sonVolume = Number(this.sonVolume);
    this.enregistrerSon();

    if (this.sonActif) {
      this.ecouterSon();
    }
  }

  // Aperçu du son après une interaction de l'utilisateur.
  ecouterSon(): void {
    if (!this.sonActif) {
      return;
    }

    if (!this.contexteAudio) {
      this.contexteAudio = creerContexteAudio();
    }

    if (this.contexteAudio) {
      jouerSonNotification(
        this.contexteAudio,
        this.sonType,
        Number(this.sonVolume)
      );
    }
  }
}