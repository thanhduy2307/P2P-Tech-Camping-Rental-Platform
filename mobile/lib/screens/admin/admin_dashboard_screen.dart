import 'package:flutter/material.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/models/order.dart';
import 'package:velox_mobile/services/admin_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  // Stats
  Map<String, dynamic>? _stats;
  bool _statsLoading = false;

  // Users
  List<dynamic> _users = [];
  bool _usersLoading = false;
  String _userRoleFilter = 'all';
  final _userSearch = TextEditingController();

  // Assets
  List<Asset> _assets = [];
  bool _assetsLoading = false;
  String _assetStatusFilter = 'all';

  // Orders
  List<Order> _orders = [];
  bool _ordersLoading = false;
  String _orderStatusFilter = 'all';

  // eKYC
  List<dynamic> _renterApps = [];
  List<dynamic> _lenderApps = [];
  bool _ekycLoading = false;

  // Withdrawals
  List<dynamic> _withdrawals = [];
  bool _withdrawalsLoading = false;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 6, vsync: this);
    _tab.addListener(() {
      if (_tab.indexIsChanging) return;
      _loadForTab(_tab.index);
    });
    _loadStats();
    _loadUsers();
  }

  @override
  void dispose() {
    _tab.dispose();
    _userSearch.dispose();
    super.dispose();
  }

  void _loadForTab(int i) {
    if (i == 1) _loadUsers();
    if (i == 2) _loadAssets();
    if (i == 3) _loadOrders();
    if (i == 4) _loadEkyc();
    if (i == 5) _loadWithdrawals();
  }

  Future<void> _loadStats() async {
    setState(() => _statsLoading = true);
    try {
      _stats = await AdminService.getStats();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _statsLoading = false);
    }
  }

  Future<void> _loadUsers() async {
    setState(() => _usersLoading = true);
    try {
      _users = await AdminService.getUsers(
        role: _userRoleFilter,
        search: _userSearch.text,
      );
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _usersLoading = false);
    }
  }

  Future<void> _loadAssets() async {
    setState(() => _assetsLoading = true);
    try {
      _assets = await AdminService.getAssets(status: _assetStatusFilter);
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _assetsLoading = false);
    }
  }

  Future<void> _loadOrders() async {
    setState(() => _ordersLoading = true);
    try {
      _orders = await AdminService.getOrders(status: _orderStatusFilter);
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _ordersLoading = false);
    }
  }

  Future<void> _loadEkyc() async {
    setState(() => _ekycLoading = true);
    try {
      _renterApps = await AdminService.getRenterApplications();
      _lenderApps = await AdminService.getLenderApplications();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _ekycLoading = false);
    }
  }

  Future<void> _loadWithdrawals() async {
    setState(() => _withdrawalsLoading = true);
    try {
      _withdrawals = await AdminService.getWithdrawals();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _withdrawalsLoading = false);
    }
  }

  Future<void> _verifyRenter(String id, String status) async {
    final confirmed = await EquipDialog.confirm(
      context,
      'Xác nhận',
      status == 'approved' ? 'Duyệt hồ sơ eKYC Renter này?' : 'Từ chối hồ sơ eKYC Renter này?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    );
    if (confirmed != true) return;
    try {
      await AdminService.verifyRenterApplication(id, status);
      if (!mounted) return;
      EquipDialog.success(context, status == 'approved' ? 'Đã duyệt eKYC Renter.' : 'Đã từ chối.');
      _loadEkyc();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _verifyLender(String id, String status) async {
    final confirmed = await EquipDialog.confirm(
      context,
      'Xác nhận',
      status == 'approved' ? 'Duyệt hồ sơ eKYC Lender này?' : 'Từ chối hồ sơ eKYC Lender này?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    );
    if (confirmed != true) return;
    try {
      await AdminService.verifyLenderApplication(id, status);
      if (mounted) EquipDialog.success(context, status == 'approved' ? 'Đã duyệt eKYC Lender.' : 'Đã từ chối.');
      _loadEkyc();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _verifyWithdrawal(String id, String status) async {
    final confirmed = await EquipDialog.confirm(
      context,
      'Xác nhận',
      status == 'approved' ? 'Duyệt yêu cầu rút tiền này?' : 'Từ chối yêu cầu rút tiền này?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    );
    if (confirmed != true) return;
    try {
      await AdminService.verifyWithdrawal(id, status);
      if (mounted) EquipDialog.success(context, status == 'approved' ? 'Đã duyệt rút tiền.' : 'Đã từ chối.');
      _loadWithdrawals();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _changeRole(String id, String role) async {
    final confirmed = await EquipDialog.confirm(
      context,
      'Xác nhận',
      'Bạn có chắc muốn đổi vai trò thành $role?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    );
    if (confirmed != true) return;
    try {
      await AdminService.updateUserRole(id, role);
      if (!mounted) return;
      UiHelper.showSuccessToast(context, 'Đã đổi vai trò thành $role.');
      _loadUsers();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _toggleBan(dynamic u) async {
    final banned = u.isBanned == true;
    final confirmed = await EquipDialog.confirm(
      context,
      banned ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?',
      'Bạn có chắc muốn ${banned ? 'mở khóa' : 'khóa'} tài khoản của ${u.name}?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    );
    if (confirmed != true) return;
    try {
      await AdminService.toggleBan(u.id);
      if (!mounted) return;
      UiHelper.showSuccessToast(context, banned ? 'Đã mở khóa.' : 'Đã khóa tài khoản.');
      _loadUsers();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  static String _fmt(dynamic v) =>
      UiHelper.formatVnd((v is num) ? v.toDouble() : 0.0);

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showTopBar: true,
      showBottomNav: false,
      showDrawer: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Bảng điều khiển Admin',
                    style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 22)),
                const SizedBox(height: 2),
                const Text('Quản trị hệ thống EquipPeer',
                    style: TextStyle(color: Color(0xFF3C4A42))),
              ],
            ),
          ),
          const SizedBox(height: 8),
          TabBar(
            controller: _tab,
            isScrollable: true,
            labelColor: const Color(0xFF006C49),
            unselectedLabelColor: const Color(0xFF3C4A42),
            indicatorColor: const Color(0xFF006C49),
            tabs: const [
              Tab(text: 'Thống kê'),
              Tab(text: 'Thành viên'),
              Tab(text: 'Thiết bị'),
              Tab(text: 'Đơn hàng'),
              Tab(text: 'Duyệt eKYC'),
              Tab(text: 'Rút tiền'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: [
                _statsTab(),
                _usersTab(),
                _assetsTab(),
                _ordersTab(),
                _ekycTab(),
                _withdrawalsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsTab() {
    if (_statsLoading && _stats == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_stats == null) {
      return const Center(child: Text('Không tải được số liệu.'));
    }
    final u = _stats!['users'] ?? {};
    final a = _stats!['assets'] ?? {};
    final o = _stats!['orders'] ?? {};
    final fin = _stats!['financials'] ?? {};
    final pend = _stats!['pendingCounts'] ?? {};
    final cards = [
      _StatCard('Tổng thành viên', '${u['total'] ?? 0}', Icons.group, const Color(0xFF0058BE),
          sub: '${u['lenders'] ?? 0} Lender · ${u['renters'] ?? 0} Renter'),
      _StatCard('Tổng thiết bị', '${a['total'] ?? 0}', Icons.category, const Color(0xFF006C49),
          sub: '${a['pending'] ?? 0} chờ duyệt'),
      _StatCard('Phí nền tảng', _fmt(fin['totalPlatformFee']), Icons.payments, const Color(0xFF10B981),
          sub: 'GD: ${_fmt(fin['totalTransactionVolume'])}'),
      _StatCard('Cần xử lý',
          '${((pend['withdrawals'] ?? 0) + (pend['lenderApplications'] ?? 0) + (pend['renterApplications'] ?? 0))}',
          Icons.notifications_active, const Color(0xFFBA1A1A),
          sub: '${pend['renterApplications'] ?? 0} Renter | ${pend['lenderApplications'] ?? 0} Lender | ${pend['withdrawals'] ?? 0} Rút'),
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.4),
          itemCount: cards.length,
          itemBuilder: (_, i) => cards[i],
        ),
        const SizedBox(height: 16),
        const Text('Cơ cấu thành viên',
            style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        _Bar(label: 'Renter', count: u['renters'] ?? 0, total: u['total'] ?? 0, color: const Color(0xFF0058BE)),
        _Bar(label: 'Lender', count: u['lenders'] ?? 0, total: u['total'] ?? 0, color: const Color(0xFF006C49)),
        _Bar(label: 'Inspector', count: u['inspectors'] ?? 0, total: u['total'] ?? 0, color: const Color(0xFFF59E0B)),
        _Bar(label: 'Admin', count: u['admins'] ?? 0, total: u['total'] ?? 0, color: const Color(0xFF7C3AED)),
        const SizedBox(height: 16),
        const Text('Trạng thái thiết bị',
            style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        _Bar(label: 'Đã duyệt', count: a['verified'] ?? 0, total: a['total'] ?? 0, color: const Color(0xFF006C49)),
        _Bar(label: 'Chờ duyệt', count: a['pending'] ?? 0, total: a['total'] ?? 0, color: const Color(0xFFF59E0B)),
        _Bar(label: 'Từ chối', count: a['rejected'] ?? 0, total: a['total'] ?? 0, color: const Color(0xFFBA1A1A)),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: const Icon(Icons.account_balance_wallet, color: Color(0xFF006C49)),
            title: const Text('Tổng số dư ví thành viên'),
            trailing: Text(_fmt(fin['totalWalletBalance']),
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.receipt_long, color: Color(0xFF006C49)),
            title: const Text('Tổng đơn hàng'),
            trailing: Text('${o['total'] ?? 0}',
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
      ],
    );
  }

  Widget _usersTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _userSearch,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Tìm tên/email...',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _loadUsers(),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: _userRoleFilter,
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('Tất cả')),
                  DropdownMenuItem(value: 'renter', child: Text('Renter')),
                  DropdownMenuItem(value: 'lender', child: Text('Lender')),
                  DropdownMenuItem(value: 'inspector', child: Text('Inspector')),
                  DropdownMenuItem(value: 'admin', child: Text('Admin')),
                ],
                onChanged: (v) => setState(() {
                  _userRoleFilter = v!;
                  _loadUsers();
                }),
              ),
            ],
          ),
        ),
        Expanded(
          child: _usersLoading
              ? const Center(child: CircularProgressIndicator())
              : _users.isEmpty
                  ? const Center(child: Text('Không có người dùng.'))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _users.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF10B981),
                            child: Text(UiHelper.initials(u.name),
                                style: const TextStyle(color: Color(0xFF005236))),
                          ),
                          title: Row(
                            children: [
                              Expanded(child: Text(u.name, overflow: TextOverflow.ellipsis)),
                              if (u.isBanned)
                                const Padding(
                                  padding: EdgeInsets.only(left: 6),
                                  child: Text('Bị khóa',
                                      style: TextStyle(color: Color(0xFFBA1A1A), fontSize: 12)),
                                ),
                            ],
                          ),
                          subtitle: Text('${u.phoneNumber ?? ''} · ${u.email ?? ''}',
                              style: const TextStyle(fontSize: 12)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              DropdownButton<String>(
                                value: u.role,
                                items: const [
                                  DropdownMenuItem(value: 'renter', child: Text('Renter')),
                                  DropdownMenuItem(value: 'lender', child: Text('Lender')),
                                  DropdownMenuItem(value: 'inspector', child: Text('Inspector')),
                                  DropdownMenuItem(value: 'admin', child: Text('Admin')),
                                ],
                                onChanged: (v) => _changeRole(u.id, v!),
                              ),
                              if (u.role != 'admin')
                                IconButton(
                                  icon: Icon(u.isBanned ? Icons.lock_open : Icons.block,
                                      color: u.isBanned ? const Color(0xFF006C49) : const Color(0xFFBA1A1A)),
                                  onPressed: () => _toggleBan(u),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _assetsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: DropdownButton<String>(
            isExpanded: true,
            value: _assetStatusFilter,
            items: const [
              DropdownMenuItem(value: 'all', child: Text('Tất cả trạng thái')),
              DropdownMenuItem(value: 'verified', child: Text('Đã duyệt')),
              DropdownMenuItem(value: 'pending_approval', child: Text('Chờ duyệt')),
              DropdownMenuItem(value: 'rejected', child: Text('Từ chối')),
            ],
            onChanged: (v) => setState(() {
              _assetStatusFilter = v!;
              _loadAssets();
            }),
          ),
        ),
        Expanded(
          child: _assetsLoading
              ? const Center(child: CircularProgressIndicator())
              : _assets.isEmpty
                  ? const Center(child: Text('Không có thiết bị.'))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _assets.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final a = _assets[i];
                        return ListTile(
                          leading: a.images.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(a.images.first, width: 48, height: 48, fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.image)),
                                )
                              : const Icon(Icons.image),
                          title: Text(a.name),
                          subtitle: Text('${a.category} · ${UiHelper.formatVnd(a.pricePerDay)}/ngày'),
                          trailing: _StatusChip(a.status),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _ordersTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: DropdownButton<String>(
            isExpanded: true,
            value: _orderStatusFilter,
            items: const [
              DropdownMenuItem(value: 'all', child: Text('Tất cả trạng thái')),
              DropdownMenuItem(value: 'active', child: Text('Đang thuê')),
              DropdownMenuItem(value: 'reserved', child: Text('Đã đặt')),
              DropdownMenuItem(value: 'completed', child: Text('Hoàn tất')),
              DropdownMenuItem(value: 'disputed', child: Text('Tranh chấp')),
            ],
            onChanged: (v) => setState(() {
              _orderStatusFilter = v!;
              _loadOrders();
            }),
          ),
        ),
        Expanded(
          child: _ordersLoading
              ? const Center(child: CircularProgressIndicator())
              : _orders.isEmpty
                  ? const Center(child: Text('Không có đơn hàng.'))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _orders.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final o = _orders[i];
                        return ListTile(
                          leading: o.assetImage != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(o.assetImage!, width: 48, height: 48, fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.image)),
                                )
                              : const Icon(Icons.receipt_long),
                          title: Text(o.assetName),
                          subtitle: Text('${_fmt(o.totalRent)} · ${o.rentalDays} ngày'),
                          trailing: _StatusChip(o.status),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _ekycTab() {
    if (_ekycLoading && _renterApps.isEmpty && _lenderApps.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_renterApps.isEmpty && _lenderApps.isEmpty) {
      return const Center(child: Text('Không có hồ sơ eKYC chờ duyệt.'));
    }
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (_renterApps.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 6),
            child: Text('eKYC Renter', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          ..._renterApps.map((a) => _ekycCard(
                name: a.name,
                sub: a.phoneNumber ?? '',
                onApprove: () => _verifyRenter(a.id, 'approved'),
                onReject: () => _verifyRenter(a.id, 'rejected'),
              )),
        ],
        if (_lenderApps.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 6),
            child: Text('eKYC Lender', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          ..._lenderApps.map((a) => _ekycCard(
                name: a.name,
                sub: a.phoneNumber ?? '',
                onApprove: () => _verifyLender(a.id, 'approved'),
                onReject: () => _verifyLender(a.id, 'rejected'),
              )),
        ],
      ],
    );
  }

  Widget _ekycCard({
    required String name,
    required String sub,
    required VoidCallback onApprove,
    required VoidCallback onReject,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFF10B981),
          child: Icon(Icons.verified_user, color: Color(0xFF005236)),
        ),
        title: Text(name),
        subtitle: Text(sub),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.check_circle, color: Color(0xFF006C49)),
              tooltip: 'Duyệt',
              onPressed: onApprove,
            ),
            IconButton(
              icon: const Icon(Icons.cancel, color: Color(0xFFBA1A1A)),
              tooltip: 'Từ chối',
              onPressed: onReject,
            ),
          ],
        ),
      ),
    );
  }

  Widget _withdrawalsTab() {
    if (_withdrawalsLoading && _withdrawals.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_withdrawals.isEmpty) {
      return const Center(child: Text('Không có yêu cầu rút tiền.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: _withdrawals.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (_, i) {
        final w = _withdrawals[i];
        final bank = w['bankAccount'] ?? {};
        return Card(
          child: ListTile(
            leading: const Icon(Icons.account_balance_wallet, color: Color(0xFF006C49)),
            title: Text(_fmt(w['amount'])),
            subtitle: Text('${bank['bankName'] ?? ''} · ${bank['accountNumber'] ?? ''}'
                '${w['status'] != null ? ' · ${w['status']}' : ''}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.check_circle, color: Color(0xFF006C49)),
                  tooltip: 'Duyệt',
                  onPressed: () => _verifyWithdrawal(w['_id'], 'approved'),
                ),
                IconButton(
                  icon: const Icon(Icons.cancel, color: Color(0xFFBA1A1A)),
                  tooltip: 'Từ chối',
                  onPressed: () => _verifyWithdrawal(w['_id'], 'rejected'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String sub;
  const _StatCard(this.label, this.value, this.icon, this.color, {this.sub = ''});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 22),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                  child: Icon(icon, color: color, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF3C4A42))),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
            if (sub.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(sub, style: const TextStyle(fontSize: 11, color: Color(0xFF3C4A42))),
              ),
          ],
        ),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  final String label;
  final int count;
  final int total;
  final Color color;
  const _Bar({required this.label, required this.count, required this.total, required this.color});

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (count / total * 100).round() : 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 13)),
              Text('$count ($pct%)', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(value: total > 0 ? count / total : 0, color: color, minHeight: 8,
              backgroundColor: const Color(0xFFE5E7EB)),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip(this.status);

  Color get _color {
    switch (status) {
      case 'verified':
      case 'approved':
      case 'completed':
      case 'active':
        return const Color(0xFF006C49);
      case 'pending':
      case 'pending_approval':
      case 'reserved':
        return const Color(0xFFF59E0B);
      case 'rejected':
      case 'cancelled':
      case 'disputed':
        return const Color(0xFFBA1A1A);
      default:
        return const Color(0xFF3C4A42);
    }
  }

  String get _text {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'Đã duyệt';
      case 'completed':
        return 'Hoàn tất';
      case 'active':
        return 'Đang thuê';
      case 'pending':
      case 'pending_approval':
        return 'Chờ duyệt';
      case 'reserved':
        return 'Đã đặt';
      case 'rejected':
        return 'Từ chối';
      case 'cancelled':
        return 'Hủy';
      case 'disputed':
        return 'Tranh chấp';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: _color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(_text, style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
