import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class GoogleAuthWebView extends StatefulWidget {
  final String url;
  const GoogleAuthWebView({super.key, required this.url});

  @override
  State<GoogleAuthWebView> createState() => _GoogleAuthWebViewState();
}

class _GoogleAuthWebViewState extends State<GoogleAuthWebView> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'onGoogleAuth',
        onMessageReceived: (message) {
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
      ..loadRequest(Uri.parse(widget.url));
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
