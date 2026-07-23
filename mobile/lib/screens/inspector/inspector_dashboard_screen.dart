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

class _InspectorDashboardScreenState extends State<InspectorDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _tasks = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _tasks = await InspectorService.getPendingTasks();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openVerify(Map<String, dynamic> task) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InspectorVerifyScreen(task: task),
      ),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showTopBar: true,
      showBottomNav: false,
      currentIndex: 0,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Dashboard Kiểm định viên',
                style: TextStyle(
                    fontFamily: 'PlusJakartaSans',
                    fontWeight: FontWeight.w800,
                    fontSize: 22)),
            const SizedBox(height: 4),
            Text('Danh sách yêu cầu kiểm định được gán cho bạn.',
                style: TextStyle(color: AppTheme.onSurfaceVariant)),
            const SizedBox(height: 16),
            if (_loading)
              const Center(
                  child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ))
            else if (_error != null)
              Center(
                child: Column(
                  children: [
                    Text(_error!,
                        style: TextStyle(color: AppTheme.error)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                        onPressed: _load, child: const Text('Thử lại')),
                  ],
                ),
              )
            else if (_tasks.isEmpty)
              Card(
                child: ListTile(
                  leading: Icon(Icons.verified_user,
                      color: AppTheme.primary),
                  title: const Text('Chưa có task kiểm định'),
                  subtitle: const Text(
                      'Hệ thống sẽ đẩy task khi có đơn cần duyệt'),
                ),
              )
            else
              ..._tasks.map((t) {
                final asset = Asset.fromJson(t);
                final taskDetails =
                    t['taskDetails'] as Map<String, dynamic>? ?? {};
                final isRemote = taskDetails['isRemote'] == true;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: const Icon(Icons.camera_alt_outlined,
                        color: AppTheme.primary),
                    title: Text(asset.name),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            '${asset.category} • ${_formatMoney(asset.pricePerDay)}/ngày'),
                        const SizedBox(height: 2),
                        Text(
                          isRemote
                              ? 'Kiểm định từ xa'
                              : 'Kiểm định tận nơi${taskDetails['distance'] != null ? ' • ${taskDetails['distance']} km' : ''}',
                          style: TextStyle(
                              fontSize: 12,
                              color: isRemote
                                  ? AppTheme.secondary
                                  : AppTheme.primary),
                        ),
                      ],
                    ),
                    isThreeLine: true,
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _openVerify(t),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  String _formatMoney(double v) =>
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
    _taskDetails =
        widget.task['taskDetails'] as Map<String, dynamic>? ?? {};
    _isRemote = _taskDetails['isRemote'] == true;
  }

  List<String> get _checklistLabels {
    final cat = _asset.category.toLowerCase();
    if (cat.contains('tech') ||
        cat.contains('camera') ||
        cat.contains('máy')) {
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
        checklist = {
          'field1': _c1,
          'field2': _c2,
          'field3': _c3,
        };
      }
      await InspectorService.verifyAsset(
        _asset.id,
        status: status,
        verificationNotes: _notesCtrl.text.trim().isEmpty
            ? null
            : _notesCtrl.text.trim(),
        checklist: checklist,
      );
      if (mounted) {
        final msg = status == 'verified'
            ? 'Đã duyệt thiết bị thành công'
            : 'Đã từ chối thiết bị';
        EquipDialog.success(context, msg);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        UiHelper.showErrorToast(context, e);
      }
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
                    separatorBuilder: (_, _) =>
                        const SizedBox(width: 8),
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(_asset.images[i],
                          width: 160, fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.image)),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(_asset.description,
                  style: TextStyle(color: AppTheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              Text('Giá: ${_formatMoney(_asset.pricePerDay)}/ngày',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 24),
              if (!_isRemote) ...[
                Text('Biên bản kiểm định thực tế',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
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
                        style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.error),
                        child: const Text('Từ chối'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _submit('verified'),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary),
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

  String _formatMoney(double v) =>
      '${v.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} đ';
}
