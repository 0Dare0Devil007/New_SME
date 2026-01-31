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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/notifications"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
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
          <h1 className="text-3xl font-bold text-gray-900">
            Notification Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Customize how you receive notifications
          </p>
        </div>

        {/* Preferences Form */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* General Settings */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              General Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("emailEnabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.emailEnabled ? "bg-blue-600" : "bg-gray-200"
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
                  <label className="font-medium text-gray-900">
                    In-App Notifications
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Show notifications in the notification bell
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("inAppEnabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.inAppEnabled ? "bg-blue-600" : "bg-gray-200"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notification Types
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose which events you want to be notified about
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-xl">👍</span>
                    Endorsements
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When someone endorses your skills
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("endorsements")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.endorsements ? "bg-blue-600" : "bg-gray-200"
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
                  <label className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    Nominations
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When you are nominated as an SME
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("nominations")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.nominations ? "bg-blue-600" : "bg-gray-200"
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
                  <label className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    Profile Changes
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When your profile is activated or deactivated
                  </p>
                </div>
                <button
                  onClick={() => togglePreference("profileChanges")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.profileChanges ? "bg-blue-600" : "bg-gray-200"
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
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-between">
            <div>
              {saveSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-2">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About Notifications</p>
              <p>
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
