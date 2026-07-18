import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:velox_mobile/core/constants.dart';
import 'package:velox_mobile/core/storage.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;

  ApiException(this.statusCode, this.message, [this.data]);

  @override
  String toString() => message;
}

/// Lightweight API client wrapping the `http` package. Automatically attaches
/// the bearer token from [Storage] and decodes JSON responses.
class ApiClient {
  static const Duration _timeout = Duration(seconds: 30);

  static Map<String, String> _headers({bool hasBody = true}) {
    final headers = <String, String>{};
    if (hasBody) headers['Content-Type'] = 'application/json';
    final token = Storage.getToken();
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  static dynamic _parse(http.Response res) {
    dynamic body;
    try {
      body = res.body.isNotEmpty ? jsonDecode(res.body) : null;
    } catch (_) {
      body = null;
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }

    // Normalize error message from common backend shapes.
    String message = 'Có lỗi xảy ra (${res.statusCode})';
    if (body is Map) {
      if (body['message'] != null) message = body['message'].toString();
      else if (body['error'] != null) message = body['error'].toString();
    }
    throw ApiException(res.statusCode, message, body);
  }

  static Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}$path')
        .replace(queryParameters: query);
    final res = await http
        .get(uri, headers: _headers(hasBody: false))
        .timeout(_timeout);
    return _parse(res);
  }

  static Future<dynamic> post(String path, Map<String, dynamic>? body) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}$path');
    final res = await http
        .post(uri, headers: _headers(), body: jsonEncode(body ?? {}))
        .timeout(_timeout);
    return _parse(res);
  }

  static Future<dynamic> put(String path, Map<String, dynamic>? body) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}$path');
    final res = await http
        .put(uri, headers: _headers(), body: jsonEncode(body ?? {}))
        .timeout(_timeout);
    return _parse(res);
  }

  static Future<dynamic> delete(String path) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}$path');
    final res = await http
        .delete(uri, headers: _headers())
        .timeout(_timeout);
    return _parse(res);
  }
}
