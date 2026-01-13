import mongoose, { Schema, model, models } from 'mongoose';

export interface ISiteSettings {
  bannerImageUrl: string;
  slideshowImages: string[];
  isBannerVisible: boolean;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    bannerImageUrl: {
      type: String,
      default: '',
    },
    slideshowImages: {
      type: [String],
      default: [],
    },
    isBannerVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SiteSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      bannerImageUrl: '',
      slideshowImages: [],
      isBannerVisible: true,
    });
  }
  return settings;
};

const SiteSettings =
  models.SiteSettings || model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;
