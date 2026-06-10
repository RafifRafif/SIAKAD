export const PROFILE_PHOTO_UPDATED_EVENT = 'siakad:profile-photo-updated';

export async function loadProfilePhotoUrl(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl || photoUrl.startsWith('data:') || photoUrl.startsWith('blob:')) {
    return photoUrl;
  }

  const requestUrl = new URL(photoUrl, window.location.origin);
  const sameAppApiUrl = requestUrl.pathname.startsWith('/api/')
    ? `${requestUrl.pathname}${requestUrl.search}`
    : photoUrl;

  const response = await fetch(sameAppApiUrl, {
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
