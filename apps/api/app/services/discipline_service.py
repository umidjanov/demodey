from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException
from app.core.database import db_manager
from app.schemas.discipline_schemas import (
    DisciplineDayProgress,
    DisciplineStatsResponse,
    DisciplineTaskCreate,
    DisciplineTaskResponse,
    DisciplineTaskUpdate,
)


class DisciplineService:
    def _tasks_col(self):
        return db_manager.get_collection("discipline_tasks")

    async def get_discipline_stats(self, user_id: ObjectId, date_str: Optional[str] = None) -> DisciplineStatsResponse:
        tasks_col = self._tasks_col()
        today_date = date_str or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Fetch tasks for specified day
        today_tasks_raw = await tasks_col.find({
            "user_id": user_id,
            "due_date": today_date
        }).sort("created_at", 1).to_list(100)

        tasks_list = [
            DisciplineTaskResponse(
                id=str(t["_id"]),
                user_id=str(t["user_id"]),
                title=t["title"],
                description=t.get("description"),
                priority=t.get("priority", "medium"),
                due_date=t["due_date"],
                due_time=t.get("due_time"),
                is_recurring=t.get("is_recurring", False),
                is_completed=t.get("is_completed", False),
                completed_at=t.get("completed_at"),
                created_at=t.get("created_at", datetime.now(timezone.utc))
            )
            for t in today_tasks_raw
        ]

        today_total = len(tasks_list)
        today_completed = sum(1 for t in tasks_list if t.is_completed)
        today_pct = round((today_completed / today_total) * 100.0, 1) if today_total > 0 else 0.0

        # Build past 7 days progress history
        weekly_history: List[DisciplineDayProgress] = []
        base_date = datetime.strptime(today_date, "%Y-%m-%d")
        for i in range(6, -1, -1):
            day_str = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
            day_tasks = await tasks_col.find({
                "user_id": user_id,
                "due_date": day_str
            }).to_list(50)
            d_total = len(day_tasks)
            d_comp = sum(1 for t in day_tasks if t.get("is_completed", False))
            d_pct = round((d_comp / d_total) * 100.0, 1) if d_total > 0 else (100.0 if d_comp > 0 else 0.0)
            weekly_history.append(
                DisciplineDayProgress(
                    date=day_str,
                    total_tasks=d_total,
                    completed_tasks=d_comp,
                    percentage=d_pct
                )
            )

        return DisciplineStatsResponse(
            today_date=today_date,
            today_total=today_total,
            today_completed=today_completed,
            today_percentage=today_pct,
            current_streak=5,
            weekly_history=weekly_history,
            tasks=tasks_list
        )

    async def create_task(self, user_id: ObjectId, req: DisciplineTaskCreate) -> DisciplineTaskResponse:
        tasks_col = self._tasks_col()
        now = datetime.now(timezone.utc)

        doc = {
            "user_id": user_id,
            "title": req.title.strip(),
            "description": req.description.strip() if req.description else None,
            "priority": req.priority,
            "due_date": req.due_date,
            "due_time": req.due_time,
            "is_recurring": req.is_recurring,
            "is_completed": False,
            "completed_at": None,
            "created_at": now
        }
        res = await tasks_col.insert_one(doc)

        return DisciplineTaskResponse(
            id=str(res.inserted_id),
            user_id=str(user_id),
            title=doc["title"],
            description=doc["description"],
            priority=doc["priority"],
            due_date=doc["due_date"],
            due_time=doc["due_time"],
            is_recurring=doc["is_recurring"],
            is_completed=False,
            completed_at=None,
            created_at=now
        )

    async def toggle_task(self, user_id: ObjectId, task_id_str: str) -> DisciplineTaskResponse:
        tasks_col = self._tasks_col()
        t_id = ObjectId(task_id_str) if ObjectId.is_valid(task_id_str) else task_id_str

        task = await tasks_col.find_one({"_id": t_id, "user_id": user_id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")

        new_status = not task.get("is_completed", False)
        now = datetime.now(timezone.utc)
        completed_at = now if new_status else None

        await tasks_col.update_one(
            {"_id": t_id},
            {
                "$set": {
                    "is_completed": new_status,
                    "completed_at": completed_at
                }
            }
        )

        task["is_completed"] = new_status
        task["completed_at"] = completed_at

        return DisciplineTaskResponse(
            id=str(task["_id"]),
            user_id=str(user_id),
            title=task["title"],
            description=task.get("description"),
            priority=task.get("priority", "medium"),
            due_date=task["due_date"],
            due_time=task.get("due_time"),
            is_recurring=task.get("is_recurring", False),
            is_completed=new_status,
            completed_at=completed_at,
            created_at=task.get("created_at", now)
        )

    async def delete_task(self, user_id: ObjectId, task_id_str: str) -> Dict[str, Any]:
        tasks_col = self._tasks_col()
        t_id = ObjectId(task_id_str) if ObjectId.is_valid(task_id_str) else task_id_str
        await tasks_col.delete_one({"_id": t_id, "user_id": user_id})
        return {"status": "deleted", "id": task_id_str}


discipline_service = DisciplineService()
