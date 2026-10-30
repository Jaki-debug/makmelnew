import {
ChangeDetectorRef,
Component,
EventEmitter,
OnInit,
Output
} from '@angular/core';

import { ClientCategoriesService } from '../services/client-categories';
import { Categorie } from '../models/categorie';

@Component({
selector: 'app-client-categories',
standalone: false,
templateUrl: './client-categories.html',
styleUrl: './client-categories.css'
})
export class ClientCategories implements OnInit {

@Output() categorieSelectionnee = new EventEmitter<string>();

categories: Categorie[] = [];

categoriesPrincipales: Categorie[] = [];

sousCategories: { [key: string]: Categorie[] } = {};

// Identifiant de la catégorie sélectionnée
categorieActive = '';

// Identifiants des catégories actuellement ouvertes
categoriesOuvertes: { [key: string]: boolean } = {};

chargement = true;

erreur = '';

constructor(
private clientCategoriesService: ClientCategoriesService,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerCategories();
}

/**

Charger les catégories depuis l'API.
*/
chargerCategories(): void {
this.chargement = true;
this.erreur = '';
this.clientCategoriesService.getCategories().subscribe({
  next: (response: any) => {
    console.log('RÉPONSE CATÉGORIES CLIENT :', response);

    const data = response?.data;

    let liste: any[] = [];

    if (Array.isArray(data)) {
      liste = data;
    } else if (Array.isArray(data?.items)) {
      liste = data.items;
    } else if (Array.isArray(data?.categories)) {
      liste = data.categories;
    } else if (Array.isArray(data?.data)) {
      liste = data.data;
    } else if (Array.isArray(response?.items)) {
      liste = response.items;
    } else if (Array.isArray(response?.categories)) {
      liste = response.categories;
    } else if (Array.isArray(response)) {
      liste = response;
    }

    this.categories = this.extraireCategories(liste);

    console.log(
      'CATÉGORIES NORMALISÉES :',
      this.categories
    );

    this.construireCategories();

    console.log(
      'CATÉGORIES PRINCIPALES :',
      this.categoriesPrincipales
    );

    console.log(
      'SOUS-CATÉGORIES :',
      this.sousCategories
    );

    this.categoriesOuvertes = {};
    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  },

  error: (error) => {
    console.error(
      'ERREUR CATÉGORIES CLIENT :',
      error
    );

    this.categories = [];
    this.categoriesPrincipales = [];
    this.sousCategories = {};
    this.categoriesOuvertes = {};

    this.erreur = 'Impossible de charger les catégories.';
    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  }
});

}

/**

Normaliser les catégories reçues depuis l'API.
Accepte les catégories imbriquées dans children ou subcategories.
*/
extraireCategories(liste: any[]): Categorie[] {
const resultat = new Map<string, Categorie>();
const parcourir = (
  elements: any[],
  parentIdHerite: string | null = null
): void => {
  for (const element of elements) {
    if (
      !element ||
      element.id == null ||
      !element.name
    ) {
      continue;
    }

    const id = String(element.id);

    const parentIdBrut =
      element.parentId ??
      element.parent?.id ??
      parentIdHerite ??
      null;

    const parentId =
      parentIdBrut == null
        ? null
        : String(parentIdBrut);

    const categorie: Categorie = {
      id,
      name: element.name,
      parentId,
      description: element.description ?? null,
      imageId: element.imageId ?? null,
      sortOrder: Number(element.sortOrder ?? 0),
      isActive: element.isActive !== false,
      parent: element.parent
        ? {
            ...element.parent,
            id: String(element.parent.id)
          }
        : null
    };

    if (categorie.isActive) {
      resultat.set(id, categorie);
    }

    const enfants =
      element.children ??
      element.subcategories ??
      element.subCategories ??
      element.sub_categories ??
      [];

    if (Array.isArray(enfants)) {
      parcourir(enfants, id);
    }
  }
};

parcourir(Array.isArray(liste) ? liste : []);

return Array.from(resultat.values()).sort(
  (a, b) => a.sortOrder - b.sortOrder
);

}

/**

Construire les catégories principales et leurs enfants.
*/
construireCategories(): void {
this.sousCategories = {};
const ids = new Set(
  this.categories.map(categorie => categorie.id)
);

this.categoriesPrincipales = this.categories.filter(
  categorie =>
    !categorie.parentId ||
    !ids.has(categorie.parentId)
);

for (const categorie of this.categories) {
  this.sousCategories[categorie.id] =
    this.categories
      .filter(
        enfant =>
          enfant.parentId === categorie.id &&
          enfant.id !== categorie.id
      )
      .sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
}

}

/**

Récupérer les sous-catégories directes.
*/
getSousCategories(categorie: Categorie): Categorie[] {
return this.sousCategories[categorie.id] || [];
}

/**

Déterminer le niveau hiérarchique d'une catégorie.
*/
getNiveauCategorie(categorie: Categorie): number {
let niveau = 0;
let parentId = categorie.parentId;
const parentsVisites = new Set<string>();
while (
  parentId &&
  !parentsVisites.has(parentId)
) {
  parentsVisites.add(parentId);

  const parent = this.categories.find(
    c => c.id === parentId
  );

  if (!parent) {
    break;
  }

  niveau++;
  parentId = parent.parentId;
}

return niveau;

}

/**

Ouvrir ou fermer une catégorie au clic.
*/
basculerCategorie(categorieId: string): void {
const enfants = this.sousCategories[categorieId] || [];
// Une catégorie sans enfants n'a rien à dérouler.
if (enfants.length === 0) {
  return;
}

this.categoriesOuvertes[categorieId] =
  !this.categoriesOuvertes[categorieId];

this.changeDetectorRef.detectChanges();

}

/**

Vérifier si une catégorie est ouverte.
*/
estCategorieOuverte(categorieId: string): boolean {
return this.categoriesOuvertes[categorieId] === true;
}

/**

Sélectionner toutes les catégories.
*/
selectionnerToutes(): void {
this.categorieActive = '';
this.categorieSelectionnee.emit('');
this.changeDetectorRef.detectChanges();

}

/**

Sélectionner une catégorie principale ou secondaire.
*/
selectionnerCategorie(categorie: Categorie): void {
this.categorieActive = categorie.id;
this.categorieSelectionnee.emit(categorie.id);
this.changeDetectorRef.detectChanges();

}

/**

Sélectionner une sous-catégorie.
*/
selectionnerSousCategorie(
sousCategorie: Categorie
): void {
this.categorieActive = sousCategorie.id;
this.categorieSelectionnee.emit(sousCategorie.id);
this.changeDetectorRef.detectChanges();

}

/**

Afficher le nom d'une catégorie.
*/
afficherNomCategorie(categorie: Categorie): string {
return categorie.name;
}

}