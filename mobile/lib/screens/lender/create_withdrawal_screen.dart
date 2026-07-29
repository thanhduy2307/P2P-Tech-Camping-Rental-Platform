import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class CreateWithdrawalScreen extends StatefulWidget {
  const CreateWithdrawalScreen({super.key});

  @override
  State<CreateWithdrawalScreen> createState() => _CreateWithdrawalScreenState();
}

class _CreateWithdrawalScreenState extends State<CreateWithdrawalScreen> {
  final _amountCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _accountNumberCtrl = TextEditingController();
  final _accountHolderCtrl = TextEditingController();
  bool _loading = false;
  double _balance = 0;

  @override
  void initState() {
    super.initState();
    _loadBalance();
  }

  Future<void> _loadBalance() async {
    try {
      final bal = await AuthService.getBalance();
      if (mounted) setState(() => _balance = bal);
    } catch (_) {}
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _bankNameCtrl.dispose();
    _accountNumberCtrl.dispose();
    _accountHolderCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountCtrl.text.replaceAll(',', '')) ?? 0;
    final bankName = _bankNameCtrl.text.trim();
    final accountNumber = _accountNumberCtrl.text.trim();
    final accountHolder = _accountHolderCtrl.text.trim();

    if (amount <= 0) {
      UiHelper.showErrorToast(context, 'Số tiền rút phải lớn hơn 0');
      return;
    }
    if (amount > _balance) {
      UiHelper.showErrorToast(context, 'Số dư không đủ (${UiHelper.formatVnd(_balance)})');
      return;
    }
    if (bankName.isEmpty || accountNumber.isEmpty || accountHolder.isEmpty) {
      UiHelper.showErrorToast(context, 'Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng');
      return;
    }

    setState(() => _loading = true);
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
      EquipDialog.success(context, 'Yêu cầu rút tiền đã được gửi. Số tiền đã được tạm đóng băng.');
      Navigator.pop(context, true);
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rút tiền')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text('Số dư khả dụng: ${UiHelper.formatVnd(_balance)}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Số tiền rút (VNĐ)',
                border: OutlineInputBorder(),
                prefixText: '₫ ',
              ),
            ),
            const SizedBox(height: 16),
            const Text('Thông tin tài khoản nhận:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            TextField(
              controller: _bankNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Tên ngân hàng',
                border: OutlineInputBorder(),
                hintText: 'VD: Vietcombank',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _accountNumberCtrl,
              decoration: const InputDecoration(
                labelText: 'Số tài khoản',
                border: OutlineInputBorder(),
                hintText: 'VD: 1234567890',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _accountHolderCtrl,
              decoration: const InputDecoration(
                labelText: 'Chủ tài khoản',
                border: OutlineInputBorder(),
                hintText: 'VD: NGUYEN VAN A',
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Gửi yêu cầu rút tiền', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
