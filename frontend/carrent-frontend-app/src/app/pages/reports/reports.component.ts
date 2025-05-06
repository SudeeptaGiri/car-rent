import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Report } from '../../models/report.model';
import { ReportService } from '../../services/report.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reports: Report[] = [];
  reportForm: FormGroup;
  isAddingReport = false;
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  pageSize = 10;
  totalReports = 0;
  searchTerm = '';
  filteredReports: Report[] = [];

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.reportForm = this.fb.group({
      reportId: ['', Validators.required],
      bookingId: ['', Validators.required],
      bookingPeriod: ['', Validators.required],
      carId: ['', Validators.required],
      carModel: ['', Validators.required],
      carNumber: ['', Validators.required],
      carMillageStart: ['', [Validators.required, Validators.min(0)]],
      carMillageEnd: ['', [Validators.required, Validators.min(0)]],
      locationId: ['', Validators.required],
      supportAgentId: [''],
      supportAgent: [''],
      clientId: ['', Validators.required],
      madeBy: ['', Validators.required],
      carServiceRating: ['']
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.reportService.getAllReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.filterReports();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching reports', error);
        this.errorMessage = 'Failed to load reports. Please try again.';
        this.isLoading = false;
      }
    });
  }

  toggleAddReport(): void {
    this.isAddingReport = !this.isAddingReport;
    if (!this.isAddingReport) {
      this.reportForm.reset();
    }
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.reportService.createReport(this.reportForm.value).subscribe({
      next: () => {
        this.loadReports();
        this.toggleAddReport();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating report', error);
        this.errorMessage = 'Failed to create report. Please try again.';
        this.isLoading = false;
      }
    });
  }

  deleteReport(reportId: string): void {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    this.isLoading = true;
    this.reportService.deleteReport(reportId).subscribe({
      next: () => {
        this.loadReports();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting report', error);
        this.errorMessage = 'Failed to delete report. Please try again.';
        this.isLoading = false;
      }
    });
  }

  exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): void {
    this.isLoading = true;
    this.reportService.exportReport(reportId, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error exporting report as ${format}`, error);
        this.errorMessage = `Failed to export report as ${format}. Please try again.`;
        this.isLoading = false;
      }
    });
  }

  get paginatedReports(): Report[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReports.slice(startIndex, startIndex + this.pageSize);
  }
  


  filterReports(): void {
    if (!this.searchTerm) {
      this.filteredReports = this.reports;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredReports = this.reports.filter(report => 
        report.reportId.toLowerCase().includes(term) ||
        report.carModel.toLowerCase().includes(term) ||
        report.carNumber.toLowerCase().includes(term) ||
        report.madeBy.toLowerCase().includes(term)
      );
    }
    this.totalReports = this.filteredReports.length;
  }

  get pageNumbers(): number[] {
    const pageCount = Math.ceil(this.totalReports / this.pageSize);
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  validateMilage(): void {
    const start = this.reportForm.get('carMillageStart')?.value;
    const end = this.reportForm.get('carMillageEnd')?.value;
    
    if (start && end && parseInt(end) < parseInt(start)) {
      this.reportForm.get('carMillageEnd')?.setErrors({ invalidMilage: true });
    }
  }
}
