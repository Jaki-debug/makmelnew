import { ClientAddress } from './client-address';

export interface Client {
id: string;
email: string;
phone: string;
firstName: string;
lastName: string;
isActive?: boolean;
createdAt?: string;
updatedAt?: string;
addresses?: ClientAddress[];
}