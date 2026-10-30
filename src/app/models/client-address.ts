export interface ClientAddress {
id: string;
label: string;
recipientName: string;
phone: string;
addressLine1: string;
addressLine2?: string;
city: string;
region: string;
countryCode: string;
latitude?: number;
longitude?: number;
isDefault: boolean;
createdAt?: string;
updatedAt?: string;
}
