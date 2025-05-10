const mongoose = require('mongoose');
const { createResponse } = require('../../utils/responseUtil');
const { connectToDatabase } = require('../../utils/database');
const { SalesReport, PerformanceReport } = require('../../models/reportsModel');
 
/**
 * Get reports data
 * @route GET /reports
 */
exports.getReports = async (event) => {
  try {
    console.log('Getting reports data');
    await connectToDatabase();
   
    const queryParams = event.queryStringParameters || {};
    const { location, periodStart, periodEnd, type = 'all' } = queryParams;
   
    console.log('Query parameters:', { location, periodStart, periodEnd, type });
   
    // Create filter objects for both report types
    const salesFilter = {};
    const performanceFilter = {};
   
    // Add location filter if provided
    if (location) {
      salesFilter.location = location;
      performanceFilter.location = location;
    }
   
    // Add date range filter if provided for sales reports
    if (periodStart) {
      salesFilter.periodStart = { $gte: new Date(periodStart) };
    }
   
    if (periodEnd) {
      salesFilter.periodEnd = {
        ...(salesFilter.periodEnd || {}),
        $lte: new Date(periodEnd)
      };
    }
   
    console.log('Applying filters:', {
      salesFilter,
      performanceFilter,
      type
    });
   
    let salesReports = [];
    let performanceReports = [];
   
    // Fetch reports based on type requested
    if (type === 'all' || type === 'sales') {
      salesReports = await SalesReport.find(salesFilter).sort({ periodStart: -1 });
      console.log(`Found ${salesReports.length} sales reports`);
    }
   
    if (type === 'all' || type === 'performance') {
      performanceReports = await PerformanceReport.find(performanceFilter).sort({ customerRating: -1 });
      console.log(`Found ${performanceReports.length} performance reports`);
    }
 
    // Format dates for frontend if using MongoDB data
    salesReports = salesReports.map(report => {
      if (report.toObject) {
        const reportObj = report.toObject();
        return {
          ...reportObj,
          periodStart: reportObj.periodStart ? reportObj.periodStart.toISOString().split('T')[0] : null,
          periodEnd: reportObj.periodEnd ? reportObj.periodEnd.toISOString().split('T')[0] : null
        };
      }
      return report;
    });
 
    // Return response
    return createResponse(200, {
      salesReports: salesReports || [],
      performanceReports: performanceReports || []
    });
   
  } catch (error) {
    console.error('Error getting reports data:', error);
    return createResponse(500, {
      message: 'Server error while retrieving reports data',
      error: error.message
    });
  }
};
 
/**
 * Get sales reports data
 * @route GET /reports/sales
 */
exports.getSalesReports = async (event) => {
  try {
    console.log('Getting sales reports data');
    await connectToDatabase();
   
    const queryParams = event.queryStringParameters || {};
    const { location, periodStart, periodEnd } = queryParams;
   
    // Create filter object
    const filter = {};
   
    // Add location filter if provided
    if (location) {
      filter.location = location;
    }
   
    // Add date range filter if provided
    if (periodStart) {
      filter.periodStart = { $gte: new Date(periodStart) };
    }
   
    if (periodEnd) {
      filter.periodEnd = {
        ...(filter.periodEnd || {}),
        $lte: new Date(periodEnd)
      };
    }
   
    console.log('Applying filters:', filter);
   
    // Fetch sales reports
    const salesReports = await SalesReport.find(filter).sort({ periodStart: -1 });
    console.log(`Found ${salesReports.length} sales reports`);
 
    // Format dates for frontend
    const formattedReports = salesReports.map(report => {
      if (report.toObject) {
        const reportObj = report.toObject();
        return {
          ...reportObj,
          periodStart: reportObj.periodStart ? reportObj.periodStart.toISOString().split('T')[0] : null,
          periodEnd: reportObj.periodEnd ? reportObj.periodEnd.toISOString().split('T')[0] : null
        };
      }
      return report;
    });
 
    // Return response
    return createResponse(200, { salesReports: formattedReports });
   
  } catch (error) {
    console.error('Error getting sales reports data:', error);
    return createResponse(500, {
      message: 'Server error while retrieving sales reports data',
      error: error.message
    });
  }
};
 
/**
 * Get performance reports data
 * @route GET /reports/performance
 */
exports.getPerformanceReports = async (event) => {
  try {
    console.log('Getting performance reports data');
    await connectToDatabase();
   
    const queryParams = event.queryStringParameters || {};
    const { location } = queryParams;
   
    // Create filter object
    const filter = {};
   
    // Add location filter if provided
    if (location) {
      filter.location = location;
    }
   
    console.log('Applying filters:', filter);
   
    // Fetch performance reports
    const performanceReports = await PerformanceReport.find(filter).sort({ customerRating: -1 });
    console.log(`Found ${performanceReports.length} performance reports`);
 
    // Return response
    return createResponse(200, { performanceReports });
   
  } catch (error) {
    console.error('Error getting performance reports data:', error);
    return createResponse(500, {
      message: 'Server error while retrieving performance reports data',
      error: error.message
    });
  }
};
 
/**
 * Save a new sales report
 * @route POST /reports/sales
 */
exports.saveSalesReport = async (event) => {
  try {
    console.log('Saving new sales report');
    await connectToDatabase();
   
    // Parse request body
    let reportData;
    try {
      reportData = JSON.parse(event.body);
      console.log('Received sales report data:', reportData);
    } catch (e) {
      console.error('Failed to parse request body:', e, 'Raw body:', event.body);
      return createResponse(400, {
        message: 'Invalid request body format',
        error: e.message,
        success: false
      });
    }
   
    // Format dates if they're provided as strings
    if (reportData.periodStart && typeof reportData.periodStart === 'string') {
      reportData.periodStart = new Date(reportData.periodStart);
    }
   
    if (reportData.periodEnd && typeof reportData.periodEnd === 'string') {
      reportData.periodEnd = new Date(reportData.periodEnd);
    }
   
    // Ensure numbers are correctly typed
    reportData.daysOfRent = Number(reportData.daysOfRent || 0);
    reportData.reservations = Number(reportData.reservations || 0);
    reportData.mileageStart = Number(reportData.mileageStart || 0);
    reportData.mileageEnd = Number(reportData.mileageEnd || 0);
    reportData.totalMileage = Number(reportData.totalMileage || 0);
    reportData.averageMileage = Number(reportData.averageMileage || 0);
   
    // Validate required fields
    const requiredFields = ['periodStart', 'periodEnd', 'location', 'carModel', 'carId', 'daysOfRent',
      'reservations', 'mileageStart', 'mileageEnd', 'totalMileage', 'averageMileage'];
    const missingFields = requiredFields.filter(field => reportData[field] === undefined || reportData[field] === null || reportData[field] === '');
   
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return createResponse(400, {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        success: false
      });
    }
   
    // Create and save new report
    const newReport = new SalesReport({
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
   
    console.log('Saving sales report to database');
   
    const savedReport = await newReport.save();
    console.log('Sales report saved with ID:', savedReport._id);
   
    return createResponse(201, {
      message: 'Sales report saved successfully',
      report: {
        ...savedReport.toObject(),
        periodStart: savedReport.periodStart.toISOString().split('T')[0],
        periodEnd: savedReport.periodEnd.toISOString().split('T')[0]
      },
      success: true
    });
   
  } catch (error) {
    console.error('Error saving sales report:', error);
    return createResponse(500, {
      message: 'Server error while saving sales report',
      error: error.message,
      success: false
    });
  }
};
 
/**
 * Save a new performance report
 * @route POST /reports/performance
 */
exports.savePerformanceReport = async (event) => {
  try {
    console.log('Saving new performance report');
    await connectToDatabase();
   
    // Parse request body
    let reportData;
    try {
      reportData = JSON.parse(event.body);
      console.log('Received performance report data:', reportData);
    } catch (e) {
      console.error('Failed to parse request body:', e, 'Raw body:', event.body);
      return createResponse(400, {
        message: 'Invalid request body format',
        error: e.message,
        success: false
      });
    }
   
    // Ensure numbers are correctly typed
    reportData.totalBookings = Number(reportData.totalBookings || 0);
    reportData.totalRevenue = Number(reportData.totalRevenue || 0);
    reportData.customerRating = Number(reportData.customerRating || 0);
    reportData.responseTime = Number(reportData.responseTime || 0);
    reportData.completionRate = Number(reportData.completionRate || 0);
   
    // Validate required fields
    const requiredFields = ['staffMember', 'position', 'location', 'totalBookings',
      'totalRevenue', 'customerRating', 'responseTime', 'completionRate'];
    const missingFields = requiredFields.filter(field => reportData[field] === undefined || reportData[field] === null || reportData[field] === '');
   
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return createResponse(400, {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        success: false
      });
    }
   
    // Create and save new report
    const newReport = new PerformanceReport({
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
   
    console.log('Saving performance report to database');
   
    const savedReport = await newReport.save();
    console.log('Performance report saved with ID:', savedReport._id);
   
    return createResponse(201, {
      message: 'Performance report saved successfully',
      report: savedReport.toObject(),
      success: true
    });
   
  } catch (error) {
    console.error('Error saving performance report:', error);
    return createResponse(500, {
      message: 'Server error while saving performance report',
      error: error.message,
      success: false
    });
  }
};
 
/**
 * Generate a PDF report
 * @route GET /reports/{format}
 */
exports.generateReport = async (event) => {
  try {
    console.log('Generate report request received');
    return createResponse(200, {
      message: 'Report generation is handled client-side',
      success: true
    });
  } catch (error) {
    console.error('Error in report generation endpoint:', error);
    return createResponse(500, {
      message: 'Server error in report generation endpoint',
      error: error.message,
      success: false
    });
  }
};