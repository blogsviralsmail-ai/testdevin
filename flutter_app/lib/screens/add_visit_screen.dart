import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AddVisitScreen extends StatefulWidget {
  final Map<String, dynamic>? customer;

  const AddVisitScreen({super.key, this.customer});

  @override
  State<AddVisitScreen> createState() => _AddVisitScreenState();
}

class _AddVisitScreenState extends State<AddVisitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mobileController = TextEditingController();
  final _itemsController = TextEditingController();
  final _rewardsController = TextEditingController();
  
  Map<String, dynamic>? _selectedCustomer;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  bool _isLoading = false;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    if (widget.customer != null) {
      _selectedCustomer = widget.customer;
      _mobileController.text = widget.customer!['mobile'] ?? '';
    }
  }

  Future<void> _searchCustomer() async {
    if (_mobileController.text.length < 10) return;

    setState(() => _isSearching = true);

    final result = await ApiService.searchCustomer(_mobileController.text.trim());

    setState(() => _isSearching = false);

    if (result['success'] == true && result['data'] != null) {
      final customers = result['data'] as List;
      if (customers.isNotEmpty) {
        setState(() => _selectedCustomer = customers.first);
      } else {
        setState(() => _selectedCustomer = null);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Customer not found'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFFc9a227),
              surface: Color(0xFF2d2d2d),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFFc9a227),
              surface: Color(0xFF2d2d2d),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _saveVisit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please search and select a customer first'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final result = await ApiService.addVisit({
      'customer_id': _selectedCustomer!['id'],
      'visit_date': '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
      'visit_time': '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}:00',
      'items': _itemsController.text.trim(),
      'rewards': double.tryParse(_rewardsController.text) ?? 0,
    });

    setState(() => _isLoading = false);

    if (result['success'] == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Visit added successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to add visit'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Visit'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _mobileController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      enabled: widget.customer == null,
                      decoration: const InputDecoration(
                        labelText: 'Customer Mobile *',
                        prefixIcon: Icon(Icons.phone, color: Color(0xFFc9a227)),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter mobile number';
                        }
                        return null;
                      },
                      onChanged: (value) {
                        if (value.length >= 10) {
                          _searchCustomer();
                        } else {
                          setState(() => _selectedCustomer = null);
                        }
                      },
                    ),
                  ),
                  if (widget.customer == null) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _isSearching ? null : _searchCustomer,
                      icon: _isSearching
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFFc9a227),
                              ),
                            )
                          : const Icon(Icons.search, color: Color(0xFFc9a227)),
                    ),
                  ],
                ],
              ),
              if (_selectedCustomer != null) ...[
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFc9a227),
                      child: Icon(Icons.person, color: Colors.black),
                    ),
                    title: Text(
                      _selectedCustomer!['name'] ?? 'Unknown',
                      style: const TextStyle(color: Colors.white),
                    ),
                    subtitle: Text(
                      '${_selectedCustomer!['category_name'] ?? 'No Category'} | Rewards: ${_selectedCustomer!['total_rewards'] ?? 0}',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    trailing: const Icon(Icons.check_circle, color: Colors.green),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _selectDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Visit Date',
                          prefixIcon: Icon(Icons.calendar_today, color: Color(0xFFc9a227)),
                        ),
                        child: Text(
                          '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InkWell(
                      onTap: _selectTime,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Visit Time',
                          prefixIcon: Icon(Icons.access_time, color: Color(0xFFc9a227)),
                        ),
                        child: Text(
                          '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _itemsController,
                style: const TextStyle(color: Colors.white),
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Items Purchased',
                  prefixIcon: Icon(Icons.shopping_bag, color: Color(0xFFc9a227)),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _rewardsController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Rewards *',
                  prefixIcon: Icon(Icons.star, color: Color(0xFFc9a227)),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter rewards';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveVisit,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.black,
                          ),
                        )
                      : const Text(
                          'SAVE VISIT',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _itemsController.dispose();
    _rewardsController.dispose();
    super.dispose();
  }
}
