import 'package:flutter/material.dart';
import '../services/api_service.dart';

class EmployeesScreen extends StatefulWidget {
  const EmployeesScreen({super.key});

  @override
  State<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends State<EmployeesScreen> {
  List<dynamic> _employees = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() => _isLoading = true);
    final result = await ApiService.getEmployees();
    if (mounted) {
      setState(() {
        _employees = result['data'] ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFc9a227),
        onPressed: () => _showAddEmployeeDialog(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
          : _employees.isEmpty
              ? const Center(child: Text('No employees found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadEmployees,
                  child: ListView.builder(
                    itemCount: _employees.length,
                    itemBuilder: (context, index) {
                      final employee = _employees[index];
                      final isActive = employee['status'] == 'active';
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isActive ? const Color(0xFFc9a227) : Colors.grey,
                            child: const Icon(Icons.person, color: Colors.black),
                          ),
                          title: Text(employee['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          subtitle: Text(employee['mobile'] ?? '', style: const TextStyle(color: Colors.grey)),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isActive ? Colors.green : Colors.red,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(isActive ? 'Active' : 'Inactive', style: const TextStyle(color: Colors.white, fontSize: 12)),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _showAddEmployeeDialog() {
    final nameController = TextEditingController();
    final mobileController = TextEditingController();
    final passwordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2d2d2d),
        title: const Text('Add Employee', style: TextStyle(color: Color(0xFFc9a227))),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: mobileController,
                style: const TextStyle(color: Colors.white),
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Mobile'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: passwordController,
                style: const TextStyle(color: Colors.white),
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              const SizedBox(height: 16),
              const Text('Note: Set permissions from web admin', style: TextStyle(color: Colors.grey, fontSize: 12)),
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
              if (nameController.text.isNotEmpty && mobileController.text.isNotEmpty) {
                await ApiService.addEmployee({
                  'name': nameController.text,
                  'mobile': mobileController.text,
                  'password': passwordController.text,
                });
                if (mounted) {
                  Navigator.pop(context);
                  _loadEmployees();
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
