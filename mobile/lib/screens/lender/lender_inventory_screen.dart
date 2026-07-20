import 'package:flutter/material.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/asset_card.dart';
import 'package:velox_mobile/widgets/common.dart';

class LenderInventoryScreen extends StatefulWidget {
  const LenderInventoryScreen({super.key});

  @override
  State<LenderInventoryScreen> createState() => _LenderInventoryScreenState();
}

class _LenderInventoryScreenState extends State<LenderInventoryScreen> {
  List<Asset> _assets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _assets = await AssetService.getMyAssets();
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/lender/post-asset'),
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _assets.isEmpty
              ? const Center(child: Text('Chưa có thiết bị nào.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _assets.length,
                    itemBuilder: (_, i) => AssetCard(
                      asset: _assets[i],
                      onTap: () {},
                    ),
                  ),
                ),
    );
  }
}
