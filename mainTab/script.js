
// Get references to the search input and item list
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');


async function* getAllEmails() {
    // Get all accounts
    let accounts = await messenger.accounts.list();
    
    for (let account of accounts) {
        // Get all folders for the account
        let folders = await messenger.folders.getSubFolders(account.id);
        
        // Find the inbox folder
        let inbox = folders.find(folder => folder.type === "inbox");
        
        if (inbox) {
            // Start fetching messages from the inbox
            let page = await messenger.messages.list(inbox.id);

            // Process messages in the first page
            for (let message of page.messages) {
                yield message;
            }

            // Fetch subsequent pages until there are no more
            while (page.id) {
                page = await messenger.messages.continueList(page.id);

                for (let message of page.messages) {
                    yield message;
                }
            }
        }
    }
}

const messages = []
let messagesProcessed = false;
async function processEmails() {
    const batch_size = 1;
    let batch = [];
    const promises = [];
    for await (const message of getAllEmails()) {
        messages.push(message);
        promises.push(processEmail(message));
    }
    await Promise.all(promises);
    console.log("Finished")
    console.log(messages);
    const API_UPDATE_MAILS_LINK = "http://localhost:8080/initialize"
    res = await fetch(API_UPDATE_MAILS_LINK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify(messages), // Convert data to JSON string
    });
    if (!res.ok) {
        console.log("oh no")
    }
    messagesProcessed = true;
}

async function processEmail(message) {
    const fullMessage = await messenger.messages.getFull(message.id);
    message["content"] = ""
    for (const part of fullMessage.parts) {
        if (!Object.hasOwn(part, "body")) {
            continue;
        }
        message["content"] += part.body.trim() + "\n\n\n"
    }
    message["sender"] = message["author"]
    message["datetime"] = message["date"]
    const necessaryKeys = ["id", "sender", "datetime", "subject", "content"]
    Object.keys(message).forEach(key => {
        if (!necessaryKeys.includes(key)) {
          delete message[key];
        }
    });
}

processEmails();

async function addMessage(content, isUser) {
    while (!messagesProcessed) {
        await setTimeout(1000);
        console.log("hi")
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSend() {
    while (!messagesProcessed) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    Promise.all(promises);
    promises = [];
    const input = userInput.value.trim();
    const API_QUERY_LINK = "http://localhost:8080/chat"
    if (input) {
        const res = await fetch(API_QUERY_LINK, { headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: input,
        })});
        add(res, false);
    }
    
    /*
    if (message) {
        await addMessage(message, true);
        userInput.value = '';
        // Here you would typically send the message to an AI service
        // and get a response. For this example, we'll just echo the message.
        const firstMessages = []
        for (const mail of messages) {
            if (mail.subject.includes(message)) {
                firstMessages.push(mail.subject);
            }
            if (firstMessages.length == 5)
                break;
        }
        const text = "Mails: " + firstMessages.join(", ");
        console.log(text)
        addMessage(text, false)
    }
    */
}

sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});
