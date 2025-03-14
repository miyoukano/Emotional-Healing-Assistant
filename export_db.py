#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import sys
import traceback
from app.config import Config

def export_database():
    """
    导出MySQL数据库为SQL文件
    """
    try:
        print("开始导出数据库...")
        
        # 从配置中获取数据库连接信息
        host = Config.HOSTNAME
        port = Config.PORT
        database = Config.DATABASE
        username = Config.USERNAME
        password = Config.PASSWORD
        
        print(f"数据库配置信息: 主机={host}, 端口={port}, 数据库={database}, 用户名={username}")
        
        # 确保data目录存在
        if not os.path.exists('data'):
            os.makedirs('data')
            print("已创建data目录")
        
        # 导出文件路径
        sql_file = os.path.join('data', f'{database}.sql')
        print(f"导出文件路径: {sql_file}")
        
        # 检查mysqldump命令是否可用
        try:
            # 在Windows上，我们需要检查MySQL的安装路径
            mysql_paths = [
                r"C:\Program Files\MySQL\MySQL Server 8.0\bin",
                r"C:\Program Files\MySQL\MySQL Server 5.7\bin",
                r"C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin",
                r"C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin",
                r"C:\xampp\mysql\bin",
                r"C:\wamp\bin\mysql\mysql5.7.36\bin",
                r"C:\wamp64\bin\mysql\mysql5.7.36\bin"
            ]
            
            mysqldump_path = "mysqldump"  # 默认假设mysqldump在PATH中
            
            # 检查环境变量中是否有MySQL路径
            for path in os.environ.get('PATH', '').split(os.pathsep):
                if os.path.exists(os.path.join(path, 'mysqldump.exe')):
                    print(f"在PATH中找到mysqldump: {path}")
                    mysqldump_path = os.path.join(path, 'mysqldump.exe')
                    break
            
            # 如果没有在PATH中找到，检查常见的MySQL安装路径
            if mysqldump_path == "mysqldump":
                for path in mysql_paths:
                    if os.path.exists(os.path.join(path, 'mysqldump.exe')):
                        print(f"在安装目录中找到mysqldump: {path}")
                        mysqldump_path = os.path.join(path, 'mysqldump.exe')
                        break
            
            print(f"使用mysqldump路径: {mysqldump_path}")
            
            # 构建mysqldump命令
            cmd = [
                mysqldump_path,
                f'--host={host}',
                f'--port={port}',
                f'--user={username}',
                f'--password={password}',
                '--set-charset',
                '--skip-comments',
                '--databases', database,
                '--result-file', sql_file
            ]
            
            print(f"执行命令: {' '.join(cmd)}")
            
            # 执行导出命令
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            if result.stderr:
                print(f"命令输出 (stderr): {result.stderr}")
            
            print(f"数据库 {database} 已成功导出到 {sql_file}")
            
            # 创建README文件，说明如何导入数据库
            create_readme()
            
            return True
        except subprocess.CalledProcessError as e:
            print(f"执行mysqldump命令时出错: {e}")
            if e.stderr:
                print(f"错误输出: {e.stderr}")
            
            # 尝试使用备选方法导出数据库
            print("\n尝试使用备选方法导出数据库...")
            return export_database_alternative(host, port, username, password, database, sql_file)
    except Exception as e:
        print(f"发生错误: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def export_database_alternative(host, port, username, password, database, sql_file):
    """
    使用备选方法导出数据库（使用Python的mysql-connector）
    """
    try:
        import mysql.connector
        
        print("使用mysql-connector导出数据库...")
        
        # 连接到MySQL服务器
        print(f"连接到MySQL服务器: {host}:{port}")
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        # 获取所有表
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"找到 {len(tables)} 个表")
        
        # 打开SQL文件进行写入
        with open(sql_file, 'w', encoding='utf-8') as f:
            # 写入数据库创建语句
            f.write(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n")
            f.write(f"USE `{database}`;\n\n")
            
            # 导出每个表的结构和数据
            for table in tables:
                table_name = table[0]
                print(f"导出表: {table_name}")
                
                # 获取表结构
                cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                create_table = cursor.fetchone()[1]
                f.write(f"{create_table};\n\n")
                
                # 获取表数据
                cursor.execute(f"SELECT * FROM `{table_name}`")
                rows = cursor.fetchall()
                
                if rows:
                    # 获取列名
                    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
                    columns = [column[0] for column in cursor.fetchall()]
                    
                    # 写入INSERT语句
                    f.write(f"INSERT INTO `{table_name}` (`{'`, `'.join(columns)}`) VALUES\n")
                    
                    # 写入数据
                    values = []
                    for row in rows:
                        value_str = []
                        for val in row:
                            if val is None:
                                value_str.append("NULL")
                            elif isinstance(val, (int, float)):
                                value_str.append(str(val))
                            else:
                                # 修复f-string中使用反斜杠的问题
                                escaped_val = str(val).replace("'", "''")
                                value_str.append(f"'{escaped_val}'")
                        values.append(f"({', '.join(value_str)})")
                    
                    f.write(',\n'.join(values))
                    f.write(";\n\n")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print(f"数据库 {database} 已成功导出到 {sql_file}（使用备选方法）")
        
        # 创建README文件，说明如何导入数据库
        create_readme()
        
        return True
    except Exception as e:
        print(f"使用备选方法导出数据库时出错: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def create_readme():
    """
    创建README文件，说明如何导入数据库
    """
    readme_content = """# 数据库导入说明

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
"""
    
    with open('data/README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("已创建数据库导入说明文件: data/README.md")

if __name__ == '__main__':
    export_database() 