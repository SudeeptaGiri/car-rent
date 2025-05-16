import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ClientUser, User } from '../models/users';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://orhwpuluvf.execute-api.eu-west-3.amazonaws.com/api'
    constructor(private http: HttpClient) { }

    // Get current user from localStorage
    getCurrentUser(): User | null {
        const userJson = localStorage.getItem('user');
        if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            return null;
        }
        }
        return null;
    }

    getClients(): Observable<User[]> {
        console.log('Requesting clients from:', `${this.apiUrl}/users/clients`);
        return this.http.get<any[]>(`${this.apiUrl}/users/clients`)
        .pipe(
            map(response => {
                console.log('Raw response:', response);
                if (Array.isArray(response)) {
                    return response;
                }
                const typedResponse = response as any;
                if (typedResponse && typedResponse.content) {
                    return typedResponse.content;
                }
                console.error('Invalid response format:', response);
                return [];
            })
        );
    }
}