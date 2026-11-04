from datetime import datetime, timezone
import logging
from bson import ObjectId
from app.core.database import db_manager
from app.core.security import get_password_hash

logger = logging.getLogger("quizora.seed")


async def purge_fake_users():
    users_col = db_manager.get_collection("users")
    profiles_col = db_manager.get_collection("user_profiles")
    friends_col = db_manager.get_collection("friends")
    requests_col = db_manager.get_collection("friend_requests")
    attempts_col = db_manager.get_collection("quiz_attempts")
    messages_col = db_manager.get_collection("messages")

    fake_emails = [
        "demo@quizora.com",
        "sarah.connor@quizora.com",
        "kenji.sato@quizora.com",
        "elena.rostova@quizora.com",
        "marcus.vance@quizora.com"
    ]
    fake_usernames = [
        "alex_learner",
        "sarah_connor",
        "kenji_sato",
        "elena_rostova",
        "marcus_v"
    ]

    fake_users = await users_col.find({
        "$or": [
            {"email": {"$in": fake_emails}},
            {"username": {"$in": fake_usernames}}
        ]
    }).to_list(100)

    fake_user_ids = [u["_id"] for u in fake_users]
    if fake_user_ids:
        logger.info(f"Purging {len(fake_user_ids)} fake/mock users: {[u.get('username') for u in fake_users]}")
        await users_col.delete_many({"_id": {"$in": fake_user_ids}})
        await profiles_col.delete_many({"user_id": {"$in": fake_user_ids}})
        await friends_col.delete_many({
            "$or": [
                {"user_id_1": {"$in": fake_user_ids}},
                {"user_id_2": {"$in": fake_user_ids}}
            ]
        })
        await requests_col.delete_many({
            "$or": [
                {"sender_id": {"$in": fake_user_ids}},
                {"receiver_id": {"$in": fake_user_ids}}
            ]
        })
        await attempts_col.delete_many({"user_id": {"$in": fake_user_ids}})
        await messages_col.delete_many({
            "$or": [
                {"sender_id": {"$in": fake_user_ids}},
                {"recipient_id": {"$in": fake_user_ids}}
            ]
        })


async def seed_database_if_empty():
    users_col = db_manager.get_collection("users")
    categories_col = db_manager.get_collection("categories")
    topics_col = db_manager.get_collection("topics")
    questions_col = db_manager.get_collection("questions")
    achievements_col = db_manager.get_collection("achievements")
    quests_col = db_manager.get_collection("daily_quests")
    videos_col = db_manager.get_collection("video_resources")
    profiles_col = db_manager.get_collection("user_profiles")
    monthly_col = db_manager.get_collection("monthly_rewards")

    now = datetime.now(timezone.utc)

    # 1. Check if basic seeding exists
    # 1. Purge all fake/mock users from system
    await purge_fake_users()

    # 2. Check if primary administrator exists
    admin_user = await users_col.find_one({"role": "admin"})
    if not admin_user:
        logger.info("🌱 Seeding QUIZORA primary administrator account...")
        admin_pw = get_password_hash("Admin123!")
        admin_id = ObjectId("670e00000000000000000001")
        admin_doc = {
            "_id": admin_id,
            "email": "admin@quizora.com",
            "username": "admin",
            "hashed_password": admin_pw,
            "first_name": "Quizora",
            "last_name": "Admin",
            "phone_number": "+998901234567",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=admin_quizora",
            "created_at": now,
            "last_login_at": now
        }
        await users_col.insert_one(admin_doc)

        admin_profile = {
            "user_id": admin_id,
            "bio": "Bosh Tizim Administratori & Boshqaruvchi.",
            "level": 30,
            "total_xp": 90000,
            "ranking_coins": 5000,
            "current_streak": 45,
            "longest_streak": 60,
            "completed_quizzes_count": 250,
            "total_questions_answered": 2500,
            "total_correct_answers": 2480,
            "total_incorrect_answers": 20,
            "average_score": 99.2,
            "privacy_settings": {"show_email": True, "show_phone": True, "show_activity": True, "allow_invitations": True},
            "created_at": now
        }
        await profiles_col.insert_one(admin_profile)

    # 2. Check if Uzbek & Multilingual Categories are seeded
    check_uz_cat = await categories_col.find_one({"slug": "ona-tili-adabiyot"})
    if not check_uz_cat:
        logger.info("🇺🇿 Seeding Uzbek, Mathematics (Adaptive), and Multilingual categories & questions...")

        # Category ObjectIds
        cat_it_id = ObjectId("670e10000000000000000001")
        cat_lang_id = ObjectId("670e10000000000000000002")
        cat_math_id = ObjectId("670e10000000000000000003")
        cat_design_id = ObjectId("670e10000000000000000004")
        cat_gk_id = ObjectId("670e10000000000000000005")

        cat_onatili_id = ObjectId("670e10000000000000000010")
        cat_uzbtarix_id = ObjectId("670e10000000000000000011")
        cat_jahontarix_id = ObjectId("670e10000000000000000012")
        cat_matem_uz_id = ObjectId("670e10000000000000000013")
        cat_rus_id = ObjectId("670e10000000000000000014")

        # Upsert English & Global categories with language tag
        await categories_col.update_one({"_id": cat_it_id}, {"$set": {"name": "IT & Programming", "slug": "it-programming", "icon": "Code", "description": "Software architecture, modern frameworks, Python, TypeScript, algorithms.", "language": "en", "is_active": True, "created_at": now}}, upsert=True)
        await categories_col.update_one({"_id": cat_lang_id}, {"$set": {"name": "English & IELTS", "slug": "english-ielts", "icon": "Languages", "description": "English Grammar, IELTS Preparation, Lexicon & Advanced Syntax.", "language": "en", "is_active": True, "created_at": now}}, upsert=True)
        await categories_col.update_one({"_id": cat_design_id}, {"$set": {"name": "Design & UI/UX", "slug": "design-ux", "icon": "Palette", "description": "UI Design, Figma, Design Systems, Typography and WCAG accessibility.", "language": "en", "is_active": True, "created_at": now}}, upsert=True)

        # Insert Uzbek & Russian Categories
        uz_categories = [
            {
                "_id": cat_onatili_id,
                "name": "Ona tili va Adabiyot",
                "slug": "ona-tili-adabiyot",
                "icon": "BookOpen",
                "description": "O'zbek tili grammatikasi, imlo qoidalari, Alisher Navoiy va o'zbek adabiyoti durdonalari.",
                "language": "uz",
                "is_active": True,
                "created_at": now
            },
            {
                "_id": cat_uzbtarix_id,
                "name": "O'zbekiston tarixi",
                "slug": "ozbekiston-tarixi",
                "icon": "Landmark",
                "description": "Qadimgi Turon sivilizatsiyasi, Amir Temur saltanati, xonliklar va Yangi O'zbekiston tarixi.",
                "language": "uz",
                "is_active": True,
                "created_at": now
            },
            {
                "_id": cat_jahontarix_id,
                "name": "Jahon tarixi",
                "slug": "jahon-tarixi",
                "icon": "Globe",
                "description": "Qadimgi dunyo sivilizatsiyalari, Rim, O'rta asrlar, jahon urushlari va yangi davr voqealari.",
                "language": "uz",
                "is_active": True,
                "created_at": now
            },
            {
                "_id": cat_matem_uz_id,
                "name": "Matematika (Moslashuvchan)",
                "slug": "matematika-uz",
                "icon": "Calculator",
                "description": "Oddiy arifmetikadan to oliy matematika va integrallargacha darajali testlar to'plami.",
                "language": "uz",
                "is_active": True,
                "created_at": now
            },
            {
                "_id": cat_rus_id,
                "name": "Русский язык и литература",
                "slug": "russkiy-yazyk",
                "icon": "Languages",
                "description": "Орфография, синтаксис, русская классическая и современная литература.",
                "language": "ru",
                "is_active": True,
                "created_at": now
            }
        ]
        for uc in uz_categories:
            await categories_col.update_one({"_id": uc["_id"]}, {"$set": uc}, upsert=True)

        # Topics
        top_onatili_grammatika = ObjectId("670e20000000000000000010")
        top_adabiyot_mumtoz = ObjectId("670e20000000000000000011")
        top_adabiyot_zamonaviy = ObjectId("670e20000000000000000012")

        top_uzbtarix_temur = ObjectId("670e20000000000000000013")
        top_uzbtarix_qadimgi = ObjectId("670e20000000000000000014")
        top_uzbtarix_yangi = ObjectId("670e20000000000000000015")

        top_jahon_qadimgi = ObjectId("670e20000000000000000016")
        top_jahon_zamonaviy = ObjectId("670e20000000000000000017")

        top_matem_arifmetika = ObjectId("670e20000000000000000018")
        top_matem_algebra = ObjectId("670e20000000000000000019")
        top_matem_geometriya = ObjectId("670e20000000000000000020")
        top_matem_oliy = ObjectId("670e20000000000000000021")

        top_rus_grammatika = ObjectId("670e20000000000000000022")

        new_topics = [
            {"_id": ObjectId("670e20000000000000000001"), "category_id": cat_it_id, "name": "Python & Backend", "slug": "python-backend", "icon": "Terminal", "description": "Core Python 3.12+, AsyncIO, FastAPI, Pydantic & Data Structures."},
            {"_id": ObjectId("670e20000000000000000002"), "category_id": cat_it_id, "name": "TypeScript Mastery", "slug": "typescript-mastery", "icon": "FileCode", "description": "Generics, Utility Types, Conditional Typing, and strict checks."},
            {"_id": ObjectId("670e20000000000000000003"), "category_id": cat_it_id, "name": "React 19 & Next.js 15", "slug": "react-nextjs", "icon": "Boxes", "description": "Server Components, App Router, Hooks, Streaming SSR & performance."},
            {"_id": ObjectId("670e20000000000000000004"), "category_id": cat_it_id, "name": "Algorithmic Systems", "slug": "algorithms", "icon": "Cpu", "description": "Graph traversals, Dynamic Programming, Big-O analysis and memory structures."},
            {"_id": ObjectId("670e20000000000000000005"), "category_id": cat_lang_id, "name": "IELTS & Advanced Syntax", "slug": "ielts-syntax", "icon": "FileText", "description": "Subjunctive clauses, inversion, idiomatic phrasals, cohesive linkers."},
            {"_id": ObjectId("670e20000000000000000006"), "category_id": cat_math_id, "name": "Linear Algebra & Calculus", "slug": "math-core", "icon": "Compass", "description": "Eigenvalues, Matrix transforms, partial derivatives & optimization."},
            {"_id": ObjectId("670e20000000000000000007"), "category_id": cat_design_id, "name": "UI/UX & Design Systems", "slug": "design-core", "icon": "Palette", "description": "WCAG 2.1 accessibility, design tokens, spatial typography & micro-interactions."},

            {"_id": top_onatili_grammatika, "category_id": cat_onatili_id, "name": "Ona tili: Grammatika va Imlo", "slug": "ona-tili-grammatika", "icon": "BookOpen", "description": "Fonetika, morfologiya, kelishiklar, gap bo'laklari va to'g'ri yozish qoidalari."},
            {"_id": top_adabiyot_mumtoz, "category_id": cat_onatili_id, "name": "Mumtoz Adabiyot (Navoiy va Bobur)", "slug": "adabiyot-mumtoz", "icon": "Feather", "description": "Alisher Navoiy, Zahriddin Muhammad Bobur, 'Xamsa', g'azallar va dostonlar."},
            {"_id": top_adabiyot_zamonaviy, "category_id": cat_onatili_id, "name": "Yangi O'zbek Adabiyoti (Jadidlar)", "slug": "adabiyot-zamonaviy", "icon": "BookMarked", "description": "Abdulla Qodiriy, Cho'lpon, Fitrat, Oybek, Abdulla Qahhor va O'tkir Hoshimov asarlari."},

            {"_id": top_uzbtarix_temur, "category_id": cat_uzbtarix_id, "name": "Amir Temur va Temuriylar davri", "slug": "uzbtarix-temur", "icon": "Shield", "description": "Amir Temur saltanati, yurishlar, Temur tuzuklari, Mirzo Ulug'bek va temuriy renessans."},
            {"_id": top_uzbtarix_qadimgi, "category_id": cat_uzbtarix_id, "name": "Qadimgi Turon va Xorazm", "slug": "uzbtarix-qadimgi", "icon": "Landmark", "description": "So'g'diyona, Baqtriya, Ko'hna Xorazm, Zardushtiylik va Avesto davri."},
            {"_id": top_uzbtarix_yangi, "category_id": cat_uzbtarix_id, "name": "Mustaqil O'zbekiston Tarixi", "slug": "uzbtarix-yangi", "icon": "Flag", "description": "O'zbekistonning mustaqillikka erishuvi, konstitutsiya, islohotlar va xalqaro nufuzi."},

            {"_id": top_jahon_qadimgi, "category_id": cat_jahontarix_id, "name": "Qadimgi Dunyo va Rim Imperiyasi", "slug": "jahon-qadimgi", "icon": "Columns", "description": "Qadimgi Misr, Bobil, Yunoniston polislari va Qadimgi Rim tarixi."},
            {"_id": top_jahon_zamonaviy, "category_id": cat_jahontarix_id, "name": "Yangi va Eng Yangi Jahon Tarixi", "slug": "jahon-zamonaviy", "icon": "Globe", "description": "Birinchi va Ikkinchi jahon urushlari, BMT, sovuq urush va XXI asr xalqaro munosabatlari."},

            {"_id": top_matem_arifmetika, "category_id": cat_matem_uz_id, "name": "Arifmetika va Sonlar (1-daraja: Juda oson)", "slug": "matem-arifmetika", "icon": "Plus", "description": "Qo'shish, ayirish, ko'paytirish, bo'lish, karra jadvali va oddiy hisob-kitoblar."},
            {"_id": top_matem_algebra, "category_id": cat_matem_uz_id, "name": "Algebra va Tenglamalar (2-daraja: Oson)", "slug": "matem-algebra", "icon": "Variable", "description": "Chiziqli tenglamalar, foizlar, oddiy va o'nli kasrlar, proporsiya."},
            {"_id": top_matem_geometriya, "category_id": cat_matem_uz_id, "name": "Geometriya va Planimetriya (3-daraja: O'rtacha)", "slug": "matem-geometriya", "icon": "Triangle", "description": "Uchburchaklar, kvadrat tenglamalar, Pifagor teoremasi, perimetr va yuzalar."},
            {"_id": top_matem_oliy, "category_id": cat_matem_uz_id, "name": "Trigonometriya va Oliy Matematika (4-5 daraja)", "slug": "matem-oliy", "icon": "TrendingUp", "description": "Sinus, kosinus, logarifmlar, hosilalar, integrallar va kombinatorika."},

            {"_id": top_rus_grammatika, "category_id": cat_rus_id, "name": "Русский язык: Грамматика и Литература", "slug": "rus-grammatika", "icon": "BookOpen", "description": "Словарный запас, части речи, пунктуация и русская классика."}
        ]
        for nt in new_topics:
            await topics_col.update_one({"_id": nt["_id"]}, {"$set": nt}, upsert=True)

        # Questions Dataset
        uz_questions = [
            # --- IT & Programming: Python & Backend ---
            {
                "category_id": cat_it_id,
                "topic_id": ObjectId("670e20000000000000000001"),
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "In Python 3.12, what is the key difference between asyncio.gather and asyncio.wait?",
                "options": [
                    {"id": "A", "text": "gather returns results preserving input order, while wait returns done/pending sets"},
                    {"id": "B", "text": "gather runs threads while wait runs processes"},
                    {"id": "C", "text": "gather is deprecated in Python 3.12"},
                    {"id": "D", "text": "wait cannot handle timeouts"}
                ],
                "correct_answer": "A",
                "explanation": "asyncio.gather preserves the sequential ordering of returned values corresponding to input futures.",
                "why_correct": "gather guarantees deterministic result index matching input arguments.",
                "why_user_incorrect": "asyncio operates on event loops, not OS threads or processes by default.",
                "learning_notes": "Use return_exceptions=True in gather to prevent one task from cancelling the aggregate.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_it_id,
                "topic_id": ObjectId("670e20000000000000000001"),
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Which Python decorator is used in FastAPI to define an asynchronous dependency injection provider?",
                "options": [
                    {"id": "A", "text": "Depends"},
                    {"id": "B", "text": "@inject"},
                    {"id": "C", "text": "@provider"},
                    {"id": "D", "text": "@middleware"}
                ],
                "correct_answer": "A",
                "explanation": "FastAPI uses fastapi.Depends to declare sub-dependencies and shared state across path operations.",
                "why_correct": "Depends cleanly manages dependency lifetimes and request context.",
                "why_user_incorrect": "@inject is used in external libraries like dependency-injector.",
                "learning_notes": "Dependencies can yield to support teardown execution.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_it_id,
                "topic_id": ObjectId("670e20000000000000000001"),
                "difficulty": "hard",
                "type": "multiple_choice",
                "stem": "How does Python's GIL (Global Interpreter Lock) impact CPU-bound multi-threaded programs in CPython 3.12?",
                "options": [
                    {"id": "A", "text": "It restricts bytecode execution to one native thread at a time per interpreter"},
                    {"id": "B", "text": "It doubles CPU execution speed by auto-vectorizing threads"},
                    {"id": "C", "text": "It eliminates the need for locks in user code completely"},
                    {"id": "D", "text": "It forces all I/O operations to be synchronous"}
                ],
                "correct_answer": "A",
                "explanation": "CPython's GIL ensures thread safety by permitting only one thread to execute Python bytecode at any moment.",
                "why_correct": "CPU-bound tasks require multiprocessing or subinterpreters to achieve parallel scaling in CPython.",
                "why_user_incorrect": "GIL only locks bytecode evaluation, not user data structures during race conditions.",
                "learning_notes": "PEP 703 introduces experimental free-threaded CPython.",
                "is_approved": True,
                "created_at": now
            },
            # --- Ona tili: Grammatika ---
            {
                "category_id": cat_onatili_id,
                "topic_id": top_onatili_grammatika,
                "difficulty": "very_easy",
                "type": "multiple_choice",
                "stem": "O'zbek tilida nechta unli tovush mavjud?",
                "options": [
                    {"id": "A", "text": "6 ta"},
                    {"id": "B", "text": "10 ta"},
                    {"id": "C", "text": "8 ta"},
                    {"id": "D", "text": "4 ta"}
                ],
                "correct_answer": "A",
                "explanation": "O'zbek adabiy tilida 6 ta unli fonema mavjud: a, o, i, u, o', e.",
                "why_correct": "O'zbek tili fonetikasiga ko'ra unlilar soni qat'iy 6 tani tashkil etadi.",
                "why_user_incorrect": "Boshqa raqamlar rus tili yoki kirill alifbosi harflari bilan adashtirilgan.",
                "learning_notes": "Unlilar: [a], [o], [i], [u], [o'], [e].",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_onatili_id,
                "topic_id": top_onatili_grammatika,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Qaratqich kelishigining qo'shimchasi qaysi javobda to'g'ri ko'rsatilgan?",
                "options": [
                    {"id": "A", "text": "-ning"},
                    {"id": "B", "text": "-ni"},
                    {"id": "C", "text": "-ga"},
                    {"id": "D", "text": "-da"}
                ],
                "correct_answer": "A",
                "explanation": "Qaratqich kelishigi '-ning' qo'shimchasi orqali hosil bo'ladi va 'kimning?', 'nimaning?' so'roqlariga javob beradi.",
                "why_correct": "-ning qo'shimchasi predmetning kimga yoki nimaga qarashli ekanligini ifodalaydi.",
                "why_user_incorrect": "-ni tushum, -ga jo'nalish, -da esa o'rin-payt kelishigi qo'shimchasidir.",
                "learning_notes": "O'zbek tilida 6 ta kelishik bor: Bosh, Qaratqich (-ning), Tushum (-ni), Jo'nalish (-ga), O'rin-payt (-da), Chiqish (-dan).",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_onatili_id,
                "topic_id": top_onatili_grammatika,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "Qaysi so'z imlo qoidasiga ko'ra xato yozilgan?",
                "options": [
                    {"id": "A", "text": "Muvofiq"},
                    {"id": "B", "text": "Muvaffaqiyat"},
                    {"id": "C", "text": "Taajub"},
                    {"id": "D", "text": "Tafakkur"}
                ],
                "correct_answer": "C",
                "explanation": "'Taajjub' so'zi ikkita 'j' harfi bilan yozilishi shart: taajjub.",
                "why_correct": "To'g'ri yozilishi 'taajjub' shaklida bo'ladi.",
                "why_user_incorrect": "'Muvofiq', 'muvaffaqiyat' va 'tafakkur' so'zlari to'liq imlo me'yorlariga mos.",
                "learning_notes": "Ikkilangan undoshlar (geminata) talaffuz va yozuvda e'tibor talab qiladi.",
                "is_approved": True,
                "created_at": now
            },
            # --- Adabiyot ---
            {
                "category_id": cat_onatili_id,
                "topic_id": top_adabiyot_mumtoz,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Alisher Navoiyning 'Xamsa' asariga kirmaydigan doston qaysi?",
                "options": [
                    {"id": "A", "text": "Lison ut-tayr"},
                    {"id": "B", "text": "Hayrat ul-abror"},
                    {"id": "C", "text": "Farhod va Shirin"},
                    {"id": "D", "text": "Sab'ai sayyor"}
                ],
                "correct_answer": "A",
                "explanation": "'Lison ut-tayr' Navoiyning falsafiy dostoni bo'lib, 'Xamsa' tarkibiga kirmaydi.",
                "why_correct": "Xamsa dostonlari: Hayrat ul-abror, Farhod va Shirin, Layli va Majnun, Sab'ai sayyor, Saddi Iskandariy.",
                "why_user_incorrect": "Boshqa barcha variantlar Xamsa tarkibidagi besh doston qatoriga kiradi.",
                "learning_notes": "Xamsa 1483-1485 yillarda turkiy tilda yaratilgan.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_onatili_id,
                "topic_id": top_adabiyot_zamonaviy,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "O'zbek adabiyotidagi ilk realistik roman qaysi asar hisoblanadi?",
                "options": [
                    {"id": "A", "text": "O'tkan kunlar (Abdulla Qodiriy)"},
                    {"id": "B", "text": "Kecha va kunduz (Cho'lpon)"},
                    {"id": "C", "text": "Navoiy (Oybek)"},
                    {"id": "D", "text": "Sarob (Abdulla Qahhor)"}
                ],
                "correct_answer": "A",
                "explanation": "Abdulla Qodiriy 1922-yilda yozib tugatgan 'O'tkan kunlar' o'zbek adabiyotidagi birinchi romandir.",
                "why_correct": "'O'tkan kunlar' asari yangi o'zbek romanchiligiga asos solgan shoh asardir.",
                "why_user_incorrect": "Cho'lponning 'Kecha va kunduz' romani 1936-yilda nashr etilgan bo'lib, keyingi davrga tegishli.",
                "learning_notes": "Qahramonlari: Otabek, Kumushbibi, Zaynab, Homid.",
                "is_approved": True,
                "created_at": now
            },
            # --- O'zbekiston Tarixi ---
            {
                "category_id": cat_uzbtarix_id,
                "topic_id": top_uzbtarix_temur,
                "difficulty": "very_easy",
                "type": "multiple_choice",
                "stem": "Amir Temur davlatining poytaxti qaysi shahar bo'lgan?",
                "options": [
                    {"id": "A", "text": "Samarqand"},
                    {"id": "B", "text": "Buxoro"},
                    {"id": "C", "text": "Toshkent"},
                    {"id": "D", "text": "Hirot"}
                ],
                "correct_answer": "A",
                "explanation": "Amir Temur 1370-yilda hokimiyat tepasiga kelgach, Samarqand shahrini o'z saltanatining poytaxti deb e'lon qilgan.",
                "why_correct": "Samarqand Amir Temur davrida dunyoning eng go'zal va qudratli shaharlaridan biriga aylantirilgan.",
                "why_user_incorrect": "Hirot Shohrux Mirzo davrida poytaxt bo'lgan, Buxoro esa xonlik davrida poytaxt bo'lgan.",
                "learning_notes": "Amir Temur shiori: 'Kuch — adolatdadir'.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_uzbtarix_id,
                "topic_id": top_uzbtarix_temur,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "Amir Temur qaysi jangda Usmonli turk sultoni Boyazid I Yildirimni mag'lubiyatga uchratgan?",
                "options": [
                    {"id": "A", "text": "Anqara jangi (1402-yil)"},
                    {"id": "B", "text": "Kondurcha jangi (1391-yil)"},
                    {"id": "C", "text": "Loy jangi (1365-yil)"},
                    {"id": "D", "text": "Terek daryosi bo'yidagi jang (1395-yil)"}
                ],
                "correct_answer": "A",
                "explanation": "1402-yil 20-iyulda Anqara yaqinida bo'lib o'tgan buyuk jangda Amir Temur g'alaba qozongan.",
                "why_correct": "Anqara jangi Yevropaning Usmonli imperiyasi tomonidan zabt etilishini 50 yilga kechiktirgan.",
                "why_user_incorrect": "Kondurcha va Terek janglari To'xtamishxonga qarshi bo'lgan.",
                "learning_notes": "Amir Temur harbiy san'atda yengilmas sarkarda sifatida tarixda qolgan.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_uzbtarix_id,
                "topic_id": top_uzbtarix_yangi,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "O'zbekiston Respublikasining davlat mustaqilligi qachon e'lon qilingan?",
                "options": [
                    {"id": "A", "text": "1991-yil 31-avgust"},
                    {"id": "B", "text": "1992-yil 8-dekabr"},
                    {"id": "C", "text": "1990-yil 20-iyun"},
                    {"id": "D", "text": "1991-yil 1-sentabr"}
                ],
                "correct_answer": "A",
                "explanation": "1991-yil 31-avgustda Oliy Kengashning navbatdan tashqari sessiyasida O'zbekistonning davlat mustaqilligi e'lon qilingan.",
                "why_correct": "1-sentabr esa Mustaqillik bayrami kuni sifatida nishonlanadi.",
                "why_user_incorrect": "1992-yil 8-dekabrda Konstitutsiya qabul qilingan.",
                "learning_notes": "O'zbekiston BMTga 1992-yil 2-martda a'zo bo'lgan.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_uzbtarix_id,
                "topic_id": top_uzbtarix_qadimgi,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Qadimgi Turon xalqlarining muqaddas diniy va yozma yodgorligi qaysi manba hisoblanadi?",
                "options": [
                    {"id": "A", "text": "Avesto kitobi"},
                    {"id": "B", "text": "Behistun yozuvlari"},
                    {"id": "C", "text": "O'rxun-Enasoy bitiklari"},
                    {"id": "D", "text": "Qutadg'u bilig"}
                ],
                "correct_answer": "A",
                "explanation": "Zardushtiylik dinining muqaddas kitobi 'Avesto' Turon zaminida yaratilgan eng qadimgi manbadir.",
                "why_correct": "Avesto miloddan avvalgi 1-ming yillik boshlarida shakllangan.",
                "why_user_incorrect": "Behistun qoyatosh yozuvlari Eron shohi Doro I buyrug'i bilan yozilgan.",
                "learning_notes": "Avestoning eng qadimiy qismi 'Gatlar' Zardusht tomonidan aytilgan deb hisoblanadi.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_uzbtarix_id,
                "topic_id": top_uzbtarix_qadimgi,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "Massagetlar malikasi To'maris Eron shohi Kir II ning bosqinchi qo'shinini qachon tor-mor keltirgan?",
                "options": [
                    {"id": "A", "text": "Miloddan avvalgi 530-yilda"},
                    {"id": "B", "text": "Miloddan avvalgi 329-yilda"},
                    {"id": "C", "text": "Miloddan avvalgi 522-yilda"},
                    {"id": "D", "text": "Milodiy 120-yilda"}
                ],
                "correct_answer": "A",
                "explanation": "Miloddan avvalgi 530-yilda To'maris jasorati tufayli forslar shohi Kir II ning qo'shini butunlay mag'lub etilgan.",
                "why_correct": "Ushbu mashhur jang Gerodotning 'Tarix' asarida batafsil yoritilgan.",
                "why_user_incorrect": "Miloddan avvalgi 329-yilda Makedoniyalik Iskandar O'rta Osiyoga bostirib kirgan.",
                "learning_notes": "To'maris jasorati vatanparvarlik va ozodlik kurashining buyuk timsoli sanaladi.",
                "is_approved": True,
                "created_at": now
            },
            # --- Jahon Tarixi ---
            {
                "category_id": cat_jahontarix_id,
                "topic_id": top_jahon_qadimgi,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Qadimgi Misr podsholari qanday unvon bilan atalgan?",
                "options": [
                    {"id": "A", "text": "Fir'avn"},
                    {"id": "B", "text": "Sezar"},
                    {"id": "C", "text": "Xoqon"},
                    {"id": "D", "text": "Imperator"}
                ],
                "correct_answer": "A",
                "explanation": "Qadimgi Misrda oliy hukmdorlar Fir'avn (Pharaoh) deb atalgan.",
                "why_correct": "Fir'avn so'zi 'katta uy' ma'nosini berib, shoh hokimiyatini ifodalagan.",
                "why_user_incorrect": "Sezar Rimda, Xoqon turkiy davlatlarda qo'llanilgan.",
                "learning_notes": "Mashhur fir'avnlar: Ramses II, Tutanxamon, Xufu (Xeops).",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_jahontarix_id,
                "topic_id": top_jahon_zamonaviy,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Birlashgan Millatlar Tashkiloti (BMT) rasman qaysi yili tashkil topgan?",
                "options": [
                    {"id": "A", "text": "1945-yilda"},
                    {"id": "B", "text": "1919-yilda"},
                    {"id": "C", "text": "1939-yilda"},
                    {"id": "D", "text": "1955-yilda"}
                ],
                "correct_answer": "A",
                "explanation": "Ikkinchi jahon urushidan so'ng, 1945-yil 24-oktabrda San-Fransiskoda BMT ustavi kuchga kirgan.",
                "why_correct": "24-oktabr har yili Xalqaro BMT kuni sifatida nishonlanadi.",
                "why_user_incorrect": "1919-yilda Millatlar Ligasi tuzilgan bo'lib, keyinchalik o'z faoliyatini to'xtatgan.",
                "learning_notes": "BMTning bosh qarorgohi AQSHning Nyu-York shahrida joylashgan.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_jahontarix_id,
                "topic_id": top_jahon_zamonaviy,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "Birinchi jahon urushi qaysi yillarda bo'lib o'tgan?",
                "options": [
                    {"id": "A", "text": "1914 – 1918 yillarda"},
                    {"id": "B", "text": "1939 – 1945 yillarda"},
                    {"id": "C", "text": "1905 – 1907 yillarda"},
                    {"id": "D", "text": "1917 – 1922 yillarda"}
                ],
                "correct_answer": "A",
                "explanation": "Birinchi jahon urushi 1914-yil 28-iyuldan 1918-yil 11-noyabrgacha davom etgan.",
                "why_correct": "Urush Kompyen sulhi bilan yakunlangan.",
                "why_user_incorrect": "1939–1945 yillarda esa Ikkinchi jahon urushi bo'lib o'tgan.",
                "learning_notes": "Urush Antanta va Uchlar ittifoqi o'rtasida global miqyosda kechgan.",
                "is_approved": True,
                "created_at": now
            },
            # --- Matematika (Moslashuvchan & 5 Daraja) ---
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_arifmetika,
                "difficulty": "very_easy",
                "type": "multiple_choice",
                "stem": "Hisoblang: 48 + 37 nimaga teng?",
                "options": [
                    {"id": "A", "text": "85"},
                    {"id": "B", "text": "75"},
                    {"id": "C", "text": "95"},
                    {"id": "D", "text": "81"}
                ],
                "correct_answer": "A",
                "explanation": "48 + 37 = (48 + 30) + 7 = 78 + 7 = 85.",
                "why_correct": "Oddiy arifmetik qo'shish qoidasiga ko'ra yig'indi 85 ga teng.",
                "why_user_incorrect": "O'nlikdan o'tishda xatolik qilingan.",
                "learning_notes": "Boshlang'ich arifmetik amallar aniqlikni talab qiladi.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_arifmetika,
                "difficulty": "very_easy",
                "type": "multiple_choice",
                "stem": "Hisoblang: 14 * 6 nimaga teng?",
                "options": [
                    {"id": "A", "text": "84"},
                    {"id": "B", "text": "74"},
                    {"id": "C", "text": "94"},
                    {"id": "D", "text": "86"}
                ],
                "correct_answer": "A",
                "explanation": "14 * 6 = (10 * 6) + (4 * 6) = 60 + 24 = 84.",
                "why_correct": "Ko'paytirish jadvali qoidasi bo'yicha javob 84.",
                "why_user_incorrect": "Boshqa variantlar noto'g'ri ko'paytirish oqibatidir.",
                "learning_notes": "Ko'paytirishning taqsimot qonuni: (a + b) * c = a*c + b*c.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_algebra,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "350 sonining 20 foizini (20%) toping.",
                "options": [
                    {"id": "A", "text": "70"},
                    {"id": "B", "text": "35"},
                    {"id": "C", "text": "50"},
                    {"id": "D", "text": "80"}
                ],
                "correct_answer": "A",
                "explanation": "350 * (20 / 100) = 350 * 0.2 = 70.",
                "why_correct": "20% sonning beshdan bir qismiga teng: 350 / 5 = 70.",
                "why_user_incorrect": "35 soni 10% ga teng, 70 esa 20% ga to'g'ri keladi.",
                "learning_notes": "Sonning p foizini topish uchun sonni p ga ko'paytirib 100 ga bo'lamiz.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_algebra,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "Tenglamani yeching: 5x - 15 = 35. x ning qiymati nechaga teng?",
                "options": [
                    {"id": "A", "text": "10"},
                    {"id": "B", "text": "8"},
                    {"id": "C", "text": "12"},
                    {"id": "D", "text": "7"}
                ],
                "correct_answer": "A",
                "explanation": "5x = 35 + 15 => 5x = 50 => x = 10.",
                "why_correct": "Tekshirish: 5 * 10 - 15 = 50 - 15 = 35.",
                "why_user_incorrect": "Tenglamaning o'ng tomoniga sonni ishorasini teskari qilib o'tkazish kerak.",
                "learning_notes": "Chiziqli tenglamalarda ozod sonlar o'ng tomonga qarama-qarshi ishora bilan o'tadi.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_geometriya,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "Kvadrat tenglamaning ildizlarini toping: x² - 7x + 12 = 0.",
                "options": [
                    {"id": "A", "text": "x1 = 3, x2 = 4"},
                    {"id": "B", "text": "x1 = 2, x2 = 6"},
                    {"id": "C", "text": "x1 = -3, x2 = -4"},
                    {"id": "D", "text": "x1 = 1, x2 = 12"}
                ],
                "correct_answer": "A",
                "explanation": "Viyet teoremasiga ko'ra: x1 + x2 = 7, x1 * x2 = 12. Demak, 3 va 4.",
                "why_correct": "Diskriminant D = 49 - 48 = 1. x = (7 ± 1) / 2 => x1 = 4, x2 = 3.",
                "why_user_incorrect": "-3 va -4 yig'indisi -7 bo'ladi, bizda esa +7 bo'lishi kerak.",
                "learning_notes": "Keltirilgan kvadrat tenglamada Viyet teoremasi: x1 + x2 = -p, x1 * x2 = q.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_geometriya,
                "difficulty": "medium",
                "type": "multiple_choice",
                "stem": "To'g'ri burchakli uchburchakning katetlari a = 6 sm va b = 8 sm bo'lsa, uning gipotenuzasi (c) necha sm?",
                "options": [
                    {"id": "A", "text": "10 sm"},
                    {"id": "B", "text": "12 sm"},
                    {"id": "C", "text": "14 sm"},
                    {"id": "D", "text": "9 sm"}
                ],
                "correct_answer": "A",
                "explanation": "Pifagor teoremasiga ko'ra: c² = a² + b² = 6² + 8² = 36 + 64 = 100. c = √100 = 10 sm.",
                "why_correct": "Misr uchburchagi qoidasi (3:4:5 nisbat): 6, 8, 10.",
                "why_user_incorrect": "Katetlar kvadratlari yig'indisidan ildiz chiqarish lozim.",
                "learning_notes": "Pifagor teoremasi: to'g'ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig'indisiga teng.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_oliy,
                "difficulty": "hard",
                "type": "multiple_choice",
                "stem": "Hisoblang: log₂ 64 ning qiymati nechaga teng?",
                "options": [
                    {"id": "A", "text": "6"},
                    {"id": "B", "text": "5"},
                    {"id": "C", "text": "8"},
                    {"id": "D", "text": "32"}
                ],
                "correct_answer": "A",
                "explanation": "2 ning nechanchi darajasi 64 ga teng? 2⁶ = 64. Shuning uchun log₂ 64 = 6.",
                "why_correct": "Logarifm ta'rifiga ko'ra a^c = b bo'lsa, log_a b = c bo'ladi.",
                "why_user_incorrect": "2⁵ = 32, 2⁶ = 64.",
                "learning_notes": "Logarifm — berilgan asosni kerakli songa yetkazish uchun kerak bo'lgan daraja ko'rsatkichidir.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_oliy,
                "difficulty": "hard",
                "type": "multiple_choice",
                "stem": "Trigonometrik ifodaning qiymatini toping: sin²(42°) + cos²(42°) + cos(60°).",
                "options": [
                    {"id": "A", "text": "1.5"},
                    {"id": "B", "text": "1.0"},
                    {"id": "C", "text": "2.0"},
                    {"id": "D", "text": "0.5"}
                ],
                "correct_answer": "A",
                "explanation": "Asosiy trigonometrik ayniyat bo'yicha: sin²α + cos²α = 1. cos(60°) = 0.5. Demak, 1 + 0.5 = 1.5.",
                "why_correct": "sin²(42°) + cos²(42°) = 1 ayniyati har qanday burchak uchun o'rinli.",
                "why_user_incorrect": "cos(60°) = 1/2 qiymatini yodda tutish lozim.",
                "learning_notes": "Asosiy ayniyat: sin² x + cos² x = 1.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_oliy,
                "difficulty": "very_hard",
                "type": "multiple_choice",
                "stem": "Hosilani hisoblang: f(x) = 2x³ - 6x² + 5x - 7 funksiyaning x = 1 dagi hosilasi f'(1) nimaga teng?",
                "options": [
                    {"id": "A", "text": "-1"},
                    {"id": "B", "text": "5"},
                    {"id": "C", "text": "0"},
                    {"id": "D", "text": "-7"}
                ],
                "correct_answer": "A",
                "explanation": "f'(x) = 6x² - 12x + 5. x = 1 qo'ysak: f'(1) = 6(1) - 12(1) + 5 = 6 - 12 + 5 = -1.",
                "why_correct": "(xⁿ)' = n*xⁿ⁻¹ differensiallash qoidasi to'g'ri tatbiq etilgan.",
                "why_user_incorrect": "Doimiy sonning hosilasi 0 ga teng: (-7)' = 0.",
                "learning_notes": "Funksiyaning hosilasi o'zgarish tezligini ko'rsatadi.",
                "is_approved": True,
                "created_at": now
            },
            {
                "category_id": cat_matem_uz_id,
                "topic_id": top_matem_oliy,
                "difficulty": "very_hard",
                "type": "multiple_choice",
                "stem": "Aniq integralni hisoblang: ∫₀² (3x²) dx nimaga teng?",
                "options": [
                    {"id": "A", "text": "8"},
                    {"id": "B", "text": "12"},
                    {"id": "C", "text": "6"},
                    {"id": "D", "text": "24"}
                ],
                "correct_answer": "A",
                "explanation": "Boshlang'ich funksiya F(x) = x³. Nyuton-Leybnits formulasi: F(2) - F(0) = 2³ - 0³ = 8.",
                "why_correct": "∫ 3x² dx = x³ bo'lib, chegaralari 0 dan 2 gacha olinganda 2³ = 8 chiqadi.",
                "why_user_incorrect": "Boshlang'ich funksiyani topishda ko'paytuvchini integrallash qoidasi: ∫ x² dx = x³/3.",
                "learning_notes": "Nyuton-Leybnits formulasi: ∫ₐᵇ f(x)dx = F(b) - F(a).",
                "is_approved": True,
                "created_at": now
            },
            # --- Rus tili ---
            {
                "category_id": cat_rus_id,
                "topic_id": top_rus_grammatika,
                "difficulty": "easy",
                "type": "multiple_choice",
                "stem": "В каком слове пишется буква 'О'?",
                "options": [
                    {"id": "A", "text": "Шорох"},
                    {"id": "B", "text": "Шёпот"},
                    {"id": "C", "text": "Жёлтый"},
                    {"id": "D", "text": "Щёлкать"}
                ],
                "correct_answer": "A",
                "explanation": "В корне слова 'шорох' пишется 'о' (слово-исключение под ударением после шипящих).",
                "why_correct": "Слова 'шёпот' (шептать), 'жёлтый' (желтеть) проверяются однокоренными словами с 'е'.",
                "why_user_incorrect": "Остальные слова пишутся через 'ё'.",
                "learning_notes": "После шипящих под ударением в корне пишется 'ё', если есть чередование с 'е'.",
                "is_approved": True,
                "created_at": now
            }
        ]

        await questions_col.insert_many(uz_questions)
        logger.info(f"✅ Successfully seeded {len(uz_questions)} rich multilingual questions in Uzbek, Russian & Mathematics!")

    # 3. Always ensure achievements and daily quests are seeded
    achievements_seed = [
        {"code": "first_quiz", "name": "First Step", "description": "Complete your very first quiz on Quizora.", "icon": "Rocket", "category": "Milestone", "xp_reward": 50, "coin_reward": 0},
        {"code": "quiz_10", "name": "Tenfold Learner", "description": "Successfully complete 10 full quizzes.", "icon": "Trophy", "category": "Dedication", "xp_reward": 150, "coin_reward": 10},
        {"code": "correct_100", "name": "Centurion Mind", "description": "Answer 100 questions correctly across all subjects.", "icon": "CheckCircle2", "category": "Mastery", "xp_reward": 250, "coin_reward": 15},
        {"code": "streak_7", "name": "Unstoppable Momentum", "description": "Maintain a 7-day daily learning streak.", "icon": "Flame", "category": "Discipline", "xp_reward": 300, "coin_reward": 20},
        {"code": "perfect_score", "name": "Flawless Execution", "description": "Score 100% on any timed quiz and earn ranking coins.", "icon": "Star", "category": "Excellence", "xp_reward": 200, "coin_reward": 10},
        {"code": "clever_champion", "name": "Clever", "description": "Top 1st place in the Monthly Leaderboard Tournament (5 Stars).", "icon": "Crown", "category": "Hall of Fame", "xp_reward": 1000, "coin_reward": 900}
    ]
    for ach in achievements_seed:
        await achievements_col.update_one({"code": ach["code"]}, {"$set": ach}, upsert=True)

    quests_seed = [
        {"code": "complete_2_quizzes", "title": "Complete 2 Quizzes", "description": "Take and complete any two quizzes today.", "target": 2, "xp_reward": 50, "coin_reward": 5, "is_active": True},
        {"code": "score_80_percent", "title": "High Scorer", "description": "Achieve at least 80% accuracy on a quiz.", "target": 1, "xp_reward": 40, "coin_reward": 3, "is_active": True},
        {"code": "discipline_tasks_3", "title": "Daily Discipline", "description": "Complete 3 discipline tasks on your planner.", "target": 3, "xp_reward": 30, "coin_reward": 2, "is_active": True},
        {"code": "answer_15_correct", "title": "Accuracy Surge", "description": "Answer 15 total questions correctly today.", "target": 15, "xp_reward": 60, "coin_reward": 5, "is_active": True}
    ]
    for q in quests_seed:
        await quests_col.update_one({"code": q["code"]}, {"$set": q}, upsert=True)

    logger.info("Database seeding check complete!")
