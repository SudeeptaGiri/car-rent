const { connectToDatabase } = require('../../utils/database');
const { createResponse } = require('../../utils/responseUtil');
const Report = require('../../models/reportsModel');
const Car = require('../../models/carModel');
const Booking = require('../../models/bookingModel');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const json2csv = require('json2csv').Parser;
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Initialize S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'eu-west-3',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
});

// S3 bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'team03backendbucket';

/**
 * Get reports based on filter criteria
 */
exports.getReports = async (event) => {
  try {
    await connectToDatabase();
    
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const { dateFrom, dateTo, locationId, carId, supportAgentId } = queryParams;
    
    // Build filter criteria
    const filter = {};
    
    if (dateFrom && dateTo) {
      filter.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    } else if (dateFrom) {
      filter.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.createdAt = { $lte: new Date(dateTo) };
    }
    
    if (locationId) filter.locationId = locationId;
    if (carId) filter.carId = carId;
    if (supportAgentId) filter.supportAgentId = supportAgentId;
    
    // Query the database
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    
    // Format the response
    const formattedReports = reports.map(report => ({
      reportId: report.reportId,
      bookingPeriod: report.bookingPeriod,
      carMillageStart: report.carMillageStart,
      carMillageEnd: report.carMillageEnd,
      carModel: report.carModel,
      carNumber: report.carNumber,
      carServiceRating: report.carServiceRating,
      madeBy: report.madeBy,
      supportAgent: report.supportAgent
    }));
    
    return createResponse(200, { content: formattedReports });
  } catch (error) {
    console.error('Error retrieving reports:', error);
    return createResponse(500, { message: 'Error retrieving reports', error: error.message });
  }
};

/**
 * Export reports in specified format
 */
exports.exportReports = async (event) => {
  try {
    await connectToDatabase();
    
    // Get extension from path parameters
    const extension = event.pathParameters.extension.toLowerCase();
    
    // Check if format is supported
    if (!['pdf', 'csv', 'excel'].includes(extension)) {
      return createResponse(400, { message: 'Unsupported export format. Supported formats: pdf, csv, excel' });
    }
    
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const { dateFrom, dateTo, locationId, carId, supportAgentId } = queryParams;
    
    // Build filter criteria
    const filter = {};
    
    if (dateFrom && dateTo) {
      filter.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    } else if (dateFrom) {
      filter.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.createdAt = { $lte: new Date(dateTo) };
    }
    
    if (locationId) filter.locationId = locationId;
    if (carId) filter.carId = carId;
    if (supportAgentId) filter.supportAgentId = supportAgentId;
    
    // Query the database
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    
    if (reports.length === 0) {
      return createResponse(404, { message: 'No reports found matching the criteria' });
    }
    
    // Format the report data
    const reportData = reports.map(report => ({
      reportId: report.reportId,
      bookingPeriod: report.bookingPeriod,
      carMillageStart: report.carMillageStart,
      carMillageEnd: report.carMillageEnd,
      carModel: report.carModel,
      carNumber: report.carNumber,
      carServiceRating: report.carServiceRating || 'N/A',
      madeBy: report.madeBy,
      supportAgent: report.supportAgent || 'N/A',
      createdAt: report.createdAt.toISOString().split('T')[0]
    }));
    
    // Generate the report in the requested format
    let content;
    let contentType;
    let fileExtension;
    
    switch (extension) {
      case 'csv':
        content = await generateCsvReport(reportData);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'excel':
        content = await generateExcelReport(reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      case 'pdf':
        content = await generatePdfReport(reportData);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
    }
    
    // Upload to S3
    const timestamp = Date.now();
    const fileName = `aggregated_report_${timestamp}.${fileExtension}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: `reports/${fileName}`,
      Body: content,
      ContentType: contentType,
      ACL: 'public-read'
    };
    
    const s3UploadResult = await s3.upload(uploadParams).promise();
    
    return createResponse(201, {
      url: s3UploadResult.Location
    });
  } catch (error) {
    console.error(`Error exporting report:`, error);
    return createResponse(500, { message: 'Error exporting report', error: error.message });
  }
};

/**
 * Generate CSV report
 */
async function generateCsvReport(data) {
  try {
    const fields = ['reportId', 'bookingPeriod', 'carModel', 'carNumber', 
                    'carMillageStart', 'carMillageEnd', 'carServiceRating', 
                    'madeBy', 'supportAgent', 'createdAt'];
    
    const json2csvParser = new json2csv({ fields });
    return json2csvParser.parse(data);
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
}

/**
 * Generate Excel report
 */
async function generateExcelReport(data) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Car Rental Reports');
    
    // Add headers
    worksheet.columns = [
      { header: 'Report ID', key: 'reportId', width: 36 },
      { header: 'Booking Period', key: 'bookingPeriod', width: 20 },
      { header: 'Car Model', key: 'carModel', width: 20 },
      { header: 'Car Number', key: 'carNumber', width: 15 },
      { header: 'Mileage Start', key: 'carMillageStart', width: 15 },
      { header: 'Mileage End', key: 'carMillageEnd', width: 15 },
      { header: 'Service Rating', key: 'carServiceRating', width: 15 },
      { header: 'Made By', key: 'madeBy', width: 20 },
      { header: 'Support Agent', key: 'supportAgent', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 15 }
    ];
    
    // Add rows
    worksheet.addRows(data);
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Write to buffer
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}

/**
 * Generate PDF report
 */
async function generatePdfReport(data) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];
      
      pdfDoc.on('data', buffers.push.bind(buffers));
      pdfDoc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add title
      pdfDoc.fontSize(18).text('Car Rental Report', { align: 'center' });
      pdfDoc.moveDown();
      
      // Add date range if available
      const currentDate = new Date().toLocaleDateString();
      pdfDoc.fontSize(10).text(`Generated on: ${currentDate}`, { align: 'right' });
      pdfDoc.moveDown();
      
      // Create table headers
      const tableTop = 150;
      const headers = ['Booking Period', 'Car', 'Mileage Start', 'Mileage End', 'Rating', 'Made By'];
      const columnWidths = [100, 120, 80, 80, 60, 120];
      
      let currentX = 30;
      
      // Draw header cells
      headers.forEach((header, i) => {
        pdfDoc
          .rect(currentX, tableTop, columnWidths[i], 20)
          .fillAndStroke('#D3D3D3', '#000000');
        
        pdfDoc
          .fontSize(10)
          .fillColor('#000000')
          .text(header, currentX + 5, tableTop + 5, { width: columnWidths[i] - 10 });
        
        currentX += columnWidths[i];
      });
      
      // Draw data rows
      let currentY = tableTop + 20;
      
      data.forEach((report, index) => {
        if (currentY > 700) {
          pdfDoc.addPage();
          currentY = 50;
          
          // Redraw headers on new page
          currentX = 30;
          headers.forEach((header, i) => {
            pdfDoc
              .rect(currentX, currentY, columnWidths[i], 20)
              .fillAndStroke('#D3D3D3', '#000000');
            
            pdfDoc
              .fontSize(10)
              .fillColor('#000000')
              .text(header, currentX + 5, currentY + 5, { width: columnWidths[i] - 10 });
            
            currentX += columnWidths[i];
          });
          
          currentY += 20;
        }
        
        // Row background color alternating
        const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
        
        currentX = 30;
        
        // Draw row cells
        const rowValues = [
          report.bookingPeriod,
          `${report.carModel} (${report.carNumber})`,
          report.carMillageStart.toString(),
          report.carMillageEnd.toString(),
          report.carServiceRating,
          report.madeBy
        ];
        
        rowValues.forEach((value, i) => {
          pdfDoc
            .rect(currentX, currentY, columnWidths[i], 20)
            .fillAndStroke(rowColor, '#CCCCCC');
          
          pdfDoc
            .fontSize(9)
            .fillColor('#000000')
            .text(value, currentX + 5, currentY + 5, { width: columnWidths[i] - 10 });
          
          currentX += columnWidths[i];
        });
        
        currentY += 20;
      });
      
      // Add footer
      pdfDoc.fontSize(10).text('End of Report', { align: 'center' });
      
      pdfDoc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Create a new report
 * (Helper function for internal use)
 */
exports.createReport = async (bookingData, carData, userData) => {
  try {
    const reportId = uuidv4();
    
    // Calculate booking period
    const pickupDate = new Date(bookingData.pickupDateTime);
    const dropoffDate = new Date(bookingData.dropOffDateTime);
    
    const formatDate = (date) => {
      const options = { month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };
    
    const bookingPeriod = `${formatDate(pickupDate)} - ${formatDate(dropoffDate)}`;
    
    // Create new report
    const report = new Report({
      reportId,
      bookingId: bookingData._id,
      bookingPeriod,
      carId: carData._id,
      carModel: `${carData.brand} ${carData.model}`,
      carNumber: carData.carNumber,
      carMillageStart: carData.initialMileage || 0,
      carMillageEnd: carData.currentMileage || 0,
      locationId: bookingData.pickupLocationId,
      supportAgentId: bookingData.supportAgentId || null,
      supportAgent: bookingData.supportAgentName || null,
      clientId: userData._id,
      madeBy: `${userData.firstName} ${userData.lastName} (Client)`,
      carServiceRating: bookingData.rating || null
    });
    
    await report.save();
    return report;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

module.exports = exports;