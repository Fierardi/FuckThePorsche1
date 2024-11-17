  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBEUVHSZ1mRzWNanAvJVjSRnatp-Uagg7c",
    authDomain: "napoligames-af2b3.firebaseapp.com",
    projectId: "napoligames-af2b3",
    storageBucket: "napoligames-af2b3.firebasestorage.app",
    messagingSenderId: "291061786722",
    appId: "1:291061786722:web:e4880a0b85683fbb94493b",
    measurementId: "G-W26KTWGWZW"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  function saveGameScore(gameTitle, score) {
    db.collection("scores").doc(gameTitle).set({
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log(`Score for ${gameTitle} saved successfully!`);
    })
    .catch((error) => {
        console.error("Error saving score: ", error);
    });
}

function getGameScore(gameTitle) {
    db.collection("scores").doc(gameTitle).get()
    .then((doc) => {
        if (doc.exists) {
            console.log(`Score for ${gameTitle}: ${doc.data().score}`);
        } else {
            console.log(`No score found for ${gameTitle}`);
        }
    })
    .catch((error) => {
        console.error("Error retrieving score: ", error);
    });
}

function endGame(gameTitle, score) {
    saveGameScore(gameTitle, score);
    alert(`${gameTitle} score of ${score} saved successfully!`);
}

function displaySavedScore(gameTitle) {
    getGameScore(gameTitle);
}

