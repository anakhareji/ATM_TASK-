from pydantic import BaseModel
from typing import Optional

class TaskSubmitRequest(BaseModel):
    submission_text: str
    file_url: Optional[str] = None
