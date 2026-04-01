-- CreateEnum
CREATE TYPE "PlaybackMode" AS ENUM ('NONE', 'EMBED', 'HLS');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "playbackMode" "PlaybackMode" NOT NULL DEFAULT 'NONE';
