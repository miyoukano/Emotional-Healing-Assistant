import os

class Config:
    # 基本配置
    SECRET_KEY = "abcdefg"
    
    # 数据库配置
    HOSTNAME = "127.0.0.1"
    PORT = "3306"
    DATABASE = "emotional_assistant"
    USERNAME = "root"
    PASSWORD = "123456"
    DB_URI = "mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8".format(USERNAME, PASSWORD, HOSTNAME, PORT, DATABASE)
    SQLALCHEMY_DATABASE_URI = DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 邮箱配置
    MAIL_SERVER = "smtp.qq.com"
    MAIL_USE_SSL = True
    MAIL_PORT = 465
    MAIL_USERNAME = "2540701905@qq.com"
    MAIL_PASSWORD = "maxtotrgdczqebba"
    MAIL_DEFAULT_SENDER = "2540701905@qq.com" 