#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import time
import traceback
from app.config import Config

def print_header(title):
    """打印测试标题"""
    width = 80
    print("\n" + "=" * width)
    print(f"{title:^{width}}")
    print("=" * width)

def print_result(method, success, message=""):
    """打印测试结果"""
    status = "✓ 成功" if success else "✗ 失败"
    print(f"[{status}] {method:<30} {message}")

def test_connection_pymysql():
    """使用PyMySQL测试数据库连接"""
    try:
        import pymysql
        
        print_header("测试方法 1: PyMySQL 直接连接")
        
        # 从配置中获取数据库连接信息
        hostname = Config.HOSTNAME
        port = int(Config.PORT)
        database = Config.DATABASE
        username = Config.USERNAME
        password = Config.PASSWORD
        
        # 连接参数
        conn_params = {
            "host": hostname,
            "port": port,
            "user": username,
            "password": password,
            "charset": "utf8mb4"
        }
        
        print(f"尝试连接到 MySQL 服务器: {hostname}:{port}")
        start_time = time.time()
        
        # 尝试连接到服务器（不指定数据库）
        conn = pymysql.connect(**conn_params)
        server_connect_time = time.time() - start_time
        print(f"  连接服务器成功! 耗时: {server_connect_time:.3f}秒")
        
        print(f"获取服务器信息...")
        with conn.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            row = cursor.fetchone()
            version = row[0] if row else "未知"
            print(f"  MySQL 版本: {version}")
            
            cursor.execute("SHOW VARIABLES LIKE 'character_set_server'")
            row = cursor.fetchone()
            charset = row[1] if row else "未知"
            print(f"  服务器字符集: {charset}")
            
            cursor.execute("SELECT DATABASE()")
            row = cursor.fetchone()
            current_db = row[0] if row else "无"
            print(f"  当前数据库: {current_db}")
        
        # 关闭不带数据库的连接
        conn.close()
        
        # 尝试连接到指定数据库
        print(f"尝试连接到数据库: {database}")
        conn_params["database"] = database
        start_time = time.time()
        conn = pymysql.connect(**conn_params)
        db_connect_time = time.time() - start_time
        print(f"  连接数据库成功! 耗时: {db_connect_time:.3f}秒")
        
        # 执行简单查询
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            table_count = len(tables)
            print(f"  数据库中有 {table_count} 个表")
            if table_count > 0:
                print(f"  表列表: {', '.join([t[0] for t in tables])}")
        
        conn.close()
        print_result("PyMySQL 直接连接", True)
        return True
    
    except ImportError:
        print_result("PyMySQL 直接连接", False, "未安装 PyMySQL 模块")
        print("  请使用 'pip install pymysql' 安装")
        return False
    except Exception as e:
        print_result("PyMySQL 直接连接", False, str(e))
        print(f"  详细错误: {traceback.format_exc()}")
        return False

def test_connection_sqlalchemy():
    """使用SQLAlchemy测试数据库连接"""
    try:
        from sqlalchemy import create_engine, text
        
        print_header("测试方法 2: SQLAlchemy 连接")
        
        # 使用配置中的URI
        db_uri = Config.DB_URI
        print(f"使用连接URI: {db_uri}")
        
        start_time = time.time()
        engine = create_engine(db_uri)
        
        # 尝试连接
        with engine.connect() as connection:
            connect_time = time.time() - start_time
            print(f"  连接成功! 耗时: {connect_time:.3f}秒")
            
            # 获取版本
            result = connection.execute(text("SELECT VERSION()"))
            version = result.scalar()
            print(f"  MySQL 版本: {version}")
            
            # 获取表
            result = connection.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            table_count = len(tables)
            print(f"  数据库中有 {table_count} 个表")
            if table_count > 0:
                print(f"  表列表: {', '.join([t[0] for t in tables])}")
        
        print_result("SQLAlchemy 连接", True)
        return True
    
    except ImportError:
        print_result("SQLAlchemy 连接", False, "未安装 SQLAlchemy 模块")
        print("  请使用 'pip install sqlalchemy' 安装")
        return False
    except Exception as e:
        print_result("SQLAlchemy 连接", False, str(e))
        print(f"  详细错误: {traceback.format_exc()}")
        return False

def test_connection_flask():
    """使用Flask-SQLAlchemy测试数据库连接"""
    try:
        print_header("测试方法 3: Flask-SQLAlchemy 连接")
        
        from app import create_app, db
        from sqlalchemy import text
        
        app = create_app()
        print("获取 Flask 应用程序上下文...")
        
        with app.app_context():
            print("  上下文获取成功")
            
            # 尝试数据库查询
            start_time = time.time()
            result = db.session.execute(text("SELECT VERSION()"))
            version = result.scalar()
            query_time = time.time() - start_time
            
            print(f"  数据库查询成功! 耗时: {query_time:.3f}秒")
            print(f"  MySQL 版本: {version}")
            
            # 获取表信息
            result = db.session.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            table_count = len(tables)
            print(f"  数据库中有 {table_count} 个表")
            if table_count > 0:
                print(f"  表列表: {', '.join([t[0] for t in tables])}")
            
            # 检查模型映射
            from app.models import User, AromaProduct, ChatSession
            
            user_count = User.query.count()
            print(f"  用户表中有 {user_count} 条记录")
            
            product_count = AromaProduct.query.count()
            print(f"  香薰产品表中有 {product_count} 条记录")
            
            session_count = ChatSession.query.count()
            print(f"  会话表中有 {session_count} 条记录")
        
        print_result("Flask-SQLAlchemy 连接", True)
        return True
    
    except ImportError:
        print_result("Flask-SQLAlchemy 连接", False, "未安装 Flask-SQLAlchemy 模块")
        print("  请使用 'pip install flask-sqlalchemy' 安装")
        return False
    except Exception as e:
        print_result("Flask-SQLAlchemy 连接", False, str(e))
        print(f"  详细错误: {traceback.format_exc()}")
        return False

def check_mysql_server():
    """检查MySQL服务器是否运行"""
    try:
        import socket
        
        print_header("检查 MySQL 服务器状态")
        
        hostname = Config.HOSTNAME
        port = int(Config.PORT)
        
        print(f"尝试连接到 {hostname}:{port}...")
        
        # 创建socket连接
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)  # 3秒超时
        result = sock.connect_ex((hostname, port))
        sock.close()
        
        if result == 0:
            print(f"  服务器端口开放，MySQL 服务器可能正在运行")
            print_result("MySQL服务器检查", True)
            return True
        else:
            print(f"  无法连接到 {hostname}:{port}")
            print(f"  请确保 MySQL 服务器正在运行，且端口{port}已开放")
            print_result("MySQL服务器检查", False, f"端口 {port} 未开放")
            return False
    
    except Exception as e:
        print_result("MySQL服务器检查", False, str(e))
        print(f"  详细错误: {traceback.format_exc()}")
        return False

def print_summary(results):
    """打印测试结果摘要"""
    print_header("测试结果摘要")
    
    success_count = sum(1 for r in results if r)
    total_count = len(results)
    
    print(f"通过测试: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n✅ 所有测试均已通过! 数据库连接正常。")
    else:
        print("\n❌ 部分测试失败。请检查错误信息进行排查。")
        
        print("\n可能的问题及解决方案:")
        print("  1. MySQL服务未启动 -> 启动MySQL服务")
        print("  2. 连接参数错误 -> 检查app/config.py中的配置")
        print("  3. 数据库不存在 -> 创建数据库或运行初始化脚本")
        print("  4. 权限问题 -> 检查MySQL用户权限")
        print("  5. 防火墙阻止 -> 检查防火墙设置")
        print("  6. 缺少依赖包 -> 安装所需Python包")

def main():
    print("\n🔍 MySQL数据库连接测试工具")
    print("----------------------------")
    print("这个工具将测试与MySQL数据库的连接，帮助诊断连接问题。")
    print(f"配置信息: {Config.HOSTNAME}:{Config.PORT}/{Config.DATABASE}")
    
    results = []
    
    # 检查MySQL服务器是否运行
    server_running = check_mysql_server()
    results.append(server_running)
    
    # 如果服务器运行，尝试数据库连接
    if server_running:
        # 测试PyMySQL连接
        pymysql_success = test_connection_pymysql()
        results.append(pymysql_success)
        
        # 测试SQLAlchemy连接
        sqlalchemy_success = test_connection_sqlalchemy()
        results.append(sqlalchemy_success)
        
        # 测试Flask-SQLAlchemy连接
        flask_success = test_connection_flask()
        results.append(flask_success)
    
    # 打印摘要
    print_summary(results)
    
    # 根据测试结果设置退出代码
    if all(results):
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main()) 