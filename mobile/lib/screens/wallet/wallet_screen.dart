import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  double _balance = 0;
  List<dynamic> _withdrawals = [];
  List<dynamic> _transactions = [];
  bool _loading = true;

  final _amountCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _accountNumberCtrl = TextEditingController();
  final _accountHolderCtrl = TextEditingController();
  bool _withdrawing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _bankNameCtrl.dispose();
    _accountNumberCtrl.dispose();
    _accountHolderCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        AuthService.getBalance(),
        AuthService.getMyWithdrawals(),
        AuthService.getMyTransactions(),
      ]);
      if (!mounted) return;
      setState(() {
        _balance = results[0] as double;
        _withdrawals = results[1] as List<dynamic>;
        _transactions = results[2] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _openWithdrawSheet() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final bank = auth.user?.bankAccount;
    _amountCtrl.clear();
    _bankNameCtrl.text = bank?['bankName'] ?? '';
    _accountNumberCtrl.text = bank?['accountNumber'] ?? '';
    _accountHolderCtrl.text = bank?['accountHolder'] ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.onSurfaceVariant.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Yêu cầu rút tiền',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: AppTheme.onSurface)),
              const SizedBox(height: 4),
              Text('Số dư hiện tại: ${UiHelper.formatVnd(_balance)}',
                  style: const TextStyle(
                      fontSize: 13, color: AppTheme.onSurfaceVariant)),
              const SizedBox(height: 16),
              TextField(
                controller: _amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số tiền rút (VNĐ)',
                  hintText: 'e.g. 500000',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              const Text('Tài khoản nhận tiền (Theo eKYC)',
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: AppTheme.onSurfaceVariant)),
              const SizedBox(height: 8),
              TextField(
                controller: _bankNameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Tên ngân hàng',
                  hintText: 'e.g. Vietcombank',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _accountNumberCtrl,
                decoration: const InputDecoration(
                  labelText: 'Số tài khoản',
                  hintText: 'e.g. 0071000...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _accountHolderCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Chủ tài khoản',
                  hintText: 'e.g. NGUYEN VAN A',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _withdrawing ? null : () => _submitWithdraw(sheetCtx),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(_withdrawing ? 'Đang gửi...' : 'Xác nhận rút'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitWithdraw(BuildContext sheetCtx) async {
    final amount = double.tryParse(_amountCtrl.text.trim()) ?? 0;
    final bankName = _bankNameCtrl.text.trim();
    final accountNumber = _accountNumberCtrl.text.trim();
    final accountHolder = _accountHolderCtrl.text.trim();

    if (amount <= 0) {
      UiHelper.showErrorToast(sheetCtx, 'Số tiền rút không hợp lệ.');
      return;
    }
    if (amount > _balance) {
      UiHelper.showErrorToast(sheetCtx, 'Số dư ví không đủ.');
      return;
    }
    if (bankName.isEmpty || accountNumber.isEmpty || accountHolder.isEmpty) {
      UiHelper.showErrorToast(sheetCtx,
          'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng.');
      return;
    }

    setState(() => _withdrawing = true);
    try {
      await AuthService.createWithdrawal(
        amount: amount,
        bankAccount: {
          'bankName': bankName,
          'accountNumber': accountNumber,
          'accountHolder': accountHolder,
        },
      );
      if (!mounted) return;
      setState(() => _withdrawing = false);
      Navigator.pop(sheetCtx);
      UiHelper.showToast(context, 'Yêu cầu rút tiền đã được gửi, chờ Admin duyệt.');
      _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _withdrawing = false);
      UiHelper.showErrorToast(sheetCtx, e);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Thành công';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
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

  String _fmtAmount(dynamic amount) {
    final v = (amount as num).toDouble();
    return (v < 0 ? '- ' : '+ ') + UiHelper.formatVnd(v.abs());
  }

  Color _txColor(dynamic amount) =>
      (amount as num).toDouble() < 0 ? Colors.red.shade400 : Colors.green.shade700;

  String _dateTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primary, AppTheme.primaryContainer],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Số dư ví khả dụng',
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(UiHelper.formatVnd(_balance),
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 28)),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: _openWithdrawSheet,
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            icon: const Icon(Icons.payments),
                            label: const Text('Rút tiền',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Lịch sử yêu cầu rút tiền',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: AppTheme.onSurface)),
                  const SizedBox(height: 8),
                  if (_withdrawals.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                          child: Text('Bạn chưa thực hiện yêu cầu rút tiền nào.',
                              style: TextStyle(color: AppTheme.onSurfaceVariant))),
                    )
                  else
                    ..._withdrawals.map((w) => _withdrawalCard(w)),
                  const SizedBox(height: 20),
                  const Text('Lịch sử giao dịch ví',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: AppTheme.onSurface)),
                  const SizedBox(height: 8),
                  if (_transactions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                          child: Text('Chưa có giao dịch nào.',
                              style: TextStyle(color: AppTheme.onSurfaceVariant))),
                    )
                  else
                    ..._transactions.map((t) => _txCard(t)),
                ],
              ),
            ),
    );
  }

  Widget _withdrawalCard(dynamic w) {
    final bank = w['bankAccount'] is Map
        ? w['bankAccount'] as Map
        : <String, dynamic>{};
    final amount = (w['amount'] as num? ?? 0).toDouble();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(UiHelper.formatVnd(amount),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppTheme.onSurface)),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusColor(w['status'] as String? ?? '')
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                    _statusLabel(w['status'] as String? ?? ''),
                    style: TextStyle(
                        color: _statusColor(w['status'] as String? ?? ''),
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${bank['bankName'] ?? ''} - STK ${bank['accountNumber'] ?? ''}',
            style: const TextStyle(
                fontSize: 13, color: AppTheme.onSurfaceVariant)),
          const SizedBox(height: 2),
          Text(
            w['status'] == 'rejected' && w['rejectReason'] != null
                ? 'Lý do từ chối: ${w['rejectReason']}'
                : _dateTime(w['createdAt'] as String? ?? ''),
            style: TextStyle(
                fontSize: 12,
                color: w['status'] == 'rejected'
                    ? Colors.red.shade400
                    : AppTheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _txCard(dynamic t) {
    final amount = t['amount'];
    final reason = t['reason'] as String? ?? '';
    final date = t['createdAt'] as String? ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _txColor(amount).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              (amount as num).toDouble() < 0
                  ? Icons.arrow_downward
                  : Icons.arrow_upward,
              color: _txColor(amount),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(reason,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppTheme.onSurface)),
                Text(_dateTime(date),
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.onSurfaceVariant)),
              ],
            ),
          ),
          Text(_fmtAmount(amount),
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: _txColor(amount))),
        ],
      ),
    );
  }
}
