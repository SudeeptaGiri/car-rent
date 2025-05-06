import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report, ReportFormData } from '../models/report.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'https://u852mb2vza.execute-api.eu-west-3.amazonaws.com/api'; // Same base URL as other services

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Get all reports
  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/reports`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get a specific report by ID
  getReportById(reportId: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/reports/${reportId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Create a new report
  createReport(reportData: ReportFormData): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/reports`, reportData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Update an existing report
  updateReport(reportId: string, reportData: Partial<ReportFormData>): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/reports/${reportId}`, reportData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Delete a report
  deleteReport(reportId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reports/${reportId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Export report as PDF, CSV, or Excel
  exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}/export/${format}`, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
