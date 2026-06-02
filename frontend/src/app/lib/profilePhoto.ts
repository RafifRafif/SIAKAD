export const PROFILE_PHOTO_UPDATED_EVENT = 'siakad:profile-photo-updated';

export async function loadProfilePhotoUrl(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl || photoUrl.startsWith('data:') || photoUrl.startsWith('blob:')) {
    return photoUrl;
  }

  const response = await fetch(photoUrl, {
    credentials: 'include',
    headers: {
      Accept: 'image/*',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error('Profile photo request failed.');
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}
