import { useEffect, useState } from "react";
import { App } from "@capacitor/app";

export interface UrlSchemeData {
  url: string;
  placeId?: string;
}

export function useUrlScheme() {
  const [urlData, setUrlData] = useState<UrlSchemeData | null>(null);

  useEffect(() => {
    const handleAppUrlOpen = (event: { url: string }) => {
      console.log("App opened with URL:", event.url);

      // Parse the URL to extract place ID
      const url = new URL(event.url);
      const placeId = url.searchParams.get("place");

      setUrlData({
        url: event.url,
        placeId: placeId || undefined,
      });
    };

    // Check if app was opened with a URL on launch
    const checkLaunchUrl = async () => {
      try {
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl && launchUrl.url) {
          handleAppUrlOpen({ url: launchUrl.url });
        }
      } catch (error) {
        console.error("Error checking launch URL:", error);
      }
    };

    // Add listener for URL events
    const listener = App.addListener("appUrlOpen", handleAppUrlOpen);

    // Check launch URL when component mounts
    checkLaunchUrl();

    return () => {
      listener.then((removal) => removal?.remove());
    };
  }, []);

  const clearUrlData = () => {
    setUrlData(null);
  };

  return {
    urlData,
    clearUrlData,
  };
}
