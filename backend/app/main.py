import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .database import Base, engine, get_db, SessionLocal
from .models import *
from .seed import seed
from . import services as sv

CURRENT_USER_ID = 1  # simplified auth: default logged-in learner


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Duolingo Clone API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("FRONTEND_ORIGIN", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])


def me(db: Session = Depends(get_db)) -> User:
    return db.get(User, CURRENT_USER_ID)


def public_exercise(e: Exercise) -> dict:
    return {"id": e.id, "type": e.type, "prompt": e.prompt, "data": e.data}  # no answer!


class AnswerIn(BaseModel):
    exercise_id: int
    answer: Any
    mode: str = "lesson"  # lesson | practice


class CompleteIn(BaseModel):
    mistakes: int = 0

@app.get("/")
def root():
    return {"status": "ok", "service": "duolingo-clone-api"}
# ---------------- user / path ----------------
@app.get("/api/me")
def get_me(db: Session = Depends(get_db), u: User = Depends(me)):
    out = sv.user_out(db, u); db.commit(); return out


@app.get("/api/path")
def get_path(db: Session = Depends(get_db), u: User = Depends(me)):
    prog = {p.skill_id: p.lessons_completed for p in db.query(SkillProgress).filter_by(user_id=u.id)}
    units, prev_done = [], True
    for unit in db.query(Unit).order_by(Unit.order):
        skills = []
        for sk in db.query(Skill).filter_by(unit_id=unit.id).order_by(Skill.order):
            lessons = db.query(Lesson).filter_by(skill_id=sk.id).order_by(Lesson.order).all()
            done = prog.get(sk.id, 0)
            total = len(lessons)
            if done >= total: state = "completed"
            elif prev_done: state = "in_progress" if done > 0 else "available"
            else: state = "locked"
            skills.append({"id": sk.id, "title": sk.title, "icon": sk.icon, "state": state,
                           "lessons_completed": done, "total_lessons": total,
                           "next_lesson_id": lessons[done].id if done < total else lessons[-1].id})
            prev_done = done >= total
        units.append({"id": unit.id, "title": unit.title, "description": unit.description,
                      "color": unit.color, "skills": skills})
    c = db.query(Course).first()
    return {"course": {"language": c.language, "flag": c.flag}, "units": units}


# ---------------- lesson loop ----------------
@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    sv.regen_hearts(u); db.commit()
    if u.hearts == 0:
        raise HTTPException(403, "no_hearts")
    exs = db.query(Exercise).filter_by(lesson_id=lesson_id).order_by(Exercise.order).all()
    if not exs: raise HTTPException(404, "Lesson not found")
    return {"lesson_id": lesson_id, "exercises": [public_exercise(e) for e in exs]}


@app.post("/api/answer")
def answer(body: AnswerIn, db: Session = Depends(get_db), u: User = Depends(me)):
    sv.regen_hearts(u)
    ex = db.get(Exercise, body.exercise_id)
    if not ex: raise HTTPException(404, "Exercise not found")
    if body.mode == "lesson" and u.hearts == 0:
        raise HTTPException(403, "no_hearts")
    ok = sv.check_answer(ex, body.answer)
    if body.mode == "practice":
        sv.review_mistake(db, u, ex.id, ok)
    elif not ok:
        sv.lose_heart(u); sv.record_mistake(db, u, ex.id)
    db.commit()
    return {"correct": ok, "correct_answer": ex.answer,
            "hearts": u.hearts}


@app.post("/api/lessons/{lesson_id}/complete")
def complete(lesson_id: int, body: CompleteIn, db: Session = Depends(get_db), u: User = Depends(me)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson: raise HTTPException(404, "Lesson not found")
    xp = 10 + (5 if body.mistakes == 0 else 0)
    sv.add_xp(db, u, xp)
    extended = sv.touch_streak(u)
    db.add(LessonCompletion(user_id=u.id, lesson_id=lesson_id, xp_earned=xp, mistakes=body.mistakes))
    prog = db.query(SkillProgress).filter_by(user_id=u.id, skill_id=lesson.skill_id).first()
    if not prog:
        prog = SkillProgress(user_id=u.id, skill_id=lesson.skill_id, lessons_completed=0); db.add(prog)
    total = db.query(Lesson).filter_by(skill_id=lesson.skill_id).count()
    skill_done = False
    if lesson.order == prog.lessons_completed:  # only the "current" lesson advances progress
        prog.lessons_completed += 1
        skill_done = prog.lessons_completed >= total
    new_ach = sv.check_achievements(db, u, body.mistakes == 0)
    out = sv.user_out(db, u)
    db.commit()
    return {"xp_gained": xp, "streak_extended": extended, "skill_completed": skill_done,
            "new_achievements": new_ach, "user": out}


# ---------------- hearts ----------------
@app.post("/api/hearts/refill")
def refill(db: Session = Depends(get_db), u: User = Depends(me)):
    sv.regen_hearts(u)
    if u.hearts >= sv.MAX_HEARTS: raise HTTPException(400, "Hearts already full")
    if u.gems < sv.REFILL_COST: raise HTTPException(400, "Not enough gems")
    u.gems -= sv.REFILL_COST; u.hearts = sv.MAX_HEARTS
    out = sv.user_out(db, u); db.commit(); return out


# ---------------- social / profile ----------------
@app.get("/api/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.weekly_xp.desc()).all()
    return [{"rank": i + 1, "display_name": x.display_name, "weekly_xp": x.weekly_xp,
             "is_me": x.id == CURRENT_USER_ID} for i, x in enumerate(users)]


@app.get("/api/profile")
def profile(db: Session = Depends(get_db), u: User = Depends(me)):
    unlocked = {x.achievement_code for x in db.query(UserAchievement).filter_by(user_id=u.id)}
    return {
        "user": sv.user_out(db, u),
        "lessons_completed": db.query(LessonCompletion).filter_by(user_id=u.id).count(),
        "achievements": [{"code": a.code, "title": a.title, "description": a.description,
                          "icon": a.icon, "unlocked": a.code in unlocked} for a in db.query(Achievement)],
        "vault": {"total": db.query(Mistake).filter_by(user_id=u.id).count(),
                  "mastered": db.query(Mistake).filter_by(user_id=u.id, mastered=True).count()},
    }


# ---------------- Mistakes Vault (novelty) ----------------
@app.get("/api/practice/mistakes")
def practice_mistakes(db: Session = Depends(get_db), u: User = Depends(me)):
    due = (db.query(Mistake).filter_by(user_id=u.id, mastered=False)
           .filter(Mistake.next_review_at <= datetime.utcnow()).limit(8).all())
    exs = [db.get(Exercise, m.exercise_id) for m in due]
    return {"exercises": [public_exercise(e) for e in exs],
            "vault": {"total": db.query(Mistake).filter_by(user_id=u.id).count(),
                      "mastered": db.query(Mistake).filter_by(user_id=u.id, mastered=True).count()}}


@app.post("/api/practice/complete")
def practice_complete(db: Session = Depends(get_db), u: User = Depends(me)):
    sv.regen_hearts(u)
    u.hearts = min(sv.MAX_HEARTS, u.hearts + 1) 
    sv.add_xp(db, u, 10); extended = sv.touch_streak(u)
    new_ach = sv.check_achievements(db, u, False)
    out = sv.user_out(db, u); db.commit()
    return {"xp_gained": 10, "streak_extended": extended, "new_achievements": new_ach, "user": out}


# ---------------- dev helper: simulate next day (for testing streaks) ----------------
@app.post("/api/dev/next-day")
def next_day(db: Session = Depends(get_db), u: User = Depends(me)):
    u.day_offset += 1
    out = sv.user_out(db, u); db.commit(); return out

# ---------------- vault list + settings ----------------
@app.get("/api/vault")
def vault_list(db: Session = Depends(get_db), u: User = Depends(me)):
    rows = (db.query(Mistake, Exercise).join(Exercise, Mistake.exercise_id == Exercise.id)
            .filter(Mistake.user_id == u.id)
            .order_by(Mistake.mastered, Mistake.next_review_at).all())
    now = datetime.utcnow()
    return {"items": [{
        "id": m.id, "type": e.type,
        "preview": e.data.get("source") or e.data.get("sentence") or e.prompt,
        "prompt": e.prompt, "box": m.box, "times_wrong": m.times_wrong,
        "mastered": m.mastered, "due": (not m.mastered) and m.next_review_at <= now,
    } for m, e in rows]}


class SettingsIn(BaseModel):
    daily_goal: int


@app.post("/api/settings")
def update_settings(body: SettingsIn, db: Session = Depends(get_db), u: User = Depends(me)):
    if body.daily_goal not in (10, 20, 30, 50):
        raise HTTPException(400, "Invalid daily goal")
    u.daily_goal = body.daily_goal
    out = sv.user_out(db, u); db.commit(); return out