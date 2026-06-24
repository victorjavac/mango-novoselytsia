window.MangoFirebase = (function() {
    const config = {
        apiKey: "AIzaSyBcar7UEjzulfsCrT7EGtldZwzmPNfaRM0",
        authDomain: "mangopos-393c4.firebaseapp.com",
        projectId: "mangopos-393c4",
        storageBucket: "mangopos-393c4.firebasestorage.app",
        messagingSenderId: "742965231195",
        appId: "1:742965231195:web:4ae1755e1b25f60457c97e"
    };

    function initialize(options = {}) {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }

        const db = firebase.firestore();
        if (options.persistence) {
            db.enablePersistence().catch(function(err) {
                console.warn(options.persistenceWarning || "Офлайн-режим не активовано: ", err.code);
            });
        }

        return {
            db,
            auth: firebase.auth ? firebase.auth() : null
        };
    }

    return { config, initialize };
})();
