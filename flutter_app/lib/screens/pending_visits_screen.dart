import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PendingVisitsScreen extends StatefulWidget {
  const PendingVisitsScreen({super.key});

  @override
  State<PendingVisitsScreen> createState() => _PendingVisitsScreenState();
}

class _PendingVisitsScreenState extends State<PendingVisitsScreen> {
  List<dynamic> _pendingVisits = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPendingVisits();
  }

  Future<void> _loadPendingVisits() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    final result = await ApiService.getPendingVisits();
    
    if (result['success'] == true) {
      setState(() {
        _pendingVisits = result['data'] ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = result['message'] ?? 'Failed to load pending visits';
      });
    }
  }

  Future<void> _approveVisit(Map<String, dynamic> visit) async {
    final rewardsController = TextEditingController();
    final referenceController = TextEditingController(text: visit['reference_by'] ?? 'Direct');
    String selectedTier = visit['customer_tier'] ?? 'Silver';
    
    final result = await showDialog<Map<String, dynamic>?>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF2d2d2d),
          title: const Text(
            'Approve Visit',
            style: TextStyle(color: Color(0xFFc9a227)),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Customer: ${visit['customer_name']}',
                  style: const TextStyle(color: Colors.white),
                ),
                Text(
                  'Mobile: ${visit['customer_mobile']}',
                  style: const TextStyle(color: Colors.grey),
                ),
                Text(
                  'Date: ${visit['visit_date']}',
                  style: const TextStyle(color: Colors.grey),
                ),
                if (visit['items'] != null && visit['items'].toString().isNotEmpty)
                  Text(
                    'Items: ${visit['items']}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                const SizedBox(height: 16),
                TextField(
                  controller: rewardsController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Rewards',
                    prefixIcon: Icon(Icons.star, color: Color(0xFFc9a227)),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Customer Tier', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButton<String>(
                    value: selectedTier,
                    isExpanded: true,
                    dropdownColor: const Color(0xFF2d2d2d),
                    underline: const SizedBox(),
                    style: const TextStyle(color: Colors.white),
                    items: ['Platinum', 'Gold', 'Silver', 'Brown'].map((tier) {
                      Color tierColor;
                      switch (tier) {
                        case 'Platinum': tierColor = Colors.grey.shade300; break;
                        case 'Gold': tierColor = Colors.amber; break;
                        case 'Silver': tierColor = Colors.grey; break;
                        case 'Brown': tierColor = Colors.brown; break;
                        default: tierColor = Colors.grey;
                      }
                      return DropdownMenuItem(
                        value: tier,
                        child: Row(
                          children: [
                            Container(
                              width: 16, height: 16,
                              decoration: BoxDecoration(
                                color: tierColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(tier),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setDialogState(() => selectedTier = value!);
                    },
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: referenceController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Reference By',
                    prefixIcon: Icon(Icons.person_add, color: Color(0xFFc9a227)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, null),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, {
                'approved': true,
                'tier': selectedTier,
                'reference': referenceController.text,
                'rewards': rewardsController.text,
              }),
              child: const Text('Approve'),
            ),
          ],
        ),
      ),
    );

    if (result != null && result['approved'] == true) {
      final rewards = double.tryParse(result['rewards'] ?? '0') ?? 0;
      final approveResult = await ApiService.approveVisit(
        visit['id'], 
        rewards,
        customerTier: result['tier'],
        referenceBy: result['reference'],
      );
      
      if (approveResult['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Visit approved successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
        _loadPendingVisits();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(approveResult['message'] ?? 'Failed to approve visit'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Visits'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPendingVisits,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFc9a227)),
            )
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 16), textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadPendingVisits, child: const Text('Retry')),
                    ],
                  ),
                )
              : _pendingVisits.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.check_circle_outline,
                            size: 64,
                            color: Colors.green,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'No pending visits',
                            style: TextStyle(color: Colors.grey, fontSize: 18),
                          ),
                        ],
                      ),
                    )
              : RefreshIndicator(
                  onRefresh: _loadPendingVisits,
                  color: const Color(0xFFc9a227),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _pendingVisits.length,
                    itemBuilder: (context, index) {
                      final visit = _pendingVisits[index];
                      return _buildPendingVisitCard(visit);
                    },
                  ),
                ),
    );
  }

  Widget _buildPendingVisitCard(Map<String, dynamic> visit) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0xFFc9a227),
                  child: Icon(Icons.person, color: Colors.black),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        visit['customer_name'] ?? 'Unknown',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        visit['customer_mobile'] ?? '',
                        style: const TextStyle(color: Color(0xFFc9a227)),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'PENDING',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today, color: Colors.grey, size: 16),
                const SizedBox(width: 8),
                Text(
                  visit['visit_date'] ?? '',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.access_time, color: Colors.grey, size: 16),
                const SizedBox(width: 8),
                Text(
                  visit['visit_time'] ?? '',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
            if (visit['items'] != null && visit['items'].toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.shopping_bag, color: Colors.grey, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      visit['items'],
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: const Color(0xFF2d2d2d),
                        title: const Text(
                          'Reject Visit?',
                          style: TextStyle(color: Colors.red),
                        ),
                        content: const Text(
                          'Are you sure you want to reject this visit?',
                          style: TextStyle(color: Colors.white),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Reject'),
                          ),
                        ],
                      ),
                    );
                    
                    if (confirm == true) {
                      final rejectResult = await ApiService.rejectVisit(visit['id']);
                      
                      if (rejectResult['success'] == true) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Visit rejected successfully'),
                              backgroundColor: Colors.orange,
                            ),
                          );
                        }
                        _loadPendingVisits();
                      } else {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(rejectResult['message'] ?? 'Failed to reject visit'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      }
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () => _approveVisit(visit),
                  child: const Text('Approve'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
