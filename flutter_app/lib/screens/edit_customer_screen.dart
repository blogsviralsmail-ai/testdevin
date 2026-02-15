import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class EditCustomerScreen extends StatefulWidget {
  final Map<String, dynamic> customer;

  const EditCustomerScreen({super.key, required this.customer});

  @override
  State<EditCustomerScreen> createState() => _EditCustomerScreenState();
}

class _EditCustomerScreenState extends State<EditCustomerScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _mobileController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  late TextEditingController _referenceController;
  List<dynamic> _categories = [];
  String? _selectedCategoryId;
  String _selectedTier = 'Silver';
  bool _isLoading = false;
  bool _isLoadingCategories = true;
  File? _selectedImage;
  String? _currentPhotoUrl;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.customer['name'] ?? '');
    _mobileController = TextEditingController(text: widget.customer['mobile'] ?? '');
    _emailController = TextEditingController(text: widget.customer['email'] ?? '');
    _addressController = TextEditingController(text: widget.customer['address'] ?? '');
    _referenceController = TextEditingController(text: widget.customer['reference_by'] ?? 'Direct');
    _selectedCategoryId = widget.customer['category_id']?.toString();
    _selectedTier = widget.customer['customer_tier'] ?? 'Silver';
    _currentPhotoUrl = _getPhotoUrl(widget.customer['photo']?.toString());
    _loadCategories();
  }

  String _getPhotoUrl(String? photo) {
    if (photo == null || photo.isEmpty) return '';
    if (photo.startsWith('http')) return photo;
    return 'https://jptiles.in/uploads/customers/$photo';
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF2d2d2d),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Color(0xFFc9a227)),
              title: const Text('Take Photo', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Color(0xFFc9a227)),
              title: const Text('Choose from Gallery', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            if (_selectedImage != null || (_currentPhotoUrl != null && _currentPhotoUrl!.isNotEmpty))
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Remove Photo', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedImage = null;
                    _currentPhotoUrl = '';
                  });
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _loadCategories() async {
    try {
      final result = await ApiService.getCategories();
      if (result['success'] == true) {
        setState(() {
          _categories = result['data'] ?? [];
          _isLoadingCategories = false;
        });
      } else {
        setState(() => _isLoadingCategories = false);
      }
    } catch (e) {
      setState(() => _isLoadingCategories = false);
    }
  }

  Future<void> _saveCustomer() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // First update customer details
    final result = await ApiService.updateCustomer(
      widget.customer['id'].toString(),
      {
        'name': _nameController.text.trim(),
        'mobile': _mobileController.text.trim(),
        'email': _emailController.text.trim(),
        'address': _addressController.text.trim(),
        'category_id': _selectedCategoryId,
        'customer_tier': _selectedTier,
        'reference_by': _referenceController.text.trim(),
      },
    );

    if (result['success'] != true) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Failed to update customer'), backgroundColor: Colors.red),
        );
      }
      return;
    }

    // If there's a new photo selected, upload it
    if (_selectedImage != null) {
      final photoResult = await ApiService.uploadCustomerPhoto(
        customerId: widget.customer['id'].toString(),
        photoFile: _selectedImage!,
      );
      
      if (photoResult['success'] != true) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Customer updated but photo upload failed: ${photoResult['message']}'), backgroundColor: Colors.orange),
          );
          Navigator.pop(context, true);
        }
        return;
      }
    }

    setState(() => _isLoading = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Customer updated successfully'), backgroundColor: Colors.green),
      );
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Customer'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Photo Section
              GestureDetector(
                onTap: _showImageOptions,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFFc9a227),
                      backgroundImage: _selectedImage != null
                          ? FileImage(_selectedImage!)
                          : (_currentPhotoUrl != null && _currentPhotoUrl!.isNotEmpty
                              ? NetworkImage(_currentPhotoUrl!) as ImageProvider
                              : null),
                      child: (_selectedImage == null && (_currentPhotoUrl == null || _currentPhotoUrl!.isEmpty))
                          ? const Icon(Icons.person, size: 50, color: Colors.black)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFc9a227),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, size: 20, color: Colors.black),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Tap to change photo',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Name *',
                  prefixIcon: Icon(Icons.person, color: Color(0xFFc9a227)),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter customer name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Mobile *',
                  prefixIcon: Icon(Icons.phone, color: Color(0xFFc9a227)),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter mobile number';
                  }
                  if (value.trim().length != 10) {
                    return 'Mobile number must be 10 digits';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email, color: Color(0xFFc9a227)),
                ),
              ),
              const SizedBox(height: 16),
              _isLoadingCategories
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFc9a227)))
                  : DropdownButtonFormField<String>(
                      value: _selectedCategoryId,
                      dropdownColor: const Color(0xFF2d2d2d),
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Category *',
                        prefixIcon: Icon(Icons.category, color: Color(0xFFc9a227)),
                      ),
                      items: _categories.map((cat) {
                        return DropdownMenuItem<String>(
                          value: cat['id'].toString(),
                          child: Text(cat['name']?.toString() ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedCategoryId = value);
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please select a category';
                        }
                        return null;
                      },
                    ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Address',
                  prefixIcon: Icon(Icons.location_on, color: Color(0xFFc9a227)),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedTier,
                dropdownColor: const Color(0xFF2d2d2d),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Customer Tier',
                  prefixIcon: Icon(Icons.workspace_premium, color: Color(0xFFc9a227)),
                ),
                items: ['Platinum', 'Gold', 'Silver', 'Brown'].map((tier) {
                  Color tierColor;
                  switch (tier) {
                    case 'Platinum': tierColor = Colors.grey.shade300; break;
                    case 'Gold': tierColor = Colors.amber; break;
                    case 'Silver': tierColor = Colors.grey; break;
                    case 'Brown': tierColor = Colors.brown; break;
                    default: tierColor = Colors.grey;
                  }
                  return DropdownMenuItem<String>(
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
                        Text(tier, style: const TextStyle(color: Colors.white)),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedTier = value!);
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _referenceController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Reference By',
                  prefixIcon: Icon(Icons.person_add, color: Color(0xFFc9a227)),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveCustomer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFc9a227),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.black)
                      : const Text('Update Customer', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _referenceController.dispose();
    super.dispose();
  }
}
