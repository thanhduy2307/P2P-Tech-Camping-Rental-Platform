import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/models/user.dart';
import 'package:velox_mobile/services/user_service.dart';

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  User? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ModalRoute.of(context)?.settings.arguments as String?;
      if (id != null) _load(id);
    });
  }

  Future<void> _load(String id) async {
    try {
      final user = await UserService.getUserProfile(id);
      if (mounted) setState(() => _user = user);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.read<AuthProvider>().user?.id;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Thông tin người dùng')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Thông tin người dùng')),
        body: const Center(child: Text('Không tìm thấy người dùng')),
      );
    }
    final u = _user!;
    return Scaffold(
      appBar: AppBar(
        title: Text(u.name, style: const TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(
              height: 180,
              child: Stack(
                children: [
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      image: u.coverImage != null
                          ? DecorationImage(
                              image: CachedNetworkImageProvider(u.coverImage!),
                              fit: BoxFit.cover)
                          : null,
                    ),
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 0,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: const Color(0xFF10B981),
                          backgroundImage: u.avatar != null
                              ? CachedNetworkImageProvider(u.avatar!)
                              : null,
                          child: u.avatar == null
                              ? const Icon(Icons.person, size: 40, color: Color(0xFF005236))
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(u.name,
                                style: const TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans')),
                            Row(
                              children: [
                                Text(_roleLabel(u.role),
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF3C4A42))),
                                const SizedBox(width: 12),
                                const Icon(Icons.star, size: 16, color: Color(0xFF0058BE)),
                                const SizedBox(width: 2),
                                Text(u.reputationScore.toStringAsFixed(1),
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (u.bio != null && u.bio!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(u.bio!, style: const TextStyle(color: Color(0xFF3C4A42))),
              ),
            ],
            const SizedBox(height: 16),
            _InfoRow(icon: Icons.calendar_today, label: 'Tham gia', value: u.createdAt != null
                ? _formatDate(u.createdAt!)
                : '---'),
            if (u.addressString != null)
              _InfoRow(icon: Icons.location_on, label: 'Địa chỉ', value: u.addressString!),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String? role) {
    switch (role) {
      case 'lender': return 'Chủ thiết bị';
      case 'inspector': return 'Kiểm định viên';
      case 'admin': return 'Quản trị viên';
      default: return 'Người thuê';
    }
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF3C4A42)),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(color: Color(0xFF808080))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
