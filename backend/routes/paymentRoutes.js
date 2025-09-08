const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  submitDeposit,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  approvePayment,
  getMyDeposits,
  getReceipt
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf)$/i;
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Public routes (with authentication)
router.post('/deposit', protect, upload.single('receipt'), submitDeposit);
router.get('/my-deposits', protect, getMyDeposits);
router.get('/receipt/:filename', protect, getReceipt);

// Admin routes
router.get('/deposits', protect, authorize('admin'), getDeposits);
router.post('/approve', protect, authorize('admin'), approvePayment);
router.put('/deposits/:id/approve', protect, authorize('admin'), approveDeposit);
router.put('/deposits/:id/reject', protect, authorize('admin'), rejectDeposit);

module.exports = router;