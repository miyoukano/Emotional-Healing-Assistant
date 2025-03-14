#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mysql.connector
import pymysql
import traceback
import time

def test_mysql_connection_with_connector():
    """
    使用mysql.connector测试MySQL连接
    """
    try:
        print("\n===== 使用mysql.connector测试MySQL连接 =====")
        
        # 硬编码连接信息，避免导入Config
        host = "127.0.0.1"
        port = 3306  # 注意：这里使用整数
        username = "root"
        password = "123456"
        
        print(f"尝试连接到MySQL服务器: {host}:{port}, 用户名: {username}")
        
        # 尝试连接到MySQL服务器
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        print("连接成功!")
        
        # 获取服务器信息
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"MySQL版本: {version[0]}")
        
        # 获取所有数据库
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        print("可用数据库:")
        for db in databases:
            print(f"  - {db[0]}")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print("MySQL连接测试成功!")
        return True
    except Exception as e:
        print(f"MySQL连接测试失败: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def test_mysql_connection_with_pymysql():
    """
    使用pymysql测试MySQL连接
    """
    try:
        print("\n===== 使用pymysql测试MySQL连接 =====")
        
        # 硬编码连接信息，避免导入Config
        host = "127.0.0.1"
        port = 3306  # 注意：这里使用整数
        username = "root"
        password = "123456"
        
        print(f"尝试连接到MySQL服务器: {host}:{port}, 用户名: {username}")
        
        # 尝试连接到MySQL服务器
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        print("连接成功!")
        
        # 获取服务器信息
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"MySQL版本: {version[0]}")
        
        # 获取所有数据库
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        print("可用数据库:")
        for db in databases:
            print(f"  - {db[0]}")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print("MySQL连接测试成功!")
        return True
    except Exception as e:
        print(f"MySQL连接测试失败: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def test_mysql_connection_with_command():
    """
    使用命令行测试MySQL连接
    """
    try:
        print("\n===== 使用命令行测试MySQL连接 =====")
        
        import subprocess
        
        # 硬编码连接信息，避免导入Config
        host = "127.0.0.1"
        port = "3306"
        username = "root"
        password = "123456"
        
        print(f"尝试连接到MySQL服务器: {host}:{port}, 用户名: {username}")
        
        # 构建mysql命令
        cmd = [
            "mysql",
            f"--host={host}",
            f"--port={port}",
            f"--user={username}",
            f"--password={password}",
            "-e", "SHOW DATABASES;"
        ]
        
        print(f"执行命令: {' '.join(cmd)}")
        
        # 执行命令
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        if result.stderr:
            print(f"命令输出 (stderr): {result.stderr}")
        
        if result.stdout:
            print(f"命令输出 (stdout): {result.stdout}")
        
        print("MySQL连接测试成功!")
        return True
    except Exception as e:
        print(f"MySQL连接测试失败: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("开始测试MySQL连接...")
    
    # 尝试使用mysql.connector连接
    test_mysql_connection_with_connector()
    
    # 等待一下
    time.sleep(1)
    
    # 尝试使用pymysql连接
    test_mysql_connection_with_pymysql()
    
    # 等待一下
    time.sleep(1)
    
    # 尝试使用命令行连接
    test_mysql_connection_with_command() 