"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  endorsements: boolean;
  nominations: boolean;
  profileChanges: boolean;
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    inAppEnabled: true,
    endorsements: true,
    nominations: true,
    profileChanges: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/notifications/preferences");
        const data = await response.json();
        setPreferences({
          emailEnabled: data.emailEnabled,
          inAppEnabled: data.inAppEnabled,
          endorsements: data.endorsements,
          nominations: data.nominations,
          profileChanges: data.profileChanges,
        });
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/notifications"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Notification Preferences
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize how you receive notifications
          </p>
        </div>

        {/* Preferences Form */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          {/* General Settings */}
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              General Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground">
                    Email Notifications
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("emailEnabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.emailEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.emailEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground">
                    In-App Notifications
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show notifications in the notification bell
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("inAppEnabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.inAppEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.inAppEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Notification Types
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which events you want to be notified about
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-xl">👍</span>
                    Endorsements
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    When someone endorses your skills
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("endorsements")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.endorsements ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.endorsements
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    Nominations
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you are nominated as an SME
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("nominations")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.nominations ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.nominations
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    Profile Changes
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    When your profile is activated or deactivated
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("profileChanges")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.profileChanges ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.profileChanges
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-muted rounded-b-lg flex items-center justify-between">
            <div>
              {saveSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Preferences saved successfully
                </p>
              )}
            </div>
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">About Notifications</p>
              <p className="text-muted-foreground">
                You can always manage your notification preferences here. Email
                notifications are sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
