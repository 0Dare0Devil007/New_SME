// Random avatar URLs from various free avatar services
export const randomAvatarUrls = [
  // UI Avatars - generates avatars from names
  "https://ui-avatars.com/api/?name=John+Doe&size=200&background=random",
  "https://ui-avatars.com/api/?name=Jane+Smith&size=200&background=random",
  "https://ui-avatars.com/api/?name=Mike+Johnson&size=200&background=random",
  "https://ui-avatars.com/api/?name=Sarah+Williams&size=200&background=random",
  "https://ui-avatars.com/api/?name=David+Brown&size=200&background=random",
  
  // DiceBear Avatars - various styles
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  
  // Boring Avatars - generated geometric avatars
  "https://source.boringavatars.com/beam/200/Maria%20Rodriguez",
  "https://source.boringavatars.com/beam/200/James%20Taylor",
  "https://source.boringavatars.com/beam/200/Emily%20Davis",
  "https://source.boringavatars.com/beam/200/Robert%20Miller",
  "https://source.boringavatars.com/beam/200/Lisa%20Anderson",
  
  // More DiceBear styles
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Thomas",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Grace",
  "https://api.dicebear.com/7.x/initials/svg?seed=Henry",
];

// Function to get a random avatar URL
export function getRandomAvatarUrl(): string {
  return randomAvatarUrls[Math.floor(Math.random() * randomAvatarUrls.length)];
}

// Function to get unique avatar URLs
export function getUniqueAvatarUrls(count: number): string[] {
  const shuffled = [...randomAvatarUrls].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, randomAvatarUrls.length));
}
