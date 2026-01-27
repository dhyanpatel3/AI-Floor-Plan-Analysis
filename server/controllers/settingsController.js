const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      // Return defaults if none found, but in a structure that FE expects
      // FE expects an object with settings property or null
      return res.status(200).json({
        msg: "No settings found, using defaults",
        settings: null,
      });
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.saveSettings = async (req, res) => {
  const { projectSettings, customRates, customQuantities } = req.body;

  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    if (settings) {
      // Update existing
      settings.projectSettings = projectSettings;
      // We need to be careful with Maps.
      // Mongoose Map support expects an object or Map
      settings.customRates = customRates;
      settings.customQuantities = customQuantities;
      settings.updatedAt = Date.now();
      await settings.save();
    } else {
      // Create new
      settings = new Settings({
        userId: req.user.id,
        projectSettings,
        customRates,
        customQuantities,
      });
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
