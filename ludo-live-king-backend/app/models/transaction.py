"""Transaction model for coin/gem operations."""
import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False)  # credit, debit
    category = Column(String(30), nullable=False)  # game_win, game_entry, purchase, bonus, admin, daily_reward
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), default="coins")  # coins, gems
    balance_after = Column(Integer, nullable=False)
    description = Column(String(500), nullable=True)
    reference_id = Column(String(100), nullable=True)  # game_id or purchase_id
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "category": self.category,
            "amount": self.amount,
            "currency": self.currency,
            "balance_after": self.balance_after,
            "description": self.description,
            "reference_id": self.reference_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
