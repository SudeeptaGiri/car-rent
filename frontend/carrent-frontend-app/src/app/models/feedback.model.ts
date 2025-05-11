// models/feedback.model.ts
export interface Feedback {
  id?: string;
  feedbackId?: string; 
  carId: string;
  clientId: string;
  bookingId: string;
  author: string;
  authorImageUrl?: string;
  carRating: number;
  serviceRating: number;
  feedbackText: string;
  date?: Date;
  orderNumber?: string;
  carDetails?: string;
  carImage?: string;
}

export interface FeedbackResponse {
  message: string;
  feedback: {
    id: string;
    carRating: number;
    serviceRating: number;
    feedbackText: string;
    date: string;
  };
}

export interface FeedbackPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  pagination: FeedbackPagination;
}

export interface RecentFeedbackResponse {
  content: Feedback[];
}