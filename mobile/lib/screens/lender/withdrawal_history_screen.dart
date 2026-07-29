import 'package:flutter/material.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class WithdrawalHistoryScreen extends StatefulWidget {
  const WithdrawalHistoryScreen({super.key});

  @override
  State<WithdrawalHistoryScreen> createState() => _WithdrawalHistoryScreenState();
}

class _WithdrawalHistoryScreenState extends State<WithdrawalHistoryScreen> {
  List<dynamic> _withdrawals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await AuthService.getMyWithdrawals();
      setState(() => _withdrawals = data);
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      setState(() => _loading = false);
    }
  }

  String _statusText(String? status) {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã chuyển khoản';
      case 'rejected':
        return 'Từ chối';
      default:
        return status ?? 'Không xác định';
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String? _formatDate(String? dateStr) {
    if (dateStr == null) return null;
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lịch sử rút tiền')),
      body: RefreshIndicator(
        onRefresh: _fetch,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _withdrawals.isEmpty
                ? ListView(
                    children: const [
                      SizedBox(height: 120),
                      Center(child: Text('Chưa có yêu cầu rút tiền nào')),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _withdrawals.length,
                    itemBuilder: (context, index) {
                      final w = _withdrawals[index];
                      final bank = w['bankAccount'] ?? {};
                      final adminInfo = w['adminTransferInfo'];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    UiHelper.formatVnd((w['amount'] as num?)?.toDouble() ?? 0),
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(w['status']).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _statusText(w['status']),
                                      style: TextStyle(
                                        color: _statusColor(w['status']),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (bank['bankName'] != null || bank['accountNumber'] != null) ...[
                                Text('NH: ${bank['bankName'] ?? ''} - STK: ${bank['accountNumber'] ?? ''}',
                                    style: const TextStyle(fontSize: 13, color: Colors.black87)),
                                if (bank['accountHolder'] != null)
                                  Text('Chủ TK: ${bank['accountHolder']}',
                                      style: const TextStyle(fontSize: 13, color: Colors.black87)),
                              ],
                              if (w['createdAt'] != null)
                                Text('Ngày tạo: ${_formatDate(w['createdAt'])}',
                                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              if (w['transferredAt'] != null)
                                Text('Ngày chuyển: ${_formatDate(w['transferredAt'])}',
                                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              if (w['status'] == 'rejected' && w['rejectReason'] != null) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.info_outline, size: 16, color: Colors.red),
                                      const SizedBox(width: 6),
                                      Expanded(child: Text('${w['rejectReason']}',
                                          style: const TextStyle(fontSize: 12, color: Colors.red))),
                                    ],
                                  ),
                                ),
                              ],
                              if (w['status'] == 'approved' && adminInfo != null) ...[
                                const SizedBox(height: 8),
                                const Divider(),
                                const Text('Thông tin chuyển khoản từ Admin:',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.teal)),
                                const SizedBox(height: 4),
                                Text('Từ: ${adminInfo['bankName'] ?? ''} - ${adminInfo['accountNumber'] ?? ''}',
                                    style: const TextStyle(fontSize: 13)),
                                if (adminInfo['accountHolder'] != null)
                                  Text('Chủ TK: ${adminInfo['accountHolder']}',
                                      style: const TextStyle(fontSize: 13)),
                                if (w['transactionReference'] != null)
                                  Text('Mã GD: ${w['transactionReference']}',
                                      style: const TextStyle(fontSize: 13)),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
