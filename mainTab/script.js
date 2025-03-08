
// Get references to the search input and item list
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');


const messages = []

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
                messages.push(message)
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

let messagesProcessed = false;
async function processEmails() {
    for await (const message of getAllEmails()) {
        messages.push(message);
    }
    messages.reverse()
    messagesProcessed = true;
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
    const message = userInput.value.trim();
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
        /*setTimeout(() => {
            addMessage(`Mails: ${wmessage}`, false);
        }, 1000); */
    }
}

sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});
