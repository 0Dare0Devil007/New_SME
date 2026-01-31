-- CreateTable
CREATE TABLE "employees" (
    "employee_id" BIGSERIAL NOT NULL,
    "emp_number" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "avatar_url" TEXT,
    "position" VARCHAR(200),
    "site_name" VARCHAR(200),
    "department_name" VARCHAR(200),
    "manager_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "employee_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employee_id","role_id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "category_id" BIGSERIAL NOT NULL,
    "category_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "skills" (
    "skill_id" BIGSERIAL NOT NULL,
    "skill_name" VARCHAR(200) NOT NULL,
    "category_id" BIGINT,
    "description" TEXT,
    "icon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "sme_profiles" (
    "sme_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "bio" TEXT,
    "languages" VARCHAR(200),
    "availability" VARCHAR(200),
    "contact_phone" VARCHAR(50),
    "contact_pref" VARCHAR(50),
    "teams_link" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "status_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sme_profiles_pkey" PRIMARY KEY ("sme_id")
);

-- CreateTable
CREATE TABLE "sme_nominations" (
    "nomination_id" BIGSERIAL NOT NULL,
    "nominee_employee_id" BIGINT NOT NULL,
    "nominated_by_tl_id" BIGINT NOT NULL,
    "department_name" VARCHAR(200),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    "decision_by_coord_id" BIGINT,
    "decision_at" TIMESTAMP(3),
    "decision_note" TEXT,

    CONSTRAINT "sme_nominations_pkey" PRIMARY KEY ("nomination_id")
);

-- CreateTable
CREATE TABLE "department_coordinators" (
    "department_name" VARCHAR(200) NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_coordinators_pkey" PRIMARY KEY ("department_name","employee_id")
);

-- CreateTable
CREATE TABLE "sme_skills" (
    "sme_skill_id" BIGSERIAL NOT NULL,
    "sme_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,
    "proficiency" VARCHAR(30),
    "years_exp" DECIMAL(4,1),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sme_skills_pkey" PRIMARY KEY ("sme_skill_id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "endorsement_id" BIGSERIAL NOT NULL,
    "sme_skill_id" BIGINT NOT NULL,
    "endorsed_by_employee_id" BIGINT NOT NULL,
    "endorsed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("endorsement_id")
);

-- CreateTable
CREATE TABLE "sme_certifications" (
    "certification_id" BIGSERIAL NOT NULL,
    "sme_id" BIGINT NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "issuer" VARCHAR(250),
    "credential_id" VARCHAR(150),
    "credential_url" TEXT,
    "issued_date" DATE,
    "expiry_date" DATE,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sme_certifications_pkey" PRIMARY KEY ("certification_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" BIGSERIAL NOT NULL,
    "sme_id" BIGINT NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "target_audience" VARCHAR(250),
    "duration_minutes" INTEGER,
    "delivery_mode" VARCHAR(30) NOT NULL DEFAULT 'TEAMS',
    "materials_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_emp_number_key" ON "employees"("emp_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "idx_employees_manager" ON "employees"("manager_id");

-- CreateIndex
CREATE INDEX "idx_employees_site_name" ON "employees"("site_name");

-- CreateIndex
CREATE INDEX "idx_employees_department_name" ON "employees"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_code_key" ON "roles"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_category_name_key" ON "skill_categories"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_skill_name_key" ON "skills"("skill_name");

-- CreateIndex
CREATE INDEX "skills_category_id_idx" ON "skills"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "sme_profiles_employee_id_key" ON "sme_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "idx_sme_status" ON "sme_profiles"("status");

-- CreateIndex
CREATE INDEX "idx_sme_skill_skill_id" ON "sme_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sme_skill" ON "sme_skills"("sme_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_endorse_once" ON "endorsements"("sme_skill_id", "endorsed_by_employee_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_profiles" ADD CONSTRAINT "sme_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_nominations" ADD CONSTRAINT "sme_nominations_nominee_employee_id_fkey" FOREIGN KEY ("nominee_employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_nominations" ADD CONSTRAINT "sme_nominations_nominated_by_tl_id_fkey" FOREIGN KEY ("nominated_by_tl_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_nominations" ADD CONSTRAINT "sme_nominations_decision_by_coord_id_fkey" FOREIGN KEY ("decision_by_coord_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_coordinators" ADD CONSTRAINT "department_coordinators_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_skills" ADD CONSTRAINT "sme_skills_sme_id_fkey" FOREIGN KEY ("sme_id") REFERENCES "sme_profiles"("sme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_skills" ADD CONSTRAINT "sme_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_sme_skill_id_fkey" FOREIGN KEY ("sme_skill_id") REFERENCES "sme_skills"("sme_skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorsed_by_employee_id_fkey" FOREIGN KEY ("endorsed_by_employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sme_certifications" ADD CONSTRAINT "sme_certifications_sme_id_fkey" FOREIGN KEY ("sme_id") REFERENCES "sme_profiles"("sme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_sme_id_fkey" FOREIGN KEY ("sme_id") REFERENCES "sme_profiles"("sme_id") ON DELETE CASCADE ON UPDATE CASCADE;
