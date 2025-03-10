from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify
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

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录"""
    # GET请求返回登录页面
    if request.method == 'GET':
        next_url = request.args.get('next', '')
        return render_template('login.html', next=next_url)
    
    # POST请求处理登录
    print("=" * 50)
    print("LOGIN REQUEST")
    print(f"Content-Type: {request.content_type}")
    print(f"Form: {request.form}")
    print("=" * 50)
    
    # 获取表单数据
    email = request.form.get('email', '')
    password = request.form.get('password', '')
    remember = request.form.get('remember', 'false')
    remember = remember.lower() in ['true', '1', 'yes', 'on']
    next_url = request.form.get('next', '')
    
    print(f"Form data: email={email}, password={password}, remember={remember}")
    
    # 查找用户
    user = User.query.filter((User.email == email) | (User.username == email)).first()
    
    # 检查是否为AJAX请求
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'application/json' in request.accept_mimetypes.values()
    
    if not user:
        print(f"User not found: {email}")
        if is_ajax:
            return jsonify({'success': False, 'message': '邮箱/用户名或密码错误'})
        flash('邮箱/用户名或密码错误', 'danger')
        return redirect(url_for('auth.login'))
    
    if not user.verify_password(password):
        print(f"Invalid password for user: {email}")
        if is_ajax:
            return jsonify({'success': False, 'message': '邮箱/用户名或密码错误'})
        flash('邮箱/用户名或密码错误', 'danger')
        return redirect(url_for('auth.login'))
    
    if not user.is_active:
        print(f"Inactive user: {email}")
        if is_ajax:
            return jsonify({'success': False, 'message': '账户已被禁用'})
        flash('账户已被禁用', 'danger')
        return redirect(url_for('auth.login'))
    
    # 登录用户
    login_user(user, remember=remember)
    
    # 更新最后登录时间
    user.last_login = db.func.now()
    db.session.commit()
    
    if is_ajax:
        return jsonify({'success': True, 'message': '登录成功', 'next': next_url or url_for('main.index')})
    
    flash('登录成功', 'success')
    
    # 重定向到下一个页面或首页
    if next_url:
        return redirect(next_url)
    return redirect(url_for('main.index'))

@auth_bp.route('/logout')
@login_required
def logout():
    """用户登出"""
    logout_user()
    return jsonify({'success': True})

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """用户注册"""
    # GET请求返回注册页面
    if request.method == 'GET':
        return render_template('register.html')
    
    # POST请求处理注册
    print("=" * 50)
    print("REGISTER REQUEST")
    print(f"Content-Type: {request.content_type}")
    print(f"Form: {request.form}")
    print("=" * 50)
    
    # 获取表单数据
    username = request.form.get('username', '')
    email = request.form.get('email', '')
    password = request.form.get('password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    print(f"Form data: username={username}, email={email}, password={password}")
    
    # 检查是否为AJAX请求
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'application/json' in request.accept_mimetypes.values()
    
    # 表单验证
    if not username or not email or not password:
        if is_ajax:
            return jsonify({'success': False, 'message': '请填写所有必填字段'})
        flash('请填写所有必填字段', 'danger')
        return redirect(url_for('auth.register'))
    
    if password != confirm_password:
        if is_ajax:
            return jsonify({'success': False, 'message': '两次输入的密码不一致'})
        flash('两次输入的密码不一致', 'danger')
        return redirect(url_for('auth.register'))
    
    # 验证用户名和邮箱是否已存在
    if User.query.filter_by(username=username).first():
        if is_ajax:
            return jsonify({'success': False, 'message': '用户名已存在'})
        flash('用户名已存在', 'danger')
        return redirect(url_for('auth.register'))
    
    if User.query.filter_by(email=email).first():
        if is_ajax:
            return jsonify({'success': False, 'message': '邮箱已存在'})
        flash('邮箱已存在', 'danger')
        return redirect(url_for('auth.register'))
    
    # 创建新用户
    user = User(
        username=username,
        email=email,
        password=password,
        is_confirmed=False,
        emotion_preferences='[]',
        aroma_preferences='[]'
    )
    
    db.session.add(user)
    db.session.commit()
    
    # 发送确认邮件
    try:
        send_confirmation_email(user)
        message = '注册成功，请查收确认邮件'
        if is_ajax:
            return jsonify({'success': True, 'message': message})
        flash(message, 'success')
    except Exception as e:
        print(f"Failed to send confirmation email: {str(e)}")
        message = '注册成功，但发送确认邮件失败，请联系管理员'
        if is_ajax:
            return jsonify({'success': True, 'message': message})
        flash(message, 'warning')
    
    if is_ajax:
        return jsonify({'success': True, 'message': '注册成功'})
    return redirect(url_for('auth.login'))

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