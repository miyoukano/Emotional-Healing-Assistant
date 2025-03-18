from datetime import datetime
from app import db
from app.models import TokenUsage
from flask import current_app

def update_token_usage(user_id, tokens_used, date=None):
    """
    更新用户的token使用记录
    
    Args:
        user_id: 用户ID
        tokens_used: 使用的token数量
        date: 日期，默认为当天
        
    Returns:
        bool: 是否成功更新
    """
    if not user_id or tokens_used <= 0:
        return False
    
    if date is None:
        date = datetime.now().date()
    
    try:
        # 查找用户当天的记录
        token_usage = TokenUsage.query.filter_by(
            user_id=user_id,
            date=date
        ).first()
        
        if token_usage:
            # 更新现有记录
            token_usage.tokens_used += tokens_used
        else:
            # 创建新记录
            token_usage = TokenUsage(
                user_id=user_id,
                date=date,
                tokens_used=tokens_used
            )
            db.session.add(token_usage)
        
        db.session.commit()
        current_app.logger.info(f"用户ID {user_id} 在 {date} 使用了 {tokens_used} tokens")
        return True
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新token使用量失败: {str(e)}")
        return False 