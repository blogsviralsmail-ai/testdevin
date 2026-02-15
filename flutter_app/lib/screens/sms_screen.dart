import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SmsScreen extends StatefulWidget {
  const SmsScreen({super.key});

  @override
  State<SmsScreen> createState() => _SmsScreenState();
}

class _SmsScreenState extends State<SmsScreen> {
  List<dynamic> _customers = [];
  List<dynamic> _categories = [];
  String? _selectedCategory;
  final _messageController = TextEditingController();
  Set<int> _selectedCustomers = {};
  bool _isLoading = true;
  bool _isSending = false;

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
        _isLoading = false;
      });
    }
  }

  void _selectAll() {
    setState(() {
      _selectedCustomers = _customers.map((c) => c['id'] as int).toSet();
    });
  }

  void _deselectAll() {
    setState(() {
      _selectedCustomers.clear();
    });
  }

  Future<void> _sendSms() async {
    if (_selectedCustomers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one customer'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_messageController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a message'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSending = true);
    
    final result = await ApiService.sendBulkSms(
      _selectedCustomers.toList(),
      _messageController.text,
    );
    
    setState(() => _isSending = false);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'SMS sent'),
          backgroundColor: result['success'] == true ? Colors.green : Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bulk SMS'),
        actions: [
          TextButton(
            onPressed: _selectAll,
            child: const Text('Select All'),
          ),
          TextButton(
            onPressed: _deselectAll,
            child: const Text('Deselect'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
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
                    setState(() {
                      _selectedCategory = value;
                      _selectedCustomers.clear();
                    });
                    _loadData();
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _messageController,
                  style: const TextStyle(color: Colors.white),
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Message',
                    hintText: 'Enter your SMS message here...',
                    prefixIcon: Icon(Icons.message, color: Color(0xFFc9a227)),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text('Selected: ${_selectedCustomers.length}', style: const TextStyle(color: Color(0xFFc9a227))),
                    const Spacer(),
                    ElevatedButton.icon(
                      onPressed: _isSending ? null : _sendSms,
                      icon: _isSending 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send),
                      label: const Text('Send SMS'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
                : ListView.builder(
                    itemCount: _customers.length,
                    itemBuilder: (context, index) {
                      final customer = _customers[index];
                      final isSelected = _selectedCustomers.contains(customer['id']);
                      return CheckboxListTile(
                        value: isSelected,
                        activeColor: const Color(0xFFc9a227),
                        title: Text(customer['name'] ?? '', style: const TextStyle(color: Colors.white)),
                        subtitle: Text(customer['mobile'] ?? '', style: const TextStyle(color: Colors.grey)),
                        onChanged: (value) {
                          setState(() {
                            if (value == true) {
                              _selectedCustomers.add(customer['id']);
                            } else {
                              _selectedCustomers.remove(customer['id']);
                            }
                          });
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }
}
