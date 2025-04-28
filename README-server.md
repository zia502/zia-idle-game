# Python服务器使用说明

这个Python服务器用于解决本地开发中的CORS问题，允许您的网页应用直接加载JSON文件。

## 前提条件

- 安装Python 3.x
- 确保Python已添加到系统PATH中

## 启动服务器

1. 打开命令行终端
2. 导航到项目根目录（包含`server.py`的目录）
3. 运行以下命令：

```bash
python server.py
```

4. 服务器将在端口8000上启动
5. 您应该会看到以下输出：

```
启动服务器在端口 8000...
当前工作目录: [您的项目路径]
使用 Ctrl+C 停止服务器
服务器运行在 http://localhost:8000
```

## 访问JSON文件

服务器启动后，您的应用可以通过以下URL访问JSON文件：

```
http://localhost:8000/src/data/job-skills-templates.json
```

## 停止服务器

在命令行中按 `Ctrl+C` 可以停止服务器。

## 故障排除

如果您在浏览器控制台中看到以下错误：

```
加载技能模板数据失败: TypeError: Failed to fetch
```

请检查：

1. Python服务器是否正在运行
2. 端口8000是否被其他应用占用（如果是，请修改`server.py`中的PORT值）
3. 项目路径结构是否正确

## 注意事项

- 这个服务器仅用于本地开发
- 它允许来自任何源的跨域请求（CORS设置为'*'）
- 在生产环境中，您应该使用适当的Web服务器（如Nginx、Apache等）
