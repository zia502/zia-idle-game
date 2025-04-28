import http.server
import socketserver

PORT = 5000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"服务器运行在 http://localhost:{PORT}")
    print(f"在远程设备上，请访问 http://[你的IP地址]:{PORT}")
    httpd.serve_forever()
