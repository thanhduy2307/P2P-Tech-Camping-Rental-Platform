const Post = require('../models/Post');
const Asset = require('../models/Asset');
const aiService = require('../services/aiService');

// @desc    Create a new PR post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, images, taggedAssets, productLink } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền tiêu đề và nội dung bài viết.' });
    }

    // Verify tagged assets exist
    if (taggedAssets && Array.isArray(taggedAssets)) {
      for (const assetId of taggedAssets) {
        const assetExists = await Asset.exists({ _id: assetId });
        if (!assetExists) {
          return res.status(400).json({ success: false, message: `Thiết bị được tag với ID ${assetId} không tồn tại.` });
        }
      }
    }

    const post = await Post.create({
      author: req.user._id,
      title,
      content,
      images: images || [],
      taggedAssets: taggedAssets || [],
      productLink: productLink || ''
    });

    res.status(201).json({
      success: true,
      message: 'Tạo bài viết PR thành công!',
      data: post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all posts (Timeline)
// @route   GET /api/posts
// @access  Public
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email role reputationScore avatar')
      .populate('taggedAssets', 'name category pricePerDay depositAmount images status')
      .populate('comments.user', 'name role avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get posts by user ID (User Personal Page Feed)
// @route   GET /api/posts/user/:userId
// @access  Public
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name email role reputationScore avatar')
      .populate('taggedAssets', 'name category pricePerDay depositAmount images status')
      .populate('comments.user', 'name role avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role reputationScore avatar')
      .populate('taggedAssets', 'name category pricePerDay depositAmount images status')
      .populate('comments.user', 'name role avatar');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const { title, content, images, taggedAssets, productLink } = req.body;
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    }

    // Check post owner
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài viết này.' });
    }

    // Verify tagged assets exist
    if (taggedAssets && Array.isArray(taggedAssets)) {
      for (const assetId of taggedAssets) {
        const assetExists = await Asset.exists({ _id: assetId });
        if (!assetExists) {
          return res.status(400).json({ success: false, message: `Thiết bị được tag với ID ${assetId} không tồn tại.` });
        }
      }
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.images = images || post.images;
    post.taggedAssets = taggedAssets || post.taggedAssets;
    post.productLink = productLink !== undefined ? productLink : post.productLink;

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài viết thành công!',
      data: post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    }

    // Check post owner or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài viết này.' });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa bài viết PR thành công.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Like on a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);

    if (likeIndex === -1) {
      // Like
      post.likes.push(req.user._id);
      await post.save();
      return res.status(200).json({ success: true, message: 'Đã thích bài viết.', likesCount: post.likes.length, isLiked: true });
    } else {
      // Unlike
      post.likes.splice(likeIndex, 1);
      await post.save();
      return res.status(200).json({ success: true, message: 'Đã bỏ thích bài viết.', likesCount: post.likes.length, isLiked: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.commentPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được bỏ trống.' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    }

    const newComment = {
      user: req.user._id,
      content
    };

    post.comments.push(newComment);
    await post.save();

    // Re-populate the comments with user details to send back
    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'name role avatar');

    res.status(201).json({
      success: true,
      message: 'Thêm bình luận thành công.',
      data: populatedPost.comments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI-assisted PR Content Generation
// @route   POST /api/posts/generate-ai-content
// @access  Private
exports.generateAIPostContent = async (req, res) => {
  try {
    const { assetId, userRequest } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID của thiết bị để sinh nội dung PR.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị để viết PR.' });
    }

    const aiContent = await aiService.generatePRContent(
      asset.name,
      asset.description || '',
      userRequest || ''
    );

    res.status(200).json({
      success: true,
      data: aiContent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
