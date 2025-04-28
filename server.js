const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// 提供静态文件
app.use(express.static(path.join(__dirname)));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`在远程设备上，请访问 http://[你的IP地址]:${PORT}`);
});
