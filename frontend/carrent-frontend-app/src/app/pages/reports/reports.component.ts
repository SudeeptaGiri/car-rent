// app-reports.component.ts
import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../services/reports.service';

interface ReportData {
  periodStart: string;
  periodEnd: string;
  location: string;
  carModel: string;
  carId: string;
  daysOfRent: number;
  reservations: number;
  mileageStart: number;
  mileageEnd: number;
  totalMileage: number;
  averageMileage: number;
}

interface PerformanceData {
  staffMember: string;
  position: string;
  location: string;
  totalBookings: number;
  totalRevenue: number;
  customerRating: number;
  responseTime: number; // in minutes
  completionRate: number; // percentage
}

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reportTypes: string[] = ['Sales report', 'Staff performance'];
  locations: string[] = ['Rome', 'Milan', 'Florence', 'Venice', 'Naples'];
  
  selectedReportType: string = 'Sales report';
  selectedPeriodStart: string = '';
  selectedPeriodEnd: string = '';
  selectedLocation: string = '';
  
  showModal: boolean = false;
  downloadMenuOpen: boolean = false;
  
  salesReportData: ReportData[] = [];
  performanceReportData: PerformanceData[] = [];
  
  newReport: any = {};
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  lastReportType: string | null = null;

  constructor(private reportsService: ReportsService) { }

  ngOnInit(): void {
    // Initialize date fields with current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.selectedPeriodStart = this.formatDate(firstDay);
    this.selectedPeriodEnd = this.formatDate(lastDay);
    
    // Load reports data from API
    this.loadReports();
  }
  
  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading reports with filters:', {
      location: this.selectedLocation,
      periodStart: this.selectedPeriodStart,
      periodEnd: this.selectedPeriodEnd,
      reportType: this.selectedReportType
    });
    
    // Determine which report type to fetch
    const reportType = this.selectedReportType === 'Sales report' ? 'sales' : 
                      this.selectedReportType === 'Staff performance' ? 'performance' : 'all';
    
    this.reportsService.getReports(
      this.selectedLocation || undefined,
      this.selectedPeriodStart || undefined,
      this.selectedPeriodEnd || undefined,
      reportType
    ).subscribe({
      next: (data) => {
        console.log('Reports data received:', {
          salesCount: data.salesReports?.length || 0,
          performanceCount: data.performanceReports?.length || 0
        });
        
        this.salesReportData = data.salesReports || [];
        this.performanceReportData = data.performanceReports || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.errorMessage = 'Failed to load reports data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  
  displayDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) 
        ? dateStr 
        : `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
    } catch (e) {
      console.warn('Date display error:', e);
      return dateStr || '';
    }
  }
  
  openModal(): void {
    this.showModal = true;
    this.resetNewReport();
    console.log('Report creation modal opened');
  }
  
  closeModal(): void {
    this.showModal = false;
    console.log('Report creation modal closed');
  }
  
  toggleDownloadMenu(): void {
    this.downloadMenuOpen = !this.downloadMenuOpen;
  }
  
  resetNewReport(): void {
    if (this.selectedReportType === 'Sales report') {
      this.newReport = {
        periodStart: this.formatDate(new Date()),
        periodEnd: this.formatDate(new Date()),
        location: this.selectedLocation || this.locations[0],
        carModel: '',
        carId: '',
        daysOfRent: 0,
        reservations: 0,
        mileageStart: 0,
        mileageEnd: 0,
        totalMileage: 0,
        averageMileage: 0
      };
    } else {
      this.newReport = {
        staffMember: '',
        position: '',
        location: this.selectedLocation || this.locations[0],
        totalBookings: 0,
        totalRevenue: 0,
        customerRating: 0,
        responseTime: 0,
        completionRate: 0
      };
    }
    
    console.log('New report form reset with type:', this.selectedReportType);
  }
  
  calculateTotalMileage(): void {
    if (this.newReport.mileageEnd && this.newReport.mileageStart) {
      this.newReport.totalMileage = Math.max(0, this.newReport.mileageEnd - this.newReport.mileageStart);
      
      if (this.newReport.reservations > 0) {
        this.newReport.averageMileage = Math.round(this.newReport.totalMileage / this.newReport.reservations);
      } else {
        this.newReport.averageMileage = 0;
      }
      
      console.log('Calculated mileage:', {
        total: this.newReport.totalMileage,
        average: this.newReport.averageMileage
      });
    }
  }
  
  submitReport(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    console.log(`Submitting ${this.selectedReportType}:`, this.newReport);
    
    if (this.selectedReportType === 'Sales report') {
      this.reportsService.saveSalesReport(this.newReport).subscribe({
        next: (response) => {
          console.log('Sales report saved successfully:', response);
          this.successMessage = 'Sales report saved successfully!';
          // Reload data to show the new report
          this.loadReports();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving sales report:', error);
          this.errorMessage = `Failed to save sales report: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
    } else {
      this.reportsService.savePerformanceReport(this.newReport).subscribe({
        next: (response) => {
          console.log('Performance report saved successfully:', response);
          this.successMessage = 'Performance report saved successfully!';
          // Reload data to show the new report
          this.loadReports();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving performance report:', error);
          this.errorMessage = `Failed to save performance report: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
    }
  }
  
  getFilteredData(): any[] {
    return this.selectedReportType === 'Sales report' ? this.salesReportData : this.performanceReportData;
  }
  
  applyFilters(): void {
    console.log('Applying filters');
    // Reload data with new filters
    this.loadReports();
  }
  
  downloadReport(format: string): void {
    const data = this.getFilteredData();
    const reportType = this.selectedReportType;
    const title = reportType;
    const location = this.selectedLocation || 'All Locations';
    const period = `${this.displayDate(this.selectedPeriodStart)} - ${this.displayDate(this.selectedPeriodEnd)}`;
    
    console.log(`Downloading ${reportType} in ${format} format`);
    
    if (format === 'csv') {
      this.reportsService.exportToCsv(data, reportType, location, period);
    } else if (format === 'xls') {
      this.reportsService.exportToExcel(data, reportType, location, period);
    } else if (format === 'pdf') {
      this.reportsService.exportToPdf(data, reportType, title, location, period);
    }
    
    this.downloadMenuOpen = false;
  }
}