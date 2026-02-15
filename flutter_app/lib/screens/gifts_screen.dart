import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class GiftsScreen extends StatefulWidget {
  const GiftsScreen({super.key});

  @override
  State<GiftsScreen> createState() => _GiftsScreenState();
}

class _GiftsScreenState extends State<GiftsScreen> {
  List<dynamic> _events = [];
  List<dynamic> _customers = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final token = await ApiService.getToken();
      final eventsResponse = await http.get(
        Uri.parse('https://jptiles.in/api/gifts.php?action=events'),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      final customersResult = await ApiService.getCustomers();
      
      if (mounted) {
        final eventsData = jsonDecode(eventsResponse.body);
        if (eventsData['success'] == true) {
          setState(() {
            _events = eventsData['data'] ?? [];
            _customers = customersResult['data'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() {
            _isLoading = false;
            _errorMessage = eventsData['message'] ?? 'Failed to load events';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gift Tracking'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showCreateEventDialog(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                    ],
                  ),
                )
              : _events.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.card_giftcard, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text('No gift events found', style: TextStyle(color: Colors.grey)),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => _showCreateEventDialog(),
                            icon: const Icon(Icons.add),
                            label: const Text('Create Event'),
                          ),
                        ],
                      ),
                    )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _events.length,
                    itemBuilder: (context, index) {
                      final event = _events[index];
                      return _buildEventCard(event);
                    },
                  ),
                ),
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event) {
    final totalRecipients = int.tryParse(event['total_recipients']?.toString() ?? '0') ?? 0;
    final deliveredCount = int.tryParse(event['delivered_count']?.toString() ?? '0') ?? 0;
    final pendingCount = totalRecipients - deliveredCount;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _openEventDetail(event),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xFFc9a227),
                    child: Icon(Icons.card_giftcard, color: Colors.black),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event['title'] ?? 'Gift Event',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          event['event_date'] ?? '',
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, color: Colors.grey),
                    onSelected: (value) {
                      if (value == 'delete') {
                        _confirmDeleteEvent(event);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'delete', child: Text('Delete Event')),
                    ],
                  ),
                ],
              ),
              if (event['description'] != null && event['description'].toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(event['description'], style: const TextStyle(color: Colors.grey)),
                ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildStatChip('Recipients', totalRecipients.toString(), Colors.blue),
                  const SizedBox(width: 8),
                  _buildStatChip('Delivered', deliveredCount.toString(), Colors.green),
                  const SizedBox(width: 8),
                  _buildStatChip('Pending', pendingCount.toString(), Colors.orange),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(color: color, fontSize: 11)),
          const SizedBox(width: 4),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showCreateEventDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    DateTime selectedDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF2d2d2d),
          title: const Text('Create Gift Event', style: TextStyle(color: Color(0xFFc9a227))),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Event Name *',
                    hintText: 'e.g., Diwali 2026, New Year',
                    prefixIcon: Icon(Icons.celebration, color: Color(0xFFc9a227)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    hintText: 'Details about the gift event',
                    prefixIcon: Icon(Icons.description, color: Color(0xFFc9a227)),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today, color: Color(0xFFc9a227)),
                  title: Text('Event Date: ${selectedDate.toString().split(' ')[0]}', style: const TextStyle(color: Colors.white)),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now().subtract(const Duration(days: 365)),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setDialogState(() => selectedDate = date);
                    }
                  },
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
                if (titleController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter event name'), backgroundColor: Colors.red),
                  );
                  return;
                }
                Navigator.pop(context);
                await _createEvent(titleController.text, descriptionController.text, selectedDate);
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createEvent(String title, String description, DateTime eventDate) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'create_event',
          'title': title,
          'description': description,
          'event_date': eventDate.toString().split(' ')[0],
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Event created'),
            backgroundColor: result['success'] == true ? Colors.green : Colors.red,
          ),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _confirmDeleteEvent(Map<String, dynamic> event) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Delete Event', style: TextStyle(color: Colors.red)),
        content: Text('Are you sure you want to delete "${event['title']}"? This will also remove all recipients.', style: const TextStyle(color: Colors.white)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteEvent(event['id']);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteEvent(dynamic eventId) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'delete_event',
          'event_id': eventId,
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Event deleted'),
            backgroundColor: result['success'] == true ? Colors.green : Colors.red,
          ),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _openEventDetail(Map<String, dynamic> event) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GiftEventDetailScreen(
          event: event,
          customers: _customers,
          onUpdate: _loadData,
        ),
      ),
    );
  }
}

class GiftEventDetailScreen extends StatefulWidget {
  final Map<String, dynamic> event;
  final List<dynamic> customers;
  final VoidCallback onUpdate;

  const GiftEventDetailScreen({
    super.key,
    required this.event,
    required this.customers,
    required this.onUpdate,
  });

  @override
  State<GiftEventDetailScreen> createState() => _GiftEventDetailScreenState();
}

class _GiftEventDetailScreenState extends State<GiftEventDetailScreen> {
  List<dynamic> _recipients = [];
  bool _isLoading = true;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _loadRecipients();
  }

  Future<void> _loadRecipients() async {
    setState(() => _isLoading = true);
    
    try {
      final token = await ApiService.getToken();
      final response = await http.get(
        Uri.parse('https://jptiles.in/api/gifts.php?action=recipients&event_id=${widget.event['id']}'),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      final data = jsonDecode(response.body);
      if (mounted) {
        setState(() {
          _recipients = data['data'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<dynamic> get _filteredRecipients {
    if (_filterStatus == 'all') return _recipients;
    if (_filterStatus == 'pending') return _recipients.where((r) => r['is_delivered'] != 1 && r['is_delivered'] != '1').toList();
    if (_filterStatus == 'delivered') return _recipients.where((r) => r['is_delivered'] == 1 || r['is_delivered'] == '1').toList();
    return _recipients;
  }

  @override
  Widget build(BuildContext context) {
    final deliveredCount = _recipients.where((r) => r['is_delivered'] == 1 || r['is_delivered'] == '1').length;
    final pendingCount = _recipients.length - deliveredCount;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.event['title'] ?? 'Event Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadRecipients,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showAddRecipientsDialog(),
        icon: const Icon(Icons.person_add, color: Colors.black),
        label: const Text('Add Recipients', style: TextStyle(color: Colors.black)),
      ),
      body: Column(
        children: [
          // Event Info Card
          Card(
            margin: const EdgeInsets.all(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Color(0xFFc9a227), size: 20),
                      const SizedBox(width: 8),
                      Text('Date: ${widget.event['event_date'] ?? 'N/A'}', style: const TextStyle(color: Colors.white)),
                    ],
                  ),
                  if (widget.event['description'] != null && widget.event['description'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(widget.event['description'], style: const TextStyle(color: Colors.grey)),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn('Total', _recipients.length.toString(), Colors.blue),
                      _buildStatColumn('Delivered', deliveredCount.toString(), Colors.green),
                      _buildStatColumn('Pending', pendingCount.toString(), Colors.orange),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Pending', 'pending'),
                const SizedBox(width: 8),
                _buildFilterChip('Delivered', 'delivered'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Recipients List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
                : _filteredRecipients.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.people_outline, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            const Text('No recipients found', style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () => _showAddRecipientsDialog(),
                              icon: const Icon(Icons.person_add),
                              label: const Text('Add Recipients'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadRecipients,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _filteredRecipients.length,
                          itemBuilder: (context, index) {
                            final recipient = _filteredRecipients[index];
                            return _buildRecipientCard(recipient);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filterStatus == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterStatus = selected ? value : 'all');
      },
      selectedColor: const Color(0xFFc9a227),
      checkmarkColor: Colors.black,
      labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
      backgroundColor: const Color(0xFF2d2d2d),
    );
  }

  Widget _buildRecipientCard(Map<String, dynamic> recipient) {
    final isDelivered = recipient['is_delivered'] == 1 || recipient['is_delivered'] == '1';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isDelivered ? Colors.green : Colors.orange,
          child: Icon(isDelivered ? Icons.check : Icons.pending, color: Colors.white),
        ),
        title: Text(recipient['customer_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(recipient['customer_mobile'] ?? '', style: const TextStyle(color: Colors.grey)),
            if (recipient['gift_description'] != null && recipient['gift_description'].toString().isNotEmpty)
              Text('Gift: ${recipient['gift_description']}', style: const TextStyle(color: Color(0xFFc9a227), fontSize: 12)),
            if (isDelivered && recipient['delivered_date'] != null)
              Text('Delivered: ${recipient['delivered_date']}', style: const TextStyle(color: Colors.green, fontSize: 11)),
          ],
        ),
        isThreeLine: true,
        trailing: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert, color: Colors.grey),
          onSelected: (value) {
            if (value == 'deliver') {
              _markDelivered(recipient['id']);
            } else if (value == 'remove') {
              _confirmRemoveRecipient(recipient);
            }
          },
          itemBuilder: (context) => [
            if (!isDelivered)
              const PopupMenuItem(value: 'deliver', child: Text('Mark Delivered')),
            const PopupMenuItem(value: 'remove', child: Text('Remove')),
          ],
        ),
      ),
    );
  }

  void _showAddRecipientsDialog() {
    List<int> selectedCustomerIds = [];
    final giftDescriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF2d2d2d),
          title: const Text('Add Recipients', style: TextStyle(color: Color(0xFFc9a227))),
          content: SizedBox(
            width: double.maxFinite,
            height: 450,
            child: Column(
              children: [
                TextField(
                  controller: giftDescriptionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Gift Item *',
                    hintText: 'e.g., Diwali Gift Box',
                    prefixIcon: Icon(Icons.card_giftcard, color: Color(0xFFc9a227)),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        setDialogState(() {
                          selectedCustomerIds = widget.customers.map((c) => int.tryParse(c['id'].toString()) ?? 0).toList();
                        });
                      },
                      child: const Text('Select All'),
                    ),
                    TextButton(
                      onPressed: () {
                        setDialogState(() => selectedCustomerIds = []);
                      },
                      child: const Text('Clear All'),
                    ),
                  ],
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: widget.customers.length,
                    itemBuilder: (context, index) {
                      final customer = widget.customers[index];
                      final customerId = int.tryParse(customer['id'].toString()) ?? 0;
                      final isSelected = selectedCustomerIds.contains(customerId);
                      
                      return CheckboxListTile(
                        value: isSelected,
                        onChanged: (value) {
                          setDialogState(() {
                            if (value == true) {
                              selectedCustomerIds.add(customerId);
                            } else {
                              selectedCustomerIds.remove(customerId);
                            }
                          });
                        },
                        title: Text(customer['name'] ?? '', style: const TextStyle(color: Colors.white)),
                        subtitle: Text('${customer['mobile'] ?? ''} - ${customer['category_name'] ?? 'N/A'}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        activeColor: const Color(0xFFc9a227),
                        checkColor: Colors.black,
                        dense: true,
                      );
                    },
                  ),
                ),
                Text('${selectedCustomerIds.length} customers selected', style: const TextStyle(color: Color(0xFFc9a227))),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: selectedCustomerIds.isEmpty || giftDescriptionController.text.isEmpty ? null : () async {
                Navigator.pop(context);
                await _addRecipients(selectedCustomerIds, giftDescriptionController.text);
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addRecipients(List<int> customerIds, String giftDescription) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'add_recipients',
          'event_id': widget.event['id'],
          'customer_ids': customerIds,
          'gift_description': giftDescription,
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Recipients added'),
            backgroundColor: result['success'] == true ? Colors.green : Colors.red,
          ),
        );
        _loadRecipients();
        widget.onUpdate();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _markDelivered(dynamic recipientId) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'mark_delivered',
          'recipient_id': recipientId,
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Marked as delivered'),
            backgroundColor: result['success'] == true ? Colors.green : Colors.red,
          ),
        );
        _loadRecipients();
        widget.onUpdate();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _confirmRemoveRecipient(Map<String, dynamic> recipient) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Remove Recipient', style: TextStyle(color: Colors.red)),
        content: Text('Remove ${recipient['customer_name']} from this event?', style: const TextStyle(color: Colors.white)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _removeRecipient(recipient['id']);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  Future<void> _removeRecipient(dynamic recipientId) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'remove_recipient',
          'recipient_id': recipientId,
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Recipient removed'),
            backgroundColor: result['success'] == true ? Colors.green : Colors.red,
          ),
        );
        _loadRecipients();
        widget.onUpdate();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
