const mongoose = require('mongoose');
const { SalesReport, PerformanceReport } = require('../models/reportsModel');

/**
 * Get reports data
 * @route GET /reports
 */
exports.getReports = async (req, res, next) => {
  try {
    console.log('Getting reports data');
    
    const { location, periodStart, periodEnd, type = 'all' } = req.query;
    
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
    return res.status(200).json({
      salesReports: salesReports || [],
      performanceReports: performanceReports || []
    });
    
  } catch (error) {
    console.error('Error getting reports data:', error);
    next(error);
  }
};

/**
 * Get sales reports data
 * @route GET /reports/sales
 */
exports.getSalesReports = async (req, res, next) => {
  try {
    console.log('Getting sales reports data');
    
    const { location, periodStart, periodEnd } = req.query;
    
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
    return res.status(200).json({ salesReports: formattedReports });
    
  } catch (error) {
    console.error('Error getting sales reports data:', error);
    next(error);
  }
};

/**
 * Get performance reports data
 * @route GET /reports/performance
 */
exports.getPerformanceReports = async (req, res, next) => {
  try {
    console.log('Getting performance reports data');
    
    const { location } = req.query;
    
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
    return res.status(200).json({ performanceReports });
    
  } catch (error) {
    console.error('Error getting performance reports data:', error);
    next(error);
  }
};

/**
 * Save a new sales report
 * @route POST /reports/sales
 */
exports.saveSalesReport = async (req, res, next) => {
  try {
    console.log('Saving new sales report');
    
    // Get report data from request body
    const reportData = req.body;
    console.log('Received sales report data:', reportData);
    
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
      return res.status(400).json({
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
    
    return res.status(201).json({
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
    next(error);
  }
};

/**
 * Save a new performance report
 * @route POST /reports/performance
 */
exports.savePerformanceReport = async (req, res, next) => {
  try {
    console.log('Saving new performance report');
    
    // Get report data from request body
    const reportData = req.body;
    console.log('Received performance report data:', reportData);
    
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
      return res.status(400).json({
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
    
    return res.status(201).json({
      message: 'Performance report saved successfully',
      report: savedReport.toObject(),
      success: true
    });
    
  } catch (error) {
    console.error('Error saving performance report:', error);
    next(error);
  }
};

/**
 * Generate a PDF report
 * @route GET /reports/:format
 */
exports.generateReport = async (req, res, next) => {
  try {
    console.log('Generate report request received');
    return res.status(200).json({
      message: 'Report generation is handled client-side',
      success: true
    });
  } catch (error) {
    console.error('Error in report generation endpoint:', error);
    next(error);
  }
};

/**
 * Delete a sales report
 * @route DELETE /reports/sales/:reportId
 */
exports.deleteSalesReport = async (req, res, next) => {
  try {
    console.log('Deleting sales report');
    
    const reportId = req.params.reportId;
    
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({
        message: 'Invalid report ID format',
        success: false
      });
    }
    
    const deletedReport = await SalesReport.findByIdAndDelete(reportId);
    
    if (!deletedReport) {
      return res.status(404).json({
        message: 'Sales report not found',
        success: false
      });
    }
    
    return res.status(200).json({
      message: 'Sales report deleted successfully',
      success: true
    });
    
  } catch (error) {
    console.error('Error deleting sales report:', error);
    next(error);
  }
};

/**
 * Delete a performance report
 * @route DELETE /reports/performance/:reportId
 */
exports.deletePerformanceReport = async (req, res, next) => {
  try {
    console.log('Deleting performance report');
    
    const reportId = req.params.reportId;
    
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({
        message: 'Invalid report ID format',
        success: false
      });
    }
    
    const deletedReport = await PerformanceReport.findByIdAndDelete(reportId);
    
    if (!deletedReport) {
      return res.status(404).json({
        message: 'Performance report not found',
        success: false
      });
    }
    
    return res.status(200).json({
      message: 'Performance report deleted successfully',
      success: true
    });
    
  } catch (error) {
    console.error('Error deleting performance report:', error);
    next(error);
  }
};

/**
 * Update a sales report
 * @route PUT /reports/sales/:reportId
 */
exports.updateSalesReport = async (req, res, next) => {
  try {
    console.log('Updating sales report');
    
    const reportId = req.params.reportId;
    const updateData = req.body;
    
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({
        message: 'Invalid report ID format',
        success: false
      });
    }
    
    // Format dates if they're provided as strings
    if (updateData.periodStart && typeof updateData.periodStart === 'string') {
      updateData.periodStart = new Date(updateData.periodStart);
    }
    
    if (updateData.periodEnd && typeof updateData.periodEnd === 'string') {
      updateData.periodEnd = new Date(updateData.periodEnd);
    }
    
    // Ensure numbers are correctly typed if provided
    if (updateData.daysOfRent !== undefined) updateData.daysOfRent = Number(updateData.daysOfRent);
    if (updateData.reservations !== undefined) updateData.reservations = Number(updateData.reservations);
    if (updateData.mileageStart !== undefined) updateData.mileageStart = Number(updateData.mileageStart);
    if (updateData.mileageEnd !== undefined) updateData.mileageEnd = Number(updateData.mileageEnd);
    if (updateData.totalMileage !== undefined) updateData.totalMileage = Number(updateData.totalMileage);
    if (updateData.averageMileage !== undefined) updateData.averageMileage = Number(updateData.averageMileage);
    
    // Update the timestamp
    updateData.updatedAt = new Date();
    
    const updatedReport = await SalesReport.findByIdAndUpdate(
      reportId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedReport) {
      return res.status(404).json({
        message: 'Sales report not found',
        success: false
      });
    }
    
    return res.status(200).json({
      message: 'Sales report updated successfully',
      report: {
        ...updatedReport.toObject(),
        periodStart: updatedReport.periodStart.toISOString().split('T')[0],
        periodEnd: updatedReport.periodEnd.toISOString().split('T')[0]
      },
      success: true
    });
    
  } catch (error) {
    console.error('Error updating sales report:', error);
    next(error);
  }
};

/**
 * Update a performance report
 * @route PUT /reports/performance/:reportId
 */
exports.updatePerformanceReport = async (req, res, next) => {
  try {
    console.log('Updating performance report');
    
    const reportId = req.params.reportId;
    const updateData = req.body;
    
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({
        message: 'Invalid report ID format',
        success: false
      });
    }
    
    // Ensure numbers are correctly typed if provided
    if (updateData.totalBookings !== undefined) updateData.totalBookings = Number(updateData.totalBookings);
    if (updateData.totalRevenue !== undefined) updateData.totalRevenue = Number(updateData.totalRevenue);
    if (updateData.customerRating !== undefined) updateData.customerRating = Number(updateData.customerRating);
    if (updateData.responseTime !== undefined) updateData.responseTime = Number(updateData.responseTime);
    if (updateData.completionRate !== undefined) updateData.completionRate = Number(updateData.completionRate);
    
    // Update the timestamp
    updateData.updatedAt = new Date();
    
    const updatedReport = await PerformanceReport.findByIdAndUpdate(
      reportId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedReport) {
      return res.status(404).json({
        message: 'Performance report not found',
        success: false
      });
    }
    
    return res.status(200).json({
      message: 'Performance report updated successfully',
      report: updatedReport.toObject(),
      success: true
    });
    
  } catch (error) {
    console.error('Error updating performance report:', error);
    next(error);
  }
};