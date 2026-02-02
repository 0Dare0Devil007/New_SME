/*
  Warnings:

  - You are about to drop the column `icon_url` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `sme_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `contact_pref` on the `sme_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `teams_link` on the `sme_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "location" VARCHAR(250),
ADD COLUMN     "max_capacity" INTEGER,
ADD COLUMN     "scheduled_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "icon_url",
ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "sme_profiles" DROP COLUMN "contact_phone",
DROP COLUMN "contact_pref",
DROP COLUMN "teams_link",
ALTER COLUMN "availability" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "course_enrollments" (
    "enrollment_id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ENROLLED',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "feedback" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "related_id" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "employee_id" BIGINT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "endorsements" BOOLEAN NOT NULL DEFAULT true,
    "nominations" BOOLEAN NOT NULL DEFAULT true,
    "profile_changes" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("employee_id")
);

-- CreateIndex
CREATE INDEX "idx_enrollments_employee" ON "course_enrollments"("employee_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_status" ON "course_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_course_enrollment" ON "course_enrollments"("course_id", "employee_id");

-- CreateIndex
CREATE INDEX "idx_notifications_employee_read" ON "notifications"("employee_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_courses_scheduled_date" ON "courses"("scheduled_date");

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;
