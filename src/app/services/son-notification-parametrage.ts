export type TypeSon = 'carillon' | 'bip' | 'cloche' | 'doux';

export interface PreferencesSon {
  actif: boolean;
  type: TypeSon;
  volume: number; // 0 à 100
}

export const SONS: { valeur: TypeSon; libelle: string }[] = [
  { valeur: 'carillon', libelle: 'Carillon' },
  { valeur: 'bip', libelle: 'Bip court' },
  { valeur: 'cloche', libelle: 'Cloche' },
  { valeur: 'doux', libelle: 'Doux' }
];

export const CLE_SON_ACTIF = 'notifications_son_active';
export const CLE_SON_TYPE = 'notifications_son_type';
export const CLE_SON_VOLUME = 'notifications_son_volume';
export const EVENEMENT_SON_MODIFIE = 'notifications:son-modifie';

interface Note {
  frequence: number;
  decalage: number;
  duree: number;
  forme: OscillatorType;
}

const NOTES: Record<TypeSon, Note[]> = {
  carillon: [
    { frequence: 1047, decalage: 0, duree: 0.3, forme: 'sine' },
    { frequence: 1319, decalage: 0.15, duree: 0.3, forme: 'sine' }
  ],
  bip: [
    { frequence: 880, decalage: 0, duree: 0.15, forme: 'square' }
  ],
  cloche: [
    { frequence: 784, decalage: 0, duree: 0.8, forme: 'triangle' },
    { frequence: 1568, decalage: 0, duree: 0.5, forme: 'sine' }
  ],
  doux: [
    { frequence: 523, decalage: 0, duree: 0.25, forme: 'sine' },
    { frequence: 659, decalage: 0.12, duree: 0.25, forme: 'sine' },
    { frequence: 784, decalage: 0.24, duree: 0.35, forme: 'sine' }
  ]
};

export function lirePreferencesSon(): PreferencesSon {
  const prefs: PreferencesSon = { actif: true, type: 'carillon', volume: 70 };

  try {
    prefs.actif = localStorage.getItem(CLE_SON_ACTIF) !== 'false';

    const type = localStorage.getItem(CLE_SON_TYPE) as TypeSon | null;
    if (type && NOTES[type]) {
      prefs.type = type;
    }

    const brut = localStorage.getItem(CLE_SON_VOLUME);
    const volume = Number(brut);
    if (brut !== null && !Number.isNaN(volume)) {
      prefs.volume = Math.min(100, Math.max(0, volume));
    }
  } catch {
    // stockage indisponible : valeurs par défaut
  }

  return prefs;
}

export function ecrirePreferencesSon(prefs: PreferencesSon): void {
  try {
    localStorage.setItem(CLE_SON_ACTIF, String(prefs.actif));
    localStorage.setItem(CLE_SON_TYPE, prefs.type);
    localStorage.setItem(CLE_SON_VOLUME, String(prefs.volume));
  } catch {
    // stockage indisponible
  }

  // Prévient le header (même onglet) pour qu'il se mette à jour.
  window.dispatchEvent(new CustomEvent(EVENEMENT_SON_MODIFIE));
}

export function creerContexteAudio(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;

    return new AudioCtx();
  } catch {
    return null;
  }
}

export function jouerSonNotification(
  ctx: AudioContext,
  type: TypeSon,
  volume: number
): void {
  const jouer = () => {
    try {
      const debut = ctx.currentTime;
      const crete = (Math.min(100, Math.max(0, volume)) / 100) * 0.5;

      if (crete <= 0) {
        return;
      }

      NOTES[type].forEach(note => {
        const oscillateur = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = debut + note.decalage;

        oscillateur.type = note.forme;
        oscillateur.frequency.value = note.frequence;

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(crete, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duree);

        oscillateur.connect(gain);
        gain.connect(ctx.destination);

        oscillateur.start(t0);
        oscillateur.stop(t0 + note.duree);
      });
    } catch {
      // son impossible : on ignore
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(jouer).catch(() => {});
  } else {
    jouer();
  }
}