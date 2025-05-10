import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Use dynamic imports to avoid issues with pdf and excel libraries
let pdfMake: any;
let pdfFonts: any;
let XLSX: any;

// Dynamically load PDF libraries when needed
async function loadPdfLibraries() {
  if (!pdfMake) {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    pdfMake = pdfMakeModule.default;
    pdfFonts = pdfFontsModule.default;
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
  return pdfMake;
}

// Dynamically load Excel library when needed
async function loadExcelLibrary() {
  if (!XLSX) {
    const XLSXModule = await import('xlsx');
    XLSX = XLSXModule.default;
  }
  return XLSX;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // Update with the current API endpoint
  private apiUrl = 'https://nhhdawlrb2.execute-api.eu-west-3.amazonaws.com/api';
  private lastReportType: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get reports from the API
   * @param location Optional location filter
   * @param periodStart Optional start date filter
   * @param periodEnd Optional end date filter
   * @param type Report type (sales, performance, or all)
   * @returns Observable with reports data
   */
  getReports(location?: string, periodStart?: string, periodEnd?: string, type: string = 'all'): Observable<any> {
    console.log('Fetching reports with filters:', { location, periodStart, periodEnd, type });
    
    // Build query params
    let params = new HttpParams();
    if (location) params = params.set('location', location);
    if (periodStart) params = params.set('periodStart', periodStart);
    if (periodEnd) params = params.set('periodEnd', periodEnd);
    if (type !== 'all') params = params.set('type', type);
    
    // Get auth headers
    const headers = this.authService.getAuthHeaders();
    console.log('Request headers:', headers);
    
    return this.http.get<any>(`${this.apiUrl}/reports`, { params, headers }).pipe(
      tap(response => {
        console.log('Reports data received:', {
          salesCount: response.salesReports?.length || 0,
          performanceCount: response.performanceReports?.length || 0
        });
      }),
      map(response => {
        // Ensure we have arrays even if the API returns null
        return {
          salesReports: response.salesReports || [],
          performanceReports: response.performanceReports || []
        };
      }),
      catchError(error => {
        console.error('Error fetching reports:', error);
        return of({ 
          salesReports: [],
          performanceReports: []
        });
      })
    );
  }

  /**
   * Save a sales report
   * @param reportData The sales report data to save
   * @returns Observable with the save result
   */
  saveSalesReport(reportData: any): Observable<any> {
    console.log('Saving sales report:', reportData);
    
    // Ensure dates are in ISO format
    if (reportData.periodStart && !(reportData.periodStart instanceof Date)) {
      reportData.periodStart = reportData.periodStart;
    }
    
    if (reportData.periodEnd && !(reportData.periodEnd instanceof Date)) {
      reportData.periodEnd = reportData.periodEnd;
    }
    
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/reports/sales`, reportData, { headers }).pipe(
      tap(response => console.log('Sales report saved successfully:', response)),
      catchError(error => {
        console.error('Error saving sales report:', error);
        return throwError(() => new Error(`Failed to save sales report: ${error.message || 'Unknown error'}`));
      })
    );
  }

  /**
   * Save a performance report
   * @param reportData The performance report data to save
   * @returns Observable with the save result
   */
  savePerformanceReport(reportData: any): Observable<any> {
    console.log('Saving performance report:', reportData);
    
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/reports/performance`, reportData, { headers }).pipe(
      tap(response => console.log('Performance report saved successfully:', response)),
      catchError(error => {
        console.error('Error saving performance report:', error);
        return throwError(() => new Error(`Failed to save performance report: ${error.message || 'Unknown error'}`));
      })
    );
  }

  /**
   * Export data to CSV format
   * @param data The report data to export
   * @param reportType The type of report 
   * @param location The location filter
   * @param period The period range
   */
  exportToCsv(data: any[], reportType: string, location: string, period: string): void {
    try {
      console.log(`Exporting ${reportType} to CSV format`);
      
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }
      
      // Get headers from the first data item
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add rows
      data.forEach(item => {
        const row = headers.map(header => {
          // Handle values with commas by quoting them
          const value = item[header] === undefined ? '' : item[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        });
        csvContent += row.join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType.replace(' ', '_')}_${location || 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV export completed');
    } catch (error) {
      console.error('Error generating CSV file:', error);
      alert('Failed to generate CSV file. See console for details.');
    }
  }

  /**
   * Export data to Excel format
   * @param data The report data to export
   * @param reportType The type of report 
   * @param location The location filter
   * @param period The period range
   */
  async exportToExcel(data: any[], reportType: string, location: string, period: string): Promise<void> {
    try {
      console.log(`Exporting ${reportType} to Excel format`);
      
      // Use dynamic import to load xlsx library
      const xlsx = await import('xlsx');
      
      // Create a worksheet from data
      const ws = xlsx.utils.json_to_sheet(data);
      
      // Add title and filters info
      xlsx.utils.sheet_add_aoa(ws, [
        [`${reportType} - ${location || 'All Locations'}`],
        [`Period: ${period}`],
        [`Generated: ${new Date().toLocaleString()}`],
        []  // Empty row before data
      ], { origin: 'A1' });
      
      // Create a workbook
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, reportType.replace(' ', '_'));
      
      // Generate Excel file
      xlsx.writeFile(wb, `${reportType.replace(' ', '_')}_${location || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('Excel export completed');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Failed to generate Excel file. See console for details.');
    }
  }

  /**
   * Export data to PDF format
   * @param data The report data to export
   * @param reportType The type of report 
   * @param title The title for the PDF
   * @param location The location filter
   * @param period The period range
   */
  async exportToPdf(data: any[], reportType: string, title: string, location: string, period: string): Promise<void> {
    try {
      console.log(`Exporting ${reportType} to PDF format`);
      
      // Dynamic import of pdfmake
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const pdfMake = pdfMakeModule.default;
      pdfMake.vfs = pdfFontsModule.default.vfs;
      
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }
      
      // Define table columns based on report type
      const columns = reportType === 'Sales report' 
        ? [
            { text: 'Period Start', style: 'tableHeader' },
            { text: 'Period End', style: 'tableHeader' },
            { text: 'Location', style: 'tableHeader' },
            { text: 'Car Model', style: 'tableHeader' },
            { text: 'Car ID', style: 'tableHeader' },
            { text: 'Days of Rent', style: 'tableHeader' },
            { text: 'Reservations', style: 'tableHeader' },
            { text: 'Mileage Start', style: 'tableHeader' },
            { text: 'Mileage End', style: 'tableHeader' },
            { text: 'Total Mileage', style: 'tableHeader' },
            { text: 'Average Mileage', style: 'tableHeader' }
          ]
        : [
            { text: 'Staff Member', style: 'tableHeader' },
            { text: 'Position', style: 'tableHeader' },
            { text: 'Location', style: 'tableHeader' },
            { text: 'Total Bookings', style: 'tableHeader' },
            { text: 'Total Revenue (€)', style: 'tableHeader' },
            { text: 'Customer Rating', style: 'tableHeader' },
            { text: 'Response Time (min)', style: 'tableHeader' },
            { text: 'Completion Rate (%)', style: 'tableHeader' }
          ];
  
      // Format the data rows - with null checks
      const rows = data.map(item => {
        if (reportType === 'Sales report') {
          return [
            this.formatDate(item.periodStart),
            this.formatDate(item.periodEnd),
            item.location || '',
            item.carModel || '',
            item.carId || '',
            item.daysOfRent || 0,
            item.reservations || 0,
            item.mileageStart || 0,
            item.mileageEnd || 0,
            item.totalMileage || 0,
            item.averageMileage || 0
          ];
        } else {
          return [
            item.staffMember || '',
            item.position || '',
            item.location || '',
            item.totalBookings || 0,
            item.totalRevenue || 0,
            item.customerRating || 0,
            item.responseTime || 0,
            item.completionRate || 0
          ];
        }
      });
  
      // Create document definition
      const docDefinition = {
        content: [
          { text: title, style: 'header' },
          { text: `Location: ${location || 'All Locations'}`, style: 'subheader' },
          { text: `Period: ${period}`, style: 'subheader' },
          { text: `Generated: ${new Date().toLocaleString()}`, style: 'subheader' },
          { text: ' ', style: 'spacer' },
          {
            table: {
              headerRows: 1,
              body: [columns, ...rows]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          subheader: {
            fontSize: 12,
            margin: [0, 5, 0, 5] as [number, number, number, number]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'black'
          },
          spacer: {
            margin: [0, 10, 0, 0] as [number, number, number, number]
          }
        },
        defaultStyle: {
          fontSize: 9
        }
      };
  
      // Generate PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.download(`${reportType.replace(' ', '_')}_${location || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('PDF export completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. See console for details.');
    }
  }

  // Helper method to format dates for display
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) 
        ? dateStr 
        : `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
    } catch (e) {
      console.warn('Date formatting error:', e);
      return dateStr || '';
    }
  }
}