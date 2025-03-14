# 数据库导入说明

本项目使用MySQL数据库。以下是导入数据库的步骤：

## 前提条件

1. 已安装MySQL服务器
2. 已创建与配置文件中相同的数据库用户

## 导入步骤

### 方法一：使用命令行

1. 打开命令行终端
2. 执行以下命令导入数据库：

```bash
mysql -u 用户名 -p < data/emotional_assistant.sql
```

3. 输入密码后，数据将被导入

### 方法二：使用MySQL工具

1. 打开MySQL Workbench或phpMyAdmin等工具
2. 连接到你的MySQL服务器
3. 创建一个名为`emotional_assistant`的数据库（如果不存在）
4. 导入`data/emotional_assistant.sql`文件

### 方法三：使用初始化脚本

1. 确保已安装项目依赖
2. 运行以下命令：

```bash
python import_db.py
```

## 配置说明

如果你需要修改数据库连接信息，请编辑`app/config.py`文件中的以下内容：

```python
# 数据库配置
HOSTNAME = "127.0.0.1"  # 数据库主机名
PORT = "3306"           # 数据库端口
DATABASE = "emotional_assistant"  # 数据库名称
USERNAME = "root"       # 数据库用户名
PASSWORD = "123456"     # 数据库密码
```

## 注意事项

- 导入操作会覆盖现有的同名数据库
- 确保MySQL服务器正在运行
- 确保用户具有创建和修改数据库的权限
