import uvicorn
from fastapi import FastAPI

from leetcode_api.core.main.routers import router

if __name__ == "__main__":
    app = FastAPI()
    app.include_router(router)
    uvicorn.run(app=app, host="0.0.0.0", port=2010, reload=False)
