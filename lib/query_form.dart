
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;


class QueryForm extends StatefulWidget {
  const QueryForm({super.key});

  @override
  State<QueryForm> createState() => _QueryFormState();
}

class _QueryFormState extends State<QueryForm> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  XFile? _image;

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    setState(() {
      _image = image;
    });
  }

Future<String?> uploadToCloudinary(File image) async {
  final url = Uri.parse(
  "https://api.cloudinary.com/v1_1/dcdcojztw/image/upload",
);


  final request = http.MultipartRequest("POST", url)
    ..fields['upload_preset'] = 'fixbit_unsigned'
    ..files.add(
      await http.MultipartFile.fromPath('file', image.path),
    );

  final response = await request.send();

  if (response.statusCode == 200) {
    final resStr = await response.stream.bytesToString();
    final jsonMap = json.decode(resStr);
    return jsonMap['secure_url'];
  } else {
    return null;
  }
}



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit a Repair Query'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Describe the issue',
                  border: OutlineInputBorder(),
                ),
                maxLines: 5,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a description';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              _image == null
                  ? OutlinedButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.add_a_photo),
                      label: const Text('Add a photo (optional)'),
                    )
                  : Image.file(File(_image!.path)),
              const SizedBox(height: 20),
              ElevatedButton(
  onPressed: () async {
    if (_formKey.currentState!.validate()) {
      String? imageUrl;

      if (_image != null) {
        imageUrl = await uploadToCloudinary(File(_image!.path));
        debugPrint("Uploaded image URL: $imageUrl");
      }

      debugPrint("Description: ${_descriptionController.text}");

      // For now, just test upload
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Query submitted (test mode)')),
      );
    }
  },
  child: const Text('Submit Query'),
),

            ],
          ),
        ),
      ),
    );
  }
}
