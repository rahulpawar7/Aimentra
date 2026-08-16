import { Request, Response } from 'express';
import { Blog } from '../models';
import { makeSlug, uniqueSlug } from '../utils/slug';

const ADMIN_ROLES = ['super_admin', 'admin', 'content_manager', 'finance_manager'];

export const listBlogs = async (req: Request, res: Response) => {
  try {
    const { status, category, search, page = 1, limit = 20, all } = req.query;
    const filter: any = {};
    if (all === 'true') {
      const role = req.user?.role;
      if (!role || !ADMIN_ROLES.includes(role)) {
        filter.status = 'published';
      }
    } else if (status) {
      filter.status = status;
    } else {
      filter.status = 'published';
    }
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Blog.countDocuments(filter),
    ]);
    res.json({ success: true, data: { posts, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug, status: 'published' });
    if (!post) return res.status(404).json({ success: false, error: { message: 'Post not found' } });
    post.viewCount += 1;
    await post.save();
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, coverImage, category, tags, status, seoTitle, seoDescription } = req.body;
    const slug = await uniqueSlug(Blog, title);
    const post = await Blog.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200),
      coverImage,
      author: req.user!.id,
      authorName: req.user!.email,
      category: category || 'General',
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : undefined,
      seoTitle,
      seoDescription,
      readTime: Math.ceil((content || '').split(/\s+/).length / 200),
    });
    res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: { message: 'Post not found' } });
    const { title, content, excerpt, coverImage, category, tags, status, seoTitle, seoDescription } = req.body;
    if (title) {
      post.title = title;
      post.slug = await uniqueSlug(Blog, title, post._id.toString());
    }
    if (content !== undefined) {
      post.content = content;
      post.readTime = Math.ceil(content.split(/\s+/).length / 200);
    }
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;
    if (status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    }
    await post.save();
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
