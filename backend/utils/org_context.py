from fastapi import Header, HTTPException, status, Depends
from utils.security import get_current_user

def get_org_id(
    x_organization_id: int | None = Header(default=None, alias="X-Organization-ID"),
    current_user=Depends(get_current_user),
):
    org_id = current_user.get("org_id")
    if org_id is not None:
        return org_id
    if x_organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization context required"
        )
    return x_organization_id
