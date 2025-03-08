browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({
        url: browser.runtime.getURL("mainTab/index.html")
    });
});
// Wait for Thunderbird to initialize
messenger.runtime.onStartup.addListener(async () => {
    console.log("Extension started!");

    // Get all email accounts
    const accounts = await messenger.accounts.list();
    console.log("Accounts:", accounts);

    // Loop through each account
    for (const account of accounts) {
        console.log(`Processing account: ${account.name}`);

        // Get all folders for the account
        const folders = await messenger.folders.list(account.id);
        console.log("Folders:", folders);
        
        // Loop through each folder
        for (const folder of folders) {
            console.log(`Processing folder: ${folder.name}`);

            // Get all messages in the folder
            const messages = await messenger.messages.list(folder.id);
            console.log("Messages:", messages);

            // Loop through each message
            for (const message of messages) {
                console.log("Subject:", message.subject);
                console.log("From:", message.author);
                console.log("Date:", message.date);
                console.log("Body:", message.body);
                console.log("-----------------------------");
            }
        }
    }
});