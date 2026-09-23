const commandInput = document.getElementById("commandInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");

const responseText = document.getElementById("responseText");
const responseCommand = document.getElementById("responseCommand");
const connectionStatus = document.getElementById("connectionStatus");
const commandHistory = document.getElementById("commandHistory");

const notesList = document.getElementById("notesList");
const remindersList = document.getElementById("remindersList");

const notesCount = document.getElementById("notesCount");
const remindersCount = document.getElementById("remindersCount");

const API_URL = "http://127.0.0.1:8000";
// ========================================
// STATUS DISPLAY
// ========================================

function setStatus(text, statusClass) {

    connectionStatus.textContent = text;

    connectionStatus.classList.remove(
        "status-listening",
        "status-processing",
        "status-speaking",
        "status-connected",
        "status-offline"
    );

    connectionStatus.classList.add(
        statusClass
    );
}


// ========================================
// NOTIFICATION PERMISSION
// ========================================

async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        console.log(
            "Browser notifications are not supported."
        );

        return;
    }

    if (Notification.permission === "default") {

        await Notification.requestPermission();

    }
}


// ========================================
// SEND COMMAND
// ========================================

async function sendCommand() {

    const text =
        commandInput.value.trim();


    if (text === "") {
        return;
    }


    responseText.textContent =
        "XENOZ is processing...";


    responseCommand.textContent =
        "Command: " + text;


    setStatus(
        "Processing....",
        "status-processing"
    )


    try {

        const response =
            await fetch(
                `${API_URL}/command`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Backend returned an error."
            );

        }


        const data =
            await response.json();


        // Display response
        responseText.textContent =
            data.response;


        // Make XENOZ speak
        speakResponse(data.response);


        responseCommand.textContent =
            "Command: " + data.command;


        setStatus(
            "Connected",
            "status-connected"
        )


        // Add command to history
        addToHistory(
            data.command,
            data.response
        );


        // Clear input
        commandInput.value = "";


        // Refresh saved data
        loadNotes();
        loadReminders();


    } catch (error) {

        console.error(error);


        responseText.textContent =
            "Unable to connect to XENOZ backend.";


        responseCommand.textContent =
            "Make sure the FastAPI server is running.";


        setStatus(
            "Offline",
            "status-offline"
        )

    }
}


// ========================================
// COMMAND HISTORY
// ========================================

function addToHistory(
    command,
    response
) {

    const emptyMessage =
        document.querySelector(
            ".empty-history"
        );


    if (emptyMessage) {
        emptyMessage.remove();
    }


    const item =
        document.createElement("div");


    item.className =
        "history-item";


    const commandElement =
        document.createElement("div");


    commandElement.className =
        "history-command";


    commandElement.textContent =
        command;


    const responseElement =
        document.createElement("div");


    responseElement.className =
        "history-response";


    responseElement.textContent =
        response;


    item.appendChild(
        commandElement
    );


    item.appendChild(
        responseElement
    );


    commandHistory.prepend(
        item
    );
}


// ========================================
// LOAD NOTES
// ========================================

async function loadNotes() {

    try {

        const response =
            await fetch(
                `${API_URL}/notes`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load notes."
            );

        }


        const data =
            await response.json();


        notesList.innerHTML =
            "";


        if (data.notes.length === 0) {

            notesList.innerHTML = `
                <p class="empty-saved">
                    No notes yet.
                </p>
            `;

        } else {

            data.notes.forEach(
                function(note) {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "saved-item";


                    item.innerHTML = `
                        <div class="saved-item-text">
                            ${escapeHTML(note.text)}
                        </div>

                        <div class="saved-item-time">
                            ${note.created_at}
                        </div>
                    `;


                    notesList.appendChild(
                        item
                    );

                }
            );
        }


        notesCount.textContent =
            data.notes.length;


    } catch (error) {

        console.error(
            "Notes error:",
            error
        );

    }
}


// ========================================
// LOAD REMINDERS
// ========================================

async function loadReminders() {

    try {

        const response =
            await fetch(
                `${API_URL}/reminders`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load reminders."
            );

        }


        const data =
            await response.json();


        remindersList.innerHTML =
            "";


        if (data.reminders.length === 0) {

            remindersList.innerHTML = `
                <p class="empty-saved">
                    No reminders yet.
                </p>
            `;

        } else {

            data.reminders.forEach(
                function(reminder) {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "saved-item";


                    item.innerHTML = `
                        <div class="saved-item-text">
                            ${escapeHTML(reminder.text)}
                        </div>

                        <div class="saved-item-time">
                            ${
                                reminder.time
                                    ? "⏰ " + reminder.time
                                    : ""
                            }
                            <br>
                            ${reminder.created_at}
                        </div>
                    `;


                    remindersList.appendChild(
                        item
                    );


                    // Restore reminder after refresh
                    scheduleSavedReminder(
                        reminder
                    );

                }
            );
        }


        remindersCount.textContent =
            data.reminders.length;


    } catch (error) {

        console.error(
            "Reminders error:",
            error
        );

    }
}


// ========================================
// RESTORE SAVED REMINDER
// ========================================

function scheduleSavedReminder(reminder) {

    if (!reminder.time) {
        return;
    }


    const parts =
        reminder.time.split(":");


    if (parts.length !== 2) {
        return;
    }


    const hour =
        parseInt(parts[0]);


    const minute =
        parseInt(parts[1]);


    const now =
        new Date();


    const reminderTime =
        new Date();


    reminderTime.setHours(
        hour,
        minute,
        0,
        0
    );


    // Don't schedule reminders
    // that already passed today

    if (reminderTime <= now) {

        console.log(
            "Skipping past reminder:",
            reminder.text
        );

        return;
    }


    const delay =
        reminderTime.getTime() -
        now.getTime();


    console.log(
        "Restored reminder:",
        reminder.text,
        "at",
        reminderTime
    );


    setTimeout(
        function() {

            showReminderNotification(
                reminder.text
            );

        },
        delay
    );
}


// ========================================
// SHOW REMINDER NOTIFICATION
// ========================================

function showReminderNotification(
    command
) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "XENOZ Reminder",
            {
                body: command
            }
        );

    } else {

        alert(
            "XENOZ Reminder\n\n" +
            command
        );

    }
}


// ========================================
// FORMAT TIME
// ========================================

function formatTime(date) {

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ========================================
// SECURITY HELPER
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


// ========================================
// SEND BUTTON
// ========================================

sendButton.addEventListener(
    "click",
    sendCommand
);


// ========================================
// ENTER KEY
// ========================================

commandInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            sendCommand();

        }

    }
);


// ========================================
// VOICE RECOGNITION
// ========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    micButton.addEventListener(
       "click",
       function() {

        recognition.start();

        setStatus(
            "Listening...",
            "status-listening"
        )

        responseText.textContent =
            "XENOZ is listening...";

        // Start listening animation
        document
            .querySelector(".orb")
            .classList.add("listening");

       }
    );


    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0]
                    .transcript;


            commandInput.value =
                transcript;


            connectionStatus.textContent =
                "Voice captured";


            sendCommand();

        };


    recognition.onerror =
        function(event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            connectionStatus.textContent =
                "Voice input error";


            responseText.textContent =
                "I couldn't understand that. Please try again.";

        };


    recognition.onend =
        function() {

             // Stop listening animation
            document
              .querySelector(".orb")
              .classList.remove("listening");


            if (
                connectionStatus.textContent ===
                "Listening..."
            ) {

                connectionStatus.textContent =
                    "Connected";

            } 

        };

} else {

    micButton.disabled =
        true;


    connectionStatus.textContent =
        "Voice input not supported";

}


// ========================================
// SYSTEM CLOCK
// ========================================

function updateTime() {

    const now =
        new Date();


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    document.getElementById(
        "systemTime"
    ).textContent =
        `${hours}:${minutes}`;
}


updateTime();


setInterval(
    updateTime,
    1000
);


// ========================================
// SIDEBAR NAVIGATION
// ========================================

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


navItems.forEach(
    function(item) {

        item.addEventListener(
            "click",
            function() {

                navItems.forEach(
                    function(nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add(
                    "active"
                );

            }
        );

    }
);


// ========================================
// XENOZ TEXT-TO-SPEECH
// FEMALE VOICE
// ========================================

let xenozVoices = [];


// Load available browser voices
function loadVoices() {

    xenozVoices =
        speechSynthesis.getVoices();

    console.log(
        "Available XENOZ voices:",
        xenozVoices
    );
}


// Some browsers load voices
// slightly after the page starts
speechSynthesis.onvoiceschanged =
    loadVoices;


// Load voices immediately as well
loadVoices();


function speakResponse(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        console.log(
            "Text-to-speech is not supported."
        );

        return;
    }


    // Stop previous speech
    speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        "en-IN";


    speech.rate =
        0.95;


    speech.pitch =
        1.08;


    speech.volume =
        1;


    // ====================================
    // SELECT FEMALE VOICE
    // ====================================

    const preferredVoice =

        // Microsoft Zira
        xenozVoices.find(
            voice =>
                /zira/i.test(
                    voice.name
                )
        )

        ||

        // Other voices explicitly named female
        xenozVoices.find(
            voice =>
                /female/i.test(
                    voice.name
                )
        )

        ||

        // Indian English voice
        xenozVoices.find(
            voice =>
                /en-IN/i.test(
                    voice.lang
                )
        )

        ||

        // US English
        xenozVoices.find(
            voice =>
                /en-US/i.test(
                    voice.lang
                )
        )

        ||

        // UK English
        xenozVoices.find(
            voice =>
                /en-GB/i.test(
                    voice.lang
                )
        );


    if (preferredVoice) {

        speech.voice =
            preferredVoice;


        console.log(
            "XENOZ female voice:",
            preferredVoice.name
        );

    } else {

        console.log(
            "No preferred female voice found."
        );

    }


    // Start speaking animation
    const orb =
       document.querySelector(".orb");

    if (orb) {
        orb.classList.add("speaking");
    }
    setStatus(
    "Speaking...",
    "status-speaking"
    );


// Speak the response
    speechSynthesis.speak(speech);


// Remove animation when speech ends
    speech.onend = function() {

       if (orb) {
           orb.classList.remove("speaking");
        }
        setStatus(
            "Connected",
            "status-connected"
        )

    };
}


// ========================================
// INITIALIZE XENOZ
// ========================================

requestNotificationPermission();

loadNotes();

loadReminders();


// ========================================
// CHECK BACKEND CONNECTION
// ========================================

async function checkBackendConnection() {

    try {

        const response =
            await fetch(`${API_URL}/`);

        if (response.ok) {

            setStatus(
                "Connected",
                "status-connected"
            );

        }

    } catch (error) {

        setStatus(
            "Offline",
            "status-offline"
        );
    }
}

checkBackendConnection();