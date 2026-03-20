import OrganizerModel from "../organizer.model.js";

async function applyTags(filePath, tags) {
  return OrganizerModel.applyTagsToFile(filePath, tags);
}

async function removeTag(filePath, tag) {
  return OrganizerModel.removeTagFromFile(filePath, tag);
}

export default {
  applyTags,
  removeTag
};
