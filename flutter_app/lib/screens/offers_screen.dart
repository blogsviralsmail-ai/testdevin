import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  List<dynamic> _offers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    setState(() => _isLoading = true);
    final result = await ApiService.getOffers();
    if (mounted) {
      setState(() {
        _offers = result['data'] ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offers'),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showAddOfferDialog(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
          : _offers.isEmpty
              ? const Center(child: Text('No offers found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadOffers,
                  child: ListView.builder(
                    itemCount: _offers.length,
                    itemBuilder: (context, index) {
                      final offer = _offers[index];
                      final isActive = offer['is_active'] == 1 || offer['is_active'] == '1';
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isActive ? const Color(0xFFc9a227) : Colors.grey,
                                child: const Icon(Icons.local_offer, color: Colors.black),
                              ),
                              title: Text(offer['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              trailing: Switch(
                                value: isActive,
                                activeColor: const Color(0xFFc9a227),
                                onChanged: (value) async {
                                  await ApiService.toggleOffer(offer['id'], value);
                                  _loadOffers();
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              child: Text(offer['description'] ?? '', style: const TextStyle(color: Colors.grey)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _showAddOfferDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Add Offer', style: TextStyle(color: Color(0xFFc9a227))),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Offer Title'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                style: const TextStyle(color: Colors.white),
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty) {
                await ApiService.addOffer({
                  'title': titleController.text,
                  'description': descriptionController.text,
                });
                if (mounted) {
                  Navigator.pop(context);
                  _loadOffers();
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
