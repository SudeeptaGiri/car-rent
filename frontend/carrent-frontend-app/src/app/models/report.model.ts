export interface Report {
  _id?: string;
  reportId: string;
  bookingId: string;
  bookingPeriod: string;
  carId: string;
  carModel: string;
  carNumber: string;
  carMillageStart: number;
  carMillageEnd: number;
  locationId: string;
  supportAgentId?: string;
  supportAgent?: string;
  clientId: string;
  madeBy: string;
  carServiceRating?: string;
  exportedFileUrls?: {
    pdf?: string;
    csv?: string;
    excel?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportFormData {
  reportId: string;
  bookingId: string;
  bookingPeriod: string;
  carId: string;
  carModel: string;
  carNumber: string;
  carMillageStart: number;
  carMillageEnd: number;
  locationId: string;
  supportAgentId?: string;
  supportAgent?: string;
  clientId: string;
  madeBy: string;
  carServiceRating?: string;
}