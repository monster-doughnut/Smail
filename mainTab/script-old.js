// Get references to the search input and item list
const searchInput = document.getElementById('searchInput');
const itemList = document.getElementById('itemList');

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


// Add an event listener to the search input
searchInput.addEventListener('input', async function () {
    if (!messagesProcessed) { return; }
    const searchTerm = searchInput.value.toLowerCase();

    // Loop through all list items
    let counter = 0;
    const MAX = 5;
    itemList.innerHTML = ""
    for (const message of messages) {
        if (message.subject.includes(searchTerm)) {
            counter += 1
            const item = document.createElement("li")
            item.innerHTML = message.subject
            itemList.appendChild(item)
        }
        if (counter == MAX)
            break;
    }
});