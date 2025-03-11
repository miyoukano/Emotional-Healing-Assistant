from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db, csrf
from app.models import User, ChatMessage, EmotionRecord, AromaProduct, product_emotions
from app.utils.spark_api import get_spark_client
from app.utils.aromatherapy_recommender import recommend_products_for_emotion, get_product_details
import json
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import sys
import logging

api_bp = Blueprint('api', __name__)

# 为聊天API豁免CSRF保护
@csrf.exempt
@api_bp.route('/chat', methods=['POST'])
@login_required
def chat():
    """处理聊天消息"""
    try:
        data = request.get_json()
        
        if not data:
            current_app.logger.error("无效的请求数据: %s", request.data)
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        message = data.get('message', '')
        persona = data.get('persona', 'empathetic')
        
        current_app.logger.info("收到聊天消息: %s, 人设: %s", message, persona)
        
        if not message:
            return jsonify({'success': False, 'message': '消息不能为空'}), 400
        
        # 分析情绪（简单实现，实际应用中应使用NLP）
        emotion, emotion_score = analyze_emotion(message)
        current_app.logger.info("情绪分析结果: %s, 分数: %s", emotion, emotion_score)
        
        try:
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
            
            # 提交数据库事务，保存用户消息和情绪记录
            db.session.commit()
            current_app.logger.info("用户消息和情绪记录已保存")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("保存用户消息失败: %s", str(e), exc_info=True)
            return jsonify({'success': False, 'message': '保存消息失败'}), 500
        
        try:
            # 使用讯飞星火API生成回复
            reply = generate_reply_with_spark(message, emotion, persona)
            current_app.logger.info("生成回复: %s", reply)
            
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
            
            # 提交数据库事务，保存助手回复
            db.session.commit()
            current_app.logger.info("助手回复已保存")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("保存助手回复失败: %s", str(e), exc_info=True)
            return jsonify({
                'success': False, 
                'message': '保存回复失败',
                'user_message_saved': True  # 表示用户消息已保存
            }), 500
        
        try:
            # 获取推荐的香薰产品
            recommended_products = recommend_products(emotion, current_user.id)
            
            # 构建响应
            response = {
                'success': True,
                'reply': reply,
                'emotion': emotion,
                'emotion_score': emotion_score,
                'emotion_type': get_emotion_type(emotion),
                'emotion_icon': get_emotion_icon(emotion),
                'emotion_description': get_emotion_description(emotion),
                'recommendations': recommended_products
            }
            
            return jsonify(response)
        except Exception as e:
            current_app.logger.error("构建响应失败: %s", str(e), exc_info=True)
            return jsonify({
                'success': True,
                'reply': reply,
                'emotion': emotion,
                'emotion_score': emotion_score
            })
    except Exception as e:
        current_app.logger.error("处理聊天消息失败: %s", str(e), exc_info=True)
        return jsonify({'success': False, 'message': '处理消息失败'}), 500

@api_bp.route('/chat-history', methods=['GET'])
@login_required
def get_chat_history():
    """获取用户的聊天历史"""
    try:
        # 获取当前用户的聊天历史
        messages = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.timestamp).all()
        
        # 转换为JSON格式
        messages_json = []
        for msg in messages:
            messages_json.append({
                'id': msg.id,
                'content': msg.content,
                'is_user': msg.is_user,
                'timestamp': msg.timestamp.isoformat(),
                'emotion': msg.emotion,
                'persona': msg.persona,
            })
        
        return jsonify({
            'success': True,
            'messages': messages_json
        })
    except Exception as e:
        current_app.logger.error("获取聊天历史失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '获取聊天历史失败'
        }), 500

@api_bp.route('/save-persona', methods=['POST'])
@login_required
def save_persona():
    """保存用户选择的人设"""
    try:
        data = request.json
        persona = data.get('persona')
        
        if not persona:
            return jsonify({
                'success': False,
                'message': '人设参数缺失'
            }), 400
        
        # 检查人设是否有效
        valid_personas = ['empathetic', 'motivational', 'analytical', 'mindful']
        if persona not in valid_personas:
            return jsonify({
                'success': False,
                'message': '无效的人设'
            }), 400
        
        # 更新用户的人设偏好
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        # 如果用户没有偏好设置，创建一个
        if not user.preferences:
            user.preferences = {}
        
        # 更新人设偏好
        preferences = user.preferences
        preferences['persona'] = persona
        user.preferences = preferences
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '人设保存成功'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("保存人设失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '保存人设失败'
        }), 500

@api_bp.route('/get-persona', methods=['GET'])
@login_required
def get_persona():
    """获取用户保存的人设"""
    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        # 获取用户的人设偏好
        persona = None
        if user.preferences and 'persona' in user.preferences:
            persona = user.preferences['persona']
        
        return jsonify({
            'success': True,
            'persona': persona
        })
    except Exception as e:
        current_app.logger.error("获取人设失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '获取人设失败'
        }), 500

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
    # 扩展的情绪关键词匹配
    message = message.lower()
    
    # 情绪类别和关键词映射
    emotion_keywords = {
        '悲伤': ['难过', '伤心', '悲', '哭', '失落', '绝望', '痛苦', '遗憾', '哀伤', '忧郁'],
        '焦虑': ['焦虑', '担心', '紧张', '害怕', '恐惧', '不安', '慌张', '忧虑', '惊慌', '压力'],
        '愤怒': ['生气', '愤怒', '烦', '恼火', '暴躁', '恨', '不满', '怒火', '气愤', '厌烦'],
        '快乐': ['开心', '高兴', '快乐', '喜悦', '兴奋', '愉快', '欣喜', '满足', '幸福', '欢乐'],
        '疲惫': ['疲惫', '累', '困', '倦怠', '精疲力竭', '没精神', '疲乏', '疲劳', '困倦', '乏力'],
        '平静': ['平静', '安宁', '放松', '舒适', '安心', '宁静', '祥和', '镇定', '安详', '平和']
    }
    
    # 情绪强度基准分数
    base_scores = {
        '悲伤': 30,
        '焦虑': 40,
        '愤怒': 35,
        '快乐': 85,
        '疲惫': 45,
        '平静': 60
    }
    
    # 计算每种情绪的匹配度
    emotion_matches = {}
    for emotion, keywords in emotion_keywords.items():
        match_count = sum(1 for keyword in keywords if keyword in message)
        if match_count > 0:
            # 计算情绪强度分数 (基础分数 + 匹配关键词数量的影响)
            emotion_matches[emotion] = base_scores[emotion] + (match_count * 5)
    
    # 如果没有匹配到任何情绪关键词，返回平静
    if not emotion_matches:
        return '平静', base_scores['平静']
    
    # 找出匹配度最高的情绪
    dominant_emotion = max(emotion_matches.items(), key=lambda x: x[1])
    return dominant_emotion[0], dominant_emotion[1]

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

def generate_reply_with_spark(message, emotion, persona):
    """使用讯飞星火API生成回复"""
    try:
        # 获取SparkAPI客户端
        spark_client = get_spark_client()
        if not spark_client:
            current_app.logger.error("无法获取SparkAPI客户端")
            return generate_reply(message, emotion, persona)
        
        # 构建消息上下文
        messages = []
        
        # 添加系统提示
        messages.append({
            "role": "system", 
            "content": "你是一名资深的心理愈疗师，专注于情感分析和香薰疗法。你的目标是：\n1. 深入理解用户的情绪状态，不仅是当前对话中表达的，还包括潜在的情绪变化和模式\n2. 建立用户的情绪档案，记住他们的情绪偏好、触发因素和应对方式\n3. 提供个性化的香薰产品推荐，解释为什么特定产品适合用户当前的情绪状态\n4. 通过多轮对话逐渐深入了解用户，建立信任关系\n5. 主动引导对话，但保持自然和共情\n\n在每次回复中，你应该：\n- 首先确认和验证用户的情绪状态\n- 提供情感支持和理解\n- 适时推荐香薰产品，解释其效果和适用情境\n- 提出开放性问题，鼓励用户继续分享\n- 记住用户之前提到的情绪和偏好，在后续对话中引用"
        })
        
        # 添加情绪信息
        emotion_prompt = f"用户当前情绪: {emotion}"
        messages.append({"role": "system", "content": emotion_prompt})
        
        # 添加人设信息
        persona_descriptions = {
            "empathetic": "你是一位非常有同理心的心理愈疗师，善于理解和共情用户的情感体验。",
            "analytical": "你是一位擅长分析的心理愈疗师，善于帮助用户理性分析情绪和问题。",
            "motivational": "你是一位非常积极向上的心理愈疗师，善于激励用户，帮助他们找到前进的动力。",
            "mindful": "你是一位专注正念的心理愈疗师，善于引导用户关注当下，接纳自己的情绪。"
        }
        
        if persona in persona_descriptions:
            messages.append({"role": "system", "content": persona_descriptions[persona]})
        
        # 添加最近的对话历史（最多5轮）
        try:
            if current_user and current_user.is_authenticated:
                # 获取最近的10条消息（5轮对话）
                recent_messages = ChatMessage.query.filter_by(
                    user_id=current_user.id
                ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
                
                # 按时间顺序排序（从旧到新）
                recent_messages.reverse()
                
                # 添加到上下文
                for msg in recent_messages:
                    role = "user" if msg.is_user else "assistant"
                    messages.append({"role": role, "content": msg.content})
                
                # 添加情绪历史分析
                emotion_history = EmotionRecord.query.filter_by(
                    user_id=current_user.id
                ).order_by(EmotionRecord.timestamp.desc()).limit(20).all()
                
                if emotion_history and len(emotion_history) >= 5:
                    # 统计情绪频率
                    emotion_counts = {}
                    for record in emotion_history:
                        emotion_counts[record.emotion] = emotion_counts.get(record.emotion, 0) + 1
                    
                    # 找出主要情绪趋势
                    dominant_emotions = sorted(
                        [(e, c) for e, c in emotion_counts.items()],
                        key=lambda x: x[1],
                        reverse=True
                    )[:2]  # 取前两个主要情绪
                    
                    emotion_trend = "用户情绪趋势: " + ", ".join([f"{e}({c}次)" for e, c in dominant_emotions])
                    messages.append({"role": "system", "content": emotion_trend})
        except Exception as e:
            current_app.logger.error(f"添加对话历史时出错: {str(e)}")
        
        # 添加用户消息
        messages.append({"role": "user", "content": message})
        
        # 打印请求消息，用于调试
        current_app.logger.info("发送到讯飞星火API的消息: %s", json.dumps(messages, ensure_ascii=False))
        
        # 设置超时时间（秒）
        timeout = 10
        
        try:
            # 调用SparkAPI生成回复，添加超时处理
            import threading
            import time
            
            result = {"reply": None, "error": None}
            
            def call_api():
                try:
                    result["reply"] = spark_client.chat(messages)
                except Exception as e:
                    result["error"] = str(e)
            
            # 创建线程调用API
            api_thread = threading.Thread(target=call_api)
            api_thread.daemon = True
            api_thread.start()
            
            # 等待线程完成或超时
            start_time = time.time()
            while api_thread.is_alive() and time.time() - start_time < timeout:
                time.sleep(0.1)
            
            # 检查是否超时
            if api_thread.is_alive():
                current_app.logger.warning("讯飞星火API调用超时")
                return generate_reply(message, emotion, persona)
            
            # 检查是否有错误
            if result["error"]:
                current_app.logger.error("讯飞星火API调用失败: %s", result["error"])
                return generate_reply(message, emotion, persona)
            
            reply = result["reply"]
            
        except Exception as e:
            current_app.logger.error("调用讯飞星火API过程中发生异常: %s", str(e), exc_info=True)
            return generate_reply(message, emotion, persona)
        
        # 打印响应，用于调试
        current_app.logger.info("讯飞星火API的响应: %s", reply)
        
        # 如果响应为空或包含默认错误消息，则使用本地回复生成
        if not reply or "抱歉，我暂时无法回答您的问题" in reply:
            current_app.logger.warning("讯飞星火API返回空响应或错误消息，使用本地回复生成")
            return generate_reply(message, emotion, persona)
        
        return reply
    except Exception as e:
        current_app.logger.error("调用讯飞星火API失败: %s", str(e), exc_info=True)
        # 如果API调用失败，回退到原始的回复生成方法
        return generate_reply(message, emotion, persona)

def recommend_products(emotion, user_id=None):
    """
    根据情绪和用户ID推荐香薰产品
    
    Args:
        emotion: 情绪关键词
        user_id: 用户ID，用于个性化推荐
        
    Returns:
        list: 推荐产品列表
    """
    try:
        # 调用香薰产品推荐模块
        products = recommend_products_for_emotion(emotion, limit=3)
        
        # 如果有用户ID，尝试获取用户偏好
        if user_id:
            try:
                # 获取用户对象
                user = User.query.get(user_id)
                if user and user.aroma_preferences:
                    # 获取用户的香薰偏好
                    aroma_prefs = json.loads(user.aroma_preferences)
                    
                    # 如果用户有香薰偏好，调整推荐结果
                    if aroma_prefs:
                        # 这里可以添加更复杂的个性化逻辑
                        pass
            except Exception as e:
                current_app.logger.error(f"读取用户偏好时出错: {str(e)}")
        
        return products
    
    except Exception as e:
        current_app.logger.error(f"推荐产品时出错: {str(e)}")
        # 返回一些默认推荐
        return [
            {"name": "薰衣草精油", "type": "精油", "description": "有助于缓解焦虑和改善睡眠"},
            {"name": "柠檬精油", "type": "精油", "description": "提神醒脑，改善情绪"},
            {"name": "茉莉花香薰", "type": "香薰", "description": "舒缓情绪，带来平静感"}
        ]

# 获取情绪类型
def get_emotion_type(emotion):
    emotion_types = {
        '快乐': 'happy',
        '悲伤': 'sad',
        '愤怒': 'angry',
        '焦虑': 'anxious',
        '疲惫': 'tired',
        '平静': 'neutral'
    }
    return emotion_types.get(emotion, 'neutral')

# 获取情绪图标
def get_emotion_icon(emotion):
    emotion_icons = {
        '快乐': 'fa-grin-beam',
        '悲伤': 'fa-sad-tear',
        '愤怒': 'fa-angry',
        '焦虑': 'fa-frown',
        '疲惫': 'fa-tired',
        '平静': 'fa-smile'
    }
    return emotion_icons.get(emotion, 'fa-smile')

# 获取情绪描述
def get_emotion_description(emotion):
    emotion_descriptions = {
        '快乐': '您似乎心情不错！享受这美好的时刻，并记住这种感觉。',
        '悲伤': '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。',
        '愤怒': '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。',
        '焦虑': '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。',
        '疲惫': '您似乎感到有些疲惫。适当的休息对身心健康都很重要。',
        '平静': '您当前的情绪状态看起来很平静'
    }
    return emotion_descriptions.get(emotion, '您当前的情绪状态看起来很平静')

@api_bp.route('/recommend_products', methods=['POST'])
@csrf.exempt
def api_recommend_products():
    """根据情绪推荐香薰产品"""
    if not request.is_json:
        return jsonify({"success": False, "message": "请求必须是JSON格式"}), 400
    
    data = request.json
    emotion = data.get('emotion')
    limit = data.get('limit', 3)
    
    if not emotion:
        return jsonify({"success": False, "message": "必须提供情绪参数"}), 400
    
    try:
        # 调用推荐函数
        products = recommend_products_for_emotion(emotion, limit)
        
        return jsonify({
            "success": True,
            "emotion": emotion,
            "products": products
        })
    
    except Exception as e:
        current_app.logger.error(f"推荐产品时出错: {str(e)}")
        return jsonify({
            "success": False,
            "message": "推荐产品时出错",
            "error": str(e)
        }), 500

@api_bp.route('/product_details/<product_id>', methods=['GET'])
@csrf.exempt
def api_product_details(product_id):
    """获取产品详细信息"""
    try:
        # 调用获取产品详情函数
        product = get_product_details(product_id)
        
        if not product:
            return jsonify({
                "success": False,
                "message": f"未找到ID为 {product_id} 的产品"
            }), 404
        
        return jsonify({
            "success": True,
            "product": product
        })
    
    except Exception as e:
        current_app.logger.error(f"获取产品详情时出错: {str(e)}")
        return jsonify({
            "success": False,
            "message": "获取产品详情时出错",
            "error": str(e)
        }), 500 