# 🏗 My Medicine — Application Architecture

## 📱 App Root
  ├── SQLiteProvider
  ├── SessionProvider
  ├── AuthProvider
  └── AppContent

## 🚀 Application Initialization
  ├── Network Status
  ├── Database Initialization
  ├── Local Seed
  └── Synchronization Engine

## 🔄 Synchronization Engine
  ├── Initial Sync
  │   ├── Reminders
  │   ├── Occurrences
  │   ├── Events / Logs
  │   ├── Family
  │   ├── Settings
  │   └── Notifications
  │
  ├── Realtime Sync
  │   ├── Global Data
  │   └── User Data
  │
  └── Push Sync
      ├── Sync Queue
      ├── Background Service
      ├── Batch Processing
      └── Retry Handling

## 🗄 Local Database
  ├── Users
  ├── Medicines
  ├── Reminders
  ├── Occurrences
  ├── Events
  ├── Family
  ├── Notifications
  ├── Devices
  ├── Settings
  └── Sync Queue

## 🔔 Notifications
  ├── Scheduler
  ├── Background Actions
  ├── Snooze
  ├── Full-screen Alarm
  └── Native Android Activity

## 👨‍👩‍👧 Family
  ├── Invitations
  ├── Members
  └── Shared Access

## 📊 Progress
  ├── Occurrence History
  ├── Status Calculation
  ├── Daily / Weekly / Monthly Aggregation
  └── Medicine-based Progress

## 📱 UI
  ├── Navigation
  ├── Screens
  ├── Hooks
  ├── Components
  └── Context Providers

## 🔐 Backend
  ├── Firebase Authentication
  ├── Firestore
  ├── Cloud Functions
  └── FCM

## 🧩 Native Layer
  ├── Android / Kotlin
  └── iOS / Swift