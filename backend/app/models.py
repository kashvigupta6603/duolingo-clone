from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, JSON, DateTime, Date, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(60))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    weekly_xp: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    daily_goal: Mapped[int] = mapped_column(Integer, default=20)
    day_offset: Mapped[int] = mapped_column(Integer, default=0)  # simulates "next day" for testing


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    language: Mapped[str] = mapped_column(String(40))
    flag: Mapped[str] = mapped_column(String(8))


class Unit(Base):
    __tablename__ = "units"
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    order: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(160))
    color: Mapped[str] = mapped_column(String(10))


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"))
    order: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(60))
    icon: Mapped[str] = mapped_column(String(8))


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    order: Mapped[int] = mapped_column(Integer)  # 0-based inside the skill


class Exercise(Base):
    __tablename__ = "exercises"
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    order: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(20))  # multiple_choice | translate | match_pairs | fill_blank | type_answer
    prompt: Mapped[str] = mapped_column(String(200))
    data: Mapped[dict] = mapped_column(JSON)       # what the client may see (options, word bank...)
    answer: Mapped[object] = mapped_column(JSON)   # NEVER sent to client before answering


class SkillProgress(Base):
    __tablename__ = "skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)


class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    xp_earned: Mapped[int] = mapped_column(Integer)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DailyXP(Base):
    __tablename__ = "daily_xp"
    __table_args__ = (UniqueConstraint("user_id", "day"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    day: Mapped[date] = mapped_column(Date)
    xp: Mapped[int] = mapped_column(Integer, default=0)


class Achievement(Base):
    __tablename__ = "achievements"
    code: Mapped[str] = mapped_column(String(30), primary_key=True)
    title: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(String(160))
    icon: Mapped[str] = mapped_column(String(8))


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_code"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    achievement_code: Mapped[str] = mapped_column(ForeignKey("achievements.code"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Mistake(Base):
    """Novelty: Mistakes Vault (Leitner-box spaced repetition)."""
    __tablename__ = "mistakes"
    __table_args__ = (UniqueConstraint("user_id", "exercise_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    box: Mapped[int] = mapped_column(Integer, default=1)
    times_wrong: Mapped[int] = mapped_column(Integer, default=1)
    next_review_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    mastered: Mapped[bool] = mapped_column(Boolean, default=False)