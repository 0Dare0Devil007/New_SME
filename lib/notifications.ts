import prisma from "@/lib/prisma";
import { sendNotificationEmail } from "./email";

export type NotificationType =
  | "ENDORSEMENT"
  | "NOMINATION"
  | "NOMINATION_DECISION"
  | "PROFILE_ACTIVATED"
  | "PROFILE_DEACTIVATED"
  | "NEW_SME_IN_DEPT";

interface CreateNotificationParams {
  employeeId: bigint;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: bigint;
}

interface EndorsementNotificationParams {
  smeEmployeeId: bigint;
  endorserName: string;
  endorserPosition?: string | null;
  skillName: string;
  endorsementId: bigint;
  comment?: string | null;
}

/**
 * Create an in-app notification
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        employeeId: params.employeeId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        relatedId: params.relatedId,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Check user notification preferences
 */
export async function getUserPreferences(employeeId: bigint) {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { employeeId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          employeeId,
          emailEnabled: true,
          inAppEnabled: true,
          endorsements: true,
          nominations: true,
          profileChanges: true,
        },
      });
    }

    return preferences;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    // Return default preferences if there's an error
    return {
      employeeId,
      emailEnabled: true,
      inAppEnabled: true,
      endorsements: true,
      nominations: true,
      profileChanges: true,
    };
  }
}

/**
 * Create an endorsement notification (in-app + email)
 */
export async function createEndorsementNotification(
  params: EndorsementNotificationParams
): Promise<void> {
  try {
    // Check user preferences
    const preferences = await getUserPreferences(params.smeEmployeeId);

    // Get SME employee details for email
    const smeEmployee = await prisma.employee.findUnique({
      where: { employeeId: params.smeEmployeeId },
      include: {
        smeProfile: true,
      },
    });

    if (!smeEmployee) {
      console.error("SME employee not found");
      return;
    }

    const smeId = smeEmployee.smeProfile?.smeId;
    if (!smeId) {
      console.error("SME profile not found");
      return;
    }

    // Construct notification message
    const title = `New endorsement for ${params.skillName}`;
    let message = `${params.endorserName}`;
    if (params.endorserPosition) {
      message += ` (${params.endorserPosition})`;
    }
    message += ` endorsed your skill in ${params.skillName}`;
    if (params.comment) {
      message += `\n\nComment: "${params.comment}"`;
    }

    const actionUrl = `/experts/${smeId.toString()}`;

    // Create in-app notification if enabled
    if (preferences.inAppEnabled && preferences.endorsements) {
      await createNotification({
        employeeId: params.smeEmployeeId,
        type: "ENDORSEMENT",
        title,
        message,
        actionUrl,
        relatedId: params.endorsementId,
      });
    }

    // Send email notification if enabled
    if (preferences.emailEnabled && preferences.endorsements) {
      await sendNotificationEmail({
        to: smeEmployee.email,
        recipientName: smeEmployee.fullName,
        subject: title,
        type: "ENDORSEMENT",
        data: {
          smeName: smeEmployee.fullName,
          endorserName: params.endorserName,
          endorserPosition: params.endorserPosition,
          skillName: params.skillName,
          comment: params.comment,
          profileUrl: `${process.env.APP_URL || "http://localhost:3000"}${actionUrl}`,
          preferencesUrl: `${
            process.env.APP_URL || "http://localhost:3000"
          }/notifications/preferences`,
        },
      });
    }
  } catch (error) {
    console.error("Error creating endorsement notification:", error);
    // Don't throw - we don't want to fail the endorsement if notification fails
  }
}
