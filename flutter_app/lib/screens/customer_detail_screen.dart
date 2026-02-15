import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'add_visit_screen.dart';
import 'edit_customer_screen.dart';

class CustomerDetailScreen extends StatefulWidget {
  final Map<String, dynamic> customer;

  const CustomerDetailScreen({super.key, required this.customer});

  @override
  State<CustomerDetailScreen> createState() => _CustomerDetailScreenState();
}

class _CustomerDetailScreenState extends State<CustomerDetailScreen> {
  List<dynamic> _visits = [];
  bool _isLoading = true;
  late Map<String, dynamic> _customer;

  @override
  void initState() {
    super.initState();
    _customer = Map<String, dynamic>.from(widget.customer);
    _loadVisits();
  }

  Future<void> _loadCustomerData() async {
    final result = await ApiService.getCustomer(_customer['id'].toString());
    if (result['success'] == true && result['data'] != null) {
      setState(() {
        _customer = result['data'];
      });
    }
  }

  Future<void> _loadVisits() async {
    setState(() => _isLoading = true);
    
    final result = await ApiService.getVisits(
      customerId: _customer['id'].toString(),
    );
    
    if (result['success'] == true) {
      setState(() {
        _visits = result['data'] ?? [];
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteCustomer() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Delete Customer', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to delete "${_customer['name']}"? This action cannot be undone.',
          style: const TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final result = await ApiService.deleteCustomer(_customer['id'].toString());
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Customer deleted successfully'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Failed to delete customer'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  String _getPhotoUrl(String? photo) {
    if (photo == null || photo.isEmpty) return '';
    if (photo.startsWith('http')) return photo;
    // Photos are stored in uploads/customers/ directory
    return 'https://jptiles.in/uploads/customers/$photo';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_customer['name'] ?? 'Customer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: Color(0xFFc9a227)),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => EditCustomerScreen(customer: _customer),
                ),
              );
              if (result == true) {
                await _loadCustomerData();
                _loadVisits();
              }
            },
            tooltip: 'Edit Customer',
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.red),
            onPressed: _deleteCustomer,
            tooltip: 'Delete Customer',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => AddVisitScreen(customer: _customer),
            ),
          );
          if (result == true) _loadVisits();
        },
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCustomerInfo(),
            const SizedBox(height: 24),
            _buildVisitHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfo() {
    final photoUrl = _getPhotoUrl(_customer['photo']?.toString());
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: const Color(0xFFc9a227),
              backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
              child: photoUrl.isEmpty
                  ? const Icon(Icons.person, size: 50, color: Colors.black)
                  : null,
            ),
            const SizedBox(height: 16),
            Text(
              _customer['name'] ?? 'Unknown',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.phone, color: Color(0xFFc9a227), size: 16),
                const SizedBox(width: 4),
                Text(
                  _customer['mobile'] ?? '',
                  style: const TextStyle(color: Color(0xFFc9a227), fontSize: 16),
                ),
              ],
            ),
            if (_customer['email'] != null && _customer['email'].toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.email, color: Colors.grey, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    _customer['email'],
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Text(
              _customer['category_name'] ?? 'No Category',
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildTierBadge(_customer['customer_tier'] ?? 'Silver'),
                const SizedBox(width: 12),
                Row(
                  children: [
                    const Icon(Icons.person_add, color: Colors.grey, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Ref: ${_customer['reference_by'] ?? 'Direct'}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
            if (_customer['address'] != null &&
                _customer['address'].toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.location_on, color: Colors.grey, size: 16),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      _customer['address'],
                      style: const TextStyle(color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            const Divider(color: Color(0xFF444444)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem(
                  'Total Visits',
                  '${_customer['visit_count'] ?? _visits.length}',
                  Icons.history,
                ),
                _buildStatItem(
                  'Total Rewards',
                  '${_customer['total_rewards'] ?? 0}',
                  Icons.star,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => EditCustomerScreen(customer: _customer),
                    ),
                  );
                  if (result == true) {
                    await _loadCustomerData();
                    _loadVisits();
                  }
                },
                icon: const Icon(Icons.edit, color: Colors.black),
                label: const Text(
                  'Edit Customer',
                  style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFc9a227),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFFc9a227), size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildTierBadge(String tier) {
    Color bgColor;
    Color textColor = Colors.black;
    switch (tier) {
      case 'Platinum':
        bgColor = Colors.grey.shade300;
        break;
      case 'Gold':
        bgColor = Colors.amber;
        break;
      case 'Silver':
        bgColor = Colors.grey;
        break;
      case 'Brown':
        bgColor = Colors.brown;
        textColor = Colors.white;
        break;
      default:
        bgColor = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        tier,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildVisitHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Visit History',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFFc9a227),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.refresh, color: Color(0xFFc9a227)),
              onPressed: _loadVisits,
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isLoading)
          const Center(
            child: CircularProgressIndicator(color: Color(0xFFc9a227)),
          )
        else if (_visits.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text(
                  'No visits yet',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          )
        else
          ..._visits.map((visit) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFc9a227),
                    child: Icon(Icons.history, color: Colors.black),
                  ),
                  title: Text(
                    visit['visit_date'] ?? '',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (visit['items'] != null && visit['items'].toString().isNotEmpty)
                        Text(
                          visit['items'],
                          style: const TextStyle(color: Colors.grey),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      Text(
                        'Time: ${visit['visit_time'] ?? ''}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, color: Color(0xFFc9a227), size: 16),
                      Text(
                        '${visit['rewards'] ?? 0}',
                        style: const TextStyle(
                          color: Color(0xFFc9a227),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }
}
