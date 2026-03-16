/**
 * @module firebase
 * @description Firebase configuration for Cloud Messaging (push notifications).
 */
const admin = require('firebase-admin');

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
};

// Validate required credentials
if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
  console.warn('⚠️  Firebase credentials not configured. Push notifications will fail.');
}

let firebaseApp;

try {
  if (firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });
  } else {
    console.info('Firebase not initialized - credentials missing');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

/**
 * Send push notification via FCM
 * @param {string} deviceToken - FCM device token
 * @param {object} notification - Notification payload { title, body }
 * @param {object} data - Additional data to send
 * @returns {Promise} Message ID
 */
const sendPushNotification = async (deviceToken, notification, data = {}) => {
  if (!firebaseApp || !admin.messaging()) {
    console.warn('Firebase not configured. Notification not sent.');
    return null;
  }

  try {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: '1',
            'mutable-content': 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          sound: 'default',
        },
      },
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Firebase messaging error:', error);
    throw error;
  }
};

/**
 * Send multicast notification to multiple devices
 * @param {string[]} deviceTokens - Array of FCM device tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data
 * @returns {Promise} Response with success/failure counts
 */
const sendMulticastNotification = async (deviceTokens, notification, data = {}) => {
  if (!firebaseApp || !admin.messaging()) {
    console.warn('Firebase not configured. Notifications not sent.');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: { ...data, timestamp: new Date().toISOString() },
    };

    const response = await admin.messaging().sendMulticast({
      tokens: deviceTokens,
      ...message,
    });

    return response;
  } catch (error) {
    console.error('Firebase multicast error:', error);
    throw error;
  }
};

module.exports.sendPushNotification = sendPushNotification;
module.exports.sendMulticastNotification = sendMulticastNotification;
module.exports = firebaseConfig;
