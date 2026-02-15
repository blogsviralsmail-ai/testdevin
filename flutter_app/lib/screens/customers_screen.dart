import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service.dart';
import 'add_customer_screen.dart';
import 'customer_detail_screen.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<dynamic> _customers = [];
  List<dynamic> _categories = [];
  List<dynamic> _searchSuggestions = [];
  bool _isLoading = true;
  bool _showSuggestions = false;
  String _selectedCategory = '';
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (_searchController.text.isNotEmpty) {
        _loadSearchSuggestions();
      } else {
        setState(() {
          _searchSuggestions = [];
          _showSuggestions = false;
        });
        _loadCustomers();
      }
    });
  }

  Future<void> _loadSearchSuggestions() async {
    final result = await ApiService.getCustomers(
      category: _selectedCategory,
      search: _searchController.text,
    );
    
    if (result['success'] == true) {
      setState(() {
        _searchSuggestions = result['data'] ?? [];
        _showSuggestions = _searchSuggestions.isNotEmpty && _searchFocusNode.hasFocus;
      });
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final categoriesResult = await ApiService.getCategories();
    if (categoriesResult['success'] == true) {
      _categories = categoriesResult['data'] ?? [];
    }
    
    await _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    setState(() => _isLoading = true);
    
    final result = await ApiService.getCustomers(
      category: _selectedCategory,
      search: _searchController.text,
    );
    
    if (result['success'] == true) {
      setState(() {
        _customers = result['data'] ?? [];
        _isLoading = false;
        _showSuggestions = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  void _selectSuggestion(Map<String, dynamic> customer) {
    setState(() {
      _showSuggestions = false;
    });
    _searchFocusNode.unfocus();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CustomerDetailScreen(customer: customer),
      ),
    ).then((result) {
      if (result == true) _loadCustomers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddCustomerScreen()),
          );
          if (result == true) _loadCustomers();
        },
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      focusNode: _searchFocusNode,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Search by name or mobile...',
                        prefixIcon: const Icon(Icons.search, color: Color(0xFFc9a227)),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: Colors.grey),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchSuggestions = [];
                                    _showSuggestions = false;
                                  });
                                  _loadCustomers();
                                },
                              )
                            : null,
                      ),
                      onSubmitted: (_) {
                        setState(() => _showSuggestions = false);
                        _loadCustomers();
                      },
                      onTap: () {
                        if (_searchSuggestions.isNotEmpty) {
                          setState(() => _showSuggestions = true);
                        }
                      },
                    ),
                    if (_showSuggestions && _searchSuggestions.isNotEmpty)
                      Container(
                        constraints: const BoxConstraints(maxHeight: 200),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2d2d2d),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFc9a227), width: 1),
                        ),
                        child: ListView.builder(
                          shrinkWrap: true,
                          itemCount: _searchSuggestions.length > 5 ? 5 : _searchSuggestions.length,
                          itemBuilder: (context, index) {
                            final customer = _searchSuggestions[index];
                            return ListTile(
                              dense: true,
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFc9a227),
                                radius: 16,
                                child: Icon(Icons.person, color: Colors.black, size: 18),
                              ),
                              title: Text(
                                customer['name'] ?? 'Unknown',
                                style: const TextStyle(color: Colors.white, fontSize: 14),
                              ),
                              subtitle: Text(
                                customer['mobile'] ?? '',
                                style: const TextStyle(color: Color(0xFFc9a227), fontSize: 12),
                              ),
                              onTap: () => _selectSuggestion(customer),
                            );
                          },
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _buildCategoryChip('All', ''),
                      ..._categories.map((cat) => _buildCategoryChip(
                            cat['name'],
                            cat['id'].toString(),
                          )),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () {
                _searchFocusNode.unfocus();
                setState(() => _showSuggestions = false);
              },
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFFc9a227)),
                    )
                  : _customers.isEmpty
                      ? const Center(
                          child: Text(
                            'No customers found',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadCustomers,
                          color: const Color(0xFFc9a227),
                          child: ListView.builder(
                            itemCount: _customers.length,
                            itemBuilder: (context, index) {
                              final customer = _customers[index];
                              return _buildCustomerCard(customer);
                            },
                          ),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, String value) {
    final isSelected = _selectedCategory == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() => _selectedCategory = selected ? value : '');
          _loadCustomers();
        },
        selectedColor: const Color(0xFFc9a227),
        checkmarkColor: Colors.black,
        labelStyle: TextStyle(
          color: isSelected ? Colors.black : Colors.white,
        ),
        backgroundColor: const Color(0xFF2d2d2d),
      ),
    );
  }

  String _getPhotoUrl(String? photo) {
    if (photo == null || photo.isEmpty) return '';
    if (photo.startsWith('http')) return photo;
    // Photos are stored in uploads/customers/ directory
    return 'https://jptiles.in/uploads/customers/$photo';
  }

  Widget _buildCustomerCard(Map<String, dynamic> customer) {
    final photoUrl = _getPhotoUrl(customer['photo']?.toString());
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFc9a227),
          backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
          child: photoUrl.isEmpty ? const Icon(Icons.person, color: Colors.black) : null,
        ),
        title: Text(
          customer['name'] ?? 'Unknown',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              customer['mobile'] ?? '',
              style: const TextStyle(color: Color(0xFFc9a227)),
            ),
            Text(
              '${customer['category_name'] ?? 'No Category'} | Rewards: ${customer['total_rewards'] ?? 0}',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFFc9a227)),
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => CustomerDetailScreen(customer: customer),
            ),
          );
          if (result == true) _loadCustomers();
        },
      ),
    );
  }
}
