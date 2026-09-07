import * as ImagePicker from 'expo-image-picker';

export type PickedImage = { uri: string; name: string; type: string };

/**
 * Prompt for a square photo from the library, ready to hand to
 * `accountApi.updateAvatar`. Returns null if the member cancels or denies
 * permission.
 */
export async function pickAvatar(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const guessedExt = (asset.uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(guessedExt) ? guessedExt : 'jpg';

  return {
    uri: asset.uri,
    name: asset.fileName ?? `avatar.${ext}`,
    type: asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  };
}
