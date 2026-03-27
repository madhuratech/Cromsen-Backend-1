const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin only: Get all blogs (including draft/unlisted)
router.get('/admin', protect, adminOnly, blogController.adminGetBlogs);

// Public routes
router.get('/', blogController.getBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Admin only: Mutating routes
router.post('/', protect, adminOnly, upload.single('image'), blogController.createBlog);
router.put('/:id', protect, adminOnly, upload.single('image'), blogController.updateBlog);
router.delete('/:id', protect, adminOnly, blogController.deleteBlog);


module.exports = router;
