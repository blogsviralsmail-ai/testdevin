import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/customer_dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(
        title: 'JP Tiles CRM',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primaryColor: const Color(0xFF1a1a1a),
          scaffoldBackgroundColor: const Color(0xFF1a1a1a),
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFFc9a227),
            secondary: Color(0xFFd4af37),
            surface: Color(0xFF2d2d2d),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1a1a1a),
            foregroundColor: Color(0xFFc9a227),
            elevation: 0,
          ),
          cardTheme: const CardThemeData(
            color: Color(0xFF2d2d2d),
            elevation: 2,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFc9a227),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFF2d2d2d),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFc9a227)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF444444)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFc9a227), width: 2),
            ),
            labelStyle: const TextStyle(color: Color(0xFFc9a227)),
            hintStyle: const TextStyle(color: Colors.grey),
          ),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Colors.white),
            bodyMedium: TextStyle(color: Colors.white),
            titleLarge: TextStyle(color: Color(0xFFc9a227)),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Show loading only during initial check, not during login
        if (auth.isLoading && !auth.isAuthenticated) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFFc9a227)),
            ),
          );
        }
        
        if (auth.isAuthenticated) {
          // Navigate to correct dashboard based on user role
          final userRole = auth.user?['role'];
          if (userRole == 'customer') {
            return const CustomerDashboardScreen();
          }
          return const DashboardScreen();
        }
        
        return const LoginScreen();
      },
    );
  }
}
