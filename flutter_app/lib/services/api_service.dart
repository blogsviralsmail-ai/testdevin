import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://jptiles.in/api';
  
  // Get stored auth token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
  
  // Store auth token
  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  
  // Clear auth token (logout)
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
  
  // Login
  static Future<Map<String, dynamic>> login(String mobile, String password, {String loginType = 'admin'}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'mobile': mobile, 'password': password, 'login_type': loginType}),
      ).timeout(const Duration(seconds: 30));
      
      if (response.statusCode != 200) {
        return {'success': false, 'message': 'Server error: ${response.statusCode}'};
      }
      
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['token'] != null) {
        await setToken(data['token']);
      }
      return data;
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'Network error: ${e.message}'};
    } on FormatException catch (e) {
      return {'success': false, 'message': 'Invalid response from server'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Refresh user data (get updated permissions)
  static Future<Map<String, dynamic>> refreshUser() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/auth.php?action=refresh'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode != 200) {
        return {'success': false, 'message': 'Server error: ${response.statusCode}'};
      }
      
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Dashboard Stats
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Customers
  static Future<Map<String, dynamic>> getCustomers({String? category, String? search}) async {
    try {
      final token = await getToken();
      String url = '$baseUrl/customers.php?';
      if (category != null && category.isNotEmpty) url += 'category=$category&';
      if (search != null && search.isNotEmpty) url += 'search=$search&';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Add Customer
  static Future<Map<String, dynamic>> addCustomer(Map<String, dynamic> customerData) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/customers.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(customerData),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Update Customer
  static Future<Map<String, dynamic>> updateCustomer(String customerId, Map<String, dynamic> customerData) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/customers.php?action=update'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({...customerData, 'id': customerId}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Delete Customer
  static Future<Map<String, dynamic>> deleteCustomer(String customerId) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/customers.php?action=delete'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'id': customerId}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Single Customer
  static Future<Map<String, dynamic>> getCustomer(String customerId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/customers.php?id=$customerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Visits
  static Future<Map<String, dynamic>> getVisits({String? customerId}) async {
    try {
      final token = await getToken();
      String url = '$baseUrl/visits.php?';
      if (customerId != null) url += 'customer_id=$customerId&';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Add Visit
  static Future<Map<String, dynamic>> addVisit(Map<String, dynamic> visitData) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/visits.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(visitData),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Pending Visits
  static Future<Map<String, dynamic>> getPendingVisits() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/pending-visits.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Approve Visit
  static Future<Map<String, dynamic>> approveVisit(dynamic visitId, double rewards, {String? customerTier, String? referenceBy}) async {
    try {
      final token = await getToken();
      final id = int.tryParse(visitId.toString()) ?? 0;
      final body = {
        'visit_id': id, 
        'rewards': rewards, 
        'action': 'approve',
      };
      if (customerTier != null && customerTier.isNotEmpty) {
        body['customer_tier'] = customerTier;
      }
      if (referenceBy != null && referenceBy.isNotEmpty) {
        body['reference_by'] = referenceBy;
      }
      final response = await http.post(
        Uri.parse('$baseUrl/pending-visits.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Reject Visit
  static Future<Map<String, dynamic>> rejectVisit(dynamic visitId) async {
    try {
      final token = await getToken();
      final id = int.tryParse(visitId.toString()) ?? 0;
      final response = await http.post(
        Uri.parse('$baseUrl/pending-visits.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'visit_id': id, 'action': 'reject'}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Get Categories
  static Future<Map<String, dynamic>> getCategories() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/categories.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
  
  // Search Customer by Mobile
  static Future<Map<String, dynamic>> searchCustomer(String mobile) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/customers.php?mobile=$mobile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Meetings
  static Future<Map<String, dynamic>> getMeetings() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/meetings.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Create Meeting
  static Future<Map<String, dynamic>> createMeeting(Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/meetings.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Gifts
  static Future<Map<String, dynamic>> getGifts() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Update Gift Status
  static Future<Map<String, dynamic>> updateGiftStatus(int giftId, String status) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/gifts.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'gift_id': giftId, 'status': status, 'action': 'update_status'}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Send Bulk SMS
  static Future<Map<String, dynamic>> sendBulkSms(List<int> customerIds, String message) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/sms.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'customer_ids': customerIds, 'message': message}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Add Category
  static Future<Map<String, dynamic>> addCategory(String name) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/categories.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'name': name}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Employees
  static Future<Map<String, dynamic>> getEmployees() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/employees.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Add Employee
  static Future<Map<String, dynamic>> addEmployee(Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/employees.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Offers
  static Future<Map<String, dynamic>> getOffers() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/offers.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Add Offer
  static Future<Map<String, dynamic>> addOffer(Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/offers.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Toggle Offer
  static Future<Map<String, dynamic>> toggleOffer(int offerId, bool isActive) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/offers.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'offer_id': offerId, 'is_active': isActive ? 1 : 0, 'action': 'toggle'}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Winners
  static Future<Map<String, dynamic>> getWinners() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/winners.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Add Winner
  static Future<Map<String, dynamic>> addWinner(Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/winners.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Customer Meetings
  static Future<Map<String, dynamic>> getCustomerMeetings(String? customerId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/customer-meetings.php?customer_id=$customerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Customer Gifts
  static Future<Map<String, dynamic>> getCustomerGifts(String? customerId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/customer-gifts.php?customer_id=$customerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Update Customer Profile
  static Future<Map<String, dynamic>> updateCustomerProfile({
    String? customerId,
    String? name,
    String? mobile,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/update-customer-profile.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'customer_id': customerId,
          'name': name,
          'mobile': mobile,
          'address': address,
          'current_password': currentPassword,
          'new_password': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Upload Customer Photo
  static Future<Map<String, dynamic>> uploadCustomerPhoto({
    required String customerId,
    required dynamic photoFile,
  }) async {
    try {
      final token = await getToken();
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload-customer-photo.php'),
      );
      
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['customer_id'] = customerId;
      request.files.add(await http.MultipartFile.fromPath('photo', photoFile.path));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Upload error: $e'};
    }
  }
}
