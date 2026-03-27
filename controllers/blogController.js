const Blog = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isActive: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin operations
exports.adminGetBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (req.file) {
      blogData.image = req.file.path;
    } else {
      return res.status(400).json({ message: 'Blog image is required.' });
    }
    
    // Explicitly set isActive if provided as string
    if (typeof blogData.isActive === 'string') {
      blogData.isActive = blogData.isActive === 'true';
    }

    const blog = new Blog(blogData);
    const newBlog = await blog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists.' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (req.file) {
      blogData.image = req.file.path;
    }
    
    if (typeof blogData.isActive === 'string') {
      blogData.isActive = blogData.isActive === 'true';
    }

    // Force updatedAt update
    blogData.updatedAt = Date.now();
    
    // Manually handle slug update if title changed
    if (blogData.title) {
        blogData.slug = blogData.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, blogData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Blog not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
