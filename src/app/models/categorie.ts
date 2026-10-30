export interface Categorie {
id: string;
name: string;
parentId: string | null;
description: string | null;
imageId: string | null;
sortOrder: number;
isActive: boolean;
parent?: Categorie | null;
}

export interface CategorieRequest {
name: string;
parentId?: string | null;
description?: string;
imageId?: string | null;
sortOrder?: number;
isActive?: boolean;
}

export interface CategoriesListResponse {
success: boolean;
data: {
items: Categorie[];
total: number;
page: number;
limit: number;
};
message?: string;
}

export interface CategorieResponse {
success: boolean;
data: Categorie;
message?: string;
}
