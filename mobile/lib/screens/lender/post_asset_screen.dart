import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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
  final _originalPrice = TextEditingController();
  final _purchaseYear = TextEditingController();
  final _conditionRate = TextEditingController();
  String _depositMode = 'fixed';
  bool _loading = false;

  final _picker = ImagePicker();
  final List<XFile> _selectedImages = [];

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage(
      imageQuality: 75,
      maxWidth: 1024,
    );
    if (picked.isNotEmpty) {
      setState(() => _selectedImages.addAll(picked));
    }
  }

  Future<void> _removeImage(int index) async {
    setState(() => _selectedImages.removeAt(index));
  }

  Future<List<String>> _imagesToBase64() async {
    final results = <String>[];
    for (final img in _selectedImages) {
      final bytes = await img.readAsBytes();
      final ext = img.path.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
      results.add('data:$mime;base64,${base64Encode(bytes)}');
    }
    return results;
  }

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
    if (_selectedImages.length < 5) {
      UiHelper.showError(context, 'Vui lòng chọn ít nhất 5 ảnh');
      return;
    }
    setState(() => _loading = true);
    try {
      final imagesB64 = await _imagesToBase64();
      await AssetService.createAsset({
        'name': _name.text,
        'description': _desc.text,
        'category': _category.text,
        'pricePerDay': double.tryParse(_price.text) ?? 0,
        'depositAmount': double.tryParse(_deposit.text) ?? 0,
        'depositCalculationMode': _depositMode,
        'images': imagesB64,
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
  void dispose() {
    _name.dispose();
    _desc.dispose();
    _category.dispose();
    _price.dispose();
    _deposit.dispose();
    _originalPrice.dispose();
    _purchaseYear.dispose();
    _conditionRate.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _f(_name, 'Tên thiết bị'),
            _f(_desc, 'Mô tả'),
            _f(_category, 'Danh mục (Tech/Camping/...)'),
            _f(_price, 'Giá thuê/ngày (VNĐ)'),
            _f(_deposit, 'Tiền cọc (VNĐ)'),
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
              decoration: const InputDecoration(labelText: 'Cách tính cọc'),
            ),
            const SizedBox(height: 16),
            Text('Ảnh thiết bị (chọn ít nhất 5 ảnh)',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            if (_selectedImages.isNotEmpty)
              _imageGrid(),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickImages,
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('Chọn ảnh từ thư viện'),
            ),
            if (_selectedImages.length < 5)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Đã chọn ${_selectedImages.length}/5 ảnh',
                  style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.error),
                ),
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

  Widget _imageGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _selectedImages.length,
      itemBuilder: (context, index) {
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(
                File(_selectedImages[index].path),
                width: double.infinity,
                height: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[200],
                  child: const Icon(Icons.broken_image, size: 32),
                ),
              ),
            ),
            Positioned(
              top: 2,
              right: 2,
              child: InkWell(
                onTap: () => _removeImage(index),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(4),
                  child: const Icon(Icons.close, size: 16, color: Colors.white),
               ),
              ),
            ),
            Positioned(
              bottom: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text('${index + 1}',
                    style:
                        const TextStyle(fontSize: 11, color: Colors.white)),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _f(TextEditingController c, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
            controller: c, decoration: InputDecoration(labelText: label)),
      );
}
