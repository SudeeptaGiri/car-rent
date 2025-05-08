import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ClientUser } from '../models/users';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://nckijnfmi0.execute-api.eu-west-3.amazonaws.com/api'
    constructor(private http: HttpClient) { }

    getClients(): Observable<ClientUser[]> {
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