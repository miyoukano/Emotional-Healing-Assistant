# 数据库导入说明

本项目使用MySQL数据库。以下是导入数据库的步骤：

## 前提条件

1. 已安装MySQL服务器
2. 已创建数据库用户（默认用户名: root，默认密码: 123456）

## 导入数据的方法

### 方法一：使用命令行

```bash
# 进入项目根目录
cd 项目根目录

# 创建数据库(如果尚未创建)
mysql -u 用户名 -p -e "CREATE DATABASE IF NOT EXISTS emotional_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据
mysql -u 用户名 -p < data/emotional_assistant.sql
```

### 方法二：使用MySQL工具

1. 打开MySQL Workbench或phpMyAdmin等工具
2. 连接到你的MySQL服务器
3. 创建名为`emotional_assistant`的数据库（如果尚未创建）
4. 导入`data/emotional_assistant.sql`文件

### 方法三：使用Python脚本

```bash
# 进入项目根目录
cd 项目根目录

# 运行导入脚本
python import_db.py
```

## 自定义配置

如果需要修改数据库连接信息，请编辑`app/config.py`文件：

```python
# 数据库配置
HOSTNAME = "127.0.0.1"  # 数据库主机
PORT = "3306"           # 数据库端口
DATABASE = "emotional_assistant"  # 数据库名称
USERNAME = "root"       # 数据库用户名
PASSWORD = "123456"     # 数据库密码
```

## 注意事项

- 确保MySQL服务器正在运行
- 如果更改了用户名或密码，导入时也需相应更改
