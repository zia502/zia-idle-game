"""
简单的HTTP服务器，用于提供JSON文件并解决CORS问题
"""
import http.server
import socketserver
import os

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """添加CORS头的HTTP请求处理器"""
    
    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    # 确保服务器从项目根目录启动
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"启动服务器在端口 {PORT}...")
    print(f"当前工作目录: {os.getcwd()}")
    print("使用 Ctrl+C 停止服务器")
    
    # 创建服务器
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"服务器运行在 http://localhost:{PORT}")
        # 启动服务器
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
