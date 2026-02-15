import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'customers_screen.dart';
import 'visits_screen.dart';
import 'pending_visits_screen.dart';
import 'add_customer_screen.dart';
import 'add_visit_screen.dart';
import 'reports_screen.dart';
import 'meetings_screen.dart';
import 'gifts_screen.dart';
import 'sms_screen.dart';
import 'qr_code_screen.dart';
import 'categories_screen.dart';
import 'employees_screen.dart';
import 'offers_screen.dart';
import 'winners_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _isLoading = true);
    
    // Refresh user data to get updated permissions
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.refreshUserData();
    
    final result = await ApiService.getDashboard();
    if (result['success'] == true) {
      setState(() {
        _dashboardData = result['data'];
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('JP Tiles CRM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboard,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
            },
          ),
        ],
      ),
      drawer: _buildDrawer(context, auth),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFc9a227)),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboard,
              color: const Color(0xFFc9a227),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome, ${auth.user?['name'] ?? 'User'}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFc9a227),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      auth.isAdmin ? 'Administrator' : 'Employee',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    _buildQuickActions(context, auth),
                    const SizedBox(height: 24),
                    _buildRecentVisits(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildDrawer(BuildContext context, AuthProvider auth) {
    return Drawer(
      backgroundColor: const Color(0xFF1a1a1a),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Color(0xFF2d2d2d),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Color(0xFFc9a227),
                  child: Icon(Icons.person, size: 35, color: Colors.black),
                ),
                const SizedBox(height: 12),
                Text(
                  auth.user?['name'] ?? 'User',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  auth.isAdmin ? 'Administrator' : 'Employee',
                  style: const TextStyle(color: Color(0xFFc9a227)),
                ),
              ],
            ),
          ),
          _buildDrawerItem(Icons.dashboard, 'Dashboard', () {
            Navigator.pop(context);
          }),
          if (auth.hasPermission('view_customers'))
            _buildDrawerItem(Icons.people, 'Customers', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomersScreen()));
            }),
          if (auth.hasPermission('add_visit'))
            _buildDrawerItem(Icons.add_circle, 'Visit Entries', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AddVisitScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.assessment, 'Reports', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.event, 'Meetings', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const MeetingsScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.card_giftcard, 'Gift Tracking', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const GiftsScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.sms, 'Bulk SMS', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SmsScreen()));
            }),
          if (auth.hasPermission('approve_visits'))
            _buildDrawerItem(Icons.pending_actions, 'Pending Visits', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const PendingVisitsScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.qr_code, 'QR Code', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const QrCodeScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.category, 'Customer Categories', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CategoriesScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.badge, 'Employees', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const EmployeesScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.local_offer, 'Offers', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const OffersScreen()));
            }),
          if (auth.isAdmin)
            _buildDrawerItem(Icons.emoji_events, 'Winners', () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const WinnersScreen()));
            }),
          const Divider(color: Color(0xFF444444)),
          _buildDrawerItem(Icons.logout, 'Logout', () async {
            await auth.logout();
            if (context.mounted) {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            }
          }),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFc9a227)),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      onTap: onTap,
    );
  }

  Widget _buildStatsGrid() {
    final stats = _dashboardData ?? {};
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Total Customers',
          '${stats['total_customers'] ?? 0}',
          Icons.people,
        ),
        _buildStatCard(
          'Total Visits',
          '${stats['total_visits'] ?? 0}',
          Icons.history,
        ),
        _buildStatCard(
          'Total Rewards',
          '${stats['total_rewards'] ?? 0}',
          Icons.star,
        ),
        _buildStatCard(
          'Pending Visits',
          '${stats['pending_visits'] ?? 0}',
          Icons.pending_actions,
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFFc9a227), size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              title,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFFc9a227),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (auth.hasPermission('add_customer'))
              Expanded(
                child: _buildActionButton(
                  'Add Customer',
                  Icons.person_add,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AddCustomerScreen()),
                  ),
                ),
              ),
            if (auth.hasPermission('add_customer') && auth.hasPermission('add_visit'))
              const SizedBox(width: 12),
            if (auth.hasPermission('add_visit'))
              Expanded(
                child: _buildActionButton(
                  'Add Visit',
                  Icons.add_circle,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AddVisitScreen()),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFFc9a227), size: 32),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentVisits() {
    final recentVisits = _dashboardData?['recent_visits'] as List? ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Visits',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFFc9a227),
          ),
        ),
        const SizedBox(height: 12),
        if (recentVisits.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text(
                  'No recent visits',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          )
        else
          ...recentVisits.take(5).map((visit) => Card(
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFc9a227),
                    child: Icon(Icons.person, color: Colors.black),
                  ),
                  title: Text(
                    visit['customer_name'] ?? 'Unknown',
                    style: const TextStyle(color: Colors.white),
                  ),
                  subtitle: Text(
                    '${visit['visit_date']} - Rewards: ${visit['rewards']}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  trailing: Text(
                    visit['customer_mobile'] ?? '',
                    style: const TextStyle(color: Color(0xFFc9a227)),
                  ),
                ),
              )),
      ],
    );
  }
}
