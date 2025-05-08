export interface User {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    imageUrl?: string;
    phoneNumber?: string;
    address?: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
    };
    createdAt?: string;
}

export interface ClientUser {
    userId: string;
    userName: string;
}