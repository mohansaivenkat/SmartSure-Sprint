-- ============================================
-- SmartSure Database Initialization Script
-- Creates all required databases on startup
-- ============================================

-- Main database (used by auth, policy, claims, admin, payment services)
CREATE DATABASE smartsure_auth;

-- Notification service database
CREATE DATABASE smartsure_notification;
