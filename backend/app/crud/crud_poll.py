from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime

from ..db.models import Poll, Question, PollResponse, Answer
from ..schemas.poll import PollCreate, PollUpdate, QuestionCreate

class CRUDPoll:
    def get(self, db: Session, id: int) -> Optional[Poll]:
        """Получить опрос по ID"""
        return db.query(Poll).filter(Poll.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Poll]:
        """Получить список опросов"""
        return db.query(Poll).offset(skip).limit(limit).all()

    def get_active(self, db: Session) -> List[Poll]:
        """Получить только активные опросы"""
        now = datetime.utcnow()
        return db.query(Poll).filter(
            and_(
                Poll.is_active == True,
                or_(
                    Poll.start_time.is_(None),
                    Poll.start_time <= now
                ),
                or_(
                    Poll.end_time.is_(None),
                    Poll.end_time >= now
                )
            )
        ).all()

    def create(self, db: Session, *, obj_in: PollCreate, creator_id: Optional[int] = None) -> Poll:
        """Создать новый опрос"""
        # Создаем опрос
        db_poll = Poll(
            title=obj_in.title,
            description=obj_in.description,
            start_time=obj_in.start_time,
            end_time=obj_in.end_time,
            creator_id=creator_id,
            is_active=True
        )
        db.add(db_poll)
        db.flush()  # Получаем ID опроса

        # Создаем вопросы
        for index, question_data in enumerate(obj_in.questions):
            db_question = Question(
                poll_id=db_poll.id,
                text=question_data.text,
                type=question_data.type,
                options=question_data.options if question_data.type != 'text' else None,
                order_index=index,
                required=True
            )
            db.add(db_question)

        db.commit()
        db.refresh(db_poll)
        return db_poll

    def update(
        self, db: Session, *, db_obj: Poll, obj_in: PollUpdate
    ) -> Poll:
        """Обновить опрос"""
        update_data = obj_in.dict(exclude_unset=True)
        
        # Обновляем основные поля опроса
        for field, value in update_data.items():
            if field != 'questions':
                setattr(db_obj, field, value)
        
        db_obj.updated_at = datetime.utcnow()
        
        # Если переданы вопросы, обновляем их
        if hasattr(obj_in, 'questions') and obj_in.questions is not None:
            # Удаляем старые вопросы
            db.query(Question).filter(Question.poll_id == db_obj.id).delete()
            
            # Создаем новые вопросы
            for index, question_data in enumerate(obj_in.questions):
                db_question = Question(
                    poll_id=db_obj.id,
                    text=question_data.text,
                    type=question_data.type,
                    options=question_data.options if question_data.type != 'text' else None,
                    order_index=index,
                    required=True
                )
                db.add(db_question)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Poll:
        """Удалить опрос"""
        obj = db.query(Poll).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def deactivate(self, db: Session, *, id: int) -> Poll:
        """Деактивировать опрос"""
        db_obj = db.query(Poll).get(id)
        db_obj.is_active = False
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def check_access(self, poll: Poll) -> Dict[str, Any]:
        """Проверить доступность опроса"""
        now = datetime.utcnow()
        
        if not poll.is_active:
            return {
                "accessible": False,
                "reason": "deactivated",
                "message": "Опрос деактивирован"
            }
        
        if poll.start_time and poll.start_time > now:
            return {
                "accessible": False,
                "reason": "not_started",
                "message": "Опрос еще не начался",
                "start_time": poll.start_time
            }
        
        if poll.end_time and poll.end_time < now:
            return {
                "accessible": False,
                "reason": "expired",
                "message": "Опрос завершен",
                "end_time": poll.end_time
            }
        
        return {
            "accessible": True,
            "end_time": poll.end_time
        }

    def submit_response(
        self, 
        db: Session, 
        *, 
        poll_id: int, 
        answers: Dict[int, Any],
        participant_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> PollResponse:
        """Сохранить ответы на опрос"""
        
        # Создаем запись ответа
        db_response = PollResponse(
            poll_id=poll_id,
            participant_id=participant_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(db_response)
        db.flush()  # Получаем ID ответа

        # Сохраняем ответы на вопросы
        for question_id, answer_data in answers.items():
            db_answer = Answer(
                response_id=db_response.id,
                question_id=int(question_id)
            )
            
            # Определяем тип ответа по типу данных
            if isinstance(answer_data, str):
                db_answer.answer_text = answer_data
            elif isinstance(answer_data, list):
                db_answer.selected_options = answer_data
            else:
                db_answer.answer_text = str(answer_data)
            
            db.add(db_answer)

        db.commit()
        db.refresh(db_response)
        return db_response

    def get_results(self, db: Session, *, poll_id: int) -> Dict[str, Any]:
        """Получить результаты опроса"""
        poll = self.get(db, poll_id)
        if not poll:
            return None

        results = {
            "poll": {
                "id": poll.id,
                "title": poll.title,
                "description": poll.description,
                "total_responses": len(poll.responses)
            },
            "questions": []
        }

        for question in poll.questions:
            question_result = {
                "id": question.id,
                "text": question.text,
                "type": question.type,
                "total_answers": len(question.answers)
            }

            if question.type in ['single', 'multiple']:
                # Подсчитываем ответы по вариантам
                option_counts = {}
                for option in question.options or []:
                    option_counts[option] = 0
                
                for answer in question.answers:
                    if answer.selected_options:
                        for option in answer.selected_options:
                            if option in option_counts:
                                option_counts[option] += 1
                
                question_result["options"] = [
                    {
                        "text": option,
                        "count": count,
                        "percentage": round((count / len(question.answers)) * 100, 2) if question.answers else 0
                    }
                    for option, count in option_counts.items()
                ]
            
            elif question.type == 'text':
                # Собираем текстовые ответы
                question_result["text_answers"] = [
                    answer.answer_text for answer in question.answers if answer.answer_text
                ]

            results["questions"].append(question_result)

        return results

# Создаем экземпляр для использования
crud_poll = CRUDPoll()