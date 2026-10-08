import random
from datetime import date, timedelta
from .models import *

# (spanish, english) vocab and (spanish sentence, english sentence, word to blank out)
SKILLS = [
    (1, "Basics", "👋", [("hola", "hello"), ("adiós", "goodbye"), ("gracias", "thank you"),
                         ("por favor", "please"), ("sí", "yes"), ("buenos días", "good morning")],
     [("Hola, buenos días", "Hello, good morning", "Hola"), ("Gracias, adiós", "Thank you, goodbye", "Gracias"),
      ("Sí, por favor", "Yes, please", "Sí")]),
    (1, "Phrases", "💬", [("yo", "I"), ("tú", "you"), ("soy", "I am"), ("eres", "you are"),
                          ("nombre", "name"), ("amigo", "friend")],
     [("Yo soy tu amigo", "I am your friend", "soy"), ("Tú eres mi amigo", "You are my friend", "eres"),
      ("Mi nombre es Ana", "My name is Ana", "nombre")]),
    (2, "Food", "🍎", [("manzana", "apple"), ("pan", "bread"), ("agua", "water"),
                       ("leche", "milk"), ("queso", "cheese"), ("arroz", "rice")],
     [("Yo como pan", "I eat bread", "pan"), ("Ella bebe agua", "She drinks water", "agua"),
      ("Tú comes queso", "You eat cheese", "queso")]),
    (2, "Animals", "🐶", [("perro", "dog"), ("gato", "cat"), ("pájaro", "bird"),
                          ("pez", "fish"), ("caballo", "horse"), ("vaca", "cow")],
     [("El perro bebe agua", "The dog drinks water", "perro"), ("Yo tengo un gato", "I have a cat", "gato"),
      ("La vaca bebe leche", "The cow drinks milk", "vaca")]),
]
UNITS = [("Unit 1", "Greet people and introduce yourself", "#58cc02"),
         ("Unit 2", "Talk about food and animals", "#ce82ff")]
EXTRA_EN, EXTRA_ES = ["the", "a", "is", "and", "my"], ["el", "la", "un", "y", "es"]


def build_exercises(vocab, sent, i):
    rnd = random.Random(i + len(vocab[0][0]))
    rot = vocab[i * 2 % len(vocab):] + vocab[:i * 2 % len(vocab)]
    (es, en), (es2, en2), (es3, en3) = rot[0], rot[1], rot[2]
    s_es, s_en, blank = sent
    shuf = lambda l: rnd.sample(l, len(l))
    others = [v for v in vocab if v[0] != es]
    others3 = [v for v in vocab if v[0] != es3]
    ex = []
    ex.append(("multiple_choice", f"Which of these means “{es}”?",
               {"options": shuf([en] + [o[1] for o in rnd.sample(others, 3)])}, en))
    pairs = [list(p) for p in rot[:4]]
    ex.append(("match_pairs", "Tap the matching pairs",
               {"left": [p[0] for p in pairs], "right": shuf([p[1] for p in pairs])}, pairs))
    words_en = s_en.split()
    ex.append(("translate", "Write this in English",
               {"source": s_es, "bank": shuf(words_en + rnd.sample([w for w in EXTRA_EN if w not in words_en], 2))}, s_en))
    ex.append(("fill_blank", "Fill in the missing word",
               {"sentence": s_es.replace(blank, "___", 1), "hint": s_en,
                "options": shuf([blank] + [o[0] for o in rnd.sample([v for v in vocab if v[0].lower() != blank.lower()], 3)])}, blank))
    ex.append(("type_answer", f"Type “{es2}” in English", {"accepted": []}, en2))
    words_es = [w.strip(",") for w in s_es.split()]
    ex.append(("translate", "Write this in Spanish",
               {"source": s_en, "bank": shuf(words_es + rnd.sample([w for w in EXTRA_ES if w not in words_es], 2))}, s_es))
    ex.append(("multiple_choice", f"Which of these means “{en3}”?",
               {"options": shuf([es3] + [o[0] for o in rnd.sample(others3, 3)])}, es3))
    return ex


def seed(db):
    if db.query(User).first():
        return
    course = Course(language="Spanish", flag="🇪🇸")
    db.add(course); db.flush()
    units = []
    for idx, (t, d, c) in enumerate(UNITS):
        u = Unit(course_id=course.id, order=idx, title=t, description=d, color=c)
        db.add(u); units.append(u)
    db.flush()
    skill_rows = []
    skill_order = {}
    for unit_no, title, icon, vocab, sents in SKILLS:
        unit = units[unit_no - 1]
        o = skill_order.get(unit.id, 0); skill_order[unit.id] = o + 1
        sk = Skill(unit_id=unit.id, order=o, title=title, icon=icon)
        db.add(sk); db.flush(); skill_rows.append(sk)
        for li, sent in enumerate(sents):
            les = Lesson(skill_id=sk.id, order=li)
            db.add(les); db.flush()
            for eo, (typ, prompt, data, ans) in enumerate(build_exercises(vocab, sent, li)):
                db.add(Exercise(lesson_id=les.id, order=eo, type=typ, prompt=prompt, data=data, answer=ans))

    for code, title, desc, icon in [
        ("first_lesson", "First Steps", "Complete your first lesson", "🌱"),
        ("streak_3", "On Fire", "Reach a 3 day streak", "🔥"),
        ("xp_100", "XP Hunter", "Earn 100 XP", "⚡"),
        ("perfect", "Flawless", "Finish a lesson with no mistakes", "💎"),
        ("mistake_master", "Mistake Master", "Master 5 exercises from your Mistakes Vault", "🧠")]:
        db.add(Achievement(code=code, title=title, description=desc, icon=icon))

    me = User(username="learner", display_name="You", xp=120, weekly_xp=120, streak=4,
              last_active_date=date.today(), hearts=5, gems=500, daily_goal=20)
    db.add(me)
    for i, (name, xp) in enumerate([("Maria", 310), ("Luca", 270), ("Aiko", 205), ("Sam", 150),
                                    ("Priya", 95), ("Tom", 60), ("Zoe", 30)]):
        db.add(User(username=name.lower(), display_name=name, xp=xp * 3, weekly_xp=xp, streak=i + 1))
    db.flush()
    db.add(SkillProgress(user_id=me.id, skill_id=skill_rows[0].id, lessons_completed=3))
    db.add(SkillProgress(user_id=me.id, skill_id=skill_rows[1].id, lessons_completed=1))
    db.add(DailyXP(user_id=me.id, day=date.today(), xp=10))
    db.add(UserAchievement(user_id=me.id, achievement_code="first_lesson"))
    db.commit()