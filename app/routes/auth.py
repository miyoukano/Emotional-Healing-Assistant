from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from app import db, mail
from app.models import User
from werkzeug.security import generate_password_hash
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
import json

auth_bp = Blueprint('auth', __name__)

# 创建序列化器用于生成确认令牌
def get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    
    if not data:
        return json.dumps({'success': False, 'message': '无效的请求数据'}), 400
    
    email = data.get('email', '')
    password = data.get('password', '')
    remember = data.get('remember', False)
    
    user = User.query.filter((User.email == email) | (User.username == email)).first()
    
    if user is None or not user.verify_password(password):
        return json.dumps({'success': False, 'message': '邮箱/用户名或密码错误'}), 401
    
    if not user.is_active:
        return json.dumps({'success': False, 'message': '账户已被禁用'}), 403
    
    # 登录用户
    login_user(user, remember=remember)
    
    # 更新最后登录时间
    user.last_login = db.func.now()
    db.session.commit()
    
    return json.dumps({
        'success': True, 
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': user.avatar,
            'emotion_preferences': json.loads(user.emotion_preferences),
            'aroma_preferences': json.loads(user.aroma_preferences)
        }
    })

@auth_bp.route('/logout')
@login_required
def logout():
    """用户登出"""
    logout_user()
    return json.dumps({'success': True})

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.get_json()
    
    if not data:
        return json.dumps({'success': False, 'message': '无效的请求数据'}), 400
    
    username = data.get('username', '')
    email = data.get('email', '')
    password = data.get('password', '')
    
    # 验证用户名和邮箱是否已存在
    if User.query.filter_by(username=username).first():
        return json.dumps({'success': False, 'message': '用户名已存在'}), 400
    
    if User.query.filter_by(email=email).first():
        return json.dumps({'success': False, 'message': '邮箱已存在'}), 400
    
    # 创建新用户
    user = User(
        username=username,
        email=email,
        password=password,
        is_confirmed=False
    )
    
    db.session.add(user)
    db.session.commit()
    
    # 发送确认邮件
    send_confirmation_email(user)
    
    return json.dumps({'success': True, 'message': '注册成功，请查收确认邮件'})

@auth_bp.route('/confirm/<token>')
def confirm(token):
    """确认用户邮箱"""
    try:
        serializer = get_serializer()
        email = serializer.loads(token, max_age=3600)  # 令牌有效期1小时
    except:
        flash('确认链接无效或已过期', 'danger')
        return redirect(url_for('main.index'))
    
    user = User.query.filter_by(email=email).first()
    
    if user is None:
        flash('用户不存在', 'danger')
        return redirect(url_for('main.index'))
    
    if user.is_confirmed:
        flash('账户已经确认过了', 'info')
    else:
        user.is_confirmed = True
        db.session.commit()
        flash('账户确认成功！现在可以登录了', 'success')
    
    return redirect(url_for('main.index'))

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_request():
    """请求重置密码"""
    data = request.get_json()
    
    if not data:
        return json.dumps({'success': False, 'message': '无效的请求数据'}), 400
    
    email = data.get('email', '')
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        send_password_reset_email(user)
    
    return json.dumps({'success': True, 'message': '如果邮箱存在，重置密码的邮件已发送'})

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """重置密码"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    user = User.verify_reset_password_token(token)
    
    if not user:
        flash('重置链接无效或已过期', 'danger')
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        
        user.password = password
        db.session.commit()
        
        flash('密码已重置', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('reset_password.html')

def send_confirmation_email(user):
    """发送确认邮件"""
    serializer = get_serializer()
    token = serializer.dumps(user.email)
    
    confirm_url = url_for('auth.confirm', token=token, _external=True)
    
    msg = Message('确认您的账户', recipients=[user.email])
    msg.body = f'''
    您好 {user.username}，

    请点击以下链接确认您的账户：
    {confirm_url}

    如果您没有注册此账户，请忽略此邮件。

    情绪愈疗助手团队
    '''
    
    mail.send(msg)

def send_password_reset_email(user):
    """发送密码重置邮件"""
    token = user.get_reset_password_token()
    
    reset_url = url_for('auth.reset_password', token=token, _external=True)
    
    msg = Message('重置您的密码', recipients=[user.email])
    msg.body = f'''
    您好 {user.username}，

    请点击以下链接重置您的密码：
    {reset_url}

    如果您没有请求重置密码，请忽略此邮件。

    情绪愈疗助手团队
    '''
    
    mail.send(msg) 