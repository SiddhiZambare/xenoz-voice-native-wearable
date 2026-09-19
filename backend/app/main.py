from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="XENOZ Backend")


class Command(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "message": "XENOZ backend is running"
    }


@app.post("/command")
def receive_command(command: Command):

    text = command.text.lower().strip()

    if "hello" in text or "hi" in text:
        response = "Hello! XENOZ is listening."

    elif "remind me" in text:
        response = "Reminder command received."

    elif "time" in text:
        response = "Time command received."

    else:
        response = "I received your command, but I don't know how to handle it yet."

    return {
        "status": "success",
        "command": command.text,
        "response": response
    }