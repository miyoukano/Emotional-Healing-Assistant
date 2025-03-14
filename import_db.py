#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import sys
import traceback
import mysql.connector
import pymysql
from app.config import Config

def check_database_exists(host, port, username, password, database):
    """
    检查数据库是否存在且包含表
    """
    try:
        print(f"检查数据库 {database} 是否存在且包含表...")
        
        # 连接到MySQL服务器
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=username,
            password=password,
            connect_timeout=5
        )
        
        # 获取所有数据库
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        
        database_exists = False
        for db in databases:
            if db[0] == database:
                database_exists = True
                print(f"找到数据库: {database}")
                break
        
        if not database_exists:
            print(f"数据库 {database} 不存在")
            cursor.close()
            conn.close()
            return False
        
        # 连接到目标数据库
        try:
            db_conn = pymysql.connect(
                host=host,
                port=int(port),
                user=username,
                password=password,
                database=database,
                connect_timeout=5
            )
            
            # 获取所有表
            db_cursor = db_conn.cursor()
            db_cursor.execute("SHOW TABLES")
            tables = db_cursor.fetchall()
            
            has_tables = len(tables) > 0
            
            if has_tables:
                print(f"数据库 {database} 包含 {len(tables)} 个表:")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print(f"数据库 {database} 存在但没有表")
            
            # 关闭连接
            db_cursor.close()
            db_conn.close()
            
            # 关闭原始连接
            cursor.close()
            conn.close()
            
            return has_tables
        except Exception as e:
            print(f"连接到数据库 {database} 时出错: {e}")
            cursor.close()
            conn.close()
            return False
    except Exception as e:
        print(f"检查数据库是否存在时出错: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def import_database():
    """
    导入MySQL数据库
    """
    try:
        print("开始导入数据库...")
        print(f"当前工作目录: {os.getcwd()}")
        
        # 从配置中获取数据库连接信息
        try:
            host = Config.HOSTNAME
            port = Config.PORT
            database = Config.DATABASE
            username = Config.USERNAME
            password = Config.PASSWORD
            
            print(f"数据库配置信息: 主机={host}, 端口={port}, 数据库={database}, 用户名={username}")
        except Exception as e:
            print(f"获取数据库配置信息时出错: {e}")
            print("错误详情:")
            traceback.print_exc()
            return False
        
        # 检查数据库是否已经存在且包含表
        if check_database_exists(host, port, username, password, database):
            print(f"数据库 {database} 已经存在且包含表，无需导入")
            return True
        
        # 检查SQL文件是否存在
        sql_file = os.path.join('data', f'{database}.sql')
        print(f"检查SQL文件: {os.path.abspath(sql_file)}")
        
        if not os.path.exists(sql_file):
            print(f"错误: 数据库导出文件 {sql_file} 不存在")
            print("请先运行 python export_db.py 导出数据库")
            
            # 检查data目录是否存在
            data_dir = os.path.join(os.getcwd(), 'data')
            if not os.path.exists(data_dir):
                print(f"错误: data目录不存在: {data_dir}")
                print("正在创建data目录...")
                try:
                    os.makedirs(data_dir)
                    print(f"已创建data目录: {data_dir}")
                except Exception as e:
                    print(f"创建data目录时出错: {e}")
            else:
                print(f"data目录存在: {data_dir}")
                print("data目录内容:")
                try:
                    for item in os.listdir(data_dir):
                        print(f"  - {item}")
                except Exception as e:
                    print(f"列出data目录内容时出错: {e}")
            
            return False
        
        print(f"找到SQL文件: {sql_file}")
        
        # 检查SQL文件大小
        try:
            file_size = os.path.getsize(sql_file)
            print(f"SQL文件大小: {file_size} 字节")
            
            if file_size == 0:
                print("错误: SQL文件为空")
                return False
            
            # 检查SQL文件内容
            with open(sql_file, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                print(f"SQL文件第一行: {first_line[:100]}...")
        except Exception as e:
            print(f"检查SQL文件时出错: {e}")
            print("错误详情:")
            traceback.print_exc()
        
        # 首先尝试创建数据库（如果不存在）
        if not create_database_if_not_exists(host, port, username, password, database):
            print("创建数据库失败，无法继续导入数据库")
            return False
        
        # 直接使用备选方法导入数据库
        print("直接使用mysql.connector导入数据库...")
        return import_database_alternative(host, port, username, password, database, sql_file)
        
    except Exception as e:
        print(f"导入数据库时出错: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def create_database_if_not_exists(host, port, username, password, database):
    """
    如果数据库不存在，则创建数据库
    """
    try:
        print(f"尝试连接到MySQL服务器: {host}:{port}")
        # 连接到MySQL服务器
        conn_params = {
            'host': host,
            'port': int(port),
            'user': username,
            'connection_timeout': 10
        }
        
        # 如果有密码，添加密码参数
        if password:
            conn_params['password'] = password
        
        conn = mysql.connector.connect(**conn_params)
        cursor = conn.cursor()
        
        # 检查数据库是否存在
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        database_exists = False
        for db in databases:
            if db[0] == database:
                database_exists = True
                print(f"数据库 {database} 已存在")
                break
        
        # 创建数据库（如果不存在）
        if not database_exists:
            print(f"创建数据库: {database}")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"数据库 {database} 已创建")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print(f"确保数据库 {database} 存在")
        return True
    except Exception as e:
        print(f"创建数据库时出错: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def import_database_alternative(host, port, username, password, database, sql_file):
    """
    使用备选方法导入数据库（使用mysql.connector）
    """
    try:
        print("使用mysql.connector导入数据库...")
        
        # 读取SQL文件内容
        print(f"读取SQL文件: {sql_file}")
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"SQL文件大小: {len(sql_content)} 字节")
        
        # 连接到MySQL服务器
        print(f"连接到MySQL服务器: {host}:{port}, 数据库: {database}")
        
        conn_params = {
            'host': host,
            'port': int(port),
            'user': username,
            'database': database,
            'connection_timeout': 10
        }
        
        # 如果有密码，添加密码参数
        if password:
            conn_params['password'] = password
        
        conn = mysql.connector.connect(**conn_params)
        cursor = conn.cursor()
        
        # 执行SQL语句
        print("执行SQL语句...")
        # 注意：这种方法可能不适用于非常大的SQL文件
        statements = sql_content.split(';')
        print(f"找到 {len(statements)} 条SQL语句")
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements):
            if statement.strip():
                try:
                    print(f"执行语句 {i+1}/{len(statements)}...")
                    cursor.execute(statement + ';')
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    print(f"执行语句时出错: {e}")
                    print(f"问题语句: {statement[:100]}...")  # 只打印前100个字符
                    # 继续执行其他语句
        
        # 提交更改
        print("提交更改...")
        conn.commit()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print(f"数据库 {database} 已成功导入（使用备选方法）")
        print(f"成功执行 {success_count} 条语句，失败 {error_count} 条语句")
        return True
    except Exception as e:
        print(f"使用备选方法导入数据库时出错: {e}")
        print("错误详情:")
        traceback.print_exc()
        print("\n请尝试手动导入数据库，详见 data/README.md")
        return False

if __name__ == '__main__':
    import_database() 