const mongoose = require('mongoose');
const { createResponse } = require('../../utils/responseUtil');
const { connectToDatabase } = require('../../utils/database');

/**
 * Get About Us information
 * @route GET /home/about-us
 */
exports.getAboutUs = async (event) => {
  try {
    console.log('Getting About Us information');
    await connectToDatabase();
    
    // Since there's no existing AboutUs model, let's create a schema for it
    const AboutUsSchema = new mongoose.Schema({
      title: String,
      numericValue: String,
      description: String,
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    });
    
    // Create or get model
    let AboutUs;
    try {
      AboutUs = mongoose.model('AboutUs');
    } catch (e) {
      AboutUs = mongoose.model('AboutUs', AboutUsSchema);
    }
    
    // Find active about us items, sorted by order
    const aboutUsData = await AboutUs.find({ isActive: true }).sort({ order: 1 });
    
    if (!aboutUsData || aboutUsData.length === 0) {
      console.log('No about us data found, returning default data');
      // Provide default data if none exists in database
      return createResponse(200, {
        content: [
          {
            title: 'years',
            numericValue: '15',
            description: 'in car rentals highlights a steadfast commitment to excellence, marked by a track record of trust and satisfaction among thousands of clients worldwide'
          },
          {
            title: 'cars',
            numericValue: '100+',
            description: 'in our fleet represent the pinnacle of automotive engineering, offering a diverse range of vehicles to suit every preference and requirement'
          },
          {
            title: 'locations',
            numericValue: '25',
            description: 'across the globe ensure that our services are accessible wherever your journey takes you, providing convenience and reliability at every destination'
          }
        ]
      });
    }
    
    // Format response according to the specified API schema
    const formattedData = aboutUsData.map(item => ({
      title: item.title,
      numericValue: item.numericValue,
      description: item.description
    }));
    
    console.log(`Returning ${formattedData.length} about us items`);
    return createResponse(200, { content: formattedData });
    
  } catch (error) {
    console.error('Error getting About Us information:', error);
    return createResponse(500, { 
      message: 'Server error while retrieving About Us information',
      error: error.message
    });
  }
};

/**
 * Get FAQ information
 * @route GET /home/faq
 */
exports.getFAQ = async (event) => {
  try {
    console.log('Getting FAQ information');
    await connectToDatabase();
    
    // Since there's no existing FAQ model, let's create a schema for it
    const FAQSchema = new mongoose.Schema({
      question: String,
      answer: String,
      category: { type: String, default: 'General' },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    });
    
    // Create or get model
    let FAQ;
    try {
      FAQ = mongoose.model('FAQ');
    } catch (e) {
      FAQ = mongoose.model('FAQ', FAQSchema);
    }
    
    // Find active FAQ items, sorted by category and order
    const faqData = await FAQ.find({ isActive: true }).sort({ category: 1, order: 1 });
    
    if (!faqData || faqData.length === 0) {
      console.log('No FAQ data found, returning default data');
      // Provide default data if none exists in database
      return createResponse(200, {
        content: [
          {
            question: 'What documents do I need to rent a car?',
            answer: 'To rent a car, you will need a valid driver\'s license, a credit card in your name, and a government-issued photo ID (such as a passport or national ID). International renters may also need to present an International Driving Permit (IDP) in addition to their home country driver\'s license.'
          },
          {
            question: 'Is there a security deposit required?',
            answer: 'Yes, a security deposit is typically required when renting a car. The amount varies depending on the vehicle type and rental duration. This deposit is usually held on your credit card and released after the vehicle is returned in the same condition it was rented.'
          },
          {
            question: 'Can I modify or cancel my reservation?',
            answer: 'Yes, you can modify or cancel your reservation through your account dashboard or by contacting our customer service. Modifications are subject to vehicle availability. Cancellations made at least 48 hours before the scheduled pickup time typically don\'t incur a fee.'
          }
        ]
      });
    }
    
    // Format response according to the specified API schema
    const formattedData = faqData.map(item => ({
      question: item.question,
      answer: item.answer
    }));
    
    console.log(`Returning ${formattedData.length} FAQ items`);
    return createResponse(200, { content: formattedData });
    
  } catch (error) {
    console.error('Error getting FAQ information:', error);
    return createResponse(500, { 
      message: 'Server error while retrieving FAQ information',
      error: error.message
    });
  }
};

/**
 * Get Locations information
 * @route GET /home/locations
 */
exports.getLocations = async (event) => {
  try {
    console.log('Getting locations information');
    await connectToDatabase();
    
    // Since there's no existing Location model, let's create a schema for it
    const LocationSchema = new mongoose.Schema({
      locationName: String,
      locationAddress: String,
      locationImageUrl: String,
      mapEmbedUrl: String,
      locationId: String
    });
    
    // Create or get model
    let Location;
    try {
      Location = mongoose.model('Location');
    } catch (e) {
      Location = mongoose.model('Location', LocationSchema);
    }
    
    // Get all locations from the database
    const locationData = await Location.find({});
    
    if (!locationData || locationData.length === 0) {
      console.log('No locations found, returning default data');
      // Provide default data if none exists in database
      return createResponse(200, {
        content: [
          {
            locationId: "681474ca1ed3224edf13e799",
            locationName: "Hyatt Hyderabad Gachibowli",
            locationAddress: "Road No 2, HUDA Techno Enclave, Hyderabad",
            locationImageUrl: "https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2017/08/29/1013/Hyatt-Hyderabad-P091-Exterior.jpg/Hyatt-Hyderabad-P091-Exterior.16x9.jpg",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.689922!3d17.4372"
          },
          {
            locationId: "681474ca1ed3224edf13e800",
            locationName: "Novotel Hyderabad Airport",
            locationAddress: "Rajiv Gandhi International Airport, Hyderabad",
            locationImageUrl: "https://www.novotelhyderabadairport.com/wp-content/uploads/sites/97/2019/11/exterior.jpg",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.8!4d78.4"
          }
        ]
      });
    }
    
    // Format response according to the specified API schema
    const formattedData = locationData.map(item => ({
      locationId: item.locationId || item._id.toString(),
      locationName: item.locationName,
      locationAddress: item.locationAddress,
      locationImageUrl: item.locationImageUrl || "",
      mapEmbedUrl: item.mapEmbedUrl || ""
    }));
    
    console.log(`Returning ${formattedData.length} locations`);
    return createResponse(200, { content: formattedData });
    
  } catch (error) {
    console.error('Error getting locations information:', error);
    return createResponse(500, { 
      message: 'Server error while retrieving locations information',
      error: error.message
    });
  }
};

/**
 * Get Popular Cars
 * @route GET /cars/popular
 * @param {string} category - Optional category filter (ECONOMY, COMFORT, BUSINESS, PREMIUM, CROSSOVER, MINIVAN, ELECTRIC)
 * @returns {Object} Popular cars data
 */
exports.getPopularCars = async (event) => {
  try {
    console.log('Getting popular cars');
    await connectToDatabase();
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const category = queryParams.category;
    
    console.log(`Category filter: ${category || 'none'}`);
    
    // Construct filter based on query parameters
    const filter = { 'popularity.isPopular': true };
    
    if (category) {
      filter.category = category.toUpperCase();
    }
    
    // Get limit parameter or default to 4
    const limit = parseInt(queryParams.limit) || 4;
    
    // Get car model
    const Car = mongoose.model('Car');
    
    // Find popular cars
    const cars = await Car.find(filter)
      .sort({ 'popularity.rentCount': -1, rating: -1 })
      .limit(limit);
    
    if (!cars || cars.length === 0) {
      console.log('No popular cars found, returning default data');
      // Provide default data if none exists in database
      return createResponse(200, {
        content: [
          {
            carId: "92c87432-3383-4328-85f8-7d20ba8715ec",
            model: "Audi A6 Quattro 2023",
            imageUrl: "https://application.s3.eu-central-1.amazonaws.com/img/cars/audi-A6-quattro-2023.jpg",
            pricePerDay: "180",
            location: "India, Hyderabad",
            status: "AVAILABLE",
            carRating: "4.5",
            serviceRating: "4.8"
          },
          {
            carId: "72c87432-3383-4328-85f8-7d20ba8715ec",
            model: "Audi A4 Sedan 2023",
            imageUrl: "https://application.s3.eu-central-1.amazonaws.com/img/cars/audi-a4-sedan-2023.jpg",
            pricePerDay: "120",
            location: "India, Delhi",
            status: "AVAILABLE",
            carRating: "4.7",
            serviceRating: "4.6"
          }
        ]
      });
    }
    
    // Format response according to the specified API schema
    const formattedData = cars.map(car => ({
      carId: car._id.toString(),
      model: `${car.brand} ${car.model} ${car.year}`,
      imageUrl: car.images && car.images.length > 0 ? 
        (typeof car.images[0] === 'string' ? car.images[0] : car.images[0].url) : 
        '',
      pricePerDay: car.price.toString(),
      location: car.location || 'India, Hyderabad',
      status: car.status || 'AVAILABLE',
      carRating: car.rating ? car.rating.toString() : '4.0',
      serviceRating: car.serviceRating ? car.serviceRating.toString() : '4.5'
    }));
    
    console.log(`Returning ${formattedData.length} popular cars`);
    return createResponse(200, { content: formattedData });
    
  } catch (error) {
    console.error('Error getting popular cars:', error);
    return createResponse(500, { 
      message: 'Server error while retrieving popular cars',
      error: error.message
    });
  }
};