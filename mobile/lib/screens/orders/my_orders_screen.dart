import 'package:flutter/material.dart';
import 'package:velox_mobile/models/order.dart';
import 'package:velox_mobile/services/order_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;
  bool _asLender = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _orders = _asLender
          ? await OrderService.getIncoming()
          : await OrderService.getMyRentals();
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'pending_payment':
        return Colors.orange;
      case 'reserved':
        return Colors.blue;
      case 'active':
        return Colors.purple;
      case 'completed':
        return Colors.green;
      case 'cancelled':
      case 'disputed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đơn thuê'),
        actions: [
          ToggleButtons(
            isSelected: [!_asLender, _asLender],
            onPressed: (i) {
              setState(() => _asLender = i == 1);
              _load();
            },
            children: const [
              Padding(padding: EdgeInsets.all(8), child: Text('Tôi thuê')),
              Padding(padding: EdgeInsets.all(8), child: Text('Tôi cho thuê')),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(child: Text('Chưa có đơn nào.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _orders.length,
                    itemBuilder: (_, i) {
                      final o = _orders[i];
                      return ListTile(
                        leading: o.assetImage != null
                            ? Image.network(o.assetImage!,
                                width: 56, height: 56, fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    const Icon(Icons.image))
                            : const Icon(Icons.image),
                        title: Text(o.assetName),
                        subtitle: Text('${o.startDate} → ${o.endDate}'),
                        trailing: Chip(
                          label: Text(o.status,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 11)),
                          backgroundColor: _statusColor(o.status),
                        ),
                        onTap: () => Navigator.pushNamed(
                            context, '/order-detail',
                            arguments: o.id),
                      );
                    },
                  ),
                ),
    );
  }
}
