import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Password hashing using scrypt (compatible with better-auth)
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    require("crypto").scrypt(password, salt, 64, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

// Generate a unique ID (similar to cuid)
function generateId(): string {
  return randomBytes(16).toString("hex");
}

// Figma icon URLs
const icons = {
  dataAnalytics: "https://www.figma.com/api/mcp/asset/f22b2b4a-198e-4088-9346-d2546b2e7eac",
  projectManagement: "https://www.figma.com/api/mcp/asset/e49359a9-b7e2-4d06-aa17-e7e7c069b442",
  cloudArchitecture: "https://www.figma.com/api/mcp/asset/1ce4173a-a361-4345-b677-252eb53f9dc9",
  machineLearning: "https://www.figma.com/api/mcp/asset/c7451f0f-24b5-4c31-bf85-76fbe03638ba",
  uxDesign: "https://www.figma.com/api/mcp/asset/89bc3c8b-f464-4da2-afb8-8e2c7dcf443a",
  cybersecurity: "https://www.figma.com/api/mcp/asset/aba9223a-c604-4df9-ad09-cf3827554538",
  financialModeling: "https://www.figma.com/api/mcp/asset/9df26c40-a0d2-430a-985f-5718e2972548",
  supplyChain: "https://www.figma.com/api/mcp/asset/2dfa4fde-e412-4407-bb5d-d6fa3d84459d",
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
      iconUrl: icons.dataAnalytics,
    },
    {
      skillName: "Project Management",
      categoryId: categoryMap["Business"].categoryId,
      description: "Agile, Scrum, Waterfall, and hybrid project management methodologies with PMP and SAFe certifications",
      iconUrl: icons.projectManagement,
    },
    {
      skillName: "Cloud Architecture",
      categoryId: categoryMap["Technology"].categoryId,
      description: "AWS, Azure, GCP infrastructure design, serverless computing, microservices, and cloud-native application development",
      iconUrl: icons.cloudArchitecture,
    },
    {
      skillName: "Machine Learning",
      categoryId: categoryMap["Technology"].categoryId,
      description: "AI/ML model development, deep learning frameworks (TensorFlow, PyTorch), neural networks, and NLP applications",
      iconUrl: icons.machineLearning,
    },
    {
      skillName: "UX/UI Design",
      categoryId: categoryMap["Design"].categoryId,
      description: "User experience research, interface design, prototyping with Figma, user testing, and design systems",
      iconUrl: icons.uxDesign,
    },
    {
      skillName: "Cybersecurity",
      categoryId: categoryMap["Technology"].categoryId,
      description: "Network security, penetration testing, threat detection, incident response, compliance (ISO 27001, SOC 2), and SIEM tools",
      iconUrl: icons.cybersecurity,
    },
    {
      skillName: "Financial Modeling",
      categoryId: categoryMap["Finance"].categoryId,
      description: "Financial forecasting, DCF valuation, scenario analysis, risk modeling, and Excel/SQL expertise",
      iconUrl: icons.financialModeling,
    },
    {
      skillName: "Supply Chain Management",
      categoryId: categoryMap["Business"].categoryId,
      description: "Logistics optimization, inventory management, demand forecasting, procurement strategies, and ERP systems (SAP, Oracle)",
      iconUrl: icons.supplyChain,
    },
    {
      skillName: "Leadership",
      categoryId: categoryMap["Business"].categoryId,
      description: "Team leadership, strategic planning, organizational development, and change management",
      iconUrl: icons.projectManagement,
    },
    {
      skillName: "Communication",
      categoryId: categoryMap["Business"].categoryId,
      description: "Professional communication, presentation skills, stakeholder management, and technical writing",
      iconUrl: icons.projectManagement,
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
    { fullName: "Sarah Chen", email: "sarah.chen@company.com", empNumber: "EMP001", position: "Senior Data Analyst", departmentName: "Analytics", siteName: "New York", avatarUrl: null },
    { fullName: "Mike Johnson", email: "mike.johnson@company.com", empNumber: "EMP002", position: "Data Scientist", departmentName: "Analytics", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Lisa Wang", email: "lisa.wang@company.com", empNumber: "EMP003", position: "BI Developer", departmentName: "Analytics", siteName: "Seattle", avatarUrl: null },
    { fullName: "David Kim", email: "david.kim@company.com", empNumber: "EMP004", position: "Analytics Manager", departmentName: "Analytics", siteName: "Boston", avatarUrl: null },
    { fullName: "Emma Davis", email: "emma.davis@company.com", empNumber: "EMP005", position: "Data Engineer", departmentName: "Analytics", siteName: "Chicago", avatarUrl: null },
    { fullName: "John Smith", email: "john.smith@company.com", empNumber: "EMP006", position: "Lead Analyst", departmentName: "Analytics", siteName: "Austin", avatarUrl: null },
    
    // Project Management experts
    { fullName: "Tom Wilson", email: "tom.wilson@company.com", empNumber: "EMP007", position: "Project Manager", departmentName: "PMO", siteName: "New York", avatarUrl: null },
    { fullName: "Amy Brown", email: "amy.brown@company.com", empNumber: "EMP008", position: "Scrum Master", departmentName: "PMO", siteName: "Seattle", avatarUrl: null },
    { fullName: "Chris Lee", email: "chris.lee@company.com", empNumber: "EMP009", position: "Program Manager", departmentName: "PMO", siteName: "Boston", avatarUrl: null },
    { fullName: "Rachel Green", email: "rachel.green@company.com", empNumber: "EMP010", position: "Agile Coach", departmentName: "PMO", siteName: "Chicago", avatarUrl: null },
    { fullName: "Mark Taylor", email: "mark.taylor@company.com", empNumber: "EMP011", position: "Senior PM", departmentName: "PMO", siteName: "Austin", avatarUrl: null },
    { fullName: "Nina Patel", email: "nina.patel@company.com", empNumber: "EMP012", position: "Portfolio Manager", departmentName: "PMO", siteName: "San Francisco", avatarUrl: null },
    
    // Cloud Architecture experts
    { fullName: "Alex Kumar", email: "alex.kumar@company.com", empNumber: "EMP013", position: "Cloud Architect", departmentName: "Infrastructure", siteName: "Seattle", avatarUrl: null },
    { fullName: "Jessica Lee", email: "jessica.lee@company.com", empNumber: "EMP014", position: "DevOps Engineer", departmentName: "Infrastructure", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Ryan Park", email: "ryan.park@company.com", empNumber: "EMP015", position: "AWS Specialist", departmentName: "Infrastructure", siteName: "New York", avatarUrl: null },
    { fullName: "Sofia Martinez", email: "sofia.martinez@company.com", empNumber: "EMP016", position: "Azure Engineer", departmentName: "Infrastructure", siteName: "Boston", avatarUrl: null },
    { fullName: "Kevin Wu", email: "kevin.wu@company.com", empNumber: "EMP017", position: "Cloud Security", departmentName: "Infrastructure", siteName: "Chicago", avatarUrl: null },
    { fullName: "Anna Jones", email: "anna.jones@company.com", empNumber: "EMP018", position: "GCP Architect", departmentName: "Infrastructure", siteName: "Austin", avatarUrl: null },
    
    // Machine Learning experts
    { fullName: "Dr. Elena Rodriguez", email: "elena.rodriguez@company.com", empNumber: "EMP019", position: "ML Research Lead", departmentName: "AI Research", siteName: "San Francisco", avatarUrl: null },
    { fullName: "James Liu", email: "james.liu@company.com", empNumber: "EMP020", position: "ML Engineer", departmentName: "AI Research", siteName: "Seattle", avatarUrl: null },
    { fullName: "Priya Sharma", email: "priya.sharma@company.com", empNumber: "EMP021", position: "AI Researcher", departmentName: "AI Research", siteName: "Boston", avatarUrl: null },
    { fullName: "Daniel Moore", email: "daniel.moore@company.com", empNumber: "EMP022", position: "NLP Specialist", departmentName: "AI Research", siteName: "New York", avatarUrl: null },
    { fullName: "Maya Chen", email: "maya.chen@company.com", empNumber: "EMP023", position: "Computer Vision", departmentName: "AI Research", siteName: "Chicago", avatarUrl: null },
    { fullName: "Leo Zhang", email: "leo.zhang@company.com", empNumber: "EMP024", position: "Deep Learning", departmentName: "AI Research", siteName: "Austin", avatarUrl: null },
    
    // UX/UI Design experts
    { fullName: "Olivia White", email: "olivia.white@company.com", empNumber: "EMP025", position: "UX Designer", departmentName: "Design", siteName: "New York", avatarUrl: null },
    { fullName: "Ethan Brown", email: "ethan.brown@company.com", empNumber: "EMP026", position: "UI Designer", departmentName: "Design", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Chloe Kim", email: "chloe.kim@company.com", empNumber: "EMP027", position: "Product Designer", departmentName: "Design", siteName: "Seattle", avatarUrl: null },
    { fullName: "Noah Davis", email: "noah.davis@company.com", empNumber: "EMP028", position: "UX Researcher", departmentName: "Design", siteName: "Boston", avatarUrl: null },
    { fullName: "Ava Wilson", email: "ava.wilson@company.com", empNumber: "EMP029", position: "Design Lead", departmentName: "Design", siteName: "Chicago", avatarUrl: null },
    { fullName: "Liam Garcia", email: "liam.garcia@company.com", empNumber: "EMP030", position: "Interaction Designer", departmentName: "Design", siteName: "Austin", avatarUrl: null },
    
    // Cybersecurity experts
    { fullName: "Robert Miller", email: "robert.miller@company.com", empNumber: "EMP031", position: "Security Director", departmentName: "Security", siteName: "New York", avatarUrl: null },
    { fullName: "Grace Lee", email: "grace.lee@company.com", empNumber: "EMP032", position: "Security Analyst", departmentName: "Security", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Sam Johnson", email: "sam.johnson@company.com", empNumber: "EMP033", position: "Penetration Tester", departmentName: "Security", siteName: "Seattle", avatarUrl: null },
    { fullName: "Emily Chen", email: "emily.chen@company.com", empNumber: "EMP034", position: "SOC Manager", departmentName: "Security", siteName: "Boston", avatarUrl: null },
    { fullName: "Jack Williams", email: "jack.williams@company.com", empNumber: "EMP035", position: "Security Engineer", departmentName: "Security", siteName: "Chicago", avatarUrl: null },
    { fullName: "Zoe Adams", email: "zoe.adams@company.com", empNumber: "EMP036", position: "Compliance Lead", departmentName: "Security", siteName: "Austin", avatarUrl: null },
    
    // Financial Modeling experts
    { fullName: "Michael Scott", email: "michael.scott@company.com", empNumber: "EMP037", position: "Financial Analyst", departmentName: "Finance", siteName: "New York", avatarUrl: null },
    { fullName: "Angela Martin", email: "angela.martin@company.com", empNumber: "EMP038", position: "Senior Analyst", departmentName: "Finance", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Oscar Martinez", email: "oscar.martinez@company.com", empNumber: "EMP039", position: "Finance Manager", departmentName: "Finance", siteName: "Seattle", avatarUrl: null },
    { fullName: "Kevin Malone", email: "kevin.malone@company.com", empNumber: "EMP040", position: "Budget Analyst", departmentName: "Finance", siteName: "Boston", avatarUrl: null },
    { fullName: "Stanley Hudson", email: "stanley.hudson@company.com", empNumber: "EMP041", position: "FP&A Manager", departmentName: "Finance", siteName: "Chicago", avatarUrl: null },
    { fullName: "Phyllis Vance", email: "phyllis.vance@company.com", empNumber: "EMP042", position: "Financial Modeler", departmentName: "Finance", siteName: "Austin", avatarUrl: null },
    
    // Supply Chain experts
    { fullName: "Tony Stark", email: "tony.stark@company.com", empNumber: "EMP043", position: "Supply Chain Director", departmentName: "Operations", siteName: "New York", avatarUrl: null },
    { fullName: "Pepper Potts", email: "pepper.potts@company.com", empNumber: "EMP044", position: "Logistics Manager", departmentName: "Operations", siteName: "San Francisco", avatarUrl: null },
    { fullName: "Bruce Banner", email: "bruce.banner@company.com", empNumber: "EMP045", position: "Operations Analyst", departmentName: "Operations", siteName: "Seattle", avatarUrl: null },
    { fullName: "Natasha Romanoff", email: "natasha.romanoff@company.com", empNumber: "EMP046", position: "Procurement Lead", departmentName: "Operations", siteName: "Boston", avatarUrl: null },
    { fullName: "Steve Rogers", email: "steve.rogers@company.com", empNumber: "EMP047", position: "Supply Planner", departmentName: "Operations", siteName: "Chicago", avatarUrl: null },
    { fullName: "Thor Odinson", email: "thor.odinson@company.com", empNumber: "EMP048", position: "Inventory Manager", departmentName: "Operations", siteName: "Austin", avatarUrl: null },
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
        contactPref: "TEAMS",
      },
      create: {
        employeeId: employeeMap[name].employeeId,
        status: "APPROVED",
        bio: `${name} is a leading expert in their field with years of experience and related technologies. Top-rated expert with extensive experience. Available for consultation, mentorship, and training sessions.`,
        availability: "Mon-Fri, 9AM-5PM",
        contactPref: "TEAMS",
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
            contactPref: "TEAMS",
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
