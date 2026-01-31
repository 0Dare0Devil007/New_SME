# SME Detail Page

## Overview
The SME detail page provides a comprehensive view of an individual subject matter expert's profile, including their skills, certifications, courses, and endorsements.

## Features

### 1. Hero Section
- **Profile Header** with purple gradient banner
- **Large avatar** (160x160px) with white border
- **Quick stats badges**:
  - Total Endorsements
  - Students Trained
  - Average Rating
  - Years of Experience
- **Department, Location, and Response Time** quick info cards
- **Action buttons**:
  - Call Now (green gradient)
  - Start Teams Meeting (blue-purple gradient)
  - Send Message (white with border)

### 2. Sidebar (Left Column)

#### Contact Information Card
- Email (clickable mailto link)
- Phone number
- Employee ID

#### Availability Card
- Work hours with timezone
- Consultation hours and days

#### Impact Summary Card (Blue Gradient)
- Total Endorsements count
- Students Trained count
- Average Rating

### 3. Main Content Area (Right Column)

#### About Section
- Biography text
- Professional background

#### Recent Endorsements
- Last 5 endorsements
- Endorser name, position, and avatar
- Skill endorsed
- Comment
- Date
- Rating (stars)

#### Skills & Expertise
- Each skill displayed as a card with:
  - Skill name
  - Proficiency level badge (Expert/Advanced/Intermediate)
  - Endorsement count
  - "Endorse" button
- Color-coded by proficiency:
  - **Expert**: Purple
  - **Advanced**: Blue
  - **Intermediate**: Green

#### Professional Certifications
- Grid layout (2 columns on desktop)
- Each certification shows:
  - Purple icon badge
  - Certificate title
  - Issuing organization
  - Issue date
  - Expiry date
- Gradient background (purple-blue)

#### Training & Courses
- "Upcoming Sessions" section
- Each course card includes:
  - Course title and description
  - "Open" status badge
  - Duration
  - Delivery mode (Teams, In-person, etc.)
  - Target audience
  - Enrollment count (e.g., "24/30 enrolled")
  - Rating with review count
  - "Enroll Now" button (green gradient)

## Routes

### Page Route
- **Path**: `/experts/[id]/page.tsx`
- **Dynamic route** using Next.js app router
- **Client component** with data fetching

### API Route
- **Path**: `/api/experts/[id]/route.ts`
- **Method**: GET
- **Returns**: Complete expert profile with all related data

## Data Structure

The API endpoint fetches and transforms data from Prisma models:
- `Employee` (basic info)
- `SmeProfile` (profile details)
- `SmeSkill` (skills with endorsements)
- `Endorsement` (endorsement details)
- `SmeCertification` (certifications)
- `Course` (training courses)

## Design System

### Colors
- **Primary Gradient**: `from-blue-600 via-blue-700 to-indigo-800`
- **Purple Gradient**: `from-[#155dfc] to-[#4f39f6]`
- **Green Gradient**: `from-[#00a63e] to-[#096]`
- **Background**: `from-gray-50 via-blue-50/30 to-purple-50/20`

### Typography
- **Font Family**: Inter
- **Heading 1**: 36px (4xl), bold
- **Heading 2**: 20px (xl), bold
- **Heading 3**: 18px (lg), bold
- **Body**: 14px (sm), medium/regular
- **Small**: 12px (xs)

### Border Radius
- **Cards**: 16-24px (rounded-2xl, rounded-3xl)
- **Buttons**: 8px (rounded-lg)
- **Badges**: 8px (rounded-lg)
- **Avatar**: Full circle (rounded-full)

### Shadows
- **Card shadows**: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- **Colored shadows**: `shadow-green-200`, `shadow-blue-200`
- **Avatar shadow**: `shadow-2xl`

### Spacing
- **Section gaps**: 24px (gap-6)
- **Card padding**: 24px (p-6)
- **Element gaps**: 12-16px (gap-3, gap-4)

## Integration with Existing Components

### SmeCard Component
Updated to include a clickable `Link` wrapper that navigates to the detail page:
```tsx
<Link href={`/experts/${expert.id}`}>
  <div className="...">
    {/* Card content */}
  </div>
</Link>
```

## Icons
Using a combination of:
- **Lucide React icons**: ArrowLeft, Phone, Video, MessageSquare, etc.
- **Figma assets**: Cached image URLs (valid for 7 days)

## Responsive Design
- **Desktop**: 3-column layout (sidebar + main content)
- **Mobile**: Single column stack (automatically handled by Tailwind's `lg:` breakpoints)

## Future Enhancements
1. Add real-time availability status
2. Implement skill endorsement functionality
3. Add course enrollment system
4. Enable direct messaging
5. Integrate Teams meeting scheduling
6. Add reviews and testimonials section
7. Display activity timeline
8. Show related experts suggestions

## Usage

Navigate to an expert's detail page by:
1. Clicking on any expert card in the `/experts` list page
2. Direct URL: `/experts/{expertId}` (e.g., `/experts/1`)

The page will automatically fetch and display all relevant data from the database.
