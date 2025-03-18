#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import datetime
import pymysql
from app.config import Config

def export_database():
    """
    使用Python导出MySQL数据库到SQL文件
    """
    # 从配置中获取数据库连接信息
    hostname = Config.HOSTNAME
    port = int(Config.PORT)
    database = Config.DATABASE
    username = Config.USERNAME
    password = Config.PASSWORD

    # 确保data目录存在
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    # 导出文件路径
    export_file = os.path.join(data_dir, f'{database}.sql')
    
    print(f"开始导出数据库 {database} 到 {export_file} ...")
    
    try:
        # 连接到MySQL数据库
        connection = pymysql.connect(
            host=hostname,
            port=port,
            user=username,
            password=password,
            database=database,
            charset='utf8mb4'
        )
        
        # 使用cursor执行SQL查询
        with connection.cursor() as cursor:
            # 打开文件准备写入
            with open(export_file, 'w', encoding='utf8') as f:
                # 添加数据库创建语句
                f.write(f"-- 数据库导出 - 由export_db.py生成\n")
                f.write(f"-- 导出时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"-- 服务器版本: MySQL\n\n")
                
                f.write("SET NAMES utf8mb4;\n")
                f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
                
                # 添加创建数据库语句
                f.write(f"DROP DATABASE IF EXISTS `{database}`;\n")
                f.write(f"CREATE DATABASE `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n")
                f.write(f"USE `{database}`;\n\n")
                
                # 获取所有表
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                
                # 导出每个表的结构和数据
                for table in tables:
                    table_name = table[0]
                    print(f"正在导出表: {table_name}")
                    
                    # 获取表创建语句
                    cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                    result = cursor.fetchone()
                    if result is not None:
                        create_table = result[1]
                        f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
                        f.write(f"{create_table};\n\n")
                    else:
                        print(f"警告: 无法获取表 {table_name} 的创建语句")
                        continue
                    
                    # 获取表的所有数据
                    cursor.execute(f"SELECT * FROM `{table_name}`")
                    rows = cursor.fetchall()
                    
                    if rows:
                        # 获取列名
                        cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
                        columns = cursor.fetchall()
                        column_names = [f"`{column[0]}`" for column in columns]
                        
                        # 写入INSERT语句
                        f.write(f"INSERT INTO `{table_name}` ({', '.join(column_names)}) VALUES\n")
                        
                        # 格式化每一行数据
                        values_list = []
                        for row in rows:
                            formatted_values = []
                            for value in row:
                                if value is None:
                                    formatted_values.append("NULL")
                                elif isinstance(value, (int, float)):
                                    formatted_values.append(str(value))
                                else:
                                    # 转义字符串中的特殊字符
                                    escaped_value = str(value).replace("'", "''").replace("\\", "\\\\")
                                    formatted_values.append(f"'{escaped_value}'")
                            
                            values_list.append(f"({', '.join(formatted_values)})")
                        
                        # 每1000行拆分一次INSERT语句，避免过大
                        chunk_size = 1000
                        for i in range(0, len(values_list), chunk_size):
                            chunk = values_list[i:i + chunk_size]
                            if i + chunk_size >= len(values_list):
                                # 最后一块，添加分号
                                f.write(',\n'.join(chunk) + ';\n\n')
                            else:
                                # 不是最后一块，添加分号并开始新的INSERT语句
                                f.write(',\n'.join(chunk) + ';\n')
                                f.write(f"INSERT INTO `{table_name}` ({', '.join(column_names)}) VALUES\n")
                
                # 导出视图（如果有）
                cursor.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW'")
                views = cursor.fetchall()
                for view in views:
                    view_name = view[0]
                    print(f"正在导出视图: {view_name}")
                    
                    cursor.execute(f"SHOW CREATE VIEW `{view_name}`")
                    result = cursor.fetchone()
                    if result is not None:
                        create_view = result[1]
                        f.write(f"DROP VIEW IF EXISTS `{view_name}`;\n")
                        f.write(f"{create_view};\n\n")
                    else:
                        print(f"警告: 无法获取视图 {view_name} 的创建语句")
                        continue
                
                # 导出触发器（如果有）
                cursor.execute("SHOW TRIGGERS")
                triggers = cursor.fetchall()
                for trigger in triggers:
                    trigger_name = trigger[0]
                    print(f"正在导出触发器: {trigger_name}")
                    
                    cursor.execute(f"SHOW CREATE TRIGGER `{trigger_name}`")
                    result = cursor.fetchone()
                    if result is not None:
                        create_trigger = result[2]
                        f.write(f"DROP TRIGGER IF EXISTS `{trigger_name}`;\n")
                        f.write(f"DELIMITER $$\n{create_trigger}$$\nDELIMITER ;\n\n")
                    else:
                        print(f"警告: 无法获取触发器 {trigger_name} 的创建语句")
                        continue
                
                # 结束
                f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
        
        # 关闭数据库连接
        connection.close()
        
        # 获取文件大小
        size = os.path.getsize(export_file) / (1024 * 1024)  # 转换为MB
        print(f"数据库导出成功！")
        print(f"导出文件: {export_file}")
        print(f"文件大小: {size:.2f} MB")
        print(f"导出时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 添加README说明
        create_readme_files(data_dir, database)
        
        return True
            
    except Exception as e:
        print(f"导出数据库时发生错误: {str(e)}")
        return False

def create_readme_files(data_dir, database):
    """创建README文件，说明如何导入数据库"""
    readme_md = os.path.join(data_dir, 'README.md')
    
    with open(readme_md, 'w', encoding='utf-8') as f:
        f.write(f"""# 数据库导入说明

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
mysql -u 用户名 -p -e "CREATE DATABASE IF NOT EXISTS {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据
mysql -u 用户名 -p < data/{database}.sql
```

### 方法二：使用MySQL工具

1. 打开MySQL Workbench或phpMyAdmin等工具
2. 连接到你的MySQL服务器
3. 创建名为`{database}`的数据库（如果尚未创建）
4. 导入`data/{database}.sql`文件

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
DATABASE = "{database}"  # 数据库名称
USERNAME = "root"       # 数据库用户名
PASSWORD = "123456"     # 数据库密码
```

## 注意事项

- 确保MySQL服务器正在运行
- 如果更改了用户名或密码，导入时也需相应更改
""")
    
    print(f"已更新 {readme_md}")

if __name__ == "__main__":
    export_database() 