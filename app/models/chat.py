from app import db
from datetime import datetime

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    content = db.Column(db.Text)
    is_user = db.Column(db.Boolean, default=True)  # True表示用户消息，False表示助手消息
    emotion = db.Column(db.String(20))  # 情绪标签
    emotion_score = db.Column(db.Float)  # 情绪分数
    persona = db.Column(db.String(20))  # 使用的人设
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ChatMessage {self.id}>'


class EmotionRecord(db.Model):
    __tablename__ = 'emotion_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    emotion = db.Column(db.String(20))  # 情绪标签
    score = db.Column(db.Float)  # 情绪分数
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<EmotionRecord {self.id}>' 