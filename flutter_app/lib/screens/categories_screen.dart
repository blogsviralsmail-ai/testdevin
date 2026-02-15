import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<dynamic> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() => _isLoading = true);
    final result = await ApiService.getCategories();
    if (mounted) {
      setState(() {
        _categories = result['data'] ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Categories'),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showAddCategoryDialog(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
          : _categories.isEmpty
              ? const Center(child: Text('No categories found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadCategories,
                  child: ListView.builder(
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFFc9a227),
                            child: Text('${index + 1}', style: const TextStyle(color: Colors.black)),
                          ),
                          title: Text(category['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          subtitle: Text('${category['customer_count'] ?? 0} customers', style: const TextStyle(color: Colors.grey)),
                          trailing: const Icon(Icons.category, color: Color(0xFFc9a227)),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _showAddCategoryDialog() {
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Add Category', style: TextStyle(color: Color(0xFFc9a227))),
        content: TextField(
          controller: nameController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(labelText: 'Category Name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isNotEmpty) {
                await ApiService.addCategory(nameController.text);
                if (mounted) {
                  Navigator.pop(context);
                  _loadCategories();
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
