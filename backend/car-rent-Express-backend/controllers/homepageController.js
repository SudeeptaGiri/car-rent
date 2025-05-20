const mongoose = require('mongoose');

/**
 * Get About Us information
 * @route GET /home/about-us
 */
exports.getAboutUs = async (req, res, next) => {
  try {
    console.log('Getting About Us information');
    
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
      return res.status(200).json({
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
    return res.status(200).json({ content: formattedData });
    
  } catch (error) {
    console.error('Error getting About Us information:', error);
    next(error);
  }
};

/**
 * Get FAQ information
 * @route GET /home/faq
 */
exports.getFAQ = async (req, res, next) => {
  try {
    console.log('Getting FAQ information');
    
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
      return res.status(200).json({
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
    return res.status(200).json({ content: formattedData });
    
  } catch (error) {
    console.error('Error getting FAQ information:', error);
    next(error);
  }
};

/**
 * Get Locations information
 * @route GET /home/locations
 */
exports.getLocations = async (req, res, next) => {
  try {
    console.log('Getting locations information');
    
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
      return res.status(200).json({
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
    return res.status(200).json({ content: formattedData });
    
  } catch (error) {
    console.error('Error getting locations information:', error);
    next(error);
  }
};

/**
 * Get Popular Cars
 * @route GET /cars/popular
 * @param {string} category - Optional category filter (ECONOMY, COMFORT, BUSINESS, PREMIUM, CROSSOVER, MINIVAN, ELECTRIC)
 * @returns {Object} Popular cars data
 */
exports.getPopularCars = async (req, res, next) => {
  try {
    console.log('Getting popular cars');
    
    // Parse query parameters
    const category = req.query.category;
    
    console.log(`Category filter: ${category || 'none'}`);
    
    // Construct filter based on query parameters
    const filter = { 'popularity.isPopular': true };
    
    if (category) {
      filter.category = category.toUpperCase();
    }
    
    // Get limit parameter or default to 4
    const limit = parseInt(req.query.limit) || 4;
    
    // Get car model
    const Car = mongoose.model('Car');
    
    // Find popular cars
    const cars = await Car.find(filter)
      .sort({ 'popularity.rentCount': -1, rating: -1 })
      .limit(limit);
    
    if (!cars || cars.length === 0) {
      console.log('No popular cars found, returning default data');
      // Provide default data if none exists in database
      return res.status(200).json({
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
    return res.status(200).json({ content: formattedData });
    
  } catch (error) {
    console.error('Error getting popular cars:', error);
    next(error);
  }
};

// Optional: Add About Us information
exports.addAboutUs = async (req, res, next) => {
  try {
    console.log('Adding About Us information');
    
    const { title, numericValue, description, order } = req.body;
    
    // Validate required fields
    if (!title || !numericValue || !description) {
      return res.status(400).json({ message: 'Title, numericValue, and description are required' });
    }
    
    // Get or create AboutUs model
    const AboutUsSchema = new mongoose.Schema({
      title: String,
      numericValue: String,
      description: String,
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    });
    
    let AboutUs;
    try {
      AboutUs = mongoose.model('AboutUs');
    } catch (e) {
      AboutUs = mongoose.model('AboutUs', AboutUsSchema);
    }
    
    // Create new about us item
    const aboutUsItem = new AboutUs({
      title,
      numericValue,
      description,
      isActive: true,
      order: order || 0
    });
    
    // Save to database
    const savedItem = await aboutUsItem.save();
    
    return res.status(201).json({
      message: 'About Us information added successfully',
      item: {
        id: savedItem._id,
        title: savedItem.title,
        numericValue: savedItem.numericValue,
        description: savedItem.description
      }
    });
  } catch (error) {
    console.error('Error adding About Us information:', error);
    next(error);
  }
};

// Optional: Add FAQ
exports.addFAQ = async (req, res, next) => {
  try {
    console.log('Adding FAQ');
    
    const { question, answer, category, order } = req.body;
    
    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }
    
    // Get or create FAQ model
    const FAQSchema = new mongoose.Schema({
      question: String,
      answer: String,
      category: { type: String, default: 'General' },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    });
    
    let FAQ;
    try {
      FAQ = mongoose.model('FAQ');
    } catch (e) {
      FAQ = mongoose.model('FAQ', FAQSchema);
    }
    
    // Create new FAQ item
    const faqItem = new FAQ({
      question,
      answer,
      category: category || 'General',
      isActive: true,
      order: order || 0
    });
    
    // Save to database
    const savedItem = await faqItem.save();
    
    return res.status(201).json({
      message: 'FAQ added successfully',
      item: {
        id: savedItem._id,
        question: savedItem.question,
        answer: savedItem.answer,
        category: savedItem.category
      }
    });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    next(error);
  }
};

// Optional: Add Location
exports.addLocation = async (req, res, next) => {
  try {
    console.log('Adding Location');
    
    const { locationName, locationAddress, locationImageUrl, mapEmbedUrl } = req.body;
    
    // Validate required fields
    if (!locationName || !locationAddress) {
      return res.status(400).json({ message: 'Location name and address are required' });
    }
    
    // Get or create Location model
    const LocationSchema = new mongoose.Schema({
      locationName: String,
      locationAddress: String,
      locationImageUrl: String,
      mapEmbedUrl: String,
      locationId: String
    });
    
    let Location;
    try {
      Location = mongoose.model('Location');
    } catch (e) {
      Location = mongoose.model('Location', LocationSchema);
    }
    
    // Create new location
    const locationItem = new Location({
      locationName,
      locationAddress,
      locationImageUrl: locationImageUrl || '',
      mapEmbedUrl: mapEmbedUrl || '',
      locationId: new mongoose.Types.ObjectId().toString()
    });
    
    // Save to database
    const savedItem = await locationItem.save();
    
    return res.status(201).json({
      message: 'Location added successfully',
      item: {
        locationId: savedItem.locationId || savedItem._id.toString(),
        locationName: savedItem.locationName,
        locationAddress: savedItem.locationAddress,
        locationImageUrl: savedItem.locationImageUrl || '',
        mapEmbedUrl: savedItem.mapEmbedUrl || ''
      }
    });
  } catch (error) {
    console.error('Error adding Location:', error);
    next(error);
  }
};