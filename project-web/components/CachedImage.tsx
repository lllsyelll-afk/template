import {
  forwardRef,
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export async function getCachedImageUrl(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;
  return url;
}

interface CachedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src?: string | null;
  alt?: ReactNode;
}

const DefaultFallback = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex flex-col justify-center items-center bg-muted gap-2 text-muted-foreground",
      className,
    )}
  >
    <ImageIcon className="opacity-40" size={32} />
  </div>
);

export const CachedImage = forwardRef<HTMLImageElement, CachedImageProps>(
  ({ src, alt, onError, className, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setHasError(false);
    }, [src]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      onError?.(e);
    };

    const altString = typeof alt === "string" ? alt : undefined;

    if (hasError || !src) {
      return typeof alt === "string" ? (
        <img
          ref={ref}
          src={src ?? undefined}
          alt={altString}
          className={className}
          onError={handleError}
          {...props}
        />
      ) : (
        <div
          className={className}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          {alt ?? <DefaultFallback className={className} />}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={altString}
        className={className}
        onError={handleError}
        {...props}
      />
    );
  },
);

CachedImage.displayName = "CachedImage";

export function useCachedUrl(url: string | null | undefined): string | null {
  return url ?? null;
}
