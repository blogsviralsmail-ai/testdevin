from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user
import json

router = APIRouter(prefix="/api/teams", tags=["teams"])


class CreateTeamRequest(BaseModel):
    name: str
    logo_url: str | None = None


class ChallengeRequest(BaseModel):
    opponent_team_id: int
    ground_id: int | None = None
    match_date: str | None = None
    match_time: str | None = None


@router.get("")
async def list_teams():
    with get_db() as db:
        rows = db.execute(
            "SELECT t.*, u.name as captain_name FROM teams t JOIN users u ON t.captain_id = u.id ORDER BY t.wins DESC"
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            member_ids = json.loads(d["members"]) if d["members"] else []
            # Resolve member names
            member_details = []
            for mid in member_ids:
                u = db.execute("SELECT id, name, phone FROM users WHERE id = ?", (mid,)).fetchone()
                if u:
                    member_details.append({"id": u["id"], "name": u["name"], "phone": u["phone"]})
                else:
                    member_details.append({"id": mid, "name": f"Player #{mid}", "phone": ""})
            d["members"] = member_ids
            d["member_details"] = member_details
            d["member_count"] = len(member_ids)
            result.append(d)
        return result


@router.post("")
async def create_team(req: CreateTeamRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        members = json.dumps([user["user_id"]])
        db.execute(
            "INSERT INTO teams (name, captain_id, logo_url, members) VALUES (?, ?, ?, ?)",
            (req.name, user["user_id"], req.logo_url, members),
        )
        return {"message": f"Team '{req.name}' created!"}


@router.post("/{team_id}/join")
async def join_team(team_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        team = db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        members = json.loads(team["members"]) if team["members"] else []
        if user["user_id"] in members:
            raise HTTPException(status_code=400, detail="Already in team")
        if len(members) >= 11:
            raise HTTPException(status_code=400, detail="Team is full (maximum 11 members allowed)")
        members.append(user["user_id"])
        db.execute("UPDATE teams SET members = ? WHERE id = ?", (json.dumps(members), team_id))
        return {"message": "Joined team"}


class AddMemberRequest(BaseModel):
    phone: str | None = None
    name: str | None = None


@router.post("/{team_id}/members")
async def add_team_member(team_id: int, req: AddMemberRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        team = db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team["captain_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Only captain can add members")
        # Support adding by name (creates a placeholder user) or by phone
        if req.name and not req.phone:
            # Add by name only - create placeholder user
            from app.seed import generate_ref_code
            ref_code = generate_ref_code()
            fake_phone = f"000{team_id}{len(json.loads(team['members']) if team['members'] else [])}{user['user_id']}"
            db.execute(
                "INSERT INTO users (name, phone, role, referral_code, wallet_balance) VALUES (?, ?, 'user', ?, 0)",
                (req.name, fake_phone, ref_code),
            )
            member = db.execute("SELECT id FROM users WHERE phone = ?", (fake_phone,)).fetchone()
        elif req.phone:
            member = db.execute("SELECT id FROM users WHERE phone = ?", (req.phone,)).fetchone()
            if not member:
                from app.seed import generate_ref_code
                ref_code = generate_ref_code()
                member_name = req.name or f"Player-{req.phone[-4:]}"
                db.execute(
                    "INSERT INTO users (name, phone, role, referral_code, wallet_balance) VALUES (?, ?, 'user', ?, 0)",
                    (member_name, req.phone, ref_code),
                )
                member = db.execute("SELECT id FROM users WHERE phone = ?", (req.phone,)).fetchone()
        else:
            raise HTTPException(status_code=400, detail="Provide name or phone")
        members = json.loads(team["members"]) if team["members"] else []
        if member["id"] in members:
            raise HTTPException(status_code=400, detail="Already in team")
        if len(members) >= 11:
            raise HTTPException(status_code=400, detail="Team is full (maximum 11 members allowed)")
        members.append(member["id"])
        db.execute("UPDATE teams SET members = ? WHERE id = ?", (json.dumps(members), team_id))
        return {"message": "Member added!"}


@router.get("/my-teams")
async def my_teams(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("SELECT t.*, u.name as captain_name FROM teams t JOIN users u ON t.captain_id = u.id").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            member_ids = json.loads(d["members"]) if d["members"] else []
            if user["user_id"] in member_ids or d["captain_id"] == user["user_id"]:
                # Resolve member names
                member_details = []
                for mid in member_ids:
                    u = db.execute("SELECT id, name, phone FROM users WHERE id = ?", (mid,)).fetchone()
                    if u:
                        member_details.append({"id": u["id"], "name": u["name"], "phone": u["phone"]})
                    else:
                        member_details.append({"id": mid, "name": f"Player #{mid}", "phone": ""})
                d["members"] = member_ids
                d["member_details"] = member_details
                d["member_count"] = len(member_ids)
                result.append(d)
        return result


@router.post("/challenge")
async def create_challenge(req: ChallengeRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        my_team = db.execute("SELECT * FROM teams WHERE captain_id = ?", (user["user_id"],)).fetchone()
        if not my_team:
            raise HTTPException(status_code=400, detail="You must be a team captain")
        opponent = db.execute("SELECT * FROM teams WHERE id = ?", (req.opponent_team_id,)).fetchone()
        if not opponent:
            raise HTTPException(status_code=404, detail="Opponent team not found")

        db.execute(
            "INSERT INTO challenges (challenger_team_id, opponent_team_id, ground_id, match_date, match_time) VALUES (?, ?, ?, ?, ?)",
            (my_team["id"], req.opponent_team_id, req.ground_id, req.match_date, req.match_time),
        )
        return {"message": f"Challenge sent to {opponent['name']}!"}


@router.get("/challenges")
async def my_challenges(user: dict = Depends(get_current_user)):
    with get_db() as db:
        my_teams = db.execute("SELECT id FROM teams WHERE captain_id = ?", (user["user_id"],)).fetchall()
        team_ids = [t["id"] for t in my_teams]
        if not team_ids:
            return []
        placeholders = ",".join("?" * len(team_ids))
        rows = db.execute(
            f"""SELECT c.*, t1.name as challenger_name, t2.name as opponent_name,
            g.name as ground_name FROM challenges c
            JOIN teams t1 ON c.challenger_team_id = t1.id
            JOIN teams t2 ON c.opponent_team_id = t2.id
            LEFT JOIN grounds g ON c.ground_id = g.id
            WHERE c.challenger_team_id IN ({placeholders}) OR c.opponent_team_id IN ({placeholders})
            ORDER BY c.created_at DESC""",
            team_ids + team_ids,
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/challenges/{challenge_id}/respond")
async def respond_challenge(challenge_id: int, accept: bool, user: dict = Depends(get_current_user)):
    with get_db() as db:
        challenge = db.execute("SELECT * FROM challenges WHERE id = ?", (challenge_id,)).fetchone()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        team = db.execute("SELECT * FROM teams WHERE id = ? AND captain_id = ?", (challenge["opponent_team_id"], user["user_id"])).fetchone()
        if not team:
            raise HTTPException(status_code=403, detail="Only opponent captain can respond")

        status = "accepted" if accept else "rejected"
        db.execute("UPDATE challenges SET status = ? WHERE id = ?", (status, challenge_id))
        return {"message": f"Challenge {status}"}
