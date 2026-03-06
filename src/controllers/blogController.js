const blog = require('../models/Blog');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');


const blogController = {
  async create(req, res) {
    try {
      let { title, slug, meta_title, meta_description, status, content } = req.body;
      
      if (typeof content === 'string') {
        content = JSON.parse(content);
      }

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "blogs",
          resource_type: "image",
        });
        
        const thumbnail = result.secure_url;
        fs.unlinkSync(req.file.path);
        
        const newBlog = await blog.create({
          title,
          slug,
          meta_title,
          meta_description,
          status,
          content,
          thumbnail
        });
        return res.status(201).json(newBlog);
      }

      const newBlog = await blog.create({
        title,
        slug,
        meta_title,
        meta_description,
        status,
        content
      });
      res.status(201).json(newBlog);
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async getAll(req, res) {
    try {
        const blogs = await blog.getAll();
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    },
    async getById(req, res) {
      try {
          const blogPost = await blog.getById(req.params.id);
          if (!blogPost) {
              return res.status(404).json({ error: 'Blog post not found' });
          }
          res.json(blogPost);
      } catch (error) {
          console.error('Error fetching blog post:', error);
          res.status(500).json({ error: 'Internal server error' });
      }
    },
    async update(req, res) {
        try {
            const updatedBlog = await blog.update(req.params.id, req.body);
            if (!updatedBlog) {
                return res.status(404).json({ error: 'Blog post not found' });
            }
            res.json(updatedBlog);
        } catch (error) {
            console.error('Error updating blog post:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async delete(req, res) {
        try {
            const deletedBlog = await blog.delete(req.params.id);
            if (!deletedBlog) {
                return res.status(404).json({ error: 'Blog post not found' });
            }
            res.json({ message: 'Blog post deleted successfully' });
        } catch (error) {
            console.error('Error deleting blog post:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async getBySlug(req, res) {
        console.log("Fetching blog post by slug:", req.params.slug);
        try {
            const blogPost = await blog.getBySlug(req.params.slug);
            if (!blogPost) {
                return res.status(404).json({ error: 'Blog post not found' });
            }
            res.json(blogPost);
        } catch (error) {
            console.error('Error fetching blog post by slug:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
module.exports = blogController;