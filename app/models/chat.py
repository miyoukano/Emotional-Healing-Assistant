from app import db
from datetime import datetime

class ChatSession(db.Model):
    """聊天会话模型"""
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_emotion = db.Column(db.String(50), nullable=True)
    last_persona = db.Column(db.String(50), default='empathetic')
    recommended_product_id = db.Column(db.Integer, nullable=True)  # 跟踪已推荐的香薰产品ID
    
    # 关系
    messages = db.relationship('ChatMessage', backref='session', lazy='dynamic', cascade='all, delete-orphan')

class ChatMessage(db.Model):
    """聊天消息模型"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    content = db.Column(db.Text, nullable=False)
    is_user = db.Column(db.Boolean, default=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    emotion = db.Column(db.String(50), nullable=True)
    emotion_score = db.Column(db.Float, nullable=True)
    persona = db.Column(db.String(50), default='empathetic')

class EmotionRecord(db.Model):
    """情绪记录模型"""
    __tablename__ = 'emotion_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    emotion = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class TokenUsage(db.Model):
    """Token使用量记录模型"""
    __tablename__ = 'token_usages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    date = db.Column(db.Date, nullable=False)
    tokens_used = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 唯一约束确保每个用户每天只有一条记录
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='unique_user_date'),) 