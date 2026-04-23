/**
 * Repair Plex channels: consolidate story-arc channels into one proper show channel.
 *
 * The correct Plex hierarchy is:
 *   Show: The Adventures of Tintin (grandparentRatingKey: 2402)
 *     → Season 1 → 13 episodes
 *
 * The previous repair created 7 channels (one per story arc). This script:
 *   1. Creates one correct "The Adventures of Tintin" channel
 *   2. Moves all Plex videos to it
 *   3. Deletes the old story-arc channels
 *
 * Run: npx tsx scripts/repair-plex-channels.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all Plex channels
  const plexChannels = await prisma.channel.findMany({
    where: { sourceType: 'PLEX' },
    include: { videos: { select: { id: true } } },
  });

  if (plexChannels.length === 0) {
    console.log('No Plex channels found.');
    return;
  }

  console.log(`Found ${plexChannels.length} Plex channel(s):`, plexChannels.map(c => c.name));

  // Determine familyId from existing channels
  const familyId = plexChannels[0].familyId;

  // Upsert the correct show channel
  const showSourceId = 'plex:show:2402';
  const showChannel = await prisma.channel.upsert({
    where: { familyId_sourceType_sourceId: { familyId, sourceType: 'PLEX', sourceId: showSourceId } },
    create: {
      familyId,
      sourceType: 'PLEX',
      sourceId: showSourceId,
      name: 'The Adventures of Tintin',
      description: 'Season 1 · 1991',
    },
    update: {
      name: 'The Adventures of Tintin',
      description: 'Season 1 · 1991',
    },
  });
  console.log(`\nShow channel: ${showChannel.id} (${showChannel.name})`);

  // Move all Plex videos to the show channel
  const oldChannelIds = plexChannels
    .filter(c => c.id !== showChannel.id)
    .map(c => c.id);

  const updated = await prisma.video.updateMany({
    where: { sourceType: 'PLEX' },
    data: { channelId: showChannel.id },
  });
  console.log(`Moved ${updated.count} videos to "${showChannel.name}"`);

  // Delete the old story-arc channels
  if (oldChannelIds.length > 0) {
    await prisma.channel.deleteMany({ where: { id: { in: oldChannelIds } } });
    console.log(`Deleted ${oldChannelIds.length} old story-arc channel(s)`);
  }

  console.log('\nRepair complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
