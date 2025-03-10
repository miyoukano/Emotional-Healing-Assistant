from flask import Blueprint, render_template, current_app, redirect, url_for, send_from_directory
from flask_login import current_user, login_required
from app.models import AromaProduct
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """主页"""
    if current_user.is_authenticated:
        return render_template('index.html')
    else:
        # 未登录用户也可以访问主页，但某些功能会受限
        return render_template('index.html')

@main_bp.route('/profile')
@login_required
def profile():
    """用户个人资料页面"""
    return render_template('profile.html')

@main_bp.route('/static/<path:filename>')
def static_files(filename):
    """提供静态文件"""
    return send_from_directory(os.path.join(current_app.root_path, 'static'), filename) 