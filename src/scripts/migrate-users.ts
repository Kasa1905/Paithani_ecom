/**
 * MIGRATION SCRIPT - Backward Compatibility for Existing Users
 * 
 * This script safely migrates existing users without phoneNumber to have:
 * - phoneNumber: Auto-generated valid 10-digit placeholder
 * - isPhoneVerified: true (marked as verified since they're existing users)
 * - isEmailVerified: true (existing users assumed verified)
 * - otp, otpExpiresAt, otpType: cleared
 * 
 * SAFE: No user deletion, no data loss, idempotent
 */

import mongoose from 'mongoose';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

/**
 * Generate a valid placeholder phone number for migration
 * Format: 99 + 8 random digits (all valid for Indian numbers)
 */
function generatePlaceholderPhoneNumber(): string {
  const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `99${randomDigits}`;
}

/**
 * Run migration
 * Usage: npx ts-node src/scripts/migrate-users.ts
 */
export async function migrateExistingUsers() {
  try {
    await connectDB();

    console.log('[MIGRATION] Starting backward compatibility migration...');

    // Find all users without phoneNumber
    const usersToMigrate = await User.find({ phoneNumber: { $exists: false } });

    if (usersToMigrate.length === 0) {
      console.log('[MIGRATION] ✓ No users to migrate - all users already have phone numbers');
      return { migrated: 0, failed: 0, skipped: 0 };
    }

    console.log(`[MIGRATION] Found ${usersToMigrate.length} users to migrate`);

    let migrated = 0;
    let failed = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Migrate each user
    for (const user of usersToMigrate) {
      try {
        // Generate unique placeholder phone number
        let phoneNumber = generatePlaceholderPhoneNumber();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure generated phone is unique
        while (attempts < maxAttempts) {
          const existingPhone = await User.findOne({ phoneNumber });
          if (!existingPhone) break;
          phoneNumber = generatePlaceholderPhoneNumber();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Could not generate unique phone number');
        }

        // Update user
        const updated = await User.findByIdAndUpdate(
          user._id,
          {
            phoneNumber,
            isPhoneVerified: true, // Mark as verified (existing user)
            isEmailVerified: true, // Mark as verified (existing user)
            otp: undefined,
            otpExpiresAt: undefined,
            otpType: undefined,
          },
          { new: true }
        );

        if (updated) {
          migrated++;
          console.log(`[MIGRATION] ✓ ${user.email} → ${phoneNumber}`);
        } else {
          failed++;
          errors.push({ userId: user._id.toString(), error: 'Update returned null' });
        }
      } catch (error) {
        failed++;
        errors.push({
          userId: user._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[MIGRATION] ✗ Failed for user ${user._id}:`, error);
      }
    }

    console.log('\n[MIGRATION] =================================');
    console.log(`[MIGRATION] Migrated: ${migrated}`);
    console.log(`[MIGRATION] Failed: ${failed}`);
    if (errors.length > 0) {
      console.log('[MIGRATION] Errors:');
      errors.forEach((e) => console.log(`  - ${e.userId}: ${e.error}`));
    }
    console.log('[MIGRATION] =================================\n');

    return { migrated, failed, skipped: 0 };
  } catch (error) {
    console.error('[MIGRATION ERROR]', error);
    throw error;
  }
}

// Export for use in tests or direct calls
export default migrateExistingUsers;
