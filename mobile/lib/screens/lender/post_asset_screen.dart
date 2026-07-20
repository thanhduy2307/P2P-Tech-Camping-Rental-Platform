import 'package:flutter/material.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';

class PostAssetScreen extends StatefulWidget {
  const PostAssetScreen({super.key});

  @override
  State<PostAssetScreen> createState() => _PostAssetScreenState();
}

class _PostAssetScreenState extends State<PostAssetScreen> {
  final _name = TextEditingController();
  final _desc = TextEditingController();
  final _category = TextEditingController();
  final _price = TextEditingController();
  final _deposit = TextEditingController();
  final _images = TextEditingController();
  final _originalPrice = TextEditingController();
  final _purchaseYear = TextEditingController();
  final _conditionRate = TextEditingController();
  String _depositMode = 'fixed';
  bool _loading = false;

  Future<void> _estimate() async {
    try {
      final data = await AssetService.aiEstimateDeposit({
        'name': _name.text,
        'description': _desc.text,
        'originalPrice': double.tryParse(_originalPrice.text) ?? 0,
        'purchaseYear': int.tryParse(_purchaseYear.text) ?? 2024,
        'itemConditionRate': double.tryParse(_conditionRate.text) ?? 80,
      });
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('AI ước tính'),
          content: SingleChildScrollView(
            child: Text(
                'Giá trị hiện tại: ${data['estimatedCurrentValue']}\n'
                'Đề xuất cọc: ${data['suggestedDeposit']}\n'
                'Giá/ngày: ${data['suggestedPricePerDay']}\n\n'
                '${data['explanation'] ?? ''}'),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Đóng')),
          ],
        ),
      );
    } catch (e) {
      UiHelper.showError(context, e);
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await AssetService.createAsset({
        'name': _name.text,
        'description': _desc.text,
        'category': _category.text,
        'pricePerDay': double.tryParse(_price.text) ?? 0,
        'depositAmount': double.tryParse(_deposit.text) ?? 0,
        'depositCalculationMode': _depositMode,
        'images': _images.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        'location': {'lat': 21.0285, 'lng': 105.8048, 'addressString': ''},
        'originalPrice': double.tryParse(_originalPrice.text),
        'purchaseYear': int.tryParse(_purchaseYear.text),
        'itemConditionRate': double.tryParse(_conditionRate.text),
      });
      if (!mounted) return;
      UiHelper.showSuccess(context, 'Đăng thiết bị thành công!');
      Navigator.pop(context);
    } catch (e) {
      UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _f(_name, 'Tên thiết bị'),
            _f(_desc, 'Mô tả'),
            _f(_category, 'Danh mục (Tech/Camping/...)'),
            _f(_price, 'Giá thuê/ngày (VNĐ)'),
            _f(_deposit, 'Tiền cọc (VNĐ)'),
            _f(_images, 'URL ảnh (cách nhau dấu phẩy, ≥5 ảnh)'),
            _f(_originalPrice, 'Giá gốc (VNĐ)'),
            _f(_purchaseYear, 'Năm mua'),
            _f(_conditionRate, 'Độ mới (%)'),
            DropdownButtonFormField<String>(
              value: _depositMode,
              items: const [
                DropdownMenuItem(value: 'fixed', child: Text('Cọc cố định')),
                DropdownMenuItem(value: 'auto', child: Text('Tự động (AI)')),
              ],
              onChanged: (v) => setState(() => _depositMode = v!),
              decoration:
                  const InputDecoration(labelText: 'Cách tính cọc'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
                onPressed: _estimate, child: const Text('AI ước tính cọc & giá')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Đăng thiết bị'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _f(TextEditingController c, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
            controller: c, decoration: InputDecoration(labelText: label)),
      );
}
