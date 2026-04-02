/**
 * Curated Channels Constants
 * Hand-picked, high-quality YouTube channels for children ages 2-12.
 * Used as the "starter pack" for new parents setting up PlayPatch.
 */

export type AgeRange = '2+' | '4+' | '7+' | '10+';
export type ChannelCategory =
  | 'EDUCATIONAL'
  | 'MUSIC'
  | 'ANIMATION'
  | 'NATURE'
  | 'ARTS_CRAFTS'
  | 'STORIES'
  | 'SCIENCE';

export interface CuratedChannel {
  name: string;
  youtubeUrl: string;
  description: string;
  ageRanges: AgeRange[];
  categories: ChannelCategory[];
  language: string;
  featured?: boolean;
}

export const CURATED_CHANNELS: CuratedChannel[] = [
  // --- Educational / Science ---
  {
    name: 'SciShow Kids',
    youtubeUrl: 'https://www.youtube.com/@SciShowKids',
    description:
      'Fun, fast-paced science videos that answer big questions for young curious minds. Covers animals, space, nature, and experiments.',
    ageRanges: ['4+', '7+'],
    categories: ['EDUCATIONAL', 'SCIENCE'],
    language: 'English',
    featured: true,
  },
  {
    name: 'Kurzgesagt – In a Nutshell',
    youtubeUrl: 'https://www.youtube.com/@kurzgesagt',
    description:
      'Beautifully animated explainers on complex science, philosophy, and space topics. Best for older kids and pre-teens.',
    ageRanges: ['10+'],
    categories: ['EDUCATIONAL', 'SCIENCE'],
    language: 'English',
    featured: true,
  },
  {
    name: 'TED-Ed',
    youtubeUrl: 'https://www.youtube.com/@TEDEd',
    description:
      'Award-winning animated lessons on history, science, mathematics, and literature created by educators worldwide.',
    ageRanges: ['10+'],
    categories: ['EDUCATIONAL'],
    language: 'English',
    featured: true,
  },
  {
    name: 'National Geographic Kids',
    youtubeUrl: 'https://www.youtube.com/@NatGeoKids',
    description:
      'Amazing animals, wild science, and fun facts from the trusted National Geographic brand, tailored for young explorers.',
    ageRanges: ['4+', '7+'],
    categories: ['EDUCATIONAL', 'NATURE'],
    language: 'English',
    featured: true,
  },
  {
    name: 'NASA',
    youtubeUrl: 'https://www.youtube.com/@NASA',
    description:
      'Official NASA channel featuring real footage of space exploration, rocket launches, and stunning imagery of the universe.',
    ageRanges: ['7+', '10+'],
    categories: ['EDUCATIONAL', 'SCIENCE'],
    language: 'English',
  },
  {
    name: 'Crash Course Kids',
    youtubeUrl: 'https://www.youtube.com/@CrashCourseKids',
    description:
      'Curriculum-aligned science videos covering earth science, physical science, and engineering designed for 5th graders.',
    ageRanges: ['7+', '10+'],
    categories: ['EDUCATIONAL', 'SCIENCE'],
    language: 'English',
    featured: true,
  },

  // --- Music / Songs ---
  {
    name: 'Cocomelon',
    youtubeUrl: 'https://www.youtube.com/@Cocomelon',
    description:
      'Colorful 3D animated nursery rhymes and original songs that help toddlers learn the alphabet, numbers, and everyday routines.',
    ageRanges: ['2+', '4+'],
    categories: ['MUSIC', 'EDUCATIONAL'],
    language: 'English',
    featured: true,
  },
  {
    name: 'Super Simple Songs',
    youtubeUrl: 'https://www.youtube.com/@SuperSimpleSongs',
    description:
      'Gentle, easy-to-follow songs and videos for babies and toddlers that support early language development and learning.',
    ageRanges: ['2+', '4+'],
    categories: ['MUSIC', 'EDUCATIONAL'],
    language: 'English',
    featured: true,
  },
  {
    name: 'Kidz Bop',
    youtubeUrl: 'https://www.youtube.com/@KidzBop',
    description:
      'Kid-friendly versions of today\'s biggest pop hits performed by kids, for kids. Clean lyrics and fun music videos.',
    ageRanges: ['7+', '10+'],
    categories: ['MUSIC'],
    language: 'English',
  },
  {
    name: 'Sesame Street',
    youtubeUrl: 'https://www.youtube.com/@SesameStreet',
    description:
      'Classic educational show featuring beloved Muppet characters teaching letters, numbers, kindness, and social-emotional skills.',
    ageRanges: ['2+', '4+'],
    categories: ['MUSIC', 'EDUCATIONAL', 'ANIMATION'],
    language: 'English',
    featured: true,
  },

  // --- Animation / Stories ---
  {
    name: 'Bluey',
    youtubeUrl: 'https://www.youtube.com/@Bluey',
    description:
      'Clips from the beloved Australian animated series following Bluey and her family through imaginative, heartfelt adventures.',
    ageRanges: ['2+', '4+'],
    categories: ['ANIMATION'],
    language: 'English',
    featured: true,
  },
  {
    name: 'Peppa Pig',
    youtubeUrl: 'https://www.youtube.com/@PeppaPigOfficial',
    description:
      'Episodes and clips from the iconic British animated series about Peppa, a lovable piggy who enjoys muddy puddles and family fun.',
    ageRanges: ['2+', '4+'],
    categories: ['ANIMATION'],
    language: 'English',
  },
  {
    name: 'StoryBots',
    youtubeUrl: 'https://www.youtube.com/@StoryBots',
    description:
      'Award-winning educational animated series where curious little creatures explore the world and answer big questions kids ask.',
    ageRanges: ['4+', '7+'],
    categories: ['ANIMATION', 'EDUCATIONAL'],
    language: 'English',
  },
  {
    name: 'Barefoot Books',
    youtubeUrl: 'https://www.youtube.com/@BarefootBooks',
    description:
      'Animated adaptations of multicultural picture books, sing-along songs, and creative storytelling celebrating global cultures.',
    ageRanges: ['2+', '4+'],
    categories: ['ANIMATION', 'STORIES', 'MUSIC'],
    language: 'English',
  },

  // --- Nature / Animals ---
  {
    name: 'National Geographic',
    youtubeUrl: 'https://www.youtube.com/@NatGeo',
    description:
      'Stunning wildlife documentaries and nature stories from the world\'s leading explorer of our planet\'s wild places.',
    ageRanges: ['7+', '10+'],
    categories: ['NATURE', 'EDUCATIONAL'],
    language: 'English',
  },
  {
    name: 'BBC Earth',
    youtubeUrl: 'https://www.youtube.com/@BBCEarth',
    description:
      'Breathtaking nature documentaries from the BBC showcasing extraordinary wildlife moments from across the planet.',
    ageRanges: ['7+', '10+'],
    categories: ['NATURE'],
    language: 'English',
  },
  {
    name: 'Brave Wilderness',
    youtubeUrl: 'https://www.youtube.com/@BraveWilderness',
    description:
      'Coyote Peterson and his crew explore the wild, encountering incredible animals and sharing their habitats and behaviors.',
    ageRanges: ['7+', '10+'],
    categories: ['NATURE', 'EDUCATIONAL'],
    language: 'English',
  },

  // --- Arts & Crafts ---
  {
    name: 'Art for Kids Hub',
    youtubeUrl: 'https://www.youtube.com/@ArtforKidsHub',
    description:
      'Step-by-step drawing and art lessons for kids of all skill levels, taught by a dad and his kids in a fun, encouraging style.',
    ageRanges: ['4+', '7+', '10+'],
    categories: ['ARTS_CRAFTS'],
    language: 'English',
  },
  {
    name: 'DoodleNation',
    youtubeUrl: 'https://www.youtube.com/@DoodleNation',
    description:
      'Simple and fun doodle-based drawing lessons that help kids build creativity and fine motor skills one step at a time.',
    ageRanges: ['7+', '10+'],
    categories: ['ARTS_CRAFTS'],
    language: 'English',
  },
  {
    name: 'Crayola',
    youtubeUrl: 'https://www.youtube.com/@Crayola',
    description:
      'Creative craft projects, coloring ideas, and art tutorials from the beloved crayon brand, sparking imagination for all ages.',
    ageRanges: ['4+', '7+'],
    categories: ['ARTS_CRAFTS'],
    language: 'English',
  },

  // --- Coding / STEM ---
  {
    name: 'Code.org',
    youtubeUrl: 'https://www.youtube.com/@codeorg',
    description:
      'Introduction to computer science and coding concepts featuring celebrity tutorials and inspiring stories about careers in tech.',
    ageRanges: ['7+', '10+'],
    categories: ['EDUCATIONAL', 'SCIENCE'],
    language: 'English',
  },
  {
    name: 'SciShow',
    youtubeUrl: 'https://www.youtube.com/@SciShow',
    description:
      'Enthusiastic science videos covering a wide range of topics from biology and chemistry to psychology and technology.',
    ageRanges: ['10+'],
    categories: ['SCIENCE', 'EDUCATIONAL'],
    language: 'English',
  },

  // --- Stories / Early Learning ---
  {
    name: 'Khan Academy Kids',
    youtubeUrl: 'https://www.youtube.com/@KhanAcademyKids',
    description:
      'Free educational content for young learners covering reading, math, social-emotional learning, and creative play.',
    ageRanges: ['2+', '4+'],
    categories: ['EDUCATIONAL', 'STORIES'],
    language: 'English',
  },
  {
    name: 'CBeebies',
    youtubeUrl: 'https://www.youtube.com/@CBeebies',
    description:
      'BBC\'s beloved children\'s channel featuring clips, songs, and stories from popular shows that entertain and educate young children.',
    ageRanges: ['2+', '4+'],
    categories: ['ANIMATION', 'STORIES', 'EDUCATIONAL'],
    language: 'English',
  },
  {
    name: 'Learning Videos for Kids',
    youtubeUrl: 'https://www.youtube.com/@LearningVideosForKids',
    description:
      'Educational stories and lessons covering topics like geography, animals, science, and language arts for early learners.',
    ageRanges: ['4+', '7+'],
    categories: ['EDUCATIONAL', 'STORIES'],
    language: 'English',
  },
];

/**
 * Filter curated channels by age range and/or category.
 * If no filter options are provided, returns all channels.
 */
export function filterCuratedChannels(opts: {
  ageRange?: AgeRange;
  category?: ChannelCategory;
}): CuratedChannel[] {
  return CURATED_CHANNELS.filter((channel) => {
    if (opts.ageRange && !channel.ageRanges.includes(opts.ageRange)) {
      return false;
    }
    if (opts.category && !channel.categories.includes(opts.category)) {
      return false;
    }
    return true;
  });
}
