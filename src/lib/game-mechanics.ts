import { DocumentReference, Firestore, runTransaction } from 'firebase/firestore';
import type { UserProfile } from './types';

// --- Configuration ---
export const XP_PER_LEVEL = 100;
export const XP_EVENTS = {
    LOG_MEAL: 10,
    LOG_WEIGHT: 15,
    MET_DAILY_CALORIE_GOAL: 25,
    EXCEEDED_DAILY_CALORIE_GOAL: -10,
};

interface XpChangeResult {
    newXp: number;
    newLevel: number;
    levelledUp: boolean;
}

/**
 * Calculates the new XP and level for a user.
 * @param currentXp The user's current XP.
 * @param currentLevel The user's current level.
 * @param xpChange The amount of XP to add (can be negative).
 * @returns An object with the new XP, new level, and a flag indicating if the user levelled up.
 */
export function calculateXpAndLevel(currentXp: number, currentLevel: number, xpChange: number): XpChangeResult {
    let newXp = currentXp + xpChange;
    let newLevel = currentLevel;
    let levelledUp = false;

    // Handle XP loss
    if (newXp < 0) {
        newXp = 0; // XP doesn't go below zero for the current level
    }

    // Handle level up
    while (newXp >= XP_PER_LEVEL) {
        newLevel += 1;
        newXp -= XP_PER_LEVEL;
        levelledUp = true;
    }

    return { newXp, newLevel, levelledUp };
}

/**
 * Applies an XP change to a user's profile within a Firestore transaction.
 * @param firestore The Firestore instance.
 * @param userProfileRef The DocumentReference for the user's profile.
 * @param xpChange The amount of XP to add or subtract.
 * @returns A promise that resolves with the result of the XP change.
 */
export async function applyXpChange(
    firestore: Firestore,
    userProfileRef: DocumentReference,
    xpChange: number
): Promise<XpChangeResult> {
    
    return runTransaction(firestore, async (transaction) => {
        const userProfileDoc = await transaction.get(userProfileRef);
        if (!userProfileDoc.exists()) {
            throw new Error("User profile does not exist!");
        }

        const userProfile = userProfileDoc.data() as UserProfile;
        const currentXp = userProfile.xp || 0;
        const currentLevel = userProfile.level || 1;

        const { newXp, newLevel, levelledUp } = calculateXpAndLevel(currentXp, currentLevel, xpChange);

        transaction.update(userProfileRef, {
            xp: newXp,
            level: newLevel,
        });

        return { newXp, newLevel, levelledUp };
    });
}
