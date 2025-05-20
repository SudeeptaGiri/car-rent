const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// Report routes - US-10: Reporting Interface
const adminAccess = [authenticate, authorize(['Admin'])];

router.get('/', adminAccess, reportController.getReports);  // Returns list of reports based on filtered parameters
router.get('/sales', adminAccess, reportController.getSalesReports);  // Returns list of reports based on filtered parameters
router.get('/performance', adminAccess, reportController.getPerformanceReports);  // Returns list of reports based on filtered parameters

router.post('/sales', adminAccess, reportController.saveSalesReport);  // Returns list of reports based on filtered parameters
router.post('/performance', adminAccess, reportController.savePerformanceReport);  // Returns list of reports based on filtered parameters


module.exports = router;