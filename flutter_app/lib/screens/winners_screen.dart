import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WinnersScreen extends StatefulWidget {
  const WinnersScreen({super.key});

  @override
  State<WinnersScreen> createState() => _WinnersScreenState();
}

class _WinnersScreenState extends State<WinnersScreen> {
  List<dynamic> _winners = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWinners();
  }

  Future<void> _loadWinners() async {
    setState(() => _isLoading = true);
    final result = await ApiService.getWinners();
    if (mounted) {
      setState(() {
        _winners = result['data'] ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Winners'),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showAddWinnerDialog(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
          : _winners.isEmpty
              ? const Center(child: Text('No winners found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadWinners,
                  child: ListView.builder(
                    itemCount: _winners.length,
                    itemBuilder: (context, index) {
                      final winner = _winners[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (winner['photo'] != null && winner['photo'].toString().isNotEmpty)
                              ClipRRect(
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                child: Image.network(
                                  winner['photo'].toString().startsWith('http') 
                                      ? winner['photo'] 
                                      : 'https://jptiles.kkhsmedia.com/${winner['photo']}',
                                  height: 200,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      height: 200,
                                      color: const Color(0xFF2d2d2d),
                                      child: const Center(
                                        child: Icon(Icons.image, size: 50, color: Colors.grey),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFc9a227),
                                child: Icon(Icons.emoji_events, color: Colors.black),
                              ),
                              title: Text(winner['customer_name'] ?? winner['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Prize: ${winner['prize'] ?? ''}', style: const TextStyle(color: Color(0xFFc9a227))),
                                  Text('Date: ${winner['created_at']?.toString().split(' ')[0] ?? ''}', style: const TextStyle(color: Colors.grey)),
                                ],
                              ),
                              isThreeLine: true,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _showAddWinnerDialog() {
    final nameController = TextEditingController();
    final prizeController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Add Winner', style: TextStyle(color: Color(0xFFc9a227))),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Winner Name'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: prizeController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Prize'),
              ),
              const SizedBox(height: 16),
              const Text('Note: Add photos from web admin', style: TextStyle(color: Colors.grey, fontSize: 12)),
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
              if (nameController.text.isNotEmpty) {
                await ApiService.addWinner({
                  'name': nameController.text,
                  'prize': prizeController.text,
                });
                if (mounted) {
                  Navigator.pop(context);
                  _loadWinners();
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
