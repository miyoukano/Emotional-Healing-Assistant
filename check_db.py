#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pymysql
import traceback
import time
import os
from app.config import Config

def check_database():
    """
    检查数据库是否存在
    """
    try:
        print("===== 检查数据库 =====")
        
        # 从配置文件获取连接信息
        host = Config.HOSTNAME
        port = int(Config.PORT)
        database = Config.DATABASE
        username = Config.USERNAME
        password = Config.PASSWORD
        
        print(f"尝试连接到MySQL服务器: {host}:{port}, 用户名: {username}, 密码: {'*****' if password else '空'}")
        
        # 尝试连接到MySQL服务器
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            connect_timeout=5
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
            
            # 检查是否存在目标数据库
            if db[0] == database:
                print(f"找到目标数据库: {database}")
                
                # 尝试连接到目标数据库
                try:
                    db_conn = pymysql.connect(
                        host=host,
                        port=port,
                        user=username,
                        password=password,
                        database=database,
                        connect_timeout=5
                    )
                    
                    print(f"成功连接到数据库: {database}")
                    
                    # 获取所有表
                    db_cursor = db_conn.cursor()
                    db_cursor.execute("SHOW TABLES")
                    tables = db_cursor.fetchall()
                    
                    if tables:
                        print(f"数据库 {database} 中的表:")
                        for table in tables:
                            print(f"  - {table[0]}")
                    else:
                        print(f"数据库 {database} 中没有表")
                    
                    # 关闭连接
                    db_cursor.close()
                    db_conn.close()
                except Exception as e:
                    print(f"连接到数据库 {database} 时出错: {e}")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print("数据库检查完成!")
        return True
    except Exception as e:
        print(f"数据库检查失败: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

def check_sql_file():
    """
    检查SQL文件
    """
    try:
        print("\n===== 检查SQL文件 =====")
        
        # 检查SQL文件是否存在
        database = Config.DATABASE
        sql_file = os.path.join('data', f'{database}.sql')
        
        if not os.path.exists(sql_file):
            print(f"错误: 数据库导出文件 {sql_file} 不存在")
            return False
        
        print(f"找到SQL文件: {sql_file}")
        
        # 检查SQL文件大小
        file_size = os.path.getsize(sql_file)
        print(f"SQL文件大小: {file_size} 字节")
        
        if file_size == 0:
            print("错误: SQL文件为空")
            return False
        
        # 检查SQL文件内容
        with open(sql_file, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            print(f"SQL文件第一行: {first_line[:100]}...")
            
            # 计算SQL语句数量
            f.seek(0)
            content = f.read()
            statements = content.split(';')
            print(f"SQL文件中包含 {len(statements)} 条语句")
        
        print("SQL文件检查完成!")
        return True
    except Exception as e:
        print(f"SQL文件检查失败: {e}")
        print("错误详情:")
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("开始检查数据库和SQL文件...")
    
    # 检查数据库
    check_database()
    
    # 检查SQL文件
    check_sql_file() 