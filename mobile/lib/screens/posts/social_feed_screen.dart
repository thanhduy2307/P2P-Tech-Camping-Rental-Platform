import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:velox_mobile/models/post.dart';
import 'package:velox_mobile/services/post_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/app_shell.dart';

class SocialFeedScreen extends StatefulWidget {
  const SocialFeedScreen({super.key});

  @override
  State<SocialFeedScreen> createState() => _SocialFeedScreenState();
}

class _SocialFeedScreenState extends State<SocialFeedScreen> {
  List<Post> _posts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _posts = await PostService.getAllPosts();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createPost() async {
    final titleCtl = TextEditingController();
    final contentCtl = TextEditingController();
    final picker = ImagePicker();
    List<XFile> selected = [];

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDState) => AlertDialog(
          title: const Text('Tạo bài viết'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtl, decoration: const InputDecoration(labelText: 'Tiêu đề', hintText: 'Nhập tiêu đề...')),
                const SizedBox(height: 8),
                TextField(controller: contentCtl, decoration: const InputDecoration(labelText: 'Nội dung', hintText: 'Nhập nội dung...'), maxLines: 4),
                const SizedBox(height: 8),
                if (selected.isNotEmpty)
                  SizedBox(
                    height: 80,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: selected.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (_, i) => ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(File(selected[i].path), width: 80, fit: BoxFit.cover),
                      ),
                    ),
                  ),
                TextButton.icon(
                  icon: const Icon(Icons.image),
                  label: const Text('Thêm ảnh'),
                  onPressed: () async {
                    final picked = await picker.pickMultiImage();
                    if (picked.isNotEmpty) setDState(() => selected = [...selected, ...picked]);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
            ElevatedButton(
              onPressed: () async {
                if (titleCtl.text.trim().isEmpty) {
                  UiHelper.showErrorToast(context, 'Vui lòng nhập tiêu đề');
                  return;
                }
                Navigator.pop(ctx);
                UiHelper.showLoading(context);
                try {
                  List<String> images = [];
                  if (selected.isNotEmpty) {
                    images = await UiHelper.imagesToBase64(selected);
                  }
                  await PostService.createPost({
                    'title': titleCtl.text.trim(),
                    'content': contentCtl.text.trim(),
                    'images': images,
                  });
                  if (!mounted) return;
                  UiHelper.hideLoading(context);
                  UiHelper.showSuccessToast(context, 'Đã đăng bài');
                  _load();
                } catch (e) {
                  if (mounted) {
                    UiHelper.hideLoading(context);
                    UiHelper.showErrorToast(context, e);
                  }
                }
              },
              child: const Text('Đăng'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showTopBar: true,
      showBottomNav: true,
      currentIndex: 0,
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: const Color(0xFF005236),
        onPressed: _createPost,
        child: const Icon(Icons.edit),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _posts.isEmpty
                ? ListView(children: const [
                    SizedBox(height: 120),
                    Center(child: Text('Chưa có bài viết nào.')),
                  ])
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
                    itemCount: _posts.length,
                    itemBuilder: (_, i) => _PostCard(
                      post: _posts[i],
                      onLike: () => _toggleLike(i),
                      onComment: () => _showCommentDialog(i),
                    ),
                  ),
      ),
    );
  }

  Future<void> _toggleLike(int i) async {
    try {
      await PostService.toggleLike(_posts[i].id);
      _load();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  void _showCommentDialog(int i) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bình luận'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'Nhập bình luận...'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
          TextButton(
            onPressed: () async {
              if (ctrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await PostService.comment(_posts[i].id, ctrl.text.trim());
                _load();
              } catch (e) {
                if (mounted) UiHelper.showErrorToast(context, e);
              }
            },
            child: const Text('Gửi'),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final Post post;
  final VoidCallback onLike;
  final VoidCallback onComment;

  const _PostCard({
    required this.post,
    required this.onLike,
    required this.onComment,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundImage: post.authorAvatar != null && !post.authorAvatar!.startsWith('data:')
                      ? NetworkImage(post.authorAvatar!)
                      : null,
                  child: post.authorAvatar == null || post.authorAvatar!.startsWith('data:')
                      ? const Icon(Icons.person, size: 18)
                      : null,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(post.authorName,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      if (post.createdAt.isNotEmpty)
                        Text(post.createdAt.substring(0, 10),
                            style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Title
          if (post.title.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 2),
              child: Text(post.title,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ),
          // Content
          if (post.content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 12, 6),
              child: Text(post.content, style: const TextStyle(fontSize: 13)),
            ),
          // Images
          if (post.images.isNotEmpty)
            SizedBox(
              height: 200,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: post.images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                  itemBuilder: (_, i) => ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: AssetImageWidget(
                      image: post.images[i],
                      width: 200,
                      fit: BoxFit.cover,
                      errWidget: Container(
                        color: Colors.grey[200],
                        width: 200,
                        child: const Icon(Icons.broken_image),
                      ),
                    ),
                  ),
              ),
            ),
          // Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 4, 4, 4),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    post.isLiked ? Icons.favorite : Icons.favorite_border,
                    color: post.isLiked ? Colors.red : null,
                    size: 20,
                  ),
                  onPressed: onLike,
                ),
                if (post.likesCount > 0)
                  Text('${post.likesCount}', style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.chat_bubble_outline, size: 20),
                  onPressed: onComment,
                ),
                if (post.commentsCount > 0)
                  Text('${post.commentsCount}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
