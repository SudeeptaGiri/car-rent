import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '../../models/locations.model';
import { LocationService } from '../../services/locations.service';

@Component({
  selector: 'app-mapview',
  standalone: false,
  templateUrl: './mapview.component.html',
  styleUrls: ['./mapview.component.css']
})
export class MapviewComponent implements OnInit {
  locations: Location[] = [];
  selectedLocation: Location | null = null;
  safeMapUrl: SafeResourceUrl | null = null;
  loading: boolean = true;

  constructor(
    private locationService: LocationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loading = true;
    // Use LocationService instead of direct HttpClient
    this.locationService.getLocations().subscribe({
      next: (locations: any[]) => { // Added explicit type annotation
        console.log('Locations loaded:', locations);
        this.locations = locations;
        if (locations.length > 0) {
          this.selectLocation(locations[0]);
        }
        this.loading = false;
      },
      error: (error: any) => { // Added explicit type
        console.error('Error loading locations:', error);
        this.loading = false;
      }
    });
  }

  selectLocation(location: Location): void {
    this.selectedLocation = location;
    
    // Add marker to the map URL
    let mapUrl = location.mapEmbedUrl;
    
    // Check if URL already has markers
    if (!mapUrl.includes('markers=')) {
      // Determine the separator based on whether the URL already has parameters
      const separator = mapUrl.includes('?') ? '&' : '?';
      
      // Build the marker parameter with custom color, size, and label
      const markerParams = `markers=color:red%7Csize:large%7Clabel:${location.locationName.charAt(0)}%7C${location.lat},${location.lng}`;
      
      // Append the marker parameter to the URL
      mapUrl += `${separator}${markerParams}`;
    }
    
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  isSelected(location: Location): boolean {
    return this.selectedLocation?.locationId === location.locationId;
  }
}