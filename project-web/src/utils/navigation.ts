export function openDirections(latitude: number, longitude: number): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  let url: string;

  if (isIOS) {
    url = `maps:?q=${latitude},${longitude}`;
  } else if (isAndroid) {
    url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  window.open(url, "_blank");
}
