import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  List<dynamic> _customers = [];
  List<dynamic> _categories = [];
  String? _selectedCategory;
  bool _isLoading = true;
  double _totalRewards = 0;
  int _totalVisits = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final categoriesResult = await ApiService.getCategories();
    final customersResult = await ApiService.getCustomers(category: _selectedCategory);
    
    if (mounted) {
      setState(() {
        _categories = categoriesResult['data'] ?? [];
        _customers = customersResult['data'] ?? [];
        _calculateTotals();
        _isLoading = false;
      });
    }
  }

  void _calculateTotals() {
    _totalRewards = 0;
    _totalVisits = 0;
    for (var customer in _customers) {
      _totalRewards += double.tryParse(customer['total_rewards']?.toString() ?? '0') ?? 0;
      _totalVisits += int.tryParse(customer['visit_count']?.toString() ?? '0') ?? 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: DropdownButtonFormField<String>(
              value: _selectedCategory,
              dropdownColor: const Color(0xFF2d2d2d),
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Filter by Category',
                prefixIcon: Icon(Icons.filter_list, color: Color(0xFFc9a227)),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('All Categories')),
                ..._categories.map((cat) => DropdownMenuItem(
                  value: cat['id'].toString(),
                  child: Text(cat['name']),
                )),
              ],
              onChanged: (value) {
                setState(() => _selectedCategory = value);
                _loadData();
              },
            ),
          ),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text('${_customers.length}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFc9a227))),
                      const Text('Customers', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                  Column(
                    children: [
                      Text('$_totalVisits', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFc9a227))),
                      const Text('Total Visits', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                  Column(
                    children: [
                      Text('${_totalRewards.toStringAsFixed(0)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFc9a227))),
                      const Text('Total Rewards', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
                : ListView.builder(
                    itemCount: _customers.length,
                    itemBuilder: (context, index) {
                      final customer = _customers[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFFc9a227),
                            child: Text('${index + 1}', style: const TextStyle(color: Colors.black)),
                          ),
                          title: Text(customer['name'] ?? '', style: const TextStyle(color: Colors.white)),
                          subtitle: Text('${customer['mobile']} | Visits: ${customer['visit_count'] ?? 0}', style: const TextStyle(color: Colors.grey)),
                          trailing: Text('${customer['total_rewards'] ?? 0}', style: const TextStyle(color: Color(0xFFc9a227), fontWeight: FontWeight.bold)),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
