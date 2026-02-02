import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Password hashing compatible with Better Auth
// Uses the same config as better-auth/dist/crypto/password.mjs
const scryptConfig = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64
};

async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(randomBytes(16));
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: scryptConfig.N,
    r: scryptConfig.r,
    p: scryptConfig.p,
    dkLen: scryptConfig.dkLen,
    maxmem: 128 * scryptConfig.N * scryptConfig.r * 2
  });
  return `${salt}:${bytesToHex(key)}`;
}

// Generate a unique ID (similar to cuid)
function generateId(): string {
  return randomBytes(16).toString("hex");
}

// Skill images - Local placeholders in /public/skills/
// Some skills have images, others use empty strings to test fallback
const skillImages = {
  dataAnalytics: "/skills/data-analytics.svg",
  projectManagement: "", // No image - will use default icon
  cloudArchitecture: "/skills/cloud-architecture.svg",
  machineLearning: "/skills/machine-learning.svg",
  uxDesign: "/skills/ux-design.svg",
  cybersecurity: "/skills/cybersecurity.svg",
  financialModeling: "", // No image - will use default icon
  supplyChain: "", // No image - will use default icon
};

async function main() {
  console.log("Starting seed...");

  // 1. Create app roles
  const appRoles = [
    { roleCode: "EMPLOYEE", roleName: "Employee" },
    { roleCode: "TEAM_LEADER", roleName: "Team Leader" },
    { roleCode: "COORDINATOR", roleName: "Coordinator" },
    { roleCode: "MANAGEMENT", roleName: "Management" },
  ];

  const roleMap: Record<string, any> = {};
  for (const role of appRoles) {
    const createdRole = await prisma.appRole.upsert({
      where: { roleCode: role.roleCode },
      update: {},
      create: role,
    });
    roleMap[role.roleCode] = createdRole;
    console.log(`App role "${role.roleName}" created`);
  }

  // 2. Create test users for each role (Better Auth users + Employees + Role assignments)
  const testUsers = [
    { email: "emp@test.com", name: "Test Employee", roleCode: "EMPLOYEE", empNumber: "TEST001", position: "Staff Member", departmentName: "General" },
    { email: "tl@test.com", name: "Test Team Leader", roleCode: "TEAM_LEADER", empNumber: "TEST002", position: "Team Leader", departmentName: "Engineering" },
    { email: "coor@test.com", name: "Test Coordinator", roleCode: "COORDINATOR", empNumber: "TEST003", position: "Coordinator", departmentName: "HR" },
    { email: "man@test.com", name: "Test Management", roleCode: "MANAGEMENT", empNumber: "TEST004", position: "Director", departmentName: "Executive" },
  ];

  const testPassword = "Test1234!";
  const hashedPassword = await hashPassword(testPassword);

  console.log("\n--- Creating Test Users ---");
  for (const testUser of testUsers) {
    // Check if Better Auth user already exists
    let user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (!user) {
      // Create Better Auth User
      const userId = generateId();
      user = await prisma.user.create({
        data: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          emailVerified: true,
        },
      });

      // Create Better Auth Account (credential provider)
      await prisma.account.create({
        data: {
          id: generateId(),
          accountId: userId,
          providerId: "credential",
          userId: userId,
          password: hashedPassword,
        },
      });

      console.log(`✓ Better Auth user created: ${testUser.email}`);
    } else {
      console.log(`→ Better Auth user already exists: ${testUser.email}`);
    }

    // Create Employee record
    let employee = await prisma.employee.findUnique({
      where: { email: testUser.email },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          empNumber: testUser.empNumber,
          fullName: testUser.name,
          email: testUser.email,
          position: testUser.position,
          departmentName: testUser.departmentName,
          siteName: "Headquarters",
          isActive: true,
        },
      });
      console.log(`✓ Employee created: ${testUser.name}`);
    } else {
      console.log(`→ Employee already exists: ${testUser.name}`);
    }

    // Assign role to employee
    const role = roleMap[testUser.roleCode];
    const existingRole = await prisma.employeeRole.findUnique({
      where: {
        employeeId_roleId: {
          employeeId: employee.employeeId,
          roleId: role.roleId,
        },
      },
    });

    if (!existingRole) {
      await prisma.employeeRole.create({
        data: {
          employeeId: employee.employeeId,
          roleId: role.roleId,
        },
      });
      console.log(`✓ Role "${testUser.roleCode}" assigned to ${testUser.name}`);
    } else {
      console.log(`→ Role "${testUser.roleCode}" already assigned to ${testUser.name}`);
    }
  }

  console.log("\n📋 Test accounts created:");
  console.log("   emp@test.com     / Test1234!  -> EMPLOYEE");
  console.log("   tl@test.com      / Test1234!  -> TEAM_LEADER");
  console.log("   coor@test.com    / Test1234!  -> COORDINATOR");
  console.log("   man@test.com     / Test1234!  -> MANAGEMENT");
  console.log("");

  // 4. Create skill categories
  const categories = [
    { categoryName: "Technology", description: "Technical and IT-related skills" },
    { categoryName: "Business", description: "Business management and operations" },
    { categoryName: "Design", description: "Creative and design skills" },
    { categoryName: "Finance", description: "Financial and accounting expertise" },
  ];

  const categoryMap: Record<string, any> = {};
  for (const cat of categories) {
    const category = await prisma.skillCategory.upsert({
      where: { categoryName: cat.categoryName },
      update: {},
      create: cat,
    });
    categoryMap[cat.categoryName] = category;
    console.log(`Category "${cat.categoryName}" created`);
  }

  // 5. Create skills
  const skillsData = [
    {
      skillName: "Data Analytics",
      categoryId: categoryMap["Technology"].categoryId,
      description: "Advanced data analysis, statistical modeling, visualization, and business intelligence tools including Power BI, Tableau, and Python",
      imageUrl: skillImages.dataAnalytics,
    },
    {
      skillName: "Project Management",
      categoryId: categoryMap["Business"].categoryId,
      description: "Agile, Scrum, Waterfall, and hybrid project management methodologies with PMP and SAFe certifications",
      imageUrl: skillImages.projectManagement,
    },
    {
      skillName: "Cloud Architecture",
      categoryId: categoryMap["Technology"].categoryId,
      description: "AWS, Azure, GCP infrastructure design, serverless computing, microservices, and cloud-native application development",
      imageUrl: skillImages.cloudArchitecture,
    },
    {
      skillName: "Machine Learning",
      categoryId: categoryMap["Technology"].categoryId,
      description: "AI/ML model development, deep learning frameworks (TensorFlow, PyTorch), neural networks, and NLP applications",
      imageUrl: skillImages.machineLearning,
    },
    {
      skillName: "UX/UI Design",
      categoryId: categoryMap["Design"].categoryId,
      description: "User experience research, interface design, prototyping with Figma, user testing, and design systems",
      imageUrl: skillImages.uxDesign,
    },
    {
      skillName: "Cybersecurity",
      categoryId: categoryMap["Technology"].categoryId,
      description: "Network security, penetration testing, threat detection, incident response, compliance (ISO 27001, SOC 2), and SIEM tools",
      imageUrl: skillImages.cybersecurity,
    },
    {
      skillName: "Financial Modeling",
      categoryId: categoryMap["Finance"].categoryId,
      description: "Financial forecasting, DCF valuation, scenario analysis, risk modeling, and Excel/SQL expertise",
      imageUrl: skillImages.financialModeling,
    },
    {
      skillName: "Supply Chain Management",
      categoryId: categoryMap["Business"].categoryId,
      description: "Logistics optimization, inventory management, demand forecasting, procurement strategies, and ERP systems (SAP, Oracle)",
      imageUrl: skillImages.supplyChain,
    },
    {
      skillName: "Leadership",
      categoryId: categoryMap["Business"].categoryId,
      description: "Team leadership, strategic planning, organizational development, and change management",
      imageUrl: skillImages.projectManagement,
    },
    {
      skillName: "Communication",
      categoryId: categoryMap["Business"].categoryId,
      description: "Professional communication, presentation skills, stakeholder management, and technical writing",
      imageUrl: skillImages.projectManagement,
    },
  ];

  const skillMap: Record<string, any> = {};
  for (const skill of skillsData) {
    const created = await prisma.skill.upsert({
      where: { skillName: skill.skillName },
      update: {},
      create: skill,
    });
    skillMap[skill.skillName] = created;
    console.log(`Skill "${skill.skillName}" created`);
  }

  // 6. Create employees (SMEs and others)
  const employeesData = [
    // Data Analytics experts
    { fullName: "Sarah Chen", email: "sarah.chen@company.com", empNumber: "EMP001", position: "Senior Data Analyst", departmentName: "Analytics", siteName: "New York", imageUrl: "https://i.pravatar.cc/150?img=5" },
    { fullName: "Mike Johnson", email: "mike.johnson@company.com", empNumber: "EMP002", position: "Data Scientist", departmentName: "Analytics", siteName: "San Francisco", imageUrl: null },
    { fullName: "Lisa Wang", email: "lisa.wang@company.com", empNumber: "EMP003", position: "BI Developer", departmentName: "Analytics", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=9" },
    { fullName: "David Kim", email: "david.kim@company.com", empNumber: "EMP004", position: "Analytics Manager", departmentName: "Analytics", siteName: "Boston", imageUrl: null },
    { fullName: "Emma Davis", email: "emma.davis@company.com", empNumber: "EMP005", position: "Data Engineer", departmentName: "Analytics", siteName: "Chicago", imageUrl: "https://i.pravatar.cc/150?img=10" },
    { fullName: "John Smith", email: "john.smith@company.com", empNumber: "EMP006", position: "Lead Analyst", departmentName: "Analytics", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=12" },
    
    // Project Management experts
    { fullName: "Tom Wilson", email: "tom.wilson@company.com", empNumber: "EMP007", position: "Project Manager", departmentName: "PMO", siteName: "New York", imageUrl: null },
    { fullName: "Amy Brown", email: "amy.brown@company.com", empNumber: "EMP008", position: "Scrum Master", departmentName: "PMO", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=16" },
    { fullName: "Chris Lee", email: "chris.lee@company.com", empNumber: "EMP009", position: "Program Manager", departmentName: "PMO", siteName: "Boston", imageUrl: "https://i.pravatar.cc/150?img=17" },
    { fullName: "Rachel Green", email: "rachel.green@company.com", empNumber: "EMP010", position: "Agile Coach", departmentName: "PMO", siteName: "Chicago", imageUrl: null },
    { fullName: "Mark Taylor", email: "mark.taylor@company.com", empNumber: "EMP011", position: "Senior PM", departmentName: "PMO", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=19" },
    { fullName: "Nina Patel", email: "nina.patel@company.com", empNumber: "EMP012", position: "Portfolio Manager", departmentName: "PMO", siteName: "San Francisco", imageUrl: null },
    
    // Cloud Architecture experts
    { fullName: "Alex Kumar", email: "alex.kumar@company.com", empNumber: "EMP013", position: "Cloud Architect", departmentName: "Infrastructure", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=33" },
    { fullName: "Jessica Lee", email: "jessica.lee@company.com", empNumber: "EMP014", position: "DevOps Engineer", departmentName: "Infrastructure", siteName: "San Francisco", imageUrl: "https://i.pravatar.cc/150?img=20" },
    { fullName: "Ryan Park", email: "ryan.park@company.com", empNumber: "EMP015", position: "AWS Specialist", departmentName: "Infrastructure", siteName: "New York", imageUrl: null },
    { fullName: "Sofia Martinez", email: "sofia.martinez@company.com", empNumber: "EMP016", position: "Azure Engineer", departmentName: "Infrastructure", siteName: "Boston", imageUrl: "https://i.pravatar.cc/150?img=27" },
    { fullName: "Kevin Wu", email: "kevin.wu@company.com", empNumber: "EMP017", position: "Cloud Security", departmentName: "Infrastructure", siteName: "Chicago", imageUrl: null },
    { fullName: "Anna Jones", email: "anna.jones@company.com", empNumber: "EMP018", position: "GCP Architect", departmentName: "Infrastructure", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=29" },
    
    // Machine Learning experts
    { fullName: "Dr. Elena Rodriguez", email: "elena.rodriguez@company.com", empNumber: "EMP019", position: "ML Research Lead", departmentName: "AI Research", siteName: "San Francisco", imageUrl: "https://i.pravatar.cc/150?img=31" },
    { fullName: "James Liu", email: "james.liu@company.com", empNumber: "EMP020", position: "ML Engineer", departmentName: "AI Research", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=32" },
    { fullName: "Priya Sharma", email: "priya.sharma@company.com", empNumber: "EMP021", position: "AI Researcher", departmentName: "AI Research", siteName: "Boston", imageUrl: null },
    { fullName: "Daniel Moore", email: "daniel.moore@company.com", empNumber: "EMP022", position: "NLP Specialist", departmentName: "AI Research", siteName: "New York", imageUrl: "https://i.pravatar.cc/150?img=34" },
    { fullName: "Maya Chen", email: "maya.chen@company.com", empNumber: "EMP023", position: "Computer Vision", departmentName: "AI Research", siteName: "Chicago", imageUrl: null },
    { fullName: "Leo Zhang", email: "leo.zhang@company.com", empNumber: "EMP024", position: "Deep Learning", departmentName: "AI Research", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=36" },
    
    // UX/UI Design experts
    { fullName: "Olivia White", email: "olivia.white@company.com", empNumber: "EMP025", position: "UX Designer", departmentName: "Design", siteName: "New York", imageUrl: "https://i.pravatar.cc/150?img=38" },
    { fullName: "Ethan Brown", email: "ethan.brown@company.com", empNumber: "EMP026", position: "UI Designer", departmentName: "Design", siteName: "San Francisco", imageUrl: null },
    { fullName: "Chloe Kim", email: "chloe.kim@company.com", empNumber: "EMP027", position: "Product Designer", departmentName: "Design", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=40" },
    { fullName: "Noah Davis", email: "noah.davis@company.com", empNumber: "EMP028", position: "UX Researcher", departmentName: "Design", siteName: "Boston", imageUrl: "https://i.pravatar.cc/150?img=41" },
    { fullName: "Ava Wilson", email: "ava.wilson@company.com", empNumber: "EMP029", position: "Design Lead", departmentName: "Design", siteName: "Chicago", imageUrl: null },
    { fullName: "Liam Garcia", email: "liam.garcia@company.com", empNumber: "EMP030", position: "Interaction Designer", departmentName: "Design", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=43" },
    
    // Cybersecurity experts
    { fullName: "Robert Miller", email: "robert.miller@company.com", empNumber: "EMP031", position: "Security Director", departmentName: "Security", siteName: "New York", imageUrl: "https://i.pravatar.cc/150?img=44" },
    { fullName: "Grace Lee", email: "grace.lee@company.com", empNumber: "EMP032", position: "Security Analyst", departmentName: "Security", siteName: "San Francisco", imageUrl: null },
    { fullName: "Sam Johnson", email: "sam.johnson@company.com", empNumber: "EMP033", position: "Penetration Tester", departmentName: "Security", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=46" },
    { fullName: "Emily Chen", email: "emily.chen@company.com", empNumber: "EMP034", position: "SOC Manager", departmentName: "Security", siteName: "Boston", imageUrl: "https://i.pravatar.cc/150?img=47" },
    { fullName: "Jack Williams", email: "jack.williams@company.com", empNumber: "EMP035", position: "Security Engineer", departmentName: "Security", siteName: "Chicago", imageUrl: null },
    { fullName: "Zoe Adams", email: "zoe.adams@company.com", empNumber: "EMP036", position: "Compliance Lead", departmentName: "Security", siteName: "Austin", imageUrl: "https://i.pravatar.cc/150?img=49" },
    
    // Financial Modeling experts
    { fullName: "Michael Scott", email: "michael.scott@company.com", empNumber: "EMP037", position: "Financial Analyst", departmentName: "Finance", siteName: "New York", imageUrl: null },
    { fullName: "Angela Martin", email: "angela.martin@company.com", empNumber: "EMP038", position: "Senior Analyst", departmentName: "Finance", siteName: "San Francisco", imageUrl: "https://i.pravatar.cc/150?img=51" },
    { fullName: "Oscar Martinez", email: "oscar.martinez@company.com", empNumber: "EMP039", position: "Finance Manager", departmentName: "Finance", siteName: "Seattle", imageUrl: "https://i.pravatar.cc/150?img=52" },
    { fullName: "Kevin Malone", email: "kevin.malone@company.com", empNumber: "EMP040", position: "Budget Analyst", departmentName: "Finance", siteName: "Boston", imageUrl: null },
    { fullName: "Stanley Hudson", email: "stanley.hudson@company.com", empNumber: "EMP041", position: "FP&A Manager", departmentName: "Finance", siteName: "Chicago", imageUrl: "https://i.pravatar.cc/150?img=54" },
    { fullName: "Phyllis Vance", email: "phyllis.vance@company.com", empNumber: "EMP042", position: "Financial Modeler", departmentName: "Finance", siteName: "Austin", imageUrl: null },
    
    // Supply Chain experts
    { fullName: "Tony Stark", email: "tony.stark@company.com", empNumber: "EMP043", position: "Supply Chain Director", departmentName: "Operations", siteName: "New York", imageUrl: "https://i.pravatar.cc/150?img=56" },
    { fullName: "Pepper Potts", email: "pepper.potts@company.com", empNumber: "EMP044", position: "Logistics Manager", departmentName: "Operations", siteName: "San Francisco", imageUrl: "https://i.pravatar.cc/150?img=57" },
    { fullName: "Bruce Banner", email: "bruce.banner@company.com", empNumber: "EMP045", position: "Operations Analyst", departmentName: "Operations", siteName: "Seattle", imageUrl: null },
    { fullName: "Natasha Romanoff", email: "natasha.romanoff@company.com", empNumber: "EMP046", position: "Procurement Lead", departmentName: "Operations", siteName: "Boston", imageUrl: "https://i.pravatar.cc/150?img=59" },
    { fullName: "Steve Rogers", email: "steve.rogers@company.com", empNumber: "EMP047", position: "Supply Planner", departmentName: "Operations", siteName: "Chicago", imageUrl: "https://i.pravatar.cc/150?img=60" },
    { fullName: "Thor Odinson", email: "thor.odinson@company.com", empNumber: "EMP048", position: "Inventory Manager", departmentName: "Operations", siteName: "Austin", imageUrl: null },
  ];

  const employeeMap: Record<string, any> = {};
  for (const emp of employeesData) {
    const employee = await prisma.employee.upsert({
      where: { empNumber: emp.empNumber },
      update: emp,
      create: emp,
    });
    employeeMap[emp.fullName] = employee;
    console.log(`Employee "${emp.fullName}" created or updated`);
  }

  // 7. Create SME Profiles for featured employees
  const featuredSmes = [
    "Dr. Elena Rodriguez",
    "Alex Kumar", 
    "Robert Miller",
    "Jessica Lee"
  ];

  for (const name of featuredSmes) {
    await prisma.smeProfile.upsert({
      where: { employeeId: employeeMap[name].employeeId },
      update: {
        status: "APPROVED",
        bio: `${name} is a leading expert in their field with years of experience and related technologies. Top-rated expert with extensive experience. Available for consultation, mentorship, and training sessions.`,
        availability: "Mon-Fri, 9AM-5PM",
      },
      create: {
        employeeId: employeeMap[name].employeeId,
        status: "APPROVED",
        bio: `${name} is a leading expert in their field with years of experience and related technologies. Top-rated expert with extensive experience. Available for consultation, mentorship, and training sessions.`,
        availability: "Mon-Fri, 9AM-5PM",
      },
    });
    console.log(`SME Profile created or updated for "${name}"`);
  }

  // 8. Create SME Profiles and Skills for each skill area
  const skillEmployeeMapping = [
    { skill: "Data Analytics", employees: ["Sarah Chen", "Mike Johnson", "Lisa Wang", "David Kim", "Emma Davis", "John Smith"] },
    { skill: "Project Management", employees: ["Tom Wilson", "Amy Brown", "Chris Lee", "Rachel Green", "Mark Taylor", "Nina Patel"] },
    { skill: "Cloud Architecture", employees: ["Alex Kumar", "Jessica Lee", "Ryan Park", "Sofia Martinez", "Kevin Wu", "Anna Jones"] },
    { skill: "Machine Learning", employees: ["Dr. Elena Rodriguez", "James Liu", "Priya Sharma", "Daniel Moore", "Maya Chen", "Leo Zhang"] },
    { skill: "UX/UI Design", employees: ["Olivia White", "Ethan Brown", "Chloe Kim", "Noah Davis", "Ava Wilson", "Liam Garcia"] },
    { skill: "Cybersecurity", employees: ["Robert Miller", "Grace Lee", "Sam Johnson", "Emily Chen", "Jack Williams", "Zoe Adams"] },
    { skill: "Financial Modeling", employees: ["Michael Scott", "Angela Martin", "Oscar Martinez", "Kevin Malone", "Stanley Hudson", "Phyllis Vance"] },
    { skill: "Supply Chain Management", employees: ["Tony Stark", "Pepper Potts", "Bruce Banner", "Natasha Romanoff", "Steve Rogers", "Thor Odinson"] },
  ];

  for (const mapping of skillEmployeeMapping) {
    const skill = skillMap[mapping.skill];
    
    for (let i = 0; i < mapping.employees.length; i++) {
      const empName = mapping.employees[i];
      const employee = employeeMap[empName];
      
      // Create SME profile if doesn't exist
      let smeProfile = await prisma.smeProfile.findUnique({
        where: { employeeId: employee.employeeId },
      });
      
      if (!smeProfile) {
        smeProfile = await prisma.smeProfile.create({
          data: {
            employeeId: employee.employeeId,
            status: "APPROVED",
            bio: `Experienced professional in ${mapping.skill} with extensive hands-on expertise and related technologies. Top-rated expert with extensive experience. Available for consultation, mentorship, and training sessions.`,
            availability: "Available for consultations",
          },
        });
      }
      
      // Create SME Skill with proficiency
      const proficiencies = ["EXPERT", "ADVANCED", "ADVANCED", "INTERMEDIATE", "INTERMEDIATE", "INTERMEDIATE"];
      
      // Check if SME skill already exists
      const existingSmeSkill = await prisma.smeSkill.findUnique({
        where: {
          smeId_skillId: {
            smeId: smeProfile.smeId,
            skillId: skill.skillId,
          },
        },
      });
      
      if (!existingSmeSkill) {
        await prisma.smeSkill.create({
          data: {
            smeId: smeProfile.smeId,
            skillId: skill.skillId,
            proficiency: proficiencies[i],
            yearsExp: 5 - i + Math.random() * 3,
            isActive: true,
          },
        });
      }
      
      // Create some endorsements (more for top experts)
      const endorsementCount = 6 - i; // Top experts get more endorsements
      for (let j = 0; j < endorsementCount; j++) {
        // Pick random employees to endorse (avoid self-endorsement)
        const endorserIndex = (i + j + 1) % mapping.employees.length;
        const endorser = employeeMap[mapping.employees[endorserIndex]];
        
        try {
          await prisma.endorsement.create({
            data: {
              smeSkillId: (await prisma.smeSkill.findFirst({
                where: {
                  smeId: smeProfile.smeId,
                  skillId: skill.skillId,
                },
              }))!.smeSkillId,
              endorsedByEmployeeId: endorser.employeeId,
              comment: `Great expertise in ${mapping.skill}!`,
            },
          });
        } catch (e) {
          // Skip duplicate endorsements
        }
      }
    }
    
    console.log(`Created SME profiles and skills for "${mapping.skill}"`);
  }

  // 9. Create certifications for SMEs
  const certificationTemplates = [
    "Professional Certification",
    "Advanced Training",
    "Industry Expert",
    "Certified Specialist",
    "Master Certification",
  ];

  // Add certifications to some SMEs
  const allSmeProfiles = await prisma.smeProfile.findMany();
  for (const sme of allSmeProfiles) {
    const certCount = Math.floor(Math.random() * 3) + 1; // 1-3 certs per SME
    for (let i = 0; i < certCount; i++) {
      await prisma.smeCertification.create({
        data: {
          smeId: sme.smeId,
          title: certificationTemplates[i],
          issuer: "Professional Institute",
          issuedDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
        },
      });
    }
  }
  console.log("Created certifications for SMEs");

  // 10. Add additional skills to some SMEs for variety
  const additionalSkillMappings = [
    { sme: "Alex Kumar", additionalSkills: ["Project Management", "Leadership", "Communication"] },
    { sme: "Dr. Elena Rodriguez", additionalSkills: ["Data Analytics", "Cloud Architecture", "Leadership"] },
    { sme: "Robert Miller", additionalSkills: ["Cloud Architecture", "Project Management", "Communication"] },
    { sme: "Jessica Lee", additionalSkills: ["Cybersecurity", "Data Analytics", "Leadership"] },
  ];

  for (const mapping of additionalSkillMappings) {
    const employee = employeeMap[mapping.sme];
    const smeProfile = await prisma.smeProfile.findUnique({
      where: { employeeId: employee.employeeId },
    });

    if (smeProfile) {
      for (const skillName of mapping.additionalSkills) {
        const skill = skillMap[skillName];
        if (skill) {
          try {
            await prisma.smeSkill.create({
              data: {
                smeId: smeProfile.smeId,
                skillId: skill.skillId,
                proficiency: "ADVANCED",
                yearsExp: 3 + Math.random() * 2,
                isActive: true,
              },
            });
          } catch (e) {
            // Skip if skill already exists
          }
        }
      }
    }
  }
  console.log("Added additional skills to featured SMEs");

  // 11. Create Training Courses for SMEs
  const courseTemplates = [
    // Data Analytics Courses
    { skill: "Data Analytics", title: "Introduction to Data Visualization with Power BI", description: "Learn how to create compelling dashboards and reports using Microsoft Power BI. This course covers data connections, DAX formulas, and best practices for visual storytelling.", targetAudience: "Business analysts, managers, and anyone interested in data visualization", durationMinutes: 90, deliveryMode: "TEAMS" },
    { skill: "Data Analytics", title: "Advanced SQL for Data Analysis", description: "Master complex SQL queries, window functions, CTEs, and performance optimization techniques for large-scale data analysis.", targetAudience: "Data analysts, developers, and database professionals", durationMinutes: 120, deliveryMode: "IN_PERSON" },
    { skill: "Data Analytics", title: "Python for Data Science Fundamentals", description: "Get started with Python programming for data science. Covers pandas, numpy, matplotlib, and basic statistical analysis.", targetAudience: "Beginners in data science and programming", durationMinutes: 180, deliveryMode: "HYBRID" },
    
    // Project Management Courses
    { skill: "Project Management", title: "Agile & Scrum Fundamentals", description: "Comprehensive introduction to Agile methodology and Scrum framework. Learn sprint planning, daily standups, retrospectives, and velocity tracking.", targetAudience: "Project managers, team leads, and developers", durationMinutes: 120, deliveryMode: "TEAMS" },
    { skill: "Project Management", title: "Stakeholder Management Best Practices", description: "Learn effective strategies for identifying, analyzing, and managing stakeholders throughout the project lifecycle.", targetAudience: "Project managers and business analysts", durationMinutes: 60, deliveryMode: "TEAMS" },
    { skill: "Project Management", title: "Risk Management in Complex Projects", description: "Identify, assess, and mitigate project risks. Covers risk registers, Monte Carlo simulation, and contingency planning.", targetAudience: "Senior project managers and program managers", durationMinutes: 90, deliveryMode: "IN_PERSON" },
    
    // Cloud Architecture Courses
    { skill: "Cloud Architecture", title: "AWS Solutions Architect Prep Course", description: "Prepare for the AWS Solutions Architect Associate certification. Covers EC2, S3, VPC, IAM, Lambda, and architectural best practices.", targetAudience: "Cloud engineers and architects", durationMinutes: 240, deliveryMode: "HYBRID" },
    { skill: "Cloud Architecture", title: "Kubernetes for Beginners", description: "Introduction to container orchestration with Kubernetes. Learn pods, deployments, services, and basic cluster management.", targetAudience: "DevOps engineers and developers", durationMinutes: 150, deliveryMode: "TEAMS" },
    { skill: "Cloud Architecture", title: "Infrastructure as Code with Terraform", description: "Learn to provision and manage cloud infrastructure using Terraform. Covers HCL syntax, modules, state management, and CI/CD integration.", targetAudience: "Cloud engineers and DevOps professionals", durationMinutes: 120, deliveryMode: "TEAMS" },
    
    // Machine Learning Courses
    { skill: "Machine Learning", title: "Machine Learning Fundamentals", description: "Introduction to ML concepts including supervised/unsupervised learning, model evaluation, and common algorithms like linear regression, decision trees, and clustering.", targetAudience: "Data scientists and developers new to ML", durationMinutes: 180, deliveryMode: "IN_PERSON" },
    { skill: "Machine Learning", title: "Deep Learning with PyTorch", description: "Build neural networks using PyTorch. Covers tensors, autograd, CNNs, RNNs, and transfer learning techniques.", targetAudience: "ML engineers and researchers", durationMinutes: 240, deliveryMode: "HYBRID" },
    { skill: "Machine Learning", title: "Natural Language Processing Workshop", description: "Hands-on workshop covering text preprocessing, word embeddings, sentiment analysis, and transformer models.", targetAudience: "Data scientists interested in NLP", durationMinutes: 180, deliveryMode: "TEAMS" },
    
    // UX/UI Design Courses
    { skill: "UX/UI Design", title: "Design Thinking Workshop", description: "Interactive workshop on the design thinking process: empathize, define, ideate, prototype, and test. Includes hands-on exercises.", targetAudience: "Product teams, designers, and anyone involved in product development", durationMinutes: 180, deliveryMode: "IN_PERSON" },
    { skill: "UX/UI Design", title: "Figma Masterclass", description: "Become proficient in Figma for UI design. Covers components, auto-layout, prototyping, design systems, and collaboration features.", targetAudience: "UI designers and front-end developers", durationMinutes: 120, deliveryMode: "TEAMS" },
    { skill: "UX/UI Design", title: "User Research Methods", description: "Learn qualitative and quantitative research methods including user interviews, surveys, usability testing, and A/B testing.", targetAudience: "UX researchers and product managers", durationMinutes: 90, deliveryMode: "TEAMS" },
    
    // Cybersecurity Courses
    { skill: "Cybersecurity", title: "Security Awareness Training", description: "Essential security training covering phishing, social engineering, password hygiene, and safe browsing practices.", targetAudience: "All employees", durationMinutes: 45, deliveryMode: "TEAMS" },
    { skill: "Cybersecurity", title: "Penetration Testing Fundamentals", description: "Introduction to ethical hacking and penetration testing. Covers reconnaissance, scanning, exploitation, and reporting.", targetAudience: "Security professionals and IT staff", durationMinutes: 180, deliveryMode: "IN_PERSON" },
    { skill: "Cybersecurity", title: "Incident Response Planning", description: "Learn to develop and implement incident response plans. Covers detection, containment, eradication, recovery, and lessons learned.", targetAudience: "Security teams and IT managers", durationMinutes: 120, deliveryMode: "HYBRID" },
    
    // Financial Modeling Courses
    { skill: "Financial Modeling", title: "Excel for Financial Analysis", description: "Advanced Excel techniques for financial modeling including XLOOKUP, dynamic arrays, Power Query, and financial functions.", targetAudience: "Financial analysts and accountants", durationMinutes: 120, deliveryMode: "TEAMS" },
    { skill: "Financial Modeling", title: "DCF Valuation Workshop", description: "Hands-on workshop building discounted cash flow models. Covers forecasting, WACC calculation, terminal value, and sensitivity analysis.", targetAudience: "Investment analysts and corporate finance professionals", durationMinutes: 180, deliveryMode: "IN_PERSON" },
    { skill: "Financial Modeling", title: "Budgeting and Forecasting Best Practices", description: "Learn modern budgeting approaches including driver-based budgeting, rolling forecasts, and variance analysis.", targetAudience: "Finance managers and FP&A professionals", durationMinutes: 90, deliveryMode: "TEAMS" },
    
    // Supply Chain Courses
    { skill: "Supply Chain Management", title: "Demand Forecasting Techniques", description: "Learn statistical forecasting methods, demand sensing, and how to improve forecast accuracy using ML techniques.", targetAudience: "Supply chain planners and demand analysts", durationMinutes: 120, deliveryMode: "TEAMS" },
    { skill: "Supply Chain Management", title: "Lean Six Sigma Yellow Belt", description: "Introduction to Lean and Six Sigma methodologies. Covers waste elimination, DMAIC, process mapping, and basic statistical tools.", targetAudience: "Operations professionals and process improvement teams", durationMinutes: 240, deliveryMode: "HYBRID" },
    { skill: "Supply Chain Management", title: "SAP ERP Overview", description: "Overview of SAP ERP for supply chain management. Covers MM, PP, SD, and WM modules with hands-on demos.", targetAudience: "Supply chain professionals and ERP users", durationMinutes: 150, deliveryMode: "IN_PERSON" },
  ];

  // Get first SME for each skill to assign courses
  for (const course of courseTemplates) {
    const mapping = skillEmployeeMapping.find(m => m.skill === course.skill);
    if (mapping) {
      // Get first 2 employees from each skill area to create courses
      for (let i = 0; i < 2; i++) {
        const empName = mapping.employees[i];
        if (empName) {
          const employee = employeeMap[empName];
          const smeProfile = await prisma.smeProfile.findUnique({
            where: { employeeId: employee.employeeId },
          });
          
          if (smeProfile && i === 0) {
            // Create course only for first expert in each area
            const existingCourse = await prisma.course.findFirst({
              where: {
                smeId: smeProfile.smeId,
                title: course.title,
              },
            });
            
            if (!existingCourse) {
              // Schedule some courses in the future, some in the past
              const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
              const scheduledDate = new Date();
              scheduledDate.setDate(scheduledDate.getDate() + daysOffset);
              
              await prisma.course.create({
                data: {
                  smeId: smeProfile.smeId,
                  title: course.title,
                  description: course.description,
                  targetAudience: course.targetAudience,
                  durationMinutes: course.durationMinutes,
                  deliveryMode: course.deliveryMode,
                  scheduledDate: scheduledDate,
                  isPublished: Math.random() > 0.3, // 70% published
                },
              });
            }
          }
        }
      }
    }
  }
  console.log("Created training courses for SMEs");

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
