from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from .config import Config
import logging
import sys

# 初始化扩展
db = SQLAlchemy()
mail = Mail()
login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

# 配置日志
def configure_logging():
    # 设置日志编码为UTF-8
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        '%Y-%m-%d %H:%M:%S'
    ))
    handler.setLevel(logging.INFO)
    
    # 设置Flask日志
    flask_logger = logging.getLogger('flask.app')
    flask_logger.setLevel(logging.INFO)
    flask_logger.addHandler(handler)
    
    # 设置Werkzeug日志
    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(logging.INFO)
    werkzeug_logger.addHandler(handler)
    
    return handler

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 配置日志
    handler = configure_logging()
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    
    # 初始化扩展
    db.init_app(app)
    mail.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    
    # 配置CSRF保护
    # 对于API请求，我们需要禁用CSRF保护
    csrf.exempt('app.routes.api')
    csrf.exempt('app.routes.auth')
    
    # 设置登录视图
    login_manager.login_view = 'auth.login'  # type: ignore
    login_manager.login_message = '请先登录以访问此页面'
    login_manager.login_message_category = 'info'
    
    # 注册蓝图
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.api import api_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app 