const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload');

// Internal/Admin routes first to avoid shadow by :slug
router.get('/admin', blogController.adminGetBlogs);

// Public routes
router.get('/', blogController.getBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Mutating routes
router.post('/', upload.single('image'), blogController.createBlog);
router.put('/:id', upload.single('image'), blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
