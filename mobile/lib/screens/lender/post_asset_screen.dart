import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';

class PostAssetScreen extends StatefulWidget {
  const PostAssetScreen({super.key});

  @override
  State<PostAssetScreen> createState() => _PostAssetScreenState();
}

class _PostAssetScreenState extends State<PostAssetScreen> {
  String? _editId;
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
  List<String> _existingImages = [];
  double _lat = 21.0285;
  double _lng = 105.8048;
  String _address = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final arg = ModalRoute.of(context)?.settings.arguments;
      if (arg is String) _loadForEdit(arg);
    });
  }

  Future<void> _loadForEdit(String id) async {
    setState(() => _loading = true);
    try {
      _editId = id;
      final asset = await AssetService.getAssetById(id);
      _name.text = asset.name;
      _desc.text = asset.description;
      _category.text = asset.category;
      _price.text = asset.pricePerDay.toStringAsFixed(0);
      _deposit.text = asset.depositAmount.toStringAsFixed(0);
      _existingImages = List.from(asset.images);
      if (asset.lat != null && asset.lng != null) {
        _lat = asset.lat!;
        _lng = asset.lng!;
      }
      _address = asset.addressString ?? '';
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

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

  Future<List<String>> _imagesToBase64() async => UiHelper.imagesToBase64(_selectedImages);

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
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _submit() async {
    if (_selectedImages.isEmpty && _existingImages.isEmpty) {
      UiHelper.showErrorToast(context, 'Vui lòng chọn ảnh thiết bị');
      return;
    }
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'name': _name.text,
        'description': _desc.text,
        'category': _category.text,
        'pricePerDay': double.tryParse(_price.text) ?? 0,
        'depositAmount': double.tryParse(_deposit.text) ?? 0,
        'depositCalculationMode': _depositMode,
        'location': {'lat': _lat, 'lng': _lng, 'addressString': _address},
        'originalPrice': double.tryParse(_originalPrice.text),
        'purchaseYear': int.tryParse(_purchaseYear.text),
        'itemConditionRate': double.tryParse(_conditionRate.text),
      };
      if (_selectedImages.isNotEmpty) {
        body['images'] = await _imagesToBase64();
      }
      if (_editId != null) {
        await AssetService.updateAsset(_editId!, body);
        if (!mounted) return;
        UiHelper.showSuccessToast(context, 'Cập nhật thiết bị thành công!');
      } else {
        if (_selectedImages.length < 5) {
          setState(() => _loading = false);
          if (mounted) UiHelper.showErrorToast(context, 'Vui lòng chọn ít nhất 5 ảnh');
          return;
        }
        await AssetService.createAsset(body);
        if (!mounted) return;
        UiHelper.showSuccessToast(context, 'Đăng thiết bị thành công!');
      }
      Navigator.pop(context);
    } catch (e) {
      UiHelper.showErrorToast(context, e);
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
            const SizedBox(height: 12),
            Text('Vị trí: $_lat, $_lng${_address.isNotEmpty ? ' - $_address' : ''}',
                style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: OutlinedButton.icon(
              icon: const Icon(Icons.my_location, size: 16),
              label: const Text('Lấy vị trí hiện tại'),
              onPressed: () async {
                try {
                  final perm = await Geolocator.checkPermission();
                  if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
                    final req = await Geolocator.requestPermission();
                    if (req == LocationPermission.denied || req == LocationPermission.deniedForever) return;
                  }
                  final pos = await Geolocator.getCurrentPosition();
                  setState(() { _lat = pos.latitude; _lng = pos.longitude; _address = ''; });
                } catch (_) {}
              },
            )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(_editId != null ? 'Cập nhật thiết bị' : 'Đăng thiết bị'),
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
