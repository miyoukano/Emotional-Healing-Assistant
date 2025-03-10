from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db, csrf
from app.models import User, ChatMessage, EmotionRecord, AromaProduct, product_emotions
import json
from datetime import datetime
import os
from werkzeug.utils import secure_filename

api_bp = Blueprint('api', __name__)

@api_bp.route('/chat', methods=['POST'])
@login_required
def chat():
    """处理聊天消息"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '无效的请求数据'}), 400
    
    message = data.get('message', '')
    persona = data.get('persona', 'empathetic')
    
    if not message:
        return jsonify({'success': False, 'message': '消息不能为空'}), 400
    
    # 分析情绪（简单实现，实际应用中应使用NLP）
    emotion, emotion_score = analyze_emotion(message)
    
    # 保存用户消息
    user_message = ChatMessage(
        user_id=current_user.id,
        content=message,
        is_user=True,
        emotion=emotion,
        emotion_score=emotion_score,
        persona=persona
    )
    db.session.add(user_message)
    
    # 记录情绪
    emotion_record = EmotionRecord(
        user_id=current_user.id,
        emotion=emotion,
        score=emotion_score
    )
    db.session.add(emotion_record)
    
    # 生成回复
    reply = generate_reply(message, emotion, persona)
    
    # 保存助手回复
    assistant_message = ChatMessage(
        user_id=current_user.id,
        content=reply,
        is_user=False,
        emotion=emotion,
        emotion_score=emotion_score,
        persona=persona
    )
    db.session.add(assistant_message)
    
    db.session.commit()
    
    # 获取推荐的香薰产品
    recommended_products = recommend_products(emotion)
    
    return jsonify({
        'success': True,
        'reply': reply,
        'emotion': {
            'label': emotion,
            'score': emotion_score
        },
        'recommendations': [product.to_dict() for product in recommended_products]
    })

@api_bp.route('/chat-history', methods=['GET'])
@login_required
def chat_history():
    """获取用户的聊天历史"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    messages = ChatMessage.query.filter_by(user_id=current_user.id).order_by(
        ChatMessage.timestamp.desc()
    ).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'success': True,
        'messages': [{
            'id': msg.id,
            'content': msg.content,
            'is_user': msg.is_user,
            'emotion': msg.emotion,
            'emotion_score': msg.emotion_score,
            'persona': msg.persona,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages.items],
        'total': messages.total,
        'pages': messages.pages,
        'current_page': messages.page
    })

@api_bp.route('/products', methods=['GET'])
def products():
    """获取香薰产品列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    emotion = request.args.get('emotion', None)
    
    query = AromaProduct.query
    
    if emotion:
        # 根据情绪筛选产品
        query = query.join(
            product_emotions
        ).filter(product_emotions.c.emotion == emotion)
    
    products = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'success': True,
        'products': [product.to_dict() for product in products.items],
        'total': products.total,
        'pages': products.pages,
        'current_page': products.page
    })

@api_bp.route('/products/<int:product_id>', methods=['GET'])
def product_detail(product_id):
    """获取香薰产品详情"""
    product = AromaProduct.query.get_or_404(product_id)
    
    return jsonify({
        'success': True,
        'product': product.to_dict()
    })

@api_bp.route('/user/profile', methods=['GET'])
@login_required
def get_profile():
    """获取用户个人资料"""
    try:
        # 处理默认头像
        avatar_url = current_user.avatar
        if not avatar_url or avatar_url.startswith('/default_avatar'):
            avatar_url = '/static/img/default_avatar.png'
        
        # 解析用户偏好
        emotions = json.loads(current_user.emotion_preferences) if current_user.emotion_preferences else []
        aromas = json.loads(current_user.aroma_preferences) if current_user.aroma_preferences else []
        
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'avatar': avatar_url,
                'preferences': {
                    'emotions': emotions,
                    'aromas': aromas
                },
                'created_at': current_user.created_at.isoformat(),
                'last_login': current_user.last_login.isoformat() if current_user.last_login else None
            }
        })
    except Exception as e:
        current_app.logger.error(f'获取用户资料异常: {str(e)}')
        return jsonify({'success': False, 'message': f'获取用户资料失败: {str(e)}'}), 500

# 为个人资料更新API豁免CSRF保护
@csrf.exempt
@api_bp.route('/user/profile', methods=['PUT'])
@login_required
def update_profile():
    """更新用户个人资料"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        current_app.logger.info(f'更新用户资料请求数据: {data}')
        
        # 更新用户名
        username = data.get('username')
        if username and username != current_user.username:
            # 检查用户名是否已存在
            if User.query.filter_by(username=username).first() and User.query.filter_by(username=username).first().id != current_user.id:
                return jsonify({'success': False, 'message': '用户名已存在'}), 400
            current_user.username = username
        
        # 更新情绪偏好
        emotion_preferences = data.get('emotion_preferences')
        if emotion_preferences is not None:
            current_user.emotion_preferences = json.dumps(emotion_preferences)
        
        # 更新香薰偏好
        aroma_preferences = data.get('aroma_preferences')
        if aroma_preferences is not None:
            current_user.aroma_preferences = json.dumps(aroma_preferences)
        
        # 更新密码
        password = data.get('password')
        if password:
            current_user.password = password
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': '个人资料更新成功',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'avatar': current_user.avatar,
                'preferences': {
                    'emotions': json.loads(current_user.emotion_preferences) if current_user.emotion_preferences else [],
                    'aromas': json.loads(current_user.aroma_preferences) if current_user.aroma_preferences else []
                }
            }
        })
    except Exception as e:
        db.session.rollback()
        error_msg = f'更新用户资料异常: {str(e)}'
        current_app.logger.error(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

# 为头像上传API单独豁免CSRF保护
@csrf.exempt
@api_bp.route('/user/avatar', methods=['POST'])
@login_required
def update_avatar():
    """更新用户头像"""
    # 简单的错误处理
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': '没有上传文件'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    # 检查文件类型
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'success': False, 'message': '只支持PNG、JPG、JPEG和GIF格式'}), 400
    
    try:
        # 确保上传目录存在
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 生成文件名并保存
        filename = f"user_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file.filename.rsplit('.', 1)[1].lower()}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 更新用户头像
        avatar_url = f"/static/uploads/avatars/{filename}"
        current_user.avatar = avatar_url
        db.session.commit()
        
        # 返回成功响应
        return jsonify({
            'success': True,
            'avatar': avatar_url,
            'message': '头像上传成功'
        })
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"头像上传失败: {str(e)}")
        return jsonify({'success': False, 'message': '头像上传失败，请稍后再试'}), 500

def analyze_emotion(message):
    """分析情绪（简单实现，实际应用中应使用NLP）"""
    # 简单的关键词匹配
    message = message.lower()
    
    if any(word in message for word in ['难过', '伤心', '悲']):
        return '悲伤', 30
    elif any(word in message for word in ['焦虑', '担心', '紧张']):
        return '焦虑', 40
    elif any(word in message for word in ['生气', '愤怒', '烦']):
        return '愤怒', 35
    elif any(word in message for word in ['开心', '高兴', '快乐']):
        return '快乐', 85
    elif any(word in message for word in ['疲惫', '累', '困']):
        return '疲惫', 45
    else:
        return '平静', 60

def generate_reply(message, emotion, persona):
    """生成回复（简单实现，实际应用中应使用NLP或LLM）"""
    # 根据人设和情绪生成不同的回复
    if persona == 'empathetic':
        if emotion == '悲伤':
            return '我能感受到你的悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。你想聊聊是什么让你感到难过吗？'
        elif emotion == '焦虑':
            return '焦虑确实是一种很不舒服的感觉。深呼吸可能会有所帮助。你能告诉我更多关于让你焦虑的事情吗？我们可以一起探索一些应对方法。'
        elif emotion == '愤怒':
            return '我理解你感到愤怒。这是一种正常的情绪反应。如果你愿意，可以告诉我更多关于让你生气的事情，有时候表达出来会感觉好一些。'
        elif emotion == '快乐':
            return '很高兴看到你这么开心！能分享是什么让你如此愉快吗？这样的积极情绪对我们的身心健康都很有益。'
        elif emotion == '疲惫':
            return '听起来你感到很疲惫。休息和自我照顾是很重要的。你最近有好好照顾自己吗？'
        else:
            return '谢谢你的分享。我很理解你的感受，这是很自然的反应。如果你愿意，我们可以一起探索这些情绪背后的原因，或者讨论一些可能对你有帮助的方法。'
    
    elif persona == 'motivational':
        return '你做得很棒！每一步都是进步，即使是小小的分享也是勇气的表现。记住，每个挑战都是成长的机会，我相信你有能力克服当前的困难。让我们一起找到前进的动力！'
    
    elif persona == 'analytical':
        return '从你的描述来看，这种情况可能与几个因素有关。我们可以从不同角度分析：首先，环境因素可能在影响你的情绪；其次，认知模式也可能起作用。让我们系统地探讨这些可能性，找出最适合你的解决方案。'
    
    elif persona == 'mindful':
        return '让我们一起深呼吸，专注于当下这一刻。注意你的感受，但不要评判它们。这些情绪就像天空中的云，它们会来也会去。保持觉知，温和地接纳当前的体验，无论它是什么。'
    
    else:
        return '我理解你的感受。请继续分享你的想法，我在这里倾听和支持你。'

def recommend_products(emotion):
    """根据情绪推荐香薰产品"""
    # 查询与该情绪相关的产品
    products = AromaProduct.query.join(
        product_emotions
    ).filter(product_emotions.c.emotion == emotion).limit(3).all()
    
    # 如果没有找到相关产品，返回随机产品
    if not products:
        products = AromaProduct.query.order_by(db.func.random()).limit(3).all()
    
    return products 