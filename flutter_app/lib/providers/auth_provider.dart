import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  String? _error;
  bool _isLoggingIn = false;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;
  
  bool get isAdmin => _user?['role'] == 'admin';
  List<dynamic> get permissions => _user?['permissions'] ?? [];

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Don't check if we're in the middle of logging in
    if (_isLoggingIn) return;
    
    try {
      final token = await ApiService.getToken();
      if (token != null && token.isNotEmpty) {
        // Try to load user data from local storage first
        final prefs = await SharedPreferences.getInstance();
        final userData = prefs.getString('user_data');
        if (userData != null && userData.isNotEmpty) {
          try {
            final parsedUser = jsonDecode(userData);
            // Validate that user data has required fields
            if (parsedUser != null && 
                parsedUser['id'] != null && 
                parsedUser['mobile'] != null &&
                parsedUser['role'] != null) {
              // Verify token with server
              final result = await ApiService.refreshUser();
              if (result['success'] == true && result['user'] != null) {
                _user = result['user'];
                _isAuthenticated = true;
                // Update stored user data
                await prefs.setString('user_data', jsonEncode(_user));
              } else {
                // Token is invalid, clear everything
                await prefs.remove('user_data');
                await ApiService.clearToken();
                _isAuthenticated = false;
                _user = null;
              }
            } else {
              // Invalid user data structure, clear it
              await prefs.remove('user_data');
              await ApiService.clearToken();
            }
          } catch (e) {
            // Invalid user data, clear it
            await prefs.remove('user_data');
            await ApiService.clearToken();
          }
        } else {
          // No user data, clear token
          await ApiService.clearToken();
        }
      }
    } catch (e) {
      // Error during check, clear auth data to be safe
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('user_data');
        await ApiService.clearToken();
      } catch (_) {}
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String mobile, String password, {String loginType = 'admin'}) async {
    _isLoggingIn = true;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.login(mobile, password, loginType: loginType);
      
      if (result['success'] == true) {
        _user = result['user'];
        _isAuthenticated = true;
        
        // Store user data as JSON
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', jsonEncode(_user));
        
        _isLoading = false;
        _isLoggingIn = false;
        notifyListeners();
        return true;
      } else {
        _error = result['message'] ?? 'Login failed';
        _isLoading = false;
        _isLoggingIn = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Login error: $e';
      _isLoading = false;
      _isLoggingIn = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }

  // Refresh user data from server to get updated permissions
  Future<void> refreshUserData() async {
    if (!_isAuthenticated || _user == null) return;
    
    try {
      final result = await ApiService.refreshUser();
      if (result['success'] == true && result['user'] != null) {
        _user = result['user'];
        
        // Update stored user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', jsonEncode(_user));
        
        notifyListeners();
      }
    } catch (e) {
      // Ignore errors during refresh
    }
  }

  bool hasPermission(String permission) {
    if (isAdmin) return true;
    return permissions.contains(permission);
  }

  // Alias for refreshUserData
  Future<void> refreshUser() async {
    await refreshUserData();
  }
}
