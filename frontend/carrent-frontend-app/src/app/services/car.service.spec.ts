import { HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CarService } from "./car.service";
import { CarsResponse, BookingRequest, CarDetails, BookedDate, ReviewsData } from "../models/car.interface";

describe('CarService', () => {
    let service: CarService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [CarService]
        });
        service = TestBed.inject(CarService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should retrieve car details with navigation', () => {
        const mockResponse: CarsResponse = {
                    cars: [
                        { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } },
                        { id: '2', brand: 'Car 2', model: 'Model 2', year: 2023, price: 120, location: 'Location 2', rating: 4.7, category: 'Sedan', status: 'Available', images: [], specifications: { transmission: 'Manual', engine: '1.8L', fuelType: 'Diesel', seats: 4, fuelConsumption: '6.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
                    ],
            metadata: { totalCars: 2, totalPages: 1, currentPage: 0, pageSize: 2 }
        };

        service.getCarDetailsWithNavigation('1').subscribe(result => {
            expect(result.car?.id).toBe('1');
            expect(result.totalCars).toBe(2);
            expect(result.currentIndex).toBe(0);
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should retrieve the next car', () => {
        const mockResponse: CarsResponse = {
            cars: [
                { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } },
                { id: '2', brand: 'Car 2', model: 'Model 2', year: 2023, price: 120, location: 'Location 2', rating: 4.7, category: 'Sedan', status: 'Available', images: [], specifications: { transmission: 'Manual', engine: '1.8L', fuelType: 'Diesel', seats: 4, fuelConsumption: '6.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
            ],
            metadata: { totalCars: 2, totalPages: 1, currentPage: 0, pageSize: 2 }
        };

        service.getNextCar('1').subscribe(car => {
            expect(car?.id).toBe('2');
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should retrieve the previous car', () => {
        const mockResponse: CarsResponse = {
            cars: [
                { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } },
                { id: '2', brand: 'Car 2', model: 'Model 2', year: 2023, price: 120, location: 'Location 2', rating: 4.7, category: 'Sedan', status: 'Available', images: [], specifications: { transmission: 'Manual', engine: '1.8L', fuelType: 'Diesel', seats: 4, fuelConsumption: '6.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
            ],
            metadata: { totalCars: 2, totalPages: 1, currentPage: 0, pageSize: 2 }
        };

        service.getPreviousCar('2').subscribe(car => {
            expect(car?.id).toBe('1');
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should retrieve booked dates for a car', () => {
        const mockResponse: CarsResponse = {
                    cars: [
                        { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [{ startDate: '2023-01-01', startTime: '10:00', endDate: '2023-01-02', endTime: '10:00', bookingId: 'b1', userId: 'u1', status: 'confirmed' }], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
                    ],
            metadata: { totalCars: 1, totalPages: 1, currentPage: 0, pageSize: 1 }
        };

        service.getCarBookedDates('1').subscribe(bookedDates => {
            expect(bookedDates.length).toBe(1);
            expect(bookedDates[0].startDate).toBe('2023-01-01');
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should retrieve reviews for a car', () => {
        const mockResponse: CarsResponse = {
                    cars: [
                        { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [], reviews: { content: [{ id: 'r1', userName: 'John Doe', rating: 5, comment: 'Great car!', date: '2023-01-01', userAvatar: 'avatar.jpg' }], totalPages: 1, currentPage: 0, totalElements: 1 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
                    ],
            metadata: { totalCars: 1, totalPages: 1, currentPage: 0, pageSize: 1 }
        };

        service.getCarReviews('1').subscribe(reviews => {
            expect(reviews.content.length).toBe(1);
            expect(reviews.content[0].comment).toBe('Great car!');
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should create a booking', () => {
        const mockResponse: CarsResponse = {
                    cars: [
                        { id: '1', brand: 'Car 1', model: 'Model 1', year: 2023, price: 100, location: 'Location 1', rating: 4.5, category: 'SUV', status: 'Available', images: [], specifications: { transmission: 'Automatic', engine: '2.0L', fuelType: 'Gasoline', seats: 5, fuelConsumption: '7.5L/100km', features: [] }, bookedDates: [], reviews: { content: [], totalPages: 0, currentPage: 0, totalElements: 0 }, popularity: { rentCount: 0, viewCount: 0, favoriteCount: 0, isPopular: false } }
                    ],
            metadata: { totalCars: 1, totalPages: 1, currentPage: 0, pageSize: 1 }
        };

        const bookingRequest: BookingRequest = {
            carId: '1',
            startDate: '2023-01-01',
            startTime: '10:00',
            endDate: '2023-01-02',
            endTime: '10:00',
            userId: 'user1'
        };

        service.createBooking(bookingRequest).subscribe(result => {
            expect(result).toEqual(bookingRequest);
        });

        const req = httpMock.expectOne('assets/cars.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });
});