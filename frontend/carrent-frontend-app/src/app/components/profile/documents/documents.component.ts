import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface DocumentFile {
  file: File | null;
  name: string;
  size: string;
  url?: string;
}

interface Documents {
  passport: {
    frontSide?: DocumentFile;
    backSide?: DocumentFile;
  };
  license: {
    frontSide?: DocumentFile;
    backSide?: DocumentFile;
  };
}

type DocumentType = 'passport' | 'license';
type DocumentSide = 'frontSide' | 'backSide';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  standalone:false
})
export class DocumentsComponent implements OnInit {
  apiUrl = 'https://u852mb2vza.execute-api.eu-west-3.amazonaws.com/api';
  documents: Documents = {
    passport: {},
    license: {}
  };
  isLoading = false;
  isSuccess = false;
  showDeleteModal = false;
  documentToDelete: { type: DocumentType; side: DocumentSide } | null = null;
  userId: string | null = null;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    // Get user ID from session storage
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userId = user.id || user._id;
      this.loadDocuments();
    }
  }
  
  loadDocuments(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.get<any>(`${this.apiUrl}/users/${this.userId}/documents`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Documents loaded:', response);
          
          if (response.passport?.frontSide) {
            this.documents.passport.frontSide = {
              file: null,
              name: 'ID Card front side.pdf',
              size: '200 KB',
              url: response.passport.frontSide
            };
          }
          
          if (response.passport?.backSide) {
            this.documents.passport.backSide = {
              file: null,
              name: 'ID Card back side.pdf',
              size: '200 KB',
              url: response.passport.backSide
            };
          }
          
          if (response.license?.frontSide) {
            this.documents.license.frontSide = {
              file: null,
              name: 'Licence front side.pdf',
              size: '200 KB',
              url: response.license.frontSide
            };
          }
          
          if (response.license?.backSide) {
            this.documents.license.backSide = {
              file: null,
              name: 'License back side.pdf',
              size: '200 KB',
              url: response.license.backSide
            };
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.isLoading = false;
        }
      });
  }
  
  onFileSelected(event: any, docType: DocumentType, side: DocumentSide): void {
    const file = event.target.files[0];
    if (file) {
      const fileSizeKB = Math.round(file.size / 1024);
      
      this.documents[docType][side] = {
        file: file,
        name: file.name,
        size: `${fileSizeKB} KB`
      };
    }
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
  
  onDrop(event: DragEvent, docType: DocumentType, side: DocumentSide): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileSizeKB = Math.round(file.size / 1024);
      
      this.documents[docType][side] = {
        file: file,
        name: file.name,
        size: `${fileSizeKB} KB`
      };
    }
  }
  
  openDeleteModal(docType: DocumentType, side: DocumentSide): void {
    this.documentToDelete = { type: docType, side: side };
    this.showDeleteModal = true;
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.documentToDelete = null;
  }
  
  confirmDelete(): void {
    if (!this.documentToDelete) return;
    
    const { type, side } = this.documentToDelete;
    
    if (this.documents[type][side]) {
      // If the document has a URL, it means it's stored on the server and needs to be deleted
      const docUrl = this.documents[type][side]?.url;
      
      if (docUrl && this.userId) {
        this.isLoading = true;
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        
        this.http.delete(`${this.apiUrl}/users/${this.userId}/documents/${type}/${side}`, { headers })
          .subscribe({
            next: () => {
              delete this.documents[type][side];
              this.isLoading = false;
              this.showDeleteModal = false;
              this.documentToDelete = null;
            },
            error: (error) => {
              console.error('Error deleting document:', error);
              this.isLoading = false;
              this.showDeleteModal = false;
              this.documentToDelete = null;
            }
          });
      } else {
        // If it's just a local file that hasn't been uploaded yet
        delete this.documents[type][side];
        this.showDeleteModal = false;
        this.documentToDelete = null;
      }
    }
  }
  
  saveChanges(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    
    const formData = new FormData();
    let hasFiles = false;
    
    // Add passport files to form data if they exist
    if (this.documents.passport.frontSide?.file) {
      formData.append('passportFront', this.documents.passport.frontSide.file);
      hasFiles = true;
    }
    
    if (this.documents.passport.backSide?.file) {
      formData.append('passportBack', this.documents.passport.backSide.file);
      hasFiles = true;
    }
    
    // Add license files to form data if they exist
    if (this.documents.license.frontSide?.file) {
      formData.append('licenseFront', this.documents.license.frontSide.file);
      hasFiles = true;
    }
    
    if (this.documents.license.backSide?.file) {
      formData.append('licenseBack', this.documents.license.backSide.file);
      hasFiles = true;
    }
    
    // If there are no files to upload, show success message and return
    if (!hasFiles) {
      this.isSuccess = true;
      this.isLoading = false;
      setTimeout(() => {
        this.isSuccess = false;
      }, 5000);
      return;
    }
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.post(`${this.apiUrl}/users/${this.userId}/documents`, formData, { headers })
      .subscribe({
        next: (response) => {
          console.log('Documents uploaded successfully:', response);
          this.isSuccess = true;
          this.isLoading = false;
          
          // Reset file objects since they've been uploaded
          if (this.documents.passport.frontSide?.file) {
            this.documents.passport.frontSide.file = null;
          }
          
          if (this.documents.passport.backSide?.file) {
            this.documents.passport.backSide.file = null;
          }
          
          if (this.documents.license.frontSide?.file) {
            this.documents.license.frontSide.file = null;
          }
          
          if (this.documents.license.backSide?.file) {
            this.documents.license.backSide.file = null;
          }
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.isSuccess = false;
          }, 5000);
        },
        error: (error) => {
          console.error('Error uploading documents:', error);
          this.isLoading = false;
        }
      });
  }
  
  closeAlert(): void {
    this.isSuccess = false;
  }
}