import 'package:flutter/material.dart';

class QrCodeScreen extends StatelessWidget {
  const QrCodeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Code'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Image.network(
                  'https://jptiles.kkhsmedia.com/admin/generate-qr.php',
                  width: 250,
                  height: 250,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 250,
                      height: 250,
                      color: Colors.grey[300],
                      child: const Center(
                        child: Icon(Icons.qr_code, size: 100, color: Colors.grey),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Customer Registration QR Code',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFc9a227),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Customers can scan this QR code to register their visit. Print this QR code and display it at your shop.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text('Registration URL:', style: TextStyle(color: Colors.grey)),
                      SizedBox(height: 8),
                      SelectableText(
                        'https://jptiles.kkhsmedia.com/qr-register.php',
                        style: TextStyle(color: Color(0xFFc9a227)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
