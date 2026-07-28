import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/constants";

type BrandLogoProps = {
  className?: string;
  /** Visual size preset */
  size?: "sm" | "md" | "lg" | "hero";
  href?: string | null;
  priority?: boolean;
};

const SIZE = {
  sm: { wrap: "h-14 w-14 sm:h-16 sm:w-16", img: 64 },
  md: { wrap: "h-24 w-24 sm:h-28 sm:w-28", img: 112 },
  lg: { wrap: "h-36 w-36 sm:h-44 sm:w-44 md:h-48 md:w-48", img: 192 },
  hero: { wrap: "h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80", img: 320 },
} as const;

export function BrandLogo({
  className,
  size = "md",
  href = "/",
  priority = false,
}: BrandLogoProps) {
  const s = SIZE[size];

  const image = (
    <Image
      src="/brand/logo.png"
      alt={BUSINESS.name}
      width={s.img}
      height={s.img}
      priority={priority}
      quality={100}
      className="h-full w-full object-contain"
    />
  );

  const classes = cn("relative inline-flex shrink-0", s.wrap, className);

  if (href === null) {
    return <div className={classes}>{image}</div>;
  }

  return (
    <Link href={href} className={classes} aria-label={BUSINESS.name}>
      {image}
    </Link>
  );
}
