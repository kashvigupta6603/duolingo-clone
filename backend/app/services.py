import re
from datetime import datetime, date, timedelta
from .models import User, DailyXP, Mistake, Achievement, UserAchievement, LessonCompletion

MAX_HEARTS = 5
HEART_INTERVAL = timedelta(minutes=30)
REFILL_COST = 100
REVIEW_MINUTES = {2: 10, 3: 60}  # box -> minutes until next review (short for demo)


def today(u: User) -> date:
    return date.today() + timedelta(days=u.day_offset)


def regen_hearts(u: User) -> int:
    """Lazy regeneration: computed whenever the user is read. Returns seconds until next heart."""
    now = datetime.utcnow()
    if u.hearts >= MAX_HEARTS:
        u.hearts_updated_at = now
        return 0
    gained = int((now - u.hearts_updated_at) / HEART_INTERVAL)
    if gained:
        u.hearts = min(MAX_HEARTS, u.hearts + gained)
        u.hearts_updated_at = now if u.hearts >= MAX_HEARTS else u.hearts_updated_at + gained * HEART_INTERVAL
    if u.hearts >= MAX_HEARTS:
        return 0
    return max(0, int((u.hearts_updated_at + HEART_INTERVAL - now).total_seconds()))


def lose_heart(u: User):
    if u.hearts >= MAX_HEARTS:
        u.hearts_updated_at = datetime.utcnow()
    u.hearts = max(0, u.hearts - 1)


def effective_streak(u: User) -> int:
    t = today(u)
    if u.last_active_date and u.last_active_date >= t - timedelta(days=1):
        return u.streak
    return 0


def touch_streak(u: User) -> bool:
    """Returns True if the streak was extended today."""
    t = today(u)
    if u.last_active_date == t:
        return False
    u.streak = u.streak + 1 if u.last_active_date == t - timedelta(days=1) else 1
    u.last_active_date = t
    return True


def add_xp(db, u: User, amount: int):
    u.xp += amount
    u.weekly_xp += amount
    row = db.query(DailyXP).filter_by(user_id=u.id, day=today(u)).first()
    if row:
        row.xp += amount
    else:
        db.add(DailyXP(user_id=u.id, day=today(u), xp=amount))


def user_out(db, u: User) -> dict:
    next_in = regen_hearts(u)
    row = db.query(DailyXP).filter_by(user_id=u.id, day=today(u)).first()
    return {
        "id": u.id, "username": u.username, "display_name": u.display_name,
        "xp": u.xp, "weekly_xp": u.weekly_xp, "streak": effective_streak(u),
        "hearts": u.hearts, "max_hearts": MAX_HEARTS, "next_heart_in": next_in,
        "gems": u.gems, "daily_goal": u.daily_goal, "xp_today": row.xp if row else 0,
        "streak_done_today": u.last_active_date == today(u),
    }


def _norm(s) -> str:
    return " ".join(re.sub(r"[^\w\s]", "", str(s).lower()).split())


def check_answer(ex, answer) -> bool:
    if ex.type == "match_pairs":
        return sorted(map(tuple, answer)) == sorted(map(tuple, ex.answer))
    accepted = [ex.answer] + ex.data.get("accepted", [])
    return _norm(answer) in [_norm(a) for a in accepted]


# ---------- Mistakes Vault (novelty) ----------
def record_mistake(db, u: User, exercise_id: int):
    m = db.query(Mistake).filter_by(user_id=u.id, exercise_id=exercise_id).first()
    if m:
        m.box, m.times_wrong, m.mastered = 1, m.times_wrong + 1, False
        m.next_review_at = datetime.utcnow()
    else:
        db.add(Mistake(user_id=u.id, exercise_id=exercise_id))


def review_mistake(db, u: User, exercise_id: int, correct: bool):
    m = db.query(Mistake).filter_by(user_id=u.id, exercise_id=exercise_id).first()
    if not m:
        return
    if not correct:
        m.box, m.times_wrong = 1, m.times_wrong + 1
        m.next_review_at = datetime.utcnow()
    elif m.box >= 3:
        m.mastered = True
    else:
        m.box += 1
        m.next_review_at = datetime.utcnow() + timedelta(minutes=REVIEW_MINUTES[m.box])


# ---------- Achievements ----------
def check_achievements(db, u: User, perfect: bool) -> list[dict]:
    have = {x.achievement_code for x in db.query(UserAchievement).filter_by(user_id=u.id)}
    lessons = db.query(LessonCompletion).filter_by(user_id=u.id).count()
    mastered = db.query(Mistake).filter_by(user_id=u.id, mastered=True).count()
    checks = {
        "first_lesson": lessons >= 1, "streak_3": u.streak >= 3, "xp_100": u.xp >= 100,
        "perfect": perfect, "mistake_master": mastered >= 5,
    }
    new = []
    for code, ok in checks.items():
        if ok and code not in have:
            db.add(UserAchievement(user_id=u.id, achievement_code=code))
            a = db.get(Achievement, code)
            new.append({"code": code, "title": a.title, "icon": a.icon})
    return new