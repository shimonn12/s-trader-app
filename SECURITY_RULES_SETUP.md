# 🔐 Firebase Security Rules Setup

## ⚠️ חשוב מאוד! צריך להגדיר את ה-Security Rules

כרגע, Firebase Firestore **פתוח לכולם**. צריך להגדיר חוקי אבטחה!

---

## 📋 שלבים:

### 1. כנס ל-Firebase Console
```
https://console.firebase.google.com/project/fir-trader-ceb20
```

### 2. לחץ על "Firestore Database" בתפריט השמאלי

### 3. לחץ על הטאב "Rules" (חוקים)

### 4. תראה משהו כזה:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. **החלף את כל התוכן** בחוקים האלה:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - each user can only access their own data
    match /users/{userId} {
      // Allow read/write only if the user is authenticated and accessing their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Futures journal data
      match /futures/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Stocks journal data
      match /stocks/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. לחץ על "Publish" (פרסם)

### 7. ✅ סיימת! עכשיו המערכת מאובטחת!

---

## 🔍 מה החוקים האלה עושים?

### 1. **זיהוי משתמש**
```javascript
request.auth != null
```
- רק משתמשים מחוברים יכולים לגשת לנתונים

### 2. **בידוד נתונים**
```javascript
request.auth.uid == userId
```
- כל משתמש רואה **רק את הנתונים שלו**
- משתמש A לא יכול לראות את הנתונים של משתמש B

### 3. **הגנה על יומנים**
```javascript
match /futures/{document=**}
match /stocks/{document=**}
```
- גם יומן החוזים וגם יומן המניות מוגנים

### 4. **חסימת כל השאר**
```javascript
allow read, write: if false;
```
- כל דבר אחר **חסום**

---

## ✅ בדיקה שהחוקים עובדים:

### 1. פתח את האפליקציה
```bash
npm run dev
```

### 2. התחבר לחשבון

### 3. הוסף עסקה

### 4. פתח Console (F12)

### 5. אם הכל עובד, תראה:
```
✅ Data saved: LocalStorage + Firestore (futures)
```

### 6. אם יש שגיאה, תראה:
```
❌ Error saving to Firestore: Missing or insufficient permissions
```

**אם יש שגיאה** - חזור על השלבים למעלה!

---

## 🎯 למה זה חשוב?

### ללא Security Rules:
- ❌ כל אחד יכול לקרוא את הנתונים שלך
- ❌ כל אחד יכול למחוק את הנתונים שלך
- ❌ כל אחד יכול לשנות את הנתונים שלך

### עם Security Rules:
- ✅ רק אתה יכול לקרוא את הנתונים שלך
- ✅ רק אתה יכול למחוק את הנתונים שלך
- ✅ רק אתה יכול לשנות את הנתונים שלך

---

## 📝 הערות:

1. **Anonymous Authentication**
   - כל משתמש מקבל UID ייחודי
   - ה-UID נשמר ב-LocalStorage
   - גם אם תמחק את ה-Cache, תקבל UID חדש

2. **Backup**
   - החוקים נשמרים ב-Firebase
   - אבל טוב לשמור עותק ב-`firestore.rules`

3. **Testing**
   - אפשר לבדוק את החוקים ב-Firebase Console
   - לחץ על "Rules Playground"

---

## 🚨 אזהרה!

**אל תשנה את החוקים האלה** אלא אם כן אתה יודע מה אתה עושה!

אם תשנה אותם ל:
```javascript
allow read, write: if true;
```

**כל אחד יוכל לגשת לכל הנתונים!** ⚠️

---

## 🎉 סיכום:

1. ✅ כנס ל-Firebase Console
2. ✅ Firestore Database → Rules
3. ✅ העתק את החוקים מלמעלה
4. ✅ Publish
5. ✅ בדוק שזה עובד

**זהו! המערכת שלך מאובטחת!** 🔐

---

**קובץ החוקים:** `firestore.rules`  
**תאריך:** 2026-02-03  
**סטטוס:** ✅ מוכן לשימוש
