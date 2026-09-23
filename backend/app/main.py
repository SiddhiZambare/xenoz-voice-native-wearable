from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import re

app = FastAPI(title="XENOZ Backend")
@app.get("/")
def root():
    return {
        "status": "online",
        "message": "XENOZ backend is running"
    }

# ========================================
# CORS
# ========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# DATA MODEL
# ========================================

class Command(BaseModel):
    text: str


# ========================================
# TEMPORARY STORAGE
# ========================================

notes = []
reminders = []


# ========================================
# EXTRACT TIME
# ========================================

def extract_time(text):

    text = text.lower().strip()

    # ========================================
    # FORMAT: 6:46 PM / 6 PM
    # ========================================

    match = re.search(
        r"\b(1[0-2]|[1-9])(?::([0-5]\d))?\s*(am|pm)\b",
        text
    )

    if match:

        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        period = match.group(3).upper()

        if period == "PM" and hour != 12:
            hour += 12

        if period == "AM" and hour == 12:
            hour = 0

        return f"{hour:02d}:{minute:02d}"


    # ========================================
    # FORMAT: 19:20
    # ========================================

    match = re.search(
        r"\b([01]?\d|2[0-3]):([0-5]\d)\b",
        text
    )

    if match:

        hour = int(match.group(1))
        minute = int(match.group(2))

        return f"{hour:02d}:{minute:02d}"


    # ========================================
    # FORMAT: 1920 / 1846
    # ========================================

    match = re.search(
        r"\b([01]\d|2[0-3])([0-5]\d)\b",
        text
    )

    if match:

        hour = int(match.group(1))
        minute = int(match.group(2))

        return f"{hour:02d}:{minute:02d}"


    return None

# ========================================
# HOME
# ========================================

@app.get("/")
def root():

    return {
        "message": "XENOZ backend is running"
    }


# ========================================
# COMMAND PROCESSOR
# ========================================

@app.post("/command")
def receive_command(command: Command):

    text = command.text.strip()

    lower_text = text.lower()


    # ====================================
    # GREETING
    # ====================================

    if (
        "hello" in lower_text
        or "hi" in lower_text
    ):

        response = "Hello! I am XENOZ."


    # ====================================
    # REMINDER
    # ====================================

    elif "remind" in lower_text:

        reminder_time = extract_time(text)

        reminder = {
            "text": text,
            "time": reminder_time,
            "created_at": datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        }

        reminders.append(reminder)


        if reminder_time:

            response = (
                f"Reminder saved for "
                f"{reminder_time}."
            )

        else:

            response = (
                "Reminder saved successfully."
            )


    # ====================================
    # NOTE
    # ====================================

    elif "note" in lower_text:

        note = {
            "text": text,
            "created_at": datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        }

        notes.append(note)

        response = "Note saved successfully."


    # ====================================
    # TIME
    # ====================================

    elif "time" in lower_text:

        current_time = datetime.now().strftime(
            "%I:%M %p"
        )

        response = (
            f"The current time is "
            f"{current_time}."
        )


    # ====================================
    # CAPABILITIES
    # ====================================

    elif (
        "what can you do" in lower_text
        or "help" in lower_text
        or "what do you do" in lower_text
    ):

        response = (
            "I can take notes, save reminders, "
            "tell you the current time, and "
            "respond to voice or text commands."
        )


    # ====================================
    # UNKNOWN
    # ====================================

    else:

        response = (
            "I received your command, "
            "but I don't know how to handle it yet."
        )


    return {

        "status": "success",

        "command": text,

        "response": response

    }


# ========================================
# GET NOTES
# ========================================

@app.get("/notes")
def get_notes():

    return {
        "notes": notes
    }


# ========================================
# GET REMINDERS
# ========================================

@app.get("/reminders")
def get_reminders():

    return {
        "reminders": reminders
    }