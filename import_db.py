#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import datetime
import pymysql
from app.config import Config

def import_database():
    """
    从SQL文件导入数据到MySQL数据库
    """
    # 从配置中获取数据库连接信息
    hostname = Config.HOSTNAME
    port = int(Config.PORT)
    database = Config.DATABASE
    username = Config.USERNAME
    password = Config.PASSWORD

    # 导入文件路径
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    import_file = os.path.join(data_dir, f'{database}.sql')
    
    # 检查导入文件是否存在
    if not os.path.exists(import_file):
        print(f"错误：导入文件不存在: {import_file}")
        print("请先运行 export_db.py 导出数据库，或确保导入文件已放置在正确位置。")
        return False
    
    print(f"开始从 {import_file} 导入数据到数据库 {database} ...")
    
    try:
        # 创建连接（不指定数据库名）
        connection = pymysql.connect(
            host=hostname,
            port=port,
            user=username,
            password=password,
            charset='utf8mb4'
        )
        
        try:
            with connection.cursor() as cursor:
                # 创建数据库（如果不存在）
                print("创建数据库（如果不存在）...")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                connection.commit()
                
                # 读取SQL文件内容
                print(f"读取SQL文件...")
                with open(import_file, 'r', encoding='utf-8') as f:
                    sql_content = f.read()
                
                # 分割SQL语句
                # 通常SQL语句以分号结尾，但要注意某些特殊情况（如存储过程中的分号）
                print(f"执行SQL语句...")
                
                # 选择数据库
                cursor.execute(f"USE `{database}`")
                
                # 防止外键约束问题
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                
                # 执行每条SQL语句
                for statement in sql_content.split(';'):
                    statement = statement.strip()
                    if statement:  # 忽略空语句
                        try:
                            cursor.execute(statement)
                            connection.commit()
                        except Exception as e:
                            print(f"执行SQL语句时出错: {e}")
                            print(f"问题语句: {statement[:100]}...")  # 仅打印前100个字符
                
                # 恢复外键约束
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
                
            print(f"数据库导入成功！")
            print(f"源文件: {import_file}")
            print(f"导入时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True
            
        finally:
            connection.close()
            
    except Exception as e:
        print(f"导入数据库时发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    import_database() 