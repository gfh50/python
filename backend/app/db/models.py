from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Poll(Base):
    """Модель опроса"""
    __tablename__ = "polls"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creator_id = Column(Integer, nullable=True)  # ID создателя опроса
    
    # Relationships
    questions = relationship("Question", back_populates="poll", cascade="all, delete-orphan")
    responses = relationship("PollResponse", back_populates="poll", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Poll(id={self.id}, title='{self.title}')>"

class Question(Base):
    """Модель вопроса в опросе"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # 'single', 'multiple', 'text'
    options = Column(JSON, nullable=True)  # Список вариантов ответов для single/multiple
    order_index = Column(Integer, default=0)  # Порядок вопроса в опросе
    required = Column(Boolean, default=True)
    
    # Relationships
    poll = relationship("Poll", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, poll_id={self.poll_id}, type='{self.type}')>"

class PollResponse(Base):
    """Модель ответа участника на опрос"""
    __tablename__ = "poll_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    participant_id = Column(String(255), nullable=True)  # IP или ID участника
    submitted_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)  # IPv4 или IPv6
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    poll = relationship("Poll", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PollResponse(id={self.id}, poll_id={self.poll_id})>"

class Answer(Base):
    """Модель ответа на конкретный вопрос"""
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("poll_responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=True)  # Для текстовых ответов
    selected_options = Column(JSON, nullable=True)  # Для single/multiple выбора
    
    # Relationships
    response = relationship("PollResponse", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    def __repr__(self):
        return f"<Answer(id={self.id}, question_id={self.question_id})>"