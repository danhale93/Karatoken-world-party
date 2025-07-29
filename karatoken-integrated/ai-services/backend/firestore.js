// Firestore admin setup for backend
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// You should set GOOGLE_APPLICATION_CREDENTIALS env var or use a serviceAccountKey.json
if (!admin.apps.length) {
  initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

module.exports = { db };
