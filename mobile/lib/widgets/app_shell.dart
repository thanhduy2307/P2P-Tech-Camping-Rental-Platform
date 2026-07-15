import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'brand_logo.dart';

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem(this.icon, this.label, this.route);
}

const List<_NavItem> _navItems = [
  _NavItem(Icons.explore_outlined, 'Khám phá', '/browse'),
  _NavItem(Icons.search_outlined, 'Tìm kiếm', '/browse'),
  _NavItem(Icons.calendar_today_outlined, 'Thuê đồ', '/my-orders'),
  _NavItem(Icons.chat_bubble_outline, 'Tin nhắn', '/conversations'),
  _NavItem(Icons.person_outline, 'Cá nhân', '/profile'),
];

class VeloxBottomNav extends StatelessWidget {
  final int currentIndex;
  final void Function(int)? onTap;

  const VeloxBottomNav({super.key, required this.currentIndex, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: Color(0x140B1C30))),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_navItems.length, (i) {
              final item = _navItems[i];
              final active = i == currentIndex;
              return Expanded(
                child: InkWell(
                  onTap: () => onTap?.call(i),
                  borderRadius: BorderRadius.circular(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: active ? AppTheme.primaryContainer.withOpacity(0.12) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          item.icon,
                          color: active ? AppTheme.primary : AppTheme.onSurfaceVariant,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                          color: active ? AppTheme.primary : AppTheme.onSurfaceVariant,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class MainScaffold extends StatelessWidget {
  final Widget body;
  final int currentIndex;
  final bool showTopBar;
  final Widget? floatingActionButton;
  final bool showBottomNav;

  const MainScaffold({
    super.key,
    required this.body,
    this.currentIndex = 0,
    this.showTopBar = true,
    this.floatingActionButton,
    this.showBottomNav = true,
  });

  void _onNavTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    final route = _navItems[index].route;
    if (index == 1) {
      // Tìm kiếm shares browse route
      Navigator.pushReplacementNamed(context, route);
      return;
    }
    Navigator.pushReplacementNamed(context, route);
  }

  @override
  Widget build(BuildContext context) {
    final appBar = showTopBar
        ? PreferredSize(
            preferredSize: const Size.fromHeight(64),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.surface.withOpacity(0.85),
                border: const Border(bottom: BorderSide(color: Color(0x140B1C30))),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      const BrandLogo(size: 26),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.receipt_long_outlined),
                        color: AppTheme.onSurface,
                        onPressed: () => Navigator.pushNamed(context, '/my-orders'),
                        tooltip: 'Đơn thuê',
                      ),
                      IconButton(
                        icon: const Icon(Icons.chat_bubble_outline),
                        color: AppTheme.onSurface,
                        onPressed: () => Navigator.pushNamed(context, '/conversations'),
                        tooltip: 'Tin nhắn',
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => Navigator.pushNamed(context, '/profile'),
                        child: CircleAvatar(
                          radius: 16,
                          backgroundColor: AppTheme.primaryContainer,
                          child: const Icon(Icons.person, color: AppTheme.onPrimaryContainer, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          )
        : null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: showBottomNav
          ? VeloxBottomNav(currentIndex: currentIndex, onTap: (i) => _onNavTap(context, i))
          : null,
    );
  }
}
