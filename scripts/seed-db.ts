import { getRandomAvatarUrl, getUniqueAvatarUrls } from "@/lib/seed-avatars";

// Example: Seeding SME experts with random avatars
async function seedExperts() {
  const experts = [
    {
      name: "John Doe",
      position: "Senior Engineer",
      department: "Engineering",
      siteName: "HQ",
      avatarUrl: getRandomAvatarUrl(),
      bio: "Expert in cloud architecture and DevOps practices.",
      // ...other fields
    },
    {
      name: "Jane Smith",
      position: "Lead Designer",
      department: "Design",
      siteName: "Remote",
      avatarUrl: getRandomAvatarUrl(),
      bio: "Specializes in user experience and interface design.",
      // ...other fields
    },
    // Add more experts...
  ];

  // Or use unique avatars for all experts
  const uniqueAvatars = getUniqueAvatarUrls(experts.length);
  experts.forEach((expert, index) => {
    expert.avatarUrl = uniqueAvatars[index];
  });

  // Insert into your database
  // await db.insert(expertsTable).values(experts);
}

seedExperts();
