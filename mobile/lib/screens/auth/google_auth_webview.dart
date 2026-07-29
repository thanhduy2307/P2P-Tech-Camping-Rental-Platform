import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class GoogleAuthWebView extends StatefulWidget {
  final String clientId;
  const GoogleAuthWebView({super.key, required this.clientId});

  @override
  State<GoogleAuthWebView> createState() => _GoogleAuthWebViewState();
}

class _GoogleAuthWebViewState extends State<GoogleAuthWebView> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    final html = '''<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client"></script>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
    .container { text-align: center; }
    h2 { color: #333; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Đăng nhập với Google</h2>
    <div id="g_id_onload"
         data-client_id="${widget.clientId}"
         data-context="signin"
         data-ux_mode="redirect"
         data-login_uri=""
         data-callback="handleCredentialResponse"
         data-auto_prompt="false">
    </div>
    <div class="g_id_signin"
         data-type="standard"
         data-shape="rectangular"
         data-theme="outline"
         data-text="signin_with"
         data-size="large"
         data-width="300">
    </div>
  </div>
  <script>
    function handleCredentialResponse(response) {
      if (response.credential) {
        window.onGoogleAuth.postMessage(response.credential);
      } else {
        window.onGoogleAuth.postMessage('__ERROR__:Không nhận được thông tin đăng nhập');
      }
    }
  </script>
</body>
</html>''';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'onGoogleAuth',
        onMessageReceived: (message) {
          if (_done) return;
          _done = true;
          final msg = message.message;
          if (msg.startsWith('__ERROR__:')) {
            Navigator.pop(context, msg.replaceFirst('__ERROR__:', ''));
          } else {
            Navigator.pop(context, msg);
          }
        },
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
      ))
      ..loadHtmlString(html);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng nhập Google'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
