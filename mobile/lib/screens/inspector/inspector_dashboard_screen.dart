import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/inspector_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class InspectorDashboardScreen extends StatefulWidget {
  const InspectorDashboardScreen({super.key});

  @override
  State<InspectorDashboardScreen> createState() =>
      _InspectorDashboardScreenState();
}

class _InspectorDashboardScreenState extends State<InspectorDashboardScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  bool _loadingTasks = true;
  String? _tasksError;
  List<Map<String, dynamic>> _tasks = [];

  bool _loadingDisputes = false;
  List<dynamic> _disputes = [];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(() {
      if (_tab.indexIsChanging) return;
      _loadForTab(_tab.index);
    });
    _loadTasks();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  void _loadForTab(int i) {
    if (i == 0) _loadTasks();
    if (i == 1) _loadDisputes();
  }

  Future<void> _loadTasks() async {
    setState(() { _loadingTasks = true; _tasksError = null; });
    try {
      _tasks = await InspectorService.getPendingTasks();
    } catch (e) {
      _tasksError = e.toString();
    } finally {
      if (mounted) setState(() => _loadingTasks = false);
    }
  }

  Future<void> _loadDisputes() async {
    setState(() => _loadingDisputes = true);
    try {
      _disputes = await InspectorService.getDisputedOrders();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loadingDisputes = false);
    }
  }

  void _openVerify(Map<String, dynamic> task) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InspectorVerifyScreen(task: task),
      ),
    ).then((_) => _loadTasks());
  }

  Future<void> _resolveDispute(String orderId, String action) async {
    try {
      await InspectorService.resolveDispute(orderId, action: action);
      if (!mounted) return;
      UiHelper.showSuccessToast(context, 'Đã giải quyết tranh chấp');
      _loadDisputes();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showTopBar: true,
      showBottomNav: false,
      currentIndex: 0,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Dashboard Kiểm định viên',
                    style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 22)),
                const SizedBox(height: 2),
                Text('Quản lý kiểm định & tranh chấp',
                    style: TextStyle(color: AppTheme.onSurfaceVariant)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          TabBar(
            controller: _tab,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.onSurfaceVariant,
            indicatorColor: AppTheme.primary,
            tabs: const [
              Tab(text: 'Kiểm định'),
              Tab(text: 'Xử lý tranh chấp'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: [
                _tasksTab(),
                _disputesTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tasksTab() {
    if (_loadingTasks) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_tasksError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_tasksError!, style: TextStyle(color: AppTheme.error)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadTasks, child: const Text('Thử lại')),
          ],
        ),
      );
    }
    if (_tasks.isEmpty) {
      return Center(
        child: Card(
          margin: const EdgeInsets.all(16),
          child: ListTile(
            leading: Icon(Icons.verified_user, color: AppTheme.primary),
            title: const Text('Chưa có task kiểm định'),
            subtitle: const Text('Hệ thống sẽ đẩy task khi có đơn cần duyệt'),
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadTasks,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: _tasks.map((t) {
          final asset = Asset.fromJson(t);
          final taskDetails = t['taskDetails'] as Map<String, dynamic>? ?? {};
          final isRemote = taskDetails['isRemote'] == true;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppTheme.primary),
              title: Text(asset.name),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${asset.category} • ${_fmt(asset.pricePerDay)}/ngày'),
                  const SizedBox(height: 2),
                  Text(
                    isRemote ? 'Kiểm định từ xa' : 'Kiểm định tận nơi${taskDetails['distance'] != null ? ' • ${taskDetails['distance']} km' : ''}',
                    style: TextStyle(fontSize: 12, color: isRemote ? AppTheme.secondary : AppTheme.primary),
                  ),
                ],
              ),
              isThreeLine: true,
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _openVerify(t),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _disputesTab() {
    if (_loadingDisputes && _disputes.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_disputes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.gavel, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            const Text('Không có đơn tranh chấp nào.'),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadDisputes,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _disputes.length,
        itemBuilder: (_, i) {
          final d = _disputes[i];
          final asset = d['asset'] is Map ? d['asset'] : (d['assetId'] is Map ? d['assetId'] : {});
          final renter = d['renter'] is Map ? d['renter'] : (d['renterId'] is Map ? d['renterId'] : {});
          final assetLender = asset['lender'] is Map ? asset['lender'] : {};
          final lender = d['lender'] is Map ? d['lender'] : (d['lenderId'] is Map ? d['lenderId'] : assetLender);
          final dispute = d['dispute'] is Map ? d['dispute'] : {};
          final creator = d['disputeCreator']?.toString() ?? '';
          return Card(
            child: ExpansionTile(
              leading: const Icon(Icons.gavel, color: Color(0xFFBA1A1A)),
              title: Text('Đơn #${(d['_id'] as String).substring(0, 8)}...',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Thiết bị: ${asset['name'] ?? 'N/A'}'),
                  Text('Bên ${creator == 'renter' ? 'đi thuê' : 'cho thuê'} khiếu nại'),
                  Text('Lý do: ${dispute['reason'] ?? ''}', style: const TextStyle(fontSize: 11)),
                ],
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        icon: const Icon(Icons.person, color: Color(0xFF006C49)),
                        label: const Text('Chấp nhận khiếu nại',
                            style: TextStyle(color: Color(0xFF006C49))),
                        onPressed: () async {
                          final action = creator == 'renter' ? 'accept_renter_dispute' : 'force_compensation';
                          final confirmed = await EquipDialog.confirm(context, 'Xác nhận', 'Chấp nhận khiếu nại?');
                          if (confirmed == true) _resolveDispute(d['_id'], action);
                        },
                      ),
                      const SizedBox(width: 8),
                      TextButton.icon(
                        icon: const Icon(Icons.person, color: Color(0xFFBA1A1A)),
                        label: const Text('Bác bỏ khiếu nại',
                            style: TextStyle(color: Color(0xFFBA1A1A))),
                        onPressed: () async {
                          final action = creator == 'renter' ? 'reject_renter_dispute' : 'reject_lender_dispute';
                          final confirmed = await EquipDialog.confirm(context, 'Xác nhận', 'Bác bỏ khiếu nại?');
                          if (confirmed == true) _resolveDispute(d['_id'], action);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _fmt(double v) =>
      '${v.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} đ';
}

class InspectorVerifyScreen extends StatefulWidget {
  final Map<String, dynamic> task;
  const InspectorVerifyScreen({super.key, required this.task});

  @override
  State<InspectorVerifyScreen> createState() => _InspectorVerifyScreenState();
}

class _InspectorVerifyScreenState extends State<InspectorVerifyScreen> {
  final _notesCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  bool? _c1;
  bool? _c2;
  bool? _c3;

  late final Asset _asset;
  late final Map<String, dynamic> _taskDetails;
  late final bool _isRemote;

  @override
  void initState() {
    super.initState();
    _asset = Asset.fromJson(widget.task);
    _taskDetails = widget.task['taskDetails'] as Map<String, dynamic>? ?? {};
    _isRemote = _taskDetails['isRemote'] == true;
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  List<String> get _checklistLabels {
    final cat = _asset.category.toLowerCase();
    if (cat.contains('tech') || cat.contains('camera') || cat.contains('máy')) {
      return [
        'Số shutter / số lần chụp',
        'Kiểm tra chết pixel cảm biến',
        'Kiểm tra mốc / rễ tre trên lens',
      ];
    }
    return [
      'Độ mòn khóa kéo',
      'Đàn hồi khung nhôm',
      'Lỗ thủng màng chống muỗi',
    ];
  }

  Future<void> _submit(String status) async {
    if (status == 'verified' && !_isRemote) {
      if (!_formKey.currentState!.validate()) return;
      if (_c1 == null || _c2 == null || _c3 == null) {
        UiHelper.showErrorToast(context, 'Vui lòng hoàn thành biên bản kiểm định.');
        return;
      }
    }
    final message = status == 'verified'
        ? 'Bạn có chắc muốn duyệt thiết bị này?'
        : 'Bạn có chắc muốn từ chối thiết bị này?';
    final confirmed = await EquipDialog.confirm(context, 'Xác nhận', message);
    if (confirmed != true) return;
    setState(() => _saving = true);
    try {
      Map<String, dynamic>? checklist;
      if (status == 'verified' && !_isRemote) {
        checklist = {'field1': _c1, 'field2': _c2, 'field3': _c3};
      }
      await InspectorService.verifyAsset(
        _asset.id,
        status: status,
        verificationNotes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        checklist: checklist,
      );
      if (mounted) {
        EquipDialog.success(context, status == 'verified' ? 'Đã duyệt thiết bị thành công' : 'Đã từ chối thiết bị');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = _checklistLabels;
    return Scaffold(
      appBar: AppBar(title: Text(_asset.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_asset.images.isNotEmpty)
                SizedBox(
                  height: 200,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _asset.images.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(_asset.images[i], width: 160, fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Icon(Icons.image)),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(_asset.description, style: TextStyle(color: AppTheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              Text('Giá: ${_fmt(_asset.pricePerDay)}/ngày',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 24),
              if (!_isRemote) ...[
                Text('Biên bản kiểm định thực tế',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                _checkItem(labels[0], _c1, (v) => setState(() => _c1 = v)),
                _checkItem(labels[1], _c2, (v) => setState(() => _c2 = v)),
                _checkItem(labels[2], _c3, (v) => setState(() => _c3 = v)),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: _notesCtrl,
                decoration: InputDecoration(
                  labelText: 'Ghi chú kiểm định (tuỳ chọn)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              if (_saving)
                const Center(child: CircularProgressIndicator())
              else
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _submit('rejected'),
                        style: OutlinedButton.styleFrom(foregroundColor: AppTheme.error),
                        child: const Text('Từ chối'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _submit('verified'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                        child: const Text('Duyệt'),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _checkItem(String label, bool? value, void Function(bool?) onChanged) {
    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      value: value,
      onChanged: onChanged,
      controlAffinity: ListTileControlAffinity.leading,
      activeColor: AppTheme.primary,
    );
  }

  String _fmt(double v) =>
      '${v.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} đ';
}
