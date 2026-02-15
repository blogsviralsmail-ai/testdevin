import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen> {
  List<dynamic> _meetings = [];
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
    
    final meetingsResult = await ApiService.getMeetings();
    final customersResult = await ApiService.getCustomers();
    
    if (mounted) {
      if (meetingsResult['success'] == true) {
        setState(() {
          _meetings = meetingsResult['data'] ?? [];
          _customers = customersResult['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = meetingsResult['message'] ?? 'Failed to load meetings';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meetings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showCreateMeetingDialog(),
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
              : _meetings.isEmpty
                  ? const Center(child: Text('No meetings found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    itemCount: _meetings.length,
                    itemBuilder: (context, index) {
                      final meeting = _meetings[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: InkWell(
                          onTap: () => _showMeetingDetails(meeting),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      backgroundColor: Color(0xFFc9a227),
                                      child: Icon(Icons.event, color: Colors.black),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(meeting['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                          Text('Date: ${meeting['meeting_date'] ?? ''}', style: const TextStyle(color: Colors.grey)),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.person_add, color: Color(0xFFc9a227)),
                                      tooltip: 'Invite Customers',
                                      onPressed: () => _showInviteCustomersDialog(meeting),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('Venue: ${meeting['venue'] ?? 'Not specified'}', style: const TextStyle(color: Colors.grey)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    _buildStatChip('Invited', meeting['invited_count']?.toString() ?? '0', Colors.blue),
                                    const SizedBox(width: 8),
                                    _buildStatChip('Attended', meeting['attended_count']?.toString() ?? '0', Colors.green),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(color: color, fontSize: 12)),
          const SizedBox(width: 4),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showMeetingDetails(Map<String, dynamic> meeting) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF2d2d2d),
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      meeting['title'] ?? 'Meeting Details',
                      style: const TextStyle(color: Color(0xFFc9a227), fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(Icons.calendar_today, 'Date', meeting['meeting_date'] ?? 'N/A'),
                  _buildDetailRow(Icons.location_on, 'Venue', meeting['venue'] ?? 'Not specified'),
                  _buildDetailRow(Icons.people, 'Invited', '${meeting['invited_count'] ?? 0} customers'),
                  _buildDetailRow(Icons.check_circle, 'Attended', '${meeting['attended_count'] ?? 0} customers'),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showInviteCustomersDialog(meeting);
                      },
                      icon: const Icon(Icons.person_add),
                      label: const Text('Invite Customers'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFc9a227),
                        foregroundColor: Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showAttendanceDialog(meeting);
                      },
                      icon: const Icon(Icons.how_to_reg),
                      label: const Text('Mark Attendance'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFc9a227), size: 20),
          const SizedBox(width: 12),
          Text('$label: ', style: const TextStyle(color: Colors.grey)),
          Expanded(child: Text(value, style: const TextStyle(color: Colors.white))),
        ],
      ),
    );
  }

  void _showInviteCustomersDialog(Map<String, dynamic> meeting) {
    List<int> selectedCustomerIds = [];
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF2d2d2d),
          title: Text('Invite Customers to ${meeting['title']}', style: const TextStyle(color: Color(0xFFc9a227))),
          content: SizedBox(
            width: double.maxFinite,
            height: 400,
            child: Column(
              children: [
                const Text('Select customers to invite:', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        setDialogState(() {
                          selectedCustomerIds = _customers.map((c) => int.tryParse(c['id'].toString()) ?? 0).toList();
                        });
                      },
                      child: const Text('Select All'),
                    ),
                    TextButton(
                      onPressed: () {
                        setDialogState(() {
                          selectedCustomerIds = [];
                        });
                      },
                      child: const Text('Clear All'),
                    ),
                  ],
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: _customers.length,
                    itemBuilder: (context, index) {
                      final customer = _customers[index];
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
                        subtitle: Text(customer['mobile'] ?? '', style: const TextStyle(color: Colors.grey)),
                        activeColor: const Color(0xFFc9a227),
                        checkColor: Colors.black,
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
              onPressed: selectedCustomerIds.isEmpty ? null : () async {
                Navigator.pop(context);
                await _inviteCustomers(meeting['id'], selectedCustomerIds);
              },
              child: const Text('Invite'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _inviteCustomers(dynamic meetingId, List<int> customerIds) async {
    try {
      final token = await ApiService.getToken();
      final response = await http.post(
        Uri.parse('https://jptiles.in/api/meetings.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'invite',
          'meeting_id': meetingId,
          'customer_ids': customerIds,
        }),
      );
      
      final result = jsonDecode(response.body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Customers invited successfully'),
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

  void _showAttendanceDialog(Map<String, dynamic> meeting) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Attendance marking feature coming soon')),
    );
  }

  void _showCreateMeetingDialog() {
    final titleController = TextEditingController();
    final venueController = TextEditingController();
    DateTime selectedDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF2d2d2d),
          title: const Text('Create Meeting', style: TextStyle(color: Color(0xFFc9a227))),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Meeting Title'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: venueController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Venue'),
                ),
                const SizedBox(height: 16),
                ListTile(
                  title: Text('Date: ${selectedDate.toString().split(' ')[0]}', style: const TextStyle(color: Colors.white)),
                  trailing: const Icon(Icons.calendar_today, color: Color(0xFFc9a227)),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setDialogState(() {
                        selectedDate = date;
                      });
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
                if (titleController.text.isNotEmpty) {
                  await ApiService.createMeeting({
                    'title': titleController.text,
                    'venue': venueController.text,
                    'meeting_date': selectedDate.toString().split(' ')[0],
                  });
                  if (mounted) {
                    Navigator.pop(context);
                    _loadData();
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
