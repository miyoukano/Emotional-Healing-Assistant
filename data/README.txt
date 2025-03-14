# 数据库文件说明

此目录用于存放导出的数据库文件。

## 文件说明

- `emotional_assistant.sql`: MySQL数据库导出文件，包含完整的数据库结构和数据

## 使用方法

1. 导出数据库：
   - Windows: 双击运行项目根目录下的 `export_db.bat`
   - Linux/Mac: 在终端中运行 `./export_db.sh`

2. 导入数据库：
   - Windows: 双击运行项目根目录下的 `import_db.bat`
   - Linux/Mac: 在终端中运行 `./import_db.sh`

## 注意事项

- 导出操作会覆盖此目录中的同名文件
- 导入操作会尝试创建数据库（如果不存在）
- 确保MySQL服务器正在运行
- 确保用户具有创建和修改数据库的权限

如需更多信息，请参阅项目根目录下的 README.md 文件。 