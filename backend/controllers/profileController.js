import { getDB } from "../config/db.js";

export async function getProfile(req, res) {
  try {
    const db = getDB();
    const profile = await db.collection("profiles").findOne({ userId: req.userId });
    if (!profile) return res.json({});

    res.json({
      goal:                 profile.goal,
      profile:              profile.profile,
      targets:              profile.targets,
      presetFoods:          profile.presetFoods          ?? null,
      permDeletedPromoted:  profile.permDeletedPromoted  ?? [],
      everPromoted:         profile.everPromoted          ?? [],
      permDeletedPresets:   profile.permDeletedPresets   ?? [],
      tempRemovedPinned:    profile.tempRemovedPinned    ?? [],
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export async function saveProfile(req, res) {
  try {
    const {
      goal,
      profile,
      targets,
      presetFoods,
      permDeletedPromoted,
      everPromoted,
      permDeletedPresets,
      tempRemovedPinned,
    } = req.body;

    const db = getDB();
    await db.collection("profiles").updateOne(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          goal,
          profile,
          targets,
          ...(presetFoods         !== undefined && { presetFoods }),
          ...(permDeletedPromoted !== undefined && { permDeletedPromoted }),
          ...(everPromoted        !== undefined && { everPromoted }),
          ...(permDeletedPresets  !== undefined && { permDeletedPresets }),
          ...(tempRemovedPinned   !== undefined && { tempRemovedPinned }),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Save profile error:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
}